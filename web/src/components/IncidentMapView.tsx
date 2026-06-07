'use client';

import { useEffect, useRef, useState } from 'react';
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

export function IncidentMapView({
  incidents,
  onMarkerClick,
  center = [74.6, 42.8],
  zoom = 12,
  showUserLocation = true,
}: IncidentMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const popups = useRef<mapboxgl.Popup[]>([]);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#ef4444'; // red
      case 'investigating':
        return '#eab308'; // yellow
      case 'resolved':
        return '#22c55e'; // green
      case 'closed':
        return '#6b7280'; // gray
      default:
        return '#3b82f6'; // blue
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [center[0], center[1]],
      zoom: zoom,
    });

    // Get user location
    if (showUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([longitude, latitude]);

          // Center map on user location
          if (map.current) {
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: 14,
              duration: 1500,
            });
          }
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [center, zoom, showUserLocation]);

  // User location marker with pulsing effect
  useEffect(() => {
    if (!map.current || !userLocation || !showUserLocation) return;

    if (userMarker.current) {
      userMarker.current.remove();
    }

    // Create pulsing dot element
    const el = document.createElement('div');
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#3b82f6';
    el.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.4)';
    el.style.animation = 'pulse 2s infinite';
    el.style.cursor = 'pointer';
    el.className = 'user-location-marker';

    // Add CSS animation
    if (!document.getElementById('pulse-animation')) {
      const style = document.createElement('style');
      style.id = 'pulse-animation';
      style.textContent = `
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.4), 0 0 0 12px rgba(59, 130, 246, 0.2);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.2), 0 0 0 16px rgba(59, 130, 246, 0.1);
          }
        }
      `;
      document.head.appendChild(style);
    }

    userMarker.current = new mapboxgl.Marker({ element: el })
      .setLngLat(userLocation)
      .addTo(map.current);
  }, [userLocation, showUserLocation]);

  // Incident markers
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers and popups
    markers.current.forEach((marker) => marker.remove());
    popups.current.forEach((popup) => popup.remove());
    markers.current = [];
    popups.current = [];

    // Create new markers for incidents
    incidents.forEach((incident) => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${encodeURIComponent(getMarkerColor(incident.status))}"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>')`;
      el.style.backgroundSize = '100%';
      el.style.cursor = 'pointer';

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([incident.lng, incident.lat])
        .addTo(map.current!);

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div class="p-3 w-48">
          <h3 class="font-bold text-sm mb-1">${incident.title}</h3>
          <p class="text-xs text-gray-600 mb-2">${incident.description.substring(0, 100)}...</p>
          <span class="text-xs font-medium px-2 py-1 rounded ${
            incident.status === 'open'
              ? 'bg-red-100 text-red-800'
              : incident.status === 'investigating'
              ? 'bg-yellow-100 text-yellow-800'
              : incident.status === 'resolved'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }">
            ${incident.status.toUpperCase()}
          </span>
        </div>`
      );

      marker.setPopup(popup);
      marker.getElement().addEventListener('click', () => {
        onMarkerClick?.(incident);
      });

      markers.current.push(marker);
      popups.current.push(popup);
    });
  }, [incidents, onMarkerClick]);

  return (
    <div className="w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
    </div>
  );
}
