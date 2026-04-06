import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Package, PlusCircle, Truck, Search, Clock, Edit3, User, 
  Trash2, X, CheckCircle2, Navigation, Map as MapIcon, Play, Plane, Ship as ShipIcon
} from "lucide-react";


import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

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
    // For airplanes, create a curved flight path (great circle approximation)
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
    // For trucks, direct road route (will be replaced by OSRM)
    coordinates.push([destLat, destLng]);
  }
  
  return coordinates;
};

const TruckIcon = L.divIcon({
  html: `<div style="background:linear-gradient(135deg,#1e40af,#1d4ed8);padding:10px;border-radius:50%;border:4px solid #ffffff;box-shadow:0 10px 30px rgba(30,64,175,0.5);">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-2.235-2.794A1 1 0 0 0 17.063 9.5H15"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
          </svg>
        </div>`,
 
  className: '', 
  iconSize: [44, 44],
  iconAnchor: [22, 22]
});

const PlaneIcon = L.divIcon({
  html: `<div style="background:linear-gradient(135deg,#7c3aed,#8b5cf6);padding:10px;border-radius:50%;border:4px solid #ffffff;box-shadow:0 10px 30px rgba(124,58,237,0.5);">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.2l.5-.2c.4-.3.6-.7.4-1.2z"/>
          </svg>
        </div>`,
 
  className: '', 
  iconSize: [44, 44],
  iconAnchor: [22, 22]
});

const ShipIconMap = L.divIcon({
  html: `<div style="background:linear-gradient(135deg,#059669,#10b981);padding:10px;border-radius:50%;border:4px solid #ffffff;box-shadow:0 10px 30px rgba(5,150,105,0.5);">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 21c.6.5 2 .5 2.5 0l8.5-8.5a.55.55 0 0 1 1 0L21 20.5c.5.6.5 2 0 2.5l-1 1c-.5.5-2 .5-2.5 0L12 16a.55.55 0 0 1 0-1L3.5 6.5a.55.55 0 0 1 0-1L2 4.5a.55.55 0 0 1 0-1L.5 2.5a.55.55 0 0 1 0-1L0 1.5C-.5.9-.5-.1 0 .4l1 1c.5.5 2 .5 2.5 0L12 11a.55.55 0 0 1 1 0l8.5 8.5c.6.5 2 .5 2.5 0l1-1c.5-.5.5-2 0-2.5L13.5 3.5a.55.55 0 0 1 0-1L12 2a.55.55 0 0 1-1 0L2.5 10.5a.55.55 0 0 1 0 1L1 12.5a.55.55 0 0 1-1 0L-.5 11.5a.55.55 0 0 1 0-1L1 10c.5-.5 2-.5 2.5 0z"/>
          </svg>
        </div>`,
 
  className: '', 
  iconSize: [44, 44],
  iconAnchor: [22, 22]
});


const getTransportationIcon = (mode) => {
  switch (mode) {
    case 'truck': return <Truck size={16}/>;
    case 'plane': return <Plane size={16}/>;
    case 'ship': return <ShipIcon size={16}/>;
    default: return <Truck size={16}/>;
  }
};

const cityDatabase = {
  "andhra pradesh": [16.5062, 80.6480], // Amaravati/Vijayawada
  "arunachal pradesh": [27.0844, 93.6053], // Itanagar
  "assam": [26.1433, 91.7363], // Guwahati
  "bihar": [25.5941, 85.1376], // Patna
  "chhattisgarh": [21.2514, 81.6296], // Raipur
  "goa": [15.4909, 73.8278], // Panaji
  "gujarat": [23.2156, 72.6369], // Gandhinagar
  "haryana": [30.7333, 76.7794], // Chandigarh
  "himachal pradesh": [31.1048, 77.1734], // Shimla
  "jharkhand": [23.3441, 85.3096], // Ranchi
  "karnataka": [12.9716, 77.5946], // Bengaluru
  "kerala": [8.5241, 76.9366], // Thiruvananthapuram
  "madhya pradesh": [23.2599, 77.4126], // Bhopal
  "maharashtra": [19.0760, 72.8777], // Mumbai
  "manipur": [24.8170, 93.9368], // Imphal
  "meghalaya": [25.5788, 91.8831], // Shillong
  "mizoram": [23.7271, 92.7176], // Aizawl
  "nagaland": [25.6747, 94.1100], // Kohima
  "odisha": [20.2961, 85.8245], // Bhubaneswar
  "punjab": [30.7333, 76.7794], // Chandigarh
  "rajasthan": [26.9124, 75.7873], // Jaipur
  "sikkim": [27.3314, 88.6138], // Gangtok
  "tamil nadu": [13.0827, 80.2707], // Chennai
  "telangana": [17.3850, 78.4867], // Hyderabad
  "tripura": [23.8315, 91.2868], // Agartala
  "uttar pradesh": [26.8467, 80.9462], // Lucknow
  "uttarakhand": [30.3165, 78.0322], // Dehradun
  "west bengal": [22.5726, 88.3639], // Kolkata



  "andaman and nicobar": [11.6234, 92.7265], // Port Blair
  "chandigarh": [30.7333, 76.7794],
  "dadra and nagar haveli": [20.2765, 73.0083], // Silvassa
  "daman and diu": [20.4283, 72.8397],
  "delhi": [28.6139, 77.2090],
  "jammu and kashmir": [34.0837, 74.7973], // Srinagar
  "ladakh": [34.1526, 77.5771], // Leh
  "lakshadweep": [10.5667, 72.6417], // Kavaratti
  "puducherry": [11.9416, 79.8083],


 
  "surat": [21.1702, 72.8311],
  "pune": [18.5204, 73.8567],
  "ahmedabad": [23.0225, 72.5714],
  "indore": [22.7196, 75.8577],
  "bengaluru": [12.9716, 77.5946],
  "chennai": [13.0827, 80.2707],
  "mumbai": [19.0760, 72.8777]
};    

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' }
];


