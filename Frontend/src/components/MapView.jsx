import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';

// Heatmap Layer Component
const HeatmapLayer = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!L.heatLayer) {
      console.error("Leaflet.heat not loaded! L.heatLayer is undefined.");
      return;
    }
    const heat = L.heatLayer(points, { radius: 30, blur: 20, maxZoom: 17 });
    heat.addTo(map);
    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);

  return null;
};

// Helper to get colored icons based on severity
const getMarkerIcon = (severity) => {
  const colors = {
    Critical: 'red',
    High: 'orange',
    Medium: 'gold',
    Low: 'green',
    Default: 'blue'
  };

  const color = colors[severity] || colors.Default;

  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const MapView = ({ incidents, onMarkerClick }) => {
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Default center (Vadodara, India)
  const defaultCenter = [22.3072, 73.1812];

  // Filter incidents that have valid coordinates
  const validIncidents = useMemo(() => incidents.filter(inc => inc.latitude && inc.longitude), [incidents]);
  // Increased intensity from 1 to 3 to make single incidents pop more on the heatmap
  const heatmapPoints = useMemo(() => validIncidents.map(inc => [inc.latitude, inc.longitude, 3]), [validIncidents]);

  useEffect(() => {
    if (showHeatmap) {
      console.log(`Heatmap Debug: Total Incidents: ${incidents.length}, Valid Coords: ${validIncidents.length}`);
      if (validIncidents.length === 0) {
        console.warn("Heatmap is empty because no incidents have valid GPS coordinates (latitude/longitude).");
      }
    }
  }, [showHeatmap, incidents.length, validIncidents.length]);

  return (
    <div className="card" style={{ height: '400px', marginBottom: '20px', padding: '0', overflow: 'hidden', position: 'relative' }}>
      <button 
        onClick={() => setShowHeatmap(!showHeatmap)}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          background: 'white',
          border: '2px solid rgba(0,0,0,0.2)',
          borderRadius: '4px',
          padding: '5px 10px',
          cursor: 'pointer',
          fontWeight: 'bold',
          color: '#333'
        }}
      >
        {showHeatmap ? 'Show Markers' : 'Show Heatmap'}
      </button>

      <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {showHeatmap ? (
          <HeatmapLayer points={heatmapPoints} />
        ) : (
          validIncidents.map((incident) => (
          <Marker 
            key={incident._id} 
            position={[incident.latitude, incident.longitude]}
            icon={getMarkerIcon(incident.severity)}
            eventHandlers={{
              click: () => {
                if (onMarkerClick) onMarkerClick(incident._id);
              },
            }}
          >
            <Popup>
              <strong>{incident.type === 'Other' && incident.customType ? incident.customType : incident.type}</strong><br />
              {incident.address}<br />
              Severity: <strong>{incident.severity}</strong><br />
              Status: {incident.status}
            </Popup>
          </Marker>
          ))
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
