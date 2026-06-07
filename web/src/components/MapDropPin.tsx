'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface MapDropPinProps {
  onLocationSelect: (lat: number, lng: number) => void;
  center?: [number, number];
  zoom?: number;
}

export function MapDropPin({
  onLocationSelect,
  center = [74.6, 42.8],
  zoom = 12,
}: MapDropPinProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Memoize the map click handler to prevent unnecessary re-renders
  const handleMapClick = useCallback((e: mapboxgl.MapLayerMouseEvent) => {
    const { lng, lat } = e.lngLat;

    if (marker.current) {
      marker.current.remove();
    }

    marker.current = new mapboxgl.Marker()
      .setLngLat([lng, lat])
      .addTo(map.current!);

    setSelectedCoords({ lat, lng });
    onLocationSelect(lat, lng);
    console.log('Location selected:', { lat, lng });
  }, [onLocationSelect]);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!MAPBOX_TOKEN) {
      console.error('Mapbox token not found');
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [center[0], center[1]],
      zoom: zoom,
    });

    map.current.on('load', () => {
      console.log('Map loaded successfully');
    });

    map.current.on('click', handleMapClick);

    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick);
        map.current.remove();
      }
    };
  }, [center, zoom, handleMapClick]);

  return (
    <div className="space-y-2">
      <div
        ref={mapContainer}
        className="h-96 w-full rounded-lg bg-gray-800 relative"
        style={{ minHeight: '400px' }}
      >
        {!MAPBOX_TOKEN && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg text-white">
            <p className="text-center">Map is loading... Make sure MAPBOX_TOKEN is set</p>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600">👆 Click on the map to select a location</p>
      {selectedCoords && (
        <div className="rounded bg-green-100 p-3 border border-green-300 text-sm text-green-800">
          ✓ Location selected: {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}