function getInterpolatedPoint(p1, p2, percent) {
  if (!p1 || !p2) return [13.08, 80.27];
  const lat = p1[0] + (p2[0] - p1[0]) * (percent / 100);
  const lng = p1[1] + (p2[1] - p1[1]) * (percent / 100);
  return [lat, lng];
}

function MapViewHandler({ source, dest }) {
  const map = useMap();
  useEffect(() => {
    if (source && dest) {
      const bounds = L.latLngBounds([source, dest]);
      map.flyToBounds(bounds, { padding: [100, 100], duration: 1.5 });
    }
  }, [source, dest, map]);
  return null;
}

const routeCache = new Map();
const MAX_CACHE_SIZE = 50; 

function RoutingEngine({ source, dest, onRouteUpdate, transportationMode = 'truck', onRouteLoading, onRouteLoaded }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !source || !dest) return;

    // Create cache key from coordinates and mode
    const cacheKey = `${transportationMode}-${source[0]},${source[1]}-${dest[0]},${dest[1]}`;

    
    if (routeCache.has(cacheKey)) {
      const cachedRoute = routeCache.get(cacheKey);
      
      const cachedPolyline = L.polyline(cachedRoute.coordinates, {
        color: getRouteColor(transportationMode),
        weight: getRouteWeight(transportationMode),
        opacity: 0.8,
        dashArray: getRouteDashArray(transportationMode)
      }).addTo(map);

      
      map._cachedRoute = cachedPolyline;

      
      if (onRouteUpdate) {
        onRouteUpdate(cachedRoute.coordinates);
      }

      
      if (map._backupRoute) {
        map.removeLayer(map._backupRoute);
      }

      return () => {
        if (map._cachedRoute) {
          map.removeLayer(map._cachedRoute);
        }
      };
    }

    
    const backupRoute = L.polyline([source, dest], {
      color: '#94a3b8',
      weight: 2,
      opacity: 0.4,
      dashArray: '5, 5'
    }).addTo(map);

    
    map._backupRoute = backupRoute;

    
    if (onRouteUpdate) {
      onRouteUpdate([{ lat: source[0], lng: source[1] }, { lat: dest[0], lng: dest[1] }]);
    }

    
    const fetchRoute = async () => {
      if (onRouteLoading) onRouteLoading(true);
      try {
        let coordinates = [];

        if (transportationMode === 'truck') {
          // Use OSRM for road routing
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${source[1]},${source[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`
          );
          
          if (!response.ok) {
            throw new Error('OSRM API request failed');
          }

          const data = await response.json();
          
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            coordinates = route.geometry.coordinates.map(coord => ({ lat: coord[1], lng: coord[0] }));
          } else {
            throw new Error('No routes found');
          }
        } else if (transportationMode === 'ship') {
          // For ships, use simplified sea routing (in a real app, you'd use a maritime routing service)
          coordinates = generateRouteCoordinates(source[0], source[1], dest[0], dest[1], 'ship')
            .map(coord => ({ lat: coord[0], lng: coord[1] }));
        } else if (transportationMode === 'airplane') {
          // For airplanes, use great circle route approximation
          coordinates = generateRouteCoordinates(source[0], source[1], dest[0], dest[1], 'airplane')
            .map(coord => ({ lat: coord[0], lng: coord[1] }));
        }

        if (coordinates.length > 0) {
          routeCache.set(cacheKey, {
            coordinates: coordinates,
            summary: { totalDistance: calculateDistance(source[0], source[1], dest[0], dest[1]), totalTime: 0 },
            timestamp: Date.now()
          });

         
          if (map && map._backupRoute) {
            map.removeLayer(map._backupRoute);
          }

          const realRoute = L.polyline(coordinates, {
            color: getRouteColor(transportationMode),
            weight: getRouteWeight(transportationMode),
            opacity: 0.8,
            dashArray: getRouteDashArray(transportationMode)
          }).addTo(map);

          map._cachedRoute = realRoute;

          
          if (onRouteUpdate) {
            onRouteUpdate(coordinates);
          }
        }
        if (onRouteLoaded) onRouteLoaded();
      } catch (error) {
        console.error(`❌ ${transportationMode.toUpperCase()} routing failed, using straight line fallback:`, error);

        
        if (onRouteUpdate) {
          onRouteUpdate([{ lat: source[0], lng: source[1] }, { lat: dest[0], lng: dest[1] }]);
        }
        if (onRouteLoaded) onRouteLoaded();
      }
    };

    
    fetchRoute();

   
    return () => {
     
      if (map && map._fallbackRoute) {
        map.removeLayer(map._fallbackRoute);
      }
      if (map && map._cachedRoute) {
        map.removeLayer(map._cachedRoute);
      }
      if (map && map._backupRoute) {
        map.removeLayer(map._backupRoute);
      }
    };
  }, [map, source, dest, onRouteUpdate, transportationMode]);

  return null;
}

// Helper functions for route styling based on transportation mode
const getRouteColor = (mode) => {
  switch (mode) {
    case 'truck': return '#1e40af'; // Blue for roads
    case 'ship': return '#0ea5e9'; // Light blue for sea
    case 'airplane': return '#ef4444'; // Red for air
    default: return '#1e40af';
  }
};

const getRouteWeight = (mode) => {
  switch (mode) {
    case 'truck': return 6;
    case 'ship': return 4;
    case 'airplane': return 3;
    default: return 6;
  }
};

const getRouteDashArray = (mode) => {
  switch (mode) {
    case 'truck': return null; // Solid line for roads
    case 'ship': return '10, 5'; // Dashed for sea
    case 'airplane': return '5, 10'; // Different dash for air
    default: return null;
  }
};

export default function Shipments() {
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(true);
  const [validationErrors, setValidationErrors] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [routeLoading, setRouteLoading] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [smartETA, setSmartETA] = useState(null);
  const [editingShipment, setEditingShipment] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [newShipment, setNewShipment] = useState({
    shipmentCode: '', origin: '', destination: '', driverId: '', status: 'PENDING', progress: 0
  });

  const loadShipments = useCallback(async (autoSelectNewest = false) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/shipments');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const formatted = data.map(s => ({
        ...s,
        sourceCoords: [s.sourceLat || 13.08, s.sourceLng || 80.27],
        destCoords: [s.destLat || 19.07, s.destLng || 72.87],
        driver: s.driverId ? `Unit-${s.driverId}` : 'Unassigned'
      }));
      setShipments(formatted);
      if (formatted.length > 0) {
        if (autoSelectNewest) setSelectedShipment(formatted[formatted.length - 1]);
        else if (!selectedShipment) setSelectedShipment(formatted[0]);
      }
    } catch (err) {
      console.error('Failed to load shipments:', err);
      // Set some demo data if backend is not available
      const demoShipments = [
        {
          id: 1,
          shipmentCode: 'SHP-001',
          origin: 'Chennai',
          destination: 'Mumbai',
          driverId: 1,
          status: 'IN_TRANSIT',
          progress: 45,
          sourceLat: 13.08,
          sourceLng: 80.27,
          destLat: 19.07,
          destLng: 72.87
        },
        {
          id: 2,
          shipmentCode: 'SHP-002',
          origin: 'Delhi',
          destination: 'Bengaluru',
          driverId: 2,
          status: 'PENDING',
          progress: 0,
          sourceLat: 28.61,
          sourceLng: 77.20,
          destLat: 12.97,
          destLng: 77.59
        }
      ];
      const formatted = demoShipments.map(s => ({
        ...s,
        sourceCoords: [s.sourceLat, s.sourceLng],
        destCoords: [s.destLat, s.destLng],
        driver: s.driverId ? `Unit-${s.driverId}` : 'Unassigned'
      }));
      setShipments(formatted);
      if (!selectedShipment) setSelectedShipment(formatted[0]);
    }
    finally {
      setLoading(false);
    }
  }, [selectedShipment]);

  useEffect(() => { loadShipments(); }, [loadShipments]);

  const handleEdit = (s) => {
    setEditingShipment(s.id);
    setEditForm({ ...s });
  };

  const cancelEdit = () => {
    setEditingShipment(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    try {
      const sKey = editForm.origin.toLowerCase().trim();
      const dKey = editForm.destination.toLowerCase().trim();
      const payload = {
        ...editForm,
        sourceLat: cityDatabase[sKey]?.[0] || editForm.sourceLat,
        sourceLng: cityDatabase[sKey]?.[1] || editForm.sourceLng,
        destLat: cityDatabase[dKey]?.[0] || editForm.destLat,
        destLng: cityDatabase[dKey]?.[1] || editForm.destLng
      };
      await fetch(`http://localhost:8080/api/shipments/${editingShipment}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setEditingShipment(null);
      loadShipments();
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const sKey = newShipment.origin.toLowerCase().trim();
    const dKey = newShipment.destination.toLowerCase().trim();
    const payload = {
      ...newShipment,
      driverId: newShipment.driverId ? parseInt(newShipment.driverId) : null,
      sourceLat: cityDatabase[sKey]?.[0] || 13.08,
      sourceLng: cityDatabase[sKey]?.[1] || 80.27,
      destLat: cityDatabase[dKey]?.[0] || 19.07,
      destLng: cityDatabase[dKey]?.[1] || 72.87
    };
    try {
      const res = await fetch('http://localhost:8080/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowForm(false);
        setNewShipment({ shipmentCode: '', origin: '', destination: '', driverId: '', status: 'PENDING', progress: 0 });
        loadShipments(true);
      } else {
        const err = await res.json();
        setValidationErrors(err.errors || ["Validation Failed"]);
      }
    } catch (err) { console.error(err); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this shipment?')) {
      try {
        await fetch(`http://localhost:8080/api/shipments/${id}`, {
          method: 'DELETE'
        });
        loadShipments();
        if (selectedShipment?.id === id) {
          setSelectedShipment(null);
        }
      } catch (err) { console.error(err); }
    }
  };

  const filteredShipments = useMemo(() => shipments.filter(s =>
    s.shipmentCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.driver?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [searchTerm, shipments]);

  // Function to call the Python Microservice
  const fetchSmartPrediction = useCallback(async (distance) => {
    console.log('fetchSmartPrediction called with distance:', distance);
    if (!distance || distance <= 0) return;

    try {
      console.log('Making API call to:', `http://localhost:8001/eta/`);
      const response = await fetch("http://localhost:8001/eta/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ distance: distance })
      });
      console.log('API response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('API response data:', data);
        // Ensure we match the keys returned by your Python summarizer
        setSmartETA(data);
      } else {
        console.error('API response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error("ETA Microservice Offline. Check Python terminal (Port 8001)", error);
      // Set fallback ETA based on simple calculation using the passed distance
      const fallbackETA = Math.round(distance / 60 * 60); // Rough estimate: 60 km/h
      setSmartETA({
        mean: fallbackETA,
        median: fallbackETA,
        percentile_95: Math.round(fallbackETA * 1.3)
      });
    }
  }, []);

  const totalDistance = useMemo(() => {
    if (!selectedShipment) return 0;

    const lat1 = selectedShipment.sourceCoords[0];
    const lon1 = selectedShipment.sourceCoords[1];
    const lat2 = selectedShipment.destCoords[0];
    const lon2 = selectedShipment.destCoords[1];
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, [selectedShipment]);

  const remainingKm = useMemo(() => {
    if (!selectedShipment) return 0;
    const remaining = totalDistance * (1 - selectedShipment.progress / 100);
    console.log('Remaining distance calculation:', {
      shipmentId: selectedShipment.id,
      totalDistance,
      progress: selectedShipment.progress,
      remainingKm: remaining
    });
    return remaining;
  }, [totalDistance, selectedShipment?.progress, selectedShipment?.id]);

  const etaInfo = useMemo(() => {
    if (!selectedShipment || selectedShipment.status === 'DELIVERED') {
      return { eta: 'Arrived', deliveryDate: null, dayLabel: null, etaFull: 'Delivered' };
    }

    const averageSpeedKmh = 60;
    const prog = Number(selectedShipment.progress) || 0;

    if (remainingKm <= 0 || prog >= 100) {
      return { eta: 'Arriving Now', deliveryDate: null, dayLabel: 'Now', etaFull: 'Arriving Now' };
    }

    const timeRemainingHours = remainingKm / averageSpeedKmh;
    const timeRemainingMs = timeRemainingHours * 60 * 60 * 1000;

    const etaDate = new Date(Date.now() + timeRemainingMs);

    const formattedDay = etaDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    const formattedTime = etaDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    let relativeDay = formattedDay;
    if (etaDate.toDateString() === today.toDateString()) {
      relativeDay = 'Today';
    } else if (etaDate.toDateString() === tomorrow.toDateString()) {
      relativeDay = 'Tomorrow';
    }

    return {
      eta: formattedTime,
      deliveryDate: formattedDay,
      dayLabel: relativeDay,
      etaFull: `${formattedDay} at ${formattedTime}`,
      etaDate: etaDate
    };
  }, [selectedShipment?.id, selectedShipment?.status, selectedShipment?.progress, remainingKm]);

  const getPositionAlongRoute = useCallback((routeCoords, progress) => {
    if (!routeCoords || routeCoords.length < 2) {
      // Fallback to linear interpolation
      if (!selectedShipment) return [13.08, 80.27];
      if (!selectedShipment.sourceCoords || !selectedShipment.destCoords) return [13.08, 80.27];
      return getInterpolatedPoint(
        selectedShipment.sourceCoords,
        selectedShipment.destCoords,
        progress
      );
    }

    let totalRouteDistance = 0;
    for (let i = 1; i < routeCoords.length; i++) {
      const p1 = routeCoords[i - 1];
      const p2 = routeCoords[i];
      if (!p1 || !p2 || typeof p1.lat !== 'number' || typeof p2.lat !== 'number') continue;
      const segmentDistance = Math.sqrt(
        Math.pow(p2.lat - p1.lat, 2) + Math.pow(p2.lng - p1.lng, 2)
      );
      totalRouteDistance += segmentDistance;
    }

    const targetDistance = totalRouteDistance * (progress / 100);
    let accumulatedDistance = 0;

    for (let i = 1; i < routeCoords.length; i++) {
      const p1 = routeCoords[i - 1];
      const p2 = routeCoords[i];
      if (!p1 || !p2 || typeof p1.lat !== 'number' || typeof p2.lat !== 'number') continue;

      const segmentDistance = Math.sqrt(
        Math.pow(p2.lat - p1.lat, 2) + Math.pow(p2.lng - p1.lng, 2)
      );

      if (accumulatedDistance + segmentDistance >= targetDistance) {
        const remainingDistance = targetDistance - accumulatedDistance;
        const ratio = remainingDistance / segmentDistance;

        const lat = p1.lat + (p2.lat - p1.lat) * ratio;
        const lng = p1.lng + (p2.lng - p1.lng) * ratio;

        return [lat, lng];
      }

      accumulatedDistance += segmentDistance;
    }

    // If we reach here, return the last valid point or fallback
    const lastPoint = routeCoords[routeCoords.length - 1];
    if (lastPoint && typeof lastPoint.lat === 'number' && typeof lastPoint.lng === 'number') {
      return [lastPoint.lat, lastPoint.lng];
    }

    // Final fallback
    if (selectedShipment && selectedShipment.destCoords) {
      return selectedShipment.destCoords;
    }
    return [13.08, 80.27];
  }, [selectedShipment]);

  const currentPos = useMemo(() => {
    if (!selectedShipment) return [13.08, 80.27];

    return getPositionAlongRoute(currentRoute, selectedShipment.progress);
  }, [selectedShipment?.progress, selectedShipment?.id, currentRoute, getPositionAlongRoute]);

  // Effect to trigger smart prediction when remainingKm changes
  useEffect(() => {
    console.log('ETA Effect triggered:', { selectedShipment: !!selectedShipment, remainingKm, hasShipment: !!selectedShipment });
    if (selectedShipment && remainingKm > 0) {
      console.log('Resetting smartETA and calling fetchSmartPrediction with distance:', remainingKm);
      setSmartETA(null); // Reset ETA before fetching new one
      fetchSmartPrediction(remainingKm);
    } else {
      console.log('Setting smartETA to null');
      setSmartETA(null);
    }
  }, [selectedShipment?.id, remainingKm, fetchSmartPrediction]);

  return (
    <div className="p-6 lg:p-12 space-y-10 bg-slate-50 min-h-screen">
      {/* Header (unchanged) */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-8 rounded-4xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-200"><MapIcon size={32} /></div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Active Dispatches</h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Live SQL Backend
            </p>
          </div>
        </div>

        <div className="flex gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by code, city, or driver..." 
              value={searchTerm}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-medium outline-none focus:border-slate-900 transition-all caret-black"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
          >
            {showForm ? "Close Form" : "New Dispatch"}
          </button>
        </div>
      </div>

     
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-10 rounded-4xl border-4 border-emerald-50 shadow-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-500">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Shipment ID *</label>
            <input 
              className="w-full p-4 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold outline-none focus:border-emerald-500" 
              placeholder="e.g. SHP-900" 
              value={newShipment.shipmentCode} 
              onChange={e => setNewShipment({...newShipment, shipmentCode: e.target.value})} 
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Origin City *</label>
            <input 
              className="w-full p-4 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold outline-none focus:border-emerald-500" 
              placeholder="e.g. Delhi" 
              value={newShipment.origin} 
              onChange={e => setNewShipment({...newShipment, origin: e.target.value})} 
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Destination City *</label>
            <input 
              className="w-full p-4 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold outline-none focus:border-emerald-500" 
              placeholder="e.g. Jaipur" 
              value={newShipment.destination} 
              onChange={e => setNewShipment({...newShipment, destination: e.target.value})} 
              required 
            />
          </div>

         
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
              <User size={12} /> Driver ID
            </label>
            <input 
              className="w-full p-4 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold outline-none focus:border-blue-500" 
              placeholder="e.g.101" 
              value={newShipment.driverId} 
              onChange={e => setNewShipment({...newShipment, driverId: e.target.value})} 
            />
          </div>
          
          {validationErrors.length > 0 && (
            <div className="col-span-full lg:col-span-4 bg-red-50 p-4 rounded-2xl border border-red-100">
              {validationErrors.map((err, i) => (
                <p key={i} className="text-red-600 text-xs font-bold">⚠️ {err}</p>
              ))}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={formLoading} 
            className="md:col-span-2 lg:col-span-4 bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-black transition-all shadow-2xl"
          >
            {formLoading ? "Deploying to Fleet..." : "Confirm & Deploy Dispatch"}
          </button>
        </form>
      )}

     
      {isMapVisible && selectedShipment && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in zoom-in-95 duration-500">
         
          <div className="xl:col-span-2 bg-white rounded-4xl h-[550px] relative overflow-hidden border-4 border-slate-200 shadow-2xl group">
            <button onClick={() => setIsMapVisible(false)} className="absolute top-6 right-6 z-[1001] bg-slate-900 text-white p-3 rounded-2xl hover:bg-red-600 transition-all shadow-xl"><X size={20} /></button>
            <MapContainer center={selectedShipment.sourceCoords} zoom={7} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={selectedShipment.sourceCoords} />
              <Marker position={selectedShipment.destCoords} />
              {selectedShipment.progress > 0 && selectedShipment.progress < 100 && (
                <Marker 
                  position={currentPos} 
                  icon={
                    getTransportationMode(selectedShipment) === 'truck' ? TruckIcon :
                    getTransportationMode(selectedShipment) === 'plane' ? PlaneIcon :
                    ShipIconMap
                  } 
                />
              )}
              
              
<RoutingEngine
  source={selectedShipment.sourceCoords}
  dest={selectedShipment.destCoords}
  transportationMode={getTransportationMode(selectedShipment)}
  onRouteUpdate={setCurrentRoute}
  onRouteLoading={setRouteLoading}
  onRouteLoaded={() => setRouteLoading(false)}
/>
              <MapViewHandler source={selectedShipment.sourceCoords} dest={selectedShipment.destCoords} />
            </MapContainer>
            
            <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-white shadow-xl z-[1000] flex justify-between items-center">
           
<div className="flex flex-col justify-center">
  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">
    {routeLoading ? 'Calculating Route...' : 'Telemetry Signal'}
  </p>
  <div className="flex items-center gap-3">
    <h4 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
      {selectedShipment?.shipmentCode}
    </h4>
    {routeLoading && (
      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    )}
  </div>
</div>
             <div className="flex items-center justify-between w-full">
  
  <span className="px-5 py-2 bg-slate-900 text-white rounded-full text-sm font-black shadow-lg shadow-slate-200 uppercase tracking-tighter">
    {selectedShipment?.status === 'DELIVERED' ? 'Arrived' : `${selectedShipment?.progress}% Complete`}
  </span>

 
  <div className="flex flex-col items-center">
    <p className="text-xl font-black text-blue-600 tracking-tight leading-none">
      {remainingKm.toFixed(2)} <span className="text-[10px] text-slate-400 uppercase ml-0.5">KM Left</span>
    </p>
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
      Route: {totalDistance.toFixed(2)} KM Total
    </p>
  </div>

 
 {/* ✅ LIVE ETA PREDICTION (Replaced with Python Data) */}
<div className="flex flex-col items-center px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100">
  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">
    AI Smart ETA
  </p>
  {smartETA ? (
    <div className="text-center">
      <p className="text-sm font-black text-emerald-900 leading-tight">
        {Math.round(smartETA.mean)} mins
      </p>
      <p className="text-[8px] font-bold text-emerald-500 uppercase">
        Safe Window: {Math.round(smartETA.percentile_95)}m
      </p>
    </div>
  ) : (
    <p className="text-sm font-black text-slate-400 animate-pulse">
      Calculating...
    </p>
  )}
</div>

  
  <div className="flex flex-col items-center">
    <p className="text-[10px] font-bold text-slate-500 uppercase">
      {selectedShipment?.origin} → {selectedShipment?.destination}
    </p>
    
    
    {selectedShipment?.driver && (
      <p className="text-xs font-bold text-slate-700 flex items-center gap-2 mt-1">
        <User size={14} className="text-slate-400" /> {selectedShipment.driver}
      </p>
    )}
  </div>
</div>
            </div>
          </div>

  
  {selectedShipment && (
    <div className="bg-white rounded-4xl border-2 border-slate-200 p-8 shadow-2xl flex flex-col overflow-y-auto h-[550px]">
      <div>
        <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
          <Clock size={24} className="text-slate-400" /> Complete Order History
        </h3>
        <div className="space-y-8 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-1 before:bg-slate-100">
          
          
          <div className="flex gap-8 relative pl-10">
            <div className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-sm bg-emerald-500 text-white">
              <CheckCircle2 size={16}/>
            </div>
            <div>
              <p className="font-black text-base text-slate-900">Order Created</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">00:00</p>
            </div>
          </div>

         
          <div className="flex gap-8 relative pl-10">
            <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-sm ${
              selectedShipment.driverId ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'
            }`}>
              <User size={16}/>
            </div>
            <div>
              <p className="font-black text-base text-slate-900">
                {selectedShipment.driverId ? `Driver Assigned: ${selectedShipment.driver}` : 'Awaiting Driver Assignment'}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {selectedShipment.driverId ? '00:15' : 'Pending'}
              </p>
            </div>
          </div>

          
          <div className="flex gap-8 relative pl-10">
            <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-sm ${
              selectedShipment.progress > 0 ? 'bg-indigo-500 text-white' : 'bg-white border-2 border-slate-100 text-slate-200'
            }`}>
              <Navigation size={16}/>
            </div>
            <div>
              <p className={`font-black text-base ${selectedShipment.progress > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                Dispatched - {selectedShipment.origin} → {selectedShipment.destination}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {selectedShipment.progress > 0 ? '02:30' : 'Pending'}
              </p>
            </div>
          </div>

          
          <div className="flex gap-8 relative pl-10">
            <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-sm ${
              selectedShipment.progress >= 50 ? 'bg-purple-500 text-white' : 'bg-white border-2 border-slate-100 text-slate-200'
            }`}>
              {getTransportationIcon(getTransportationMode(selectedShipment))}
            </div>
            <div>
              <p className={`font-black text-base ${selectedShipment.progress >= 50 ? 'text-slate-900' : 'text-slate-300'}`}>
                In Transit - {Math.round(selectedShipment.progress)}% Complete
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {selectedShipment.progress >= 50 ? '04:45' : 'Pending'}
              </p>
            </div>
          </div>

          
          <div className="flex gap-8 relative pl-10">
            <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-sm ${
              selectedShipment.status === 'DELIVERED' 
                ? 'bg-green-500 text-white' 
                : selectedShipment.status === 'CANCELLED'
                ? 'bg-red-500 text-white'
                : 'bg-orange-500 text-white'
            }`}>
              {selectedShipment.status === 'DELIVERED' ? <CheckCircle2 size={16}/> : 
               selectedShipment.status === 'CANCELLED' ? <X size={16}/> : <Play size={16}/>}
            </div>
            <div>
              <p className="font-black text-base text-slate-900">
                {selectedShipment.status.replace('_', ' ').toUpperCase()}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">LIVE</p>
            </div>
          </div>

          
          <div className="flex gap-8 relative pl-10 opacity-75">
            <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-sm ${
              selectedShipment.status === 'DELIVERED' ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-slate-100 text-slate-200'
            }`}>
              <Package size={16}/>
            </div>
            <div>
              <p className={`font-black text-base ${selectedShipment.status === 'DELIVERED' ? 'text-slate-900' : 'text-slate-300'}`}>
                Delivery Confirmed & Signed
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {selectedShipment.status === 'DELIVERED' ? '06:20' : 'Pending'}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )}


            
            </div>
         
      )}

      {!isMapVisible && (
        <button onClick={() => setIsMapVisible(true)} className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-slate-800 transition-all shadow-2xl animate-in fade-in mx-auto">
          <MapIcon size={20} /> Restore Visual Tracking Interface
        </button>
      )}

<div className="bg-white rounded-4xl border-2 border-slate-200 shadow-sm overflow-hidden">
  {filteredShipments.length > 0 ? (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 text-slate-900 text-[11px] font-black uppercase tracking-[0.3em] border-b-2 border-slate-100">
          <tr>
            <th className="p-8">Fleet Code</th>
            <th className="p-8 text-center">Driver</th>
            <th className="p-8 text-center">Load Progress</th>
            <th className="p-8 text-center">Active Vector</th>
            <th className="p-8 text-center">Status</th>
            <th className="p-8 text-right">Command</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {filteredShipments.map(s => (
            <tr 
              key={s.id} 
              onClick={() => { 
                if (editingShipment !== s.id) {
                  setSelectedShipment(s); 
                  setIsMapVisible(true); 
                }
              }} 
              className={`hover:bg-slate-50/80 cursor-pointer transition-all group ${selectedShipment?.id === s.id ? 'bg-blue-50/50' : ''} ${editingShipment === s.id ? 'bg-yellow-50/80' : ''}`}
            >
              
              <td className="p-8">
                {editingShipment === s.id ? (
                  <input
                    value={editForm.shipmentCode}
                    onChange={(e) => setEditForm({...editForm, shipmentCode: e.target.value})}
                    className="w-full p-3 border-2 border-yellow-200 rounded-xl bg-yellow-50 font-black text-2xl text-slate-900 focus:border-yellow-400 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <>
                    <p className="font-black text-slate-900 text-2xl group-hover:translate-x-1 transition-transform">{s.shipmentCode}</p>
                   
                  </>
                )}
              </td>

              
              <td className="p-8 text-center">
                {editingShipment === s.id ? (
                  <input
                    type="text"
                    value={editForm.driverId}
                    onChange={(e) => setEditForm({...editForm, driverId: e.target.value})}
                    placeholder="Driver ID"
                    className="w-32 p-3 border-2 border-yellow-200 rounded-xl bg-yellow-50 font-bold text-sm text-slate-900 focus:border-yellow-400 focus:outline-none text-center"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {s.driverId || '?'}
                    </div>
                    <span className="text-sm font-bold text-slate-900">{s.driver}</span>
                  </div>
                )}
              </td>

              
              <td className="p-8">
                {editingShipment === s.id ? (
                  <div className="flex flex-col items-center gap-4">
                  
                    <div className="flex items-center gap-2 w-full justify-center">
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                      <div className="flex-1 h-1 bg-gray-200 rounded-full" />
                      <div className={`w-2 h-2 rounded-full ${editForm.progress >= 25 ? 'bg-emerald-500 shadow-lg' : 'bg-gray-300'}`} />
                      <div className="flex-1 h-1 bg-gray-200 rounded-full" />
                      <div className={`w-2 h-2 rounded-full ${editForm.progress >= 50 ? 'bg-blue-500 shadow-lg' : 'bg-gray-300'}`} />
                      <div className="flex-1 h-1 bg-gray-200 rounded-full" />
                      <div className={`w-2 h-2 rounded-full ${editForm.progress >= 75 ? 'bg-purple-500 shadow-lg' : 'bg-gray-300'}`} />
                      <div className="flex-1 h-1 bg-gray-200 rounded-full" />
                      <div className={`w-2 h-2 rounded-full ${editForm.progress >= 100 ? 'bg-emerald-500 shadow-lg' : 'bg-gray-300'}`} />
                    </div>
                    
                   
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="25"
                      value={editForm.progress}
                      onChange={(e) => setEditForm({...editForm, progress: parseInt(e.target.value)})}
                      className="w-48 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400"
                    />
                    <span className="font-black text-slate-900 text-base">{editForm.progress}%</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 justify-center">
                    <div className="w-32 h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-slate-900 transition-all duration-1000" style={{ width: `${s.progress}%` }}></div>
                    </div>
                    <span className="font-black text-slate-900 text-base">{s.progress}%</span>
                  </div>
                )}
              </td>

              
              <td className="p-8 text-center">
                {editingShipment === s.id ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <input
                        value={editForm.origin}
                        onChange={(e) => setEditForm({...editForm, origin: e.target.value})}
                        placeholder="Origin"
                        className="flex-1 p-2 border-2 border-yellow-200 rounded-xl bg-yellow-50 text-[10px] font-black uppercase text-slate-900 focus:border-yellow-400"
                      />
                      <Navigation size={12} className="text-blue-600 rotate-90 my-auto" />
                      <input
                        value={editForm.destination}
                        onChange={(e) => setEditForm({...editForm, destination: e.target.value})}
                        placeholder="Destination"
                        className="flex-1 p-2 border-2 border-yellow-200 rounded-xl bg-yellow-50 text-[10px] font-black uppercase text-blue-600 focus:border-yellow-400"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="inline-flex items-center px-5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <span className="text-[10px] font-black text-slate-900 uppercase">{s.origin}</span>
                    <Navigation size={12} className="mx-4 text-blue-600 rotate-90" />
                    <span className="text-[10px] font-black text-blue-600 uppercase">{s.destination}</span>
                  </div>
                )}
              </td>

              
              <td className="p-8 text-center">
                <div className="relative">
                  <select
                    value={editingShipment === s.id ? editForm.status : s.status}
                    onChange={(e) => {
                      if (editingShipment === s.id) {
                        setEditForm({...editForm, status: e.target.value});
                      } else {
                        updateStatus(s.id, e.target.value);
                      }
                    }}
                    disabled={updatingStatus[s.id]}
                    className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm hover:shadow-md w-40 appearance-none cursor-pointer"
                  >
                    {STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {updatingStatus[s.id] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </td>

             
              <td className="p-8 text-right flex gap-2 justify-end">
                {editingShipment === s.id ? (
                  <>
                    <button 
                      onClick={saveEdit}
                      className="p-3 bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl transition-all active:scale-95 shadow-sm font-bold"
                      title="Save Changes"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <button 
                      onClick={cancelEdit}
                      className="p-3 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-2xl transition-all active:scale-95 shadow-sm"
                      title="Cancel"
                    >
                      <X size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(s);
                      }}
                      className="p-3 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all active:scale-95 shadow-sm"
                      title="Edit Shipment"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(s.id, e);
                      }} 
                      className="p-4 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all active:scale-90 shadow-sm"
                    >
                      <Trash2 size={22} />
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="p-20 text-center font-black text-slate-400">NO FLEET UNITS DETECTED</div>
  )}
</div>
</div>
  );
}

