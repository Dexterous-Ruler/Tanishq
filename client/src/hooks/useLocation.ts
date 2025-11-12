/**
 * Hook to get user's current location
 */
import { useState, useEffect } from 'react';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface UseLocationResult {
  location: Location | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => void;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by your browser';
      console.error('[useLocation]', errorMsg);
      setError(errorMsg);
      return;
    }

    console.log('[useLocation] Requesting location permission...');
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        console.log('[useLocation] Location obtained:', loc);
        setLocation(loc);
        setLoading(false);
      },
      (err) => {
        let errorMsg = 'Failed to get location';
        if (err.code === 1) {
          errorMsg = 'Location permission denied. Please enable location access in your browser settings.';
        } else if (err.code === 2) {
          errorMsg = 'Location unavailable. Please check your device location settings.';
        } else if (err.code === 3) {
          errorMsg = 'Location request timed out. Please try again.';
        } else {
          errorMsg = err.message || 'Failed to get location';
        }
        console.error('[useLocation] Location error:', err.code, errorMsg);
        setError(errorMsg);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout to 15 seconds
        maximumAge: 0,
      }
    );
  };

  // Note: Location is not automatically requested on mount
  // Call requestLocation() explicitly when needed (e.g., when chatbot opens)

  return { location, loading, error, requestLocation };
}

