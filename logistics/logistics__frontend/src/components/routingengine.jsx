function RoutingEngine({ source, dest, setRoadPath }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !source || !dest) return;
    
    // ✅ Reset road path immediately when coordinates change
    setRoadPath([]); 

    const routingControl = L.Routing.control({
      waypoints: [L.latLng(source[0], source[1]), L.latLng(dest[0], dest[1])],
      lineOptions: { styles: [{ color: '#1e40af', weight: 6, opacity: 0.8 }] },
      addWaypoints: false,
      draggableWaypoints: false,
      show: false,
      containerClassName: 'hidden',
      createMarker: () => null,
    }).addTo(map);

    routingControl.on('routesfound', (e) => {
      const coords = e.routes[0].coordinates;
      setRoadPath(coords); 
    });

    return () => map.removeControl(routingControl);
  }, [map, source, dest, setRoadPath]);

  return null;
}