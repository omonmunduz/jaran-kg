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

const getCategoryEmoji = (icon: string): string => {
  const emojiMap: Record<string, string> = {
    health:        '🏥',
    road:          '🛣️',
    security:       '🚨',
    lighting:      '💡',
    garbage:       '🗑️',
    utilities:         '💧',
    education:   '💡',
    safety:        '🚨',
    vandalism:     '🏚️',
    noise:         '📢',
    environment:   '🌳',
    traffic:     '🚗',
    construction:  '🚧',
    animal:        '🐾',
    fire:          '🔥',
    flood:         '🌊',
    other:         '📍',
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
  const markers = useRef<mapboxgl.Marker[]>([]);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [center[0], center[1]],
      zoom: zoom,
    });

    if (showUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([longitude, latitude]);

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

    const el = document.createElement('div');
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#3b82f6';
    el.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.4)';
    el.style.animation = 'pulse 2s infinite';
    el.style.cursor = 'pointer';
    el.className = 'user-location-marker';

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

    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    incidents.forEach((incident) => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.fontSize = '28px';
      el.style.lineHeight = '1';
      el.style.cursor = 'pointer';
      el.style.userSelect = 'none';
      el.style.filter =
        incident.status === 'resolved' || incident.status === 'closed'
          ? 'grayscale(1) opacity(0.5)'
          : 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))';
      el.textContent = getCategoryEmoji(incident.category.icon);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([incident.lng, incident.lat])
        .addTo(map.current!);

      marker.getElement().addEventListener('click', () => {
        onMarkerClick?.(incident);
      });

      markers.current.push(marker);
    });
  }, [incidents, onMarkerClick]);

  return (
    <div className="w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
    </div>
  );
}