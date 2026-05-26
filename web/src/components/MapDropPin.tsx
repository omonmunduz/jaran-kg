'use client';

import { useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center[0], center[1]],
      zoom: zoom,
    });

    const handleMapClick = (e: mapboxgl.MapLayerMouseEvent) => {
      const { lng, lat } = e.lngLat;

      if (marker.current) {
        marker.current.remove();
      }

      marker.current = new mapboxgl.Marker()
        .setLngLat([lng, lat])
        .addTo(map.current!);

      setSelectedCoords({ lat, lng });
      onLocationSelect(lat, lng);
    };

    map.current.on('click', handleMapClick as any);

    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick as any);
        map.current.remove();
      }
    };
  }, [onLocationSelect, center, zoom]);

  return (
    <div className="space-y-2">
      <div ref={mapContainer} className="h-96 w-full rounded-lg" />
      {selectedCoords && (
        <div className="rounded bg-gray-100 p-2 text-sm text-gray-700">
          Coordinates: {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}
