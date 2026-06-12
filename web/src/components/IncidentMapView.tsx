'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Incident, Category } from '@civic-platform/shared';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface IncidentMapViewProps {
  incidents: (Incident & { category: Category })[];
  onMarkerClick?: (incident: Incident & { category: Category }) => void;
  center?: [number, number];
  zoom?: number;
  showUserLocation?: boolean;
}

const getCategoryEmoji = (icon: string): string => {
  const emojiMap: Record<string, string> = {
    health: '🏥',
    road: '🛣️',
    security: '🚨',
    lighting: '💡',
    garbage: '🗑️',
    utilities: '💧',
    education: '💡',
    safety: '🚨',
    vandalism: '🏚️',
    noise: '📢',
    environment: '🌳',
    traffic: '🚗',
    construction: '🚧',
    animal: '🐾',
    fire: '🔥',
    flood: '🌊',
    other: '📍',
  };

  return emojiMap[icon?.toLowerCase()] ?? '📍';
};

export function IncidentMapView({
  incidents,
  onMarkerClick,
  center = [74.6, 42.8],
  zoom = 12,
  showUserLocation = true,
}: IncidentMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const incidentMarkers = useRef<mapboxgl.Marker[]>([]);
  const userMarker = useRef<mapboxgl.Marker | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationStatus, setLocationStatus] =
    useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);

  // -----------------------
  // INIT MAP
  // -----------------------
  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center,
      zoom,
    });

    map.current = mapInstance;

    mapInstance.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      mapInstance.remove();
      map.current = null;
    };
  }, []);

  // -----------------------
  // GEOLOCATION (AUTO)
  // -----------------------
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    setLocationStatus('loading');
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [
          pos.coords.longitude,
          pos.coords.latitude,
        ];

        setUserLocation(coords);
        setLocationStatus('success');

        map.current?.flyTo({
          center: coords,
          zoom: 14,
          duration: 1500,
        });
      },
      (err) => {
        setLocationStatus('error');
        setLocationError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, []);

  // AUTO TRIGGER LOCATION ON MAP LOAD
  useEffect(() => {
    if (!mapLoaded || !showUserLocation) return;

    getUserLocation();
  }, [mapLoaded, showUserLocation, getUserLocation]);

  // -----------------------
  // USER MARKER
  // -----------------------
  useEffect(() => {
    if (!map.current || !mapLoaded || !userLocation) return;

    const [lng, lat] = userLocation;

    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

    userMarker.current?.remove();

    const el = document.createElement('div');
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#3b82f6';
    el.style.border = '3px solid white';
    el.style.boxShadow =
      '0 0 0 4px rgba(59,130,246,0.4), 0 0 0 10px rgba(59,130,246,0.2)';
    el.style.cursor = 'pointer';

    userMarker.current = new mapboxgl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(map.current);
  }, [userLocation, mapLoaded]);

  // -----------------------
  // INCIDENT MARKERS
  // -----------------------
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    incidentMarkers.current.forEach((m) => m.remove());
    incidentMarkers.current = [];

    incidents.forEach((incident) => {
      const el = document.createElement('div');
      el.style.fontSize = '26px';
      el.style.cursor = 'pointer';
      el.textContent = getCategoryEmoji(incident.category.icon);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([incident.lng, incident.lat])
        .addTo(map.current!);

      el.addEventListener('click', () => {
        onMarkerClick?.(incident);
      });

      incidentMarkers.current.push(marker);
    });
  }, [incidents, mapLoaded, onMarkerClick]);

  // -----------------------
  // UI
  // -----------------------
  return (
    <div className="w-full h-full relative">
      {/* Optional control panel (kept as fallback/debug) */}
      {showUserLocation && (
        <div className="absolute top-4 right-4 z-50 bg-white p-3 rounded-lg shadow-md flex flex-col gap-2 w-[220px]">
          <button
            onClick={getUserLocation}
            disabled={locationStatus === 'loading'}
            className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm disabled:opacity-50"
          >
            {locationStatus === 'loading'
              ? 'Getting location...'
              : '📍 Refresh Location'}
          </button>

          {locationStatus === 'error' && (
            <div className="text-xs text-red-600">{locationError}</div>
          )}

          {locationStatus === 'success' && userLocation && (
            <div className="text-xs text-green-600">
              {userLocation[0].toFixed(5)}, {userLocation[1].toFixed(5)}
            </div>
          )}
        </div>
      )}

      <div ref={mapContainer} className="w-full h-full rounded-lg" />
    </div>
  );
}