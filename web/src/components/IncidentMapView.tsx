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

  const getMarkerEmoji = (category: { icon: string }) => {
    const emojiMap: Record<string, string> = {
      'traffic': '🚗', // car crash / traffic issues
      'utilities': '🚰', // water / utilities
      'environment': '🌳', // environmental issues
      'security': '🚨', // security / police
      'education': '🎓', // education
      'health': '🏥', // health / medical
    };
    return emojiMap[category.icon] || '📍';
  };

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
        try {
          map.current.remove();
        } catch (e) {
          console.log('Map cleanup error:', e);
        }
        map.current = null;
      }
    };
  }, []);

  // User location marker with pulsing effect
  useEffect(() => {
    if (!map.current || !userLocation) return;

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
  }, [userLocation]);

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
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.fontSize = '24px';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.backgroundColor = getMarkerColor(incident.status);
      el.style.cursor = 'pointer';
      el.style.transition = 'transform 0.2s ease';
      el.innerHTML = getMarkerEmoji(incident.category);

      // Add hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([incident.lng, incident.lat])
        .addTo(map.current!);

      const popup = new mapboxgl.Popup({ offset: 35 }).setHTML(
        `<div class="p-3 w-48">
          <div class="flex items-center mb-1">
            <span class="text-xl mr-2">${getMarkerEmoji(incident.category)}</span>
            <span class="text-xs font-medium px-2 py-1 rounded ${
              incident.status === 'open'
                ? 'bg-red-100 text-red-800'
                : incident.status === 'investigating'
                ? 'bg-yellow-100 text-yellow-800'
                : incident.status === 'resolved'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }">
              ${incident.category.name_ru}
            </span>
          </div>
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
