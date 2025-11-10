/**
 * Nearby Clinics API Client
 */
import { apiRequest } from "../queryClient";

export interface Clinic {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number; // in kilometers
  phone?: string;
  rating?: number;
  types?: string[]; // e.g., ['hospital', 'clinic', 'pharmacy']
}

export interface NearbyClinicsResponse {
  success: boolean;
  clinics: Clinic[];
  message?: string;
}

/**
 * Get nearby clinics based on user location
 */
export async function getNearbyClinics(
  latitude: number,
  longitude: number,
  radius: number = 5000 // 5km default
): Promise<NearbyClinicsResponse> {
  const params = new URLSearchParams({
    lat: latitude.toString(),
    lng: longitude.toString(),
    radius: radius.toString(),
  });

  const res = await apiRequest("GET", `/api/clinics/nearby?${params}`, undefined);
  return res.json();
}

