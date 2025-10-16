'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom icons for start and end points
const createCustomIcon = (gradient, text, size = 32) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
      background: ${gradient};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      font-size: ${size === 32 ? '14px' : '12px'};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">${text}</div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};

const startIcon = createCustomIcon('linear-gradient(135deg, #10b981 0%, #059669 100%)', 'S', 36); // Green for Start
const endIcon = createCustomIcon('linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 'E', 36);   // Red for End
const routeIcon = createCustomIcon('linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', '', 32);  // Blue for route stops

export default function MapComponent({ stops, route, showComparison, originalRoute }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <div className="text-gray-600">Loading map...</div>
      </div>
    );
  }

  // Mumbai coordinates
  const mumbaiCenter = [19.07, 72.87];

  // Create route coordinates for polyline
  const routeCoordinates = route.map(stop => [stop.lat, stop.lng]);
  const originalRouteCoordinates = originalRoute ? originalRoute.map(stop => [stop.lat, stop.lng]) : [];

  return (
    <div className="w-full h-full relative">
      {/* Legend */}
      {routeCoordinates.length > 1 && (
        <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm p-5 rounded-2xl shadow-xl border border-slate-200/60 z-10 text-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="font-semibold text-slate-700 text-sm">Route Legend</span>
          </div>
          
          {/* Route Lines */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-full" style={{ borderTop: '2px dashed #ef4444' }}></div>
              <span className="text-slate-600 font-medium">Optimized Route</span>
            </div>
            {showComparison && originalRouteCoordinates.length > 1 && (
              <div className="flex items-center gap-3">
                <div className="w-6 h-1 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full" style={{ borderTop: '2px dashed #64748b' }}></div>
                <span className="text-slate-600 font-medium">Original Order</span>
              </div>
            )}
          </div>
          
          {/* Markers */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">S</div>
              <span className="text-slate-600 font-medium">Start Point</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">E</div>
              <span className="text-slate-600 font-medium">End Point</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">#</div>
              <span className="text-slate-600 font-medium">Route Stops</span>
            </div>
          </div>
        </div>
      )}
      
      <MapContainer
        center={mumbaiCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Render markers for each stop */}
        {stops.map((stop, index) => {
          // Find the position of this stop in the route
          const routeIndex = route.findIndex(routeStop => routeStop.id === stop.id);
          const isStartPoint = routeIndex === 0;
          const isEndPoint = routeIndex === route.length - 2; // -2 because last item is return to start
          const isInRoute = routeIndex !== -1;
          
          // Determine which icon to use
          let iconToUse = L.Icon.Default.prototype;
          let markerText = index + 1;
          
          if (isInRoute && route.length > 1) {
            if (isStartPoint) {
              iconToUse = startIcon;
              markerText = 'S';
            } else if (isEndPoint) {
              iconToUse = endIcon;
              markerText = 'E';
            } else {
              iconToUse = routeIcon;
              markerText = routeIndex;
            }
          }
          
          return (
            <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={iconToUse}>
              <Popup className="custom-popup">
                <div className="p-2 min-w-[200px]">
                  <div className="text-center">
                    <div className="font-bold text-slate-800 mb-2 text-sm">
                      {isInRoute && route.length > 1 ? (
                        <>
                          {isStartPoint && <span className="text-emerald-600 flex items-center justify-center gap-1">🚀 START POINT</span>}
                          {isEndPoint && <span className="text-red-600 flex items-center justify-center gap-1">🏁 END POINT</span>}
                          {!isStartPoint && !isEndPoint && `Stop ${routeIndex}`}
                        </>
                      ) : (
                        `Stop ${index + 1}`
                      )}
                    </div>
                    <div className="text-slate-700 font-medium mb-2">{stop.name}</div>
                    <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-2 py-1 mb-2">
                      {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                    </div>
                    {isInRoute && route.length > 1 && (
                      <div className="text-xs text-blue-600 bg-blue-50 rounded-lg px-2 py-1 font-medium">
                        Route Position: {routeIndex + 1} of {route.length - 1}
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        {/* Render original route polyline if comparison is shown */}
        {showComparison && originalRouteCoordinates.length > 1 && (
          <Polyline
            positions={originalRouteCoordinates}
            color="gray"
            weight={3}
            opacity={0.6}
            dashArray="10, 10"
          />
        )}
        
        {/* Render optimized route polyline if route exists */}
        {routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            color="red"
            weight={4}
            opacity={0.8}
            dashArray="5, 5"
          />
        )}
        
        {/* Add direction arrows for the route */}
        {routeCoordinates.length > 2 && routeCoordinates.slice(0, -1).map((coord, index) => {
          if (index === routeCoordinates.length - 2) return null; // Skip last segment (return to start)
          
          const nextCoord = routeCoordinates[index + 1];
          const midLat = (coord[0] + nextCoord[0]) / 2;
          const midLng = (coord[1] + nextCoord[1]) / 2;
          
          return (
            <Marker key={`arrow-${index}`} position={[midLat, midLng]} icon={L.divIcon({
              className: 'arrow-marker',
              html: `<div style="
                color: red;
                font-size: 16px;
                font-weight: bold;
                text-shadow: 1px 1px 2px rgba(255,255,255,0.8);
              ">→</div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })} />
          );
        })}
      </MapContainer>
    </div>
  );
}
