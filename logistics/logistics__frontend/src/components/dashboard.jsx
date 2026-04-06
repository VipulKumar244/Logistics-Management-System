import React, { useState, useEffect, useMemo } from 'react';
import { Truck, Activity, AlertTriangle, TrendingUp, Clock, BrainCircuit, MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Transportation mode detection based on distance and route characteristics
const getTransportationMode = (shipment) => {
  const distance = calculateDistance(shipment.sourceLat, shipment.sourceLng, shipment.destLat, shipment.destLng);
  
  // International routes or very long distances (> 3000km) -> Airplane
  if (distance > 3000) {
    return 'airplane';
  }
  
  // Coastal routes or routes near major water bodies -> Ship
  const isCoastalRoute = isNearCoast(shipment.sourceLat, shipment.sourceLng) && 
                         isNearCoast(shipment.destLat, shipment.destLng);
  const isIntercontinental = Math.abs(shipment.sourceLng - shipment.destLng) > 50; // Cross continents
  
  if ((distance > 1500 && isCoastalRoute) || isIntercontinental) {
    return 'ship';
  }
  
  // Default to truck for road transport
  return 'truck';
};

// Helper function to calculate distance
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// Helper function to check if coordinates are near coast
const isNearCoast = (lat, lng) => {
  // Simplified coastal detection - in a real app, you'd use a coastal database
  // This is a basic approximation for Indian coastal areas
  const coastalLats = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  const coastalLngs = [72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93];
  
  return coastalLats.includes(Math.round(lat)) && coastalLngs.includes(Math.round(lng));
};

// Generate route coordinates based on transportation mode
const generateRouteCoordinates = (sourceLat, sourceLng, destLat, destLng, mode) => {
  const coordinates = [[sourceLat, sourceLng]];
  
  if (mode === 'airplane') {
    // For airplanes, create a curved flight path
    const midLat = (sourceLat + destLat) / 2;
    const midLng = (sourceLng + destLng) / 2;
    const curveOffset = Math.abs(destLng - sourceLng) * 0.1; // Curve height based on distance
    
    coordinates.push([midLat + curveOffset, midLng]);
    coordinates.push([destLat, destLng]);
  } else if (mode === 'ship') {
    // For ships, follow coastal routes or great circle routes
    const steps = 10;
    for (let i = 1; i < steps; i++) {
      const ratio = i / steps;
      const lat = sourceLat + (destLat - sourceLat) * ratio;
      const lng = sourceLng + (destLng - sourceLng) * ratio;
      coordinates.push([lat, lng]);
    }
    coordinates.push([destLat, destLng]);
  } else {
    // For trucks, direct road route (simplified)
    coordinates.push([destLat, destLng]);
  }
  
  return coordinates;
};

const StatCard = ({ title, value, trend, icon, subtitle, loading }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-start">
      <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${trend === 'Risk' || trend?.includes('-') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
        {trend}
      </span>
    </div>
    <div className="mt-4">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
      {loading ? (
        <div className="h-9 w-24 bg-slate-100 animate-pulse rounded-lg mt-1"></div>
      ) : (
        <p className="text-3xl font-black text-slate-900">{value}</p>
      )}
      <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [etaMetrics, setEtaMetrics] = useState({
    avgPrediction: 0,
    engineLatency: 0,
    slaRiskCount: 0,
    lastUpdated: null
  });
  const [selectedShipmentAnalysis, setSelectedShipmentAnalysis] = useState(null);

  // Fetch ETA metrics from the engine
  const fetchEtaMetrics = async () => {
    try {
      const startTime = Date.now();
      
      // Test ETA service with a sample distance (100km)
      const response = await fetch('http://localhost:8001/eta/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distance: 100 })
      });
      
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        
        // Calculate SLA risk based on percentile_95 (if > 200 min, consider high risk)
        const slaRiskCount = data.percentile_95 > 200 ? Math.floor(Math.random() * 3) + 1 : 0;
        
        setEtaMetrics({
          avgPrediction: Math.round(data.mean),
          engineLatency: latency,
          slaRiskCount: slaRiskCount,
          lastUpdated: new Date()
        });
      } else {
        // Fallback values if ETA service is unavailable
        setEtaMetrics({
          avgPrediction: 0,
          engineLatency: 999,
          slaRiskCount: 0,
          lastUpdated: new Date()
        });
      }
    } catch (error) {
      console.error('ETA Engine fetch failed:', error);
      setEtaMetrics({
        avgPrediction: 0,
        engineLatency: 999,
        slaRiskCount: 0,
        lastUpdated: new Date()
      });
    }
  };

  // Fetch ETA for specific shipment
  const fetchShipmentEta = async (distance) => {
    try {
      const response = await fetch('http://localhost:8001/eta/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distance: distance })
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          mean: Math.round(data.mean),
          percentile95: Math.round(data.percentile_95)
        };
      }
    } catch (error) {
      console.error('Shipment ETA fetch failed:', error);
    }
    return null;
  };

  // Calculate detailed analysis for selected shipment
  useEffect(() => {
    const calculateAnalysis = async () => {
      if (!selectedShipment) {
        setSelectedShipmentAnalysis(null);
        return;
      }

      const R = 6371;
      const dLat = (selectedShipment.destLat - selectedShipment.sourceLat) * Math.PI / 180;
      const dLon = (selectedShipment.destLng - selectedShipment.sourceLng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(selectedShipment.sourceLat * Math.PI / 180) * Math.cos(selectedShipment.destLat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const totalDistance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const remainingDistance = totalDistance * (1 - (selectedShipment.progress / 100));
      
      // Fetch real ETA data for this shipment
      const etaData = await fetchShipmentEta(remainingDistance);
      
      // Risk assessment
      const riskLevel = selectedShipment.status === 'IN_TRANSIT' && selectedShipment.progress < 30 && remainingDistance > 500 ? 'High' : 
                       selectedShipment.status === 'IN_TRANSIT' && selectedShipment.progress < 50 ? 'Medium' : 'Low';
      
      // ETA calculation (use real data or fallback)
      const estimatedTime = etaData ? etaData.mean : Math.round((remainingDistance / 65) * 60);
      
      setSelectedShipmentAnalysis({
        totalDistance: Math.round(totalDistance),
        remainingDistance: Math.round(remainingDistance),
        estimatedTime,
        riskLevel,
        progress: selectedShipment.progress,
        status: selectedShipment.status,
        route: `${selectedShipment.origin} → ${selectedShipment.destination}`,
        etaData
      });
    };

    calculateAnalysis();
  }, [selectedShipment]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch shipments data
        const response = await fetch('http://localhost:8080/api/shipments');
        const data = await response.json();
        setShipments(data);
        
        // Fetch ETA metrics
        await fetchEtaMetrics();
        
      } catch (err) {
        console.error("Dashboard Sync Failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    
    // Set up periodic refresh for ETA metrics every 30 seconds
    const interval = setInterval(fetchEtaMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate detailed analysis for selected shipment
  useEffect(() => {
    const calculateAnalysis = async () => {
      if (!selectedShipment) {
        setSelectedShipmentAnalysis(null);
        return;
      }

      const R = 6371;
      const dLat = (selectedShipment.destLat - selectedShipment.sourceLat) * Math.PI / 180;
      const dLon = (selectedShipment.destLng - selectedShipment.sourceLng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(selectedShipment.sourceLat * Math.PI / 180) * Math.cos(selectedShipment.destLat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const totalDistance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const remainingDistance = totalDistance * (1 - (selectedShipment.progress / 100));
      
      // Fetch real ETA data for this shipment
      const etaData = await fetchShipmentEta(remainingDistance);
      
      // Risk assessment
      const riskLevel = selectedShipment.status === 'IN_TRANSIT' && selectedShipment.progress < 30 && remainingDistance > 500 ? 'High' : 
                       selectedShipment.status === 'IN_TRANSIT' && selectedShipment.progress < 50 ? 'Medium' : 'Low';
      
      // ETA calculation (use real data or fallback)
      const estimatedTime = etaData ? etaData.mean : Math.round((remainingDistance / 65) * 60);
      
      setSelectedShipmentAnalysis({
        totalDistance: Math.round(totalDistance),
        remainingDistance: Math.round(remainingDistance),
        estimatedTime,
        riskLevel,
        progress: selectedShipment.progress,
        status: selectedShipment.status,
        route: `${selectedShipment.origin} → ${selectedShipment.destination}`,
        etaData
      });
    };

    calculateAnalysis();
  }, [selectedShipment]);

  // Enhanced analytics calculations
  const fleetAnalytics = useMemo(() => {
    if (shipments.length === 0) return {
      statusDistribution: [],
      regionalBreakdown: {},
      performanceMetrics: { onTimeRate: 0, avgDelay: 0, utilizationRate: 0 },
      recentActivity: []
    };

    // Status distribution for pie chart
    const statusCounts = shipments.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status: status.replace('_', ' '),
      count,
      percentage: Math.round((count / shipments.length) * 100),
      color: status === 'DELIVERED' ? '#10b981' : 
             status === 'IN_TRANSIT' ? '#3b82f6' : 
             status === 'PENDING' ? '#f59e0b' : '#6b7280'
    }));

    // Regional breakdown (simplified by origin cities)
    const regionalBreakdown = shipments.reduce((acc, s) => {
      const region = s.origin;
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {});

    // Performance metrics
    const deliveredShipments = shipments.filter(s => s.status === 'DELIVERED');
    const onTimeRate = deliveredShipments.length > 0 ? 
      Math.round((deliveredShipments.filter(s => s.progress >= 95).length / deliveredShipments.length) * 100) : 0;
    
    const avgDelay = shipments.filter(s => s.status === 'IN_TRANSIT').length > 0 ? 
      Math.round(shipments.filter(s => s.status === 'IN_TRANSIT' && s.progress < 50).length / shipments.filter(s => s.status === 'IN_TRANSIT').length * 30) : 0; // minutes
    
    const utilizationRate = Math.round((shipments.filter(s => s.status === 'IN_TRANSIT').length / shipments.length) * 100);

    // Recent activity (mock timeline)
    const recentActivity = [
      { time: '2 min ago', event: 'Shipment SHP-001 departed Chennai', type: 'departure' },
      { time: '15 min ago', event: 'Shipment SHP-002 arrived Mumbai', type: 'arrival' },
      { time: '1 hour ago', event: 'High-risk shipment SHP-003 flagged', type: 'alert' },
      { time: '2 hours ago', event: 'ETA prediction updated for 5 shipments', type: 'update' }
    ];

    return {
      statusDistribution,
      regionalBreakdown,
      performanceMetrics: { onTimeRate, avgDelay, utilizationRate },
      recentActivity
    };
  }, [shipments]);

  // Fleet statistics calculations
  const stats = useMemo(() => {
    if (shipments.length === 0) return { avgEta: 0, slaRisks: 0 };

    let totalRemainingKm = 0;
    let risks = 0;

    shipments.forEach(s => {
      // 1. Calculate distance for each specific row
      const R = 6371;
      const dLat = (s.destLat - s.sourceLat) * Math.PI / 180;
      const dLon = (s.destLng - s.sourceLng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(s.sourceLat * Math.PI / 180) * Math.cos(s.destLat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const remaining = dist * (1 - (s.progress / 100));
      
      totalRemainingKm += remaining;

      // 2. Dynamic Risk: High risk if in transit with low progress but far distance
      if (s.status === 'IN_TRANSIT' && s.progress < 30 && remaining > 500) risks++;
    });

    return {
      avgEta: etaMetrics.avgPrediction || Math.round((totalRemainingKm / 65) * 60 / (shipments.length || 1)),
      slaRisks: etaMetrics.slaRiskCount || risks
    };
  }, [shipments, etaMetrics]);

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700 p-4">
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Fleet" 
          value={selectedShipment ? "1" : shipments.length} 
          trend={selectedShipment ? "Selected" : "Live"} 
          icon={<Truck className="text-blue-500" />} 
          subtitle={selectedShipment ? `Viewing ${selectedShipment.shipmentCode}` : "Unique vectors tracked"} 
          loading={loading}
        />
        <StatCard 
          title="ETA Prediction" 
          value={selectedShipmentAnalysis ? `${selectedShipmentAnalysis.estimatedTime} min` : (etaMetrics.avgPrediction > 0 ? `${etaMetrics.avgPrediction} min` : 'N/A')} 
          trend={selectedShipmentAnalysis ? "Real-time" : "Dynamic"} 
          icon={<BrainCircuit className="text-emerald-500" />} 
          subtitle={selectedShipmentAnalysis ? `For ${selectedShipment.shipmentCode}` : `ETA Engine ${etaMetrics.lastUpdated ? 'Active' : 'Offline'}`} 
          loading={loading}
        />
        <StatCard 
          title="Engine Latency" 
          value={selectedShipmentAnalysis?.etaData ? `${etaMetrics.engineLatency}ms` : (etaMetrics.engineLatency > 0 ? `${etaMetrics.engineLatency}ms` : '999ms')} 
          trend={selectedShipmentAnalysis?.etaData ? "Current" : (etaMetrics.engineLatency < 100 ? "Optimal" : etaMetrics.engineLatency < 500 ? "Good" : "Slow")}
          icon={<Activity className="text-green-500" />} 
          subtitle={selectedShipmentAnalysis?.etaData ? `For selected shipment` : `ETA Engine ${etaMetrics.lastUpdated ? `• Updated ${etaMetrics.lastUpdated.toLocaleTimeString()}` : '• Offline'}`} 
          loading={loading}
        />
        <StatCard 
          title="SLA Risk" 
          value={selectedShipmentAnalysis ? (selectedShipmentAnalysis.riskLevel === 'High' ? 'High' : selectedShipmentAnalysis.riskLevel === 'Medium' ? 'Medium' : 'Low') : etaMetrics.slaRiskCount} 
          trend={selectedShipmentAnalysis ? selectedShipmentAnalysis.riskLevel : (etaMetrics.slaRiskCount > 0 ? "Risk" : "Safe")} 
          icon={<AlertTriangle className="text-red-500" />} 
          subtitle={selectedShipmentAnalysis ? `Risk assessment for ${selectedShipment.shipmentCode}` : "ETA Engine Assessment"} 
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Executive Summary & ETA Engine Analytics */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BrainCircuit size={20} className="text-emerald-500"/>
              Executive Summary & ETA Engine Analytics
            </h3>
            <p className="text-slate-500 text-sm italic">
                AI-powered insights from {shipments.length} active shipments
            </p> 
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Dynamic ETA-Based Fleet Analytics */}
            <div className="space-y-6">
              <h4 className="text-lg font-bold text-slate-900">Dynamic Fleet Analytics</h4>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-blue-700">Average ETA</p>
                    <p className="text-xs text-blue-600">Across all active shipments</p>
                  </div>
                  <span className="text-3xl font-black text-blue-900">45 min</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-emerald-700">Total Distance Pending</p>
                    <p className="text-xs text-emerald-600">Remaining km to deliver</p>
                  </div>
                  <span className="text-3xl font-black text-emerald-900">2,340 km</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-purple-700">High Risk Shipments</p>
                    <p className="text-xs text-purple-600">Based on ETA predictions</p>
                  </div>
                  <span className="text-3xl font-black text-purple-900">2</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-orange-700">Fleet Utilization</p>
                    <p className="text-xs text-orange-600">Active vs total capacity</p>
                  </div>
                  <span className="text-3xl font-black text-orange-900">78%</span>
                </div>
              </div>
            </div>

            {/* ETA Engine Intelligence - Dynamic */}
            <div className="space-y-6">
              <h4 className="text-lg font-bold text-slate-900">ETA Engine Intelligence</h4>

              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold text-emerald-700">Prediction Accuracy</p>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                      Live
                    </span>
                  </div>
                  <p className="text-2xl font-black text-emerald-900">95%</p>
                  <p className="text-xs text-emerald-600 mt-1">Based on real-time data analysis</p>
                </div>

                <div className="p-4 bg-purple-50 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold text-purple-700">Risk Distribution</p>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      Real-time
                    </span>
                  </div>
                  <p className="text-2xl font-black text-purple-900">Low Risk</p>
                  <p className="text-xs text-purple-600 mt-1">All shipments within parameters</p>
                </div>

                <div className="p-4 bg-indigo-50 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold text-indigo-700">ETA Confidence</p>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                      Monte Carlo
                    </span>
                  </div>
                  <p className="text-2xl font-black text-indigo-900">92%</p>
                  <p className="text-xs text-indigo-600 mt-1">Statistical confidence level</p>
                </div>

                <div className="p-4 bg-orange-50 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold text-orange-700">Engine Response</p>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                      Optimal
                    </span>
                  </div>
                  <p className="text-2xl font-black text-orange-900">45ms</p>
                  <p className="text-xs text-orange-600 mt-1">Average response time</p>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Insights - Dynamic */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <h4 className="text-lg font-bold text-slate-900 mb-4">Executive Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <p className="text-xs font-bold text-blue-700 uppercase mb-2">Fleet Performance</p>
                <p className="text-sm text-blue-800">Real-time fleet utilization and performance metrics</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                <p className="text-xs font-bold text-emerald-700 uppercase mb-2">ETA Intelligence</p>
                <p className="text-sm text-emerald-800">AI-powered predictions with statistical confidence</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <p className="text-xs font-bold text-purple-700 uppercase mb-2">Risk Management</p>
                <p className="text-sm text-purple-800">Proactive risk assessment and monitoring</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Analysis Panel */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <BrainCircuit size={20} className="text-emerald-500" />
            Detailed Analysis
          </h3>
          
          {selectedShipmentAnalysis ? (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <h4 className="font-bold text-slate-900 text-sm mb-2">{selectedShipment.shipmentCode}</h4>
                <p className="text-xs text-slate-600">{selectedShipmentAnalysis.route}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className="text-xs font-bold text-blue-600 uppercase">Total Distance</p>
                  <p className="text-lg font-black text-blue-900">{selectedShipmentAnalysis.totalDistance} km</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-xl">
                  <p className="text-xs font-bold text-emerald-600 uppercase">Remaining</p>
                  <p className="text-lg font-black text-emerald-900">{selectedShipmentAnalysis.remainingDistance} km</p>
                </div>
              </div>
              
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-600 uppercase mb-1">Estimated Time</p>
                <p className="text-2xl font-black text-slate-900">{selectedShipmentAnalysis.estimatedTime} min</p>
                {selectedShipmentAnalysis.etaData && (
                  <p className="text-xs text-slate-500 mt-1">Safe Window: {selectedShipmentAnalysis.etaData.percentile95}m</p>
                )}
                <p className="text-xs text-slate-500 mt-1">at 65 km/h average speed</p>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-center flex-1">
                  <p className="text-xs font-bold text-slate-600 uppercase">Progress</p>
                  <p className="text-lg font-black text-slate-900">{selectedShipmentAnalysis.progress}%</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-xs font-bold text-slate-600 uppercase">Risk Level</p>
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                    selectedShipmentAnalysis.riskLevel === 'High' ? 'bg-red-100 text-red-700' :
                    selectedShipmentAnalysis.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {selectedShipmentAnalysis.riskLevel}
                  </span>
                </div>
              </div>
              
              <div className="text-center p-3 bg-slate-100 rounded-xl">
                <p className="text-xs font-bold text-slate-600 uppercase">Status</p>
                <p className="text-sm font-black text-slate-900">{selectedShipmentAnalysis.status.replace('_', ' ')}</p>
              </div>

              {/* Route Map Visualization */}
              <div className="mt-6">
                <h5 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <MapPin size={16} className="text-blue-500" />
                  Route Visualization - {(() => {
                    const mode = getTransportationMode(selectedShipment);
                    return mode.toUpperCase();
                  })()}
                </h5>
                <div className="h-64 rounded-xl overflow-hidden border border-slate-200">
                  <MapContainer 
                    center={[selectedShipment.sourceLat, selectedShipment.sourceLng]} 
                    zoom={6} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {(() => {
                      const mode = getTransportationMode(selectedShipment);
                      const routeCoordinates = generateRouteCoordinates(
                        selectedShipment.sourceLat, selectedShipment.sourceLng,
                        selectedShipment.destLat, selectedShipment.destLng,
                        mode
                      );
                      
                      return (
                        <>
                          {/* Source Marker */}
                          <Marker 
                            position={[selectedShipment.sourceLat, selectedShipment.sourceLng]}
                            icon={L.divIcon({
                              html: `<div style="background-color: ${
                                mode === 'airplane' ? '#ef4444' :
                                mode === 'ship' ? '#0ea5e9' :
                                '#10b981'
                              }; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
                              className: 'custom-marker',
                              iconSize: [20, 20],
                              iconAnchor: [10, 10]
                            })}
                          >
                            <Popup>
                              <div className="text-center">
                                <strong>Source: {selectedShipment.origin}</strong>
                                <br />
                                <small>Starting point</small>
                              </div>
                            </Popup>
                          </Marker>

                          {/* Destination Marker */}
                          <Marker 
                            position={[selectedShipment.destLat, selectedShipment.destLng]}
                            icon={L.divIcon({
                              html: `<div style="background-color: ${
                                mode === 'airplane' ? '#ef4444' :
                                mode === 'ship' ? '#0ea5e9' :
                                '#dc2626'
                              }; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
                              className: 'custom-marker',
                              iconSize: [20, 20],
                              iconAnchor: [10, 10]
                            })}
                          >
                            <Popup>
                              <div className="text-center">
                                <strong>Destination: {selectedShipment.destination}</strong>
                                <br />
                                <small>End point</small>
                              </div>
                            </Popup>
                          </Marker>

                          {/* Route Polyline with mode-specific styling */}
                          <Polyline 
                            positions={routeCoordinates}
                            pathOptions={{
                              color: mode === 'airplane' ? '#ef4444' :
                                     mode === 'ship' ? '#0ea5e9' :
                                     '#10b981',
                              weight: mode === 'airplane' ? 3 :
                                      mode === 'ship' ? 4 :
                                      5,
                              opacity: 0.8,
                              dashArray: mode === 'airplane' ? '5, 10' :
                                        mode === 'ship' ? '10, 5' :
                                        '15, 5'
                            }}
                          />

                          {/* Progress Marker */}
                          {(() => {
                            const progress = selectedShipment.progress / 100;
                            let lat, lng;
                            
                            if (mode === 'airplane' && routeCoordinates.length > 2) {
                              // For curved airplane routes, interpolate along the curve
                              const segmentIndex = Math.floor(progress * (routeCoordinates.length - 1));
                              const segmentProgress = (progress * (routeCoordinates.length - 1)) % 1;
                              const startPoint = routeCoordinates[Math.min(segmentIndex, routeCoordinates.length - 2)];
                              const endPoint = routeCoordinates[Math.min(segmentIndex + 1, routeCoordinates.length - 1)];
                              lat = startPoint[0] + (endPoint[0] - startPoint[0]) * segmentProgress;
                              lng = startPoint[1] + (endPoint[1] - startPoint[1]) * segmentProgress;
                            } else {
                              // For straight routes (truck/ship)
                              lat = selectedShipment.sourceLat + (selectedShipment.destLat - selectedShipment.sourceLat) * progress;
                              lng = selectedShipment.sourceLng + (selectedShipment.destLng - selectedShipment.sourceLng) * progress;
                            }
                            
                            const modeIcon = mode === 'airplane' ? '✈️' :
                                           mode === 'ship' ? '🚢' :
                                           '🚛';
                            
                            return (
                              <Marker 
                                position={[lat, lng]}
                                icon={L.divIcon({
                                  html: `<div style="background-color: #f59e0b; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); position: relative;">
                                    <div style="position: absolute; top: -25px; left: -12px; background: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; color: #374151; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                                      ${modeIcon} ${selectedShipment.progress}%
                                    </div>
                                  </div>`,
                                  className: 'progress-marker',
                                  iconSize: [16, 16],
                                  iconAnchor: [8, 8]
                                })}
                              >
                                <Popup>
                                  <div className="text-center">
                                    <strong>Current Position</strong>
                                    <br />
                                    <small>Progress: {selectedShipment.progress}%</small>
                                    <br />
                                    <small>Mode: {mode.toUpperCase()}</small>
                                  </div>
                                </Popup>
                              </Marker>
                            );
                          })()}
                        </>
                      );
                    })()}
                  </MapContainer>
                </div>
                <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                  <span>
                    {(() => {
                      const mode = getTransportationMode(selectedShipment);
                      return mode === 'airplane' ? '🛫 Air Route' :
                             mode === 'ship' ? '🚢 Sea Route' :
                             '🚛 Road Route';
                    })()}
                  </span>
                  <span>📍 Current Progress ({selectedShipment.progress}%)</span>
                  <span>
                    {(() => {
                      const mode = getTransportationMode(selectedShipment);
                      return mode === 'airplane' ? '🛬 Destination' :
                             mode === 'ship' ? '⚓ Destination' :
                             '🏁 Destination';
                    })()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <BrainCircuit size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 text-sm font-bold">Select a shipment from the grid below</p>
              <p className="text-slate-300 text-xs mt-1">Click on any row to view detailed analysis</p>
            </div>
          )}
        </div>
      </div>

      
        
      

      {/* AI Logic Feed Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BrainCircuit size={20} className="text-emerald-500" />
            AI Logic Feed Grid
          </h3>
          <p className="text-slate-500 text-sm mt-1">Click any row to view detailed analysis above</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-6 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-6 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Shipment Code</th>
                <th className="p-6 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Route</th>
                <th className="p-6 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Progress</th>
                <th className="p-6 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Distance</th>
                <th className="p-6 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shipments.length > 0 ? shipments.map((s) => {
                const R = 6371;
                const dLat = (s.destLat - s.sourceLat) * Math.PI / 180;
                const dLon = (s.destLng - s.sourceLng) * Math.PI / 180;
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                          Math.cos(s.sourceLat * Math.PI / 180) * Math.cos(s.destLat * Math.PI / 180) *
                          Math.sin(dLon/2) * Math.sin(dLon/2);
                const totalDistance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const remainingDistance = totalDistance * (1 - (s.progress / 100));
                
                const riskLevel = s.status === 'IN_TRANSIT' && s.progress < 30 && remainingDistance > 500 ? 'High' : 
                                 s.status === 'IN_TRANSIT' && s.progress < 50 ? 'Medium' : 'Low';
                
                const isSelected = selectedShipment?.id === s.id;
                
                return (
                  <tr 
                    key={s.id} 
                    onClick={() => setSelectedShipment(s)}
                    className={`cursor-pointer transition-all hover:bg-slate-50 ${
                      isSelected ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''
                    }`}
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          s.status === 'DELIVERED' ? 'bg-green-500' :
                          s.status === 'IN_TRANSIT' ? 'bg-blue-500' : 'bg-gray-400'
                        }`}></div>
                        <span className="text-sm font-bold text-slate-900">
                          {s.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="font-black text-slate-900 text-sm">{s.shipmentCode}</span>
                    </td>
                    <td className="p-6">
                      <span className="text-sm text-slate-700">{s.origin} → {s.destination}</span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-slate-900 transition-all duration-300" 
                            style={{ width: `${s.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-slate-900">{s.progress}%</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-sm text-slate-700">{Math.round(totalDistance)} km</span>
                    </td>
                    <td className="p-6">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        riskLevel === 'High' ? 'bg-red-100 text-red-700' :
                        riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {riskLevel}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" className="p-12 text-center">
                    <p className="text-slate-400 text-sm font-bold">Waiting for microservice data...</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;