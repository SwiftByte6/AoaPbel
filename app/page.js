'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('./components/MapComponent'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-200 flex items-center justify-center">Loading map...</div>
});

export default function BusRoutePlanner() {
  const [stops, setStops] = useState([]);
  const [newStopName, setNewStopName] = useState('');
  const [route, setRoute] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [showComparison, setShowComparison] = useState(false);
  const [originalRoute, setOriginalRoute] = useState([]);
  const [originalDistance, setOriginalDistance] = useState(0);

  // Generate random coordinates around Mumbai
  const generateRandomCoordinates = () => {
    const baseLat = 19.07;
    const baseLng = 72.87;
    const offset = 0.05; // ~5km radius
    
    return {
      lat: baseLat + (Math.random() - 0.5) * offset,
      lng: baseLng + (Math.random() - 0.5) * offset
    };
  };

  const addStop = () => {
    if (newStopName.trim()) {
      const coordinates = generateRandomCoordinates();
      const newStop = {
        id: Date.now(),
        name: newStopName.trim(),
        ...coordinates
      };
      setStops([...stops, newStop]);
      setNewStopName('');
    }
  };

  const removeStop = (id) => {
    setStops(stops.filter(stop => stop.id !== id));
    setRoute([]);
    setTotalDistance(0);
    setShowComparison(false);
    setOriginalRoute([]);
    setOriginalDistance(0);
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (point1, point2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const findShortestPath = () => {
    if (stops.length < 2) {
      alert('Please add at least 2 stops to find a route');
      return;
    }
    
    // Nearest Neighbor Algorithm for TSP
    const unvisited = [...stops];
    const path = [];
    
    // Start with the first stop
    let currentStop = unvisited.shift();
    path.push(currentStop);
    
    // Visit nearest unvisited stop each time
    while (unvisited.length > 0) {
      let nearestStop = unvisited[0];
      let shortestDistance = calculateDistance(currentStop, nearestStop);
      let nearestIndex = 0;
      
      // Find the nearest unvisited stop
      for (let i = 1; i < unvisited.length; i++) {
        const distance = calculateDistance(currentStop, unvisited[i]);
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestStop = unvisited[i];
          nearestIndex = i;
        }
      }
      
      // Move to nearest stop
      currentStop = unvisited.splice(nearestIndex, 1)[0];
      path.push(currentStop);
    }
    
    // Return to start
    path.push(path[0]);
    
    // Calculate total distance
    let totalDist = 0;
    for (let i = 0; i < path.length - 1; i++) {
      totalDist += calculateDistance(path[i], path[i + 1]);
    }
    
    setRoute(path);
    setTotalDistance(totalDist);
    
    // Also calculate original order distance for comparison
    const originalPath = [...stops];
    if (originalPath.length > 0) {
      originalPath.push(originalPath[0]);
    }
    
    let originalDist = 0;
    for (let i = 0; i < originalPath.length - 1; i++) {
      originalDist += calculateDistance(originalPath[i], originalPath[i + 1]);
    }
    
    setOriginalRoute(originalPath);
    setOriginalDistance(originalDist);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addStop();
    }
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Left Panel - 1/3 width */}
      <div className="w-1/3 bg-white/80 overflow-y-a backdrop-blur-sm border-r border-slate-200/60 p-8 flex flex-col shadow-xl">
        {/* Top Section - Stop Input */}
        <div className="flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Bus Route Planner
            </h1>
            <p className="text-slate-600 text-sm">Plan optimal bus routes with AI-powered optimization</p>
          </div>
          
          <div className="mb-8">
            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newStopName}
                  onChange={(e) => setNewStopName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter bus stop name"
                  className="w-full px-4 py-3 pl-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm text-slate-700 placeholder-slate-400"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <button
                onClick={addStop}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add
              </button>
            </div>
            
            {/* Stops List */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Added Stops</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent"></div>
              </div>
              {stops.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-sm">No stops added yet</p>
                  <p className="text-slate-400 text-xs mt-1">Add your first stop to get started</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                  {stops.map((stop, index) => (
                    <div
                      key={stop.id}
                      className="group flex items-center justify-between bg-white/70 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-slate-200/50 hover:shadow-md hover:border-slate-300/50 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                          {index + 1}
                        </div>
                        <div>
                          <span className="text-slate-800 font-medium">{stop.name}</span>
                          <div className="text-xs text-slate-500">
                            {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeStop(stop.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section - Find Path Button */}
        <div className="mt-auto space-y-4">
          <button
            onClick={findShortestPath}
            disabled={stops.length < 2}
            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:ring-offset-2 transition-all duration-200 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Find Optimal Route
          </button>
          
          {route.length > 0 && (
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="w-full py-3 px-6 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl hover:from-slate-600 hover:to-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:ring-offset-2 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {showComparison ? 'Hide' : 'Show'} Comparison
            </button>
          )}
          {route.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/60 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-emerald-800 font-semibold text-sm">
                    Route Optimized! {route.length - 1} stops
                  </p>
                  <p className="text-emerald-600 text-xs">
                    Using Nearest Neighbor Algorithm
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-emerald-200/40">
                  <div className="text-xs text-slate-600 mb-1">Total Distance</div>
                  <div className="text-lg font-bold text-emerald-700">{totalDistance.toFixed(2)} km</div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-emerald-200/40">
                  <div className="text-xs text-slate-600 mb-1">Stops</div>
                  <div className="text-lg font-bold text-emerald-700">{route.length - 1}</div>
                </div>
              </div>
              
              {showComparison && (
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-emerald-200/40 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-sm font-medium text-slate-700">Comparison</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">Original distance:</span>
                      <span className="text-sm font-medium text-slate-700">{originalDistance.toFixed(2)} km</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">Optimized distance:</span>
                      <span className="text-sm font-medium text-emerald-600">{totalDistance.toFixed(2)} km</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="text-xs font-medium text-slate-700">Savings:</span>
                      <span className="text-sm font-bold text-blue-600">
                        {((originalDistance - totalDistance) / originalDistance * 100).toFixed(1)}% 
                        ({(originalDistance - totalDistance).toFixed(2)} km)
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Route Summary */}
              {route.length > 1 && (
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-emerald-200/40">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="text-sm font-medium text-slate-700">Route Summary</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        S
                      </div>
                      <div>
                        <div className="text-xs text-slate-600">Start Point</div>
                        <div className="text-sm font-medium text-slate-800">{route[0]?.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        E
                      </div>
                      <div>
                        <div className="text-xs text-slate-600">End Point</div>
                        <div className="text-sm font-medium text-slate-800">{route[route.length - 2]?.name}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - 2/3 width */}
      <div className="w-2/3">
        <MapComponent 
          stops={stops} 
          route={route} 
          showComparison={showComparison}
          originalRoute={originalRoute}
        />
      </div>
    </div>
  );
}
