/**
 * React Query hook for nearby clinics
 */
import { useQuery } from "@tanstack/react-query";
import { getNearbyClinics, type Clinic } from "@/lib/api/clinics";
import { useLocation } from "@/hooks/useLocation";

export function useNearbyClinics(radius: number = 5000) {
  const { location, loading: locationLoading, error: locationError } = useLocation();

  const query = useQuery({
    queryKey: ["nearby-clinics", location?.latitude, location?.longitude, radius],
    queryFn: () => {
      if (!location) {
        throw new Error("Location not available");
      }
      return getNearbyClinics(location.latitude, location.longitude, radius);
    },
    enabled: !!location && !locationLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Combine location error with query error
  return {
    ...query,
    error: locationError || query.error,
  };
}

