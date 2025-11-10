/**
 * Clinics Service
 * Service for fetching nearby hospitals and clinics using Google Maps API
 */

interface Hospital {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number; // in kilometers
  rating?: number;
  types: string[];
  phone?: string;
}

/**
 * Get nearby hospitals/clinics based on location
 * @param latitude - User's latitude
 * @param longitude - User's longitude
 * @param radius - Search radius in meters (default: 50000 = 50km)
 * @returns Array of nearby hospitals
 */
export async function getNearbyHospitals(
  latitude: number,
  longitude: number,
  radius: number = 50000
): Promise<Hospital[]> {
  const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!googlePlacesApiKey) {
    console.warn("[ClinicsService] Google Places API key not configured, using OpenStreetMap fallback");
    return getNearbyHospitalsFromOSM(latitude, longitude, radius);
  }

  try {
    console.log(`[ClinicsService] Searching for hospitals within ${radius}m of ${latitude},${longitude}`);
    
    // Google Places API: Max radius is 50000m (50km) per request
    const maxRadius = Math.min(radius, 50000);
    
    // Try Text Search API first (sometimes works better)
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=hospital&location=${latitude},${longitude}&radius=${maxRadius}&key=${googlePlacesApiKey}`;
    const nearbySearchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${maxRadius}&type=hospital&key=${googlePlacesApiKey}`;
    
    // Try text search first
    let response = await fetch(textSearchUrl);
    let data = await response.json();
    
    // If text search fails or returns no results, try nearby search
    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      console.log(`[ClinicsService] Text search returned ${data.status}, trying nearby search...`);
      response = await fetch(nearbySearchUrl);
      data = await response.json();
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log(`[ClinicsService] Google Places API response status: ${data.status}`);

    if (data.status === "OK" && data.results && data.results.length > 0) {
      // Filter to only hospitals and calculate distances
      const hospitals = data.results
        .filter((place: any) => {
          const types = place.types || [];
          return types.some((type: string) => 
            type === 'hospital' || 
            type === 'health' ||
            type.includes('hospital')
          );
        })
        .map((place: any) => {
          const placeLat = place.geometry?.location?.lat;
          const placeLng = place.geometry?.location?.lng;
          
          if (!placeLat || !placeLng) {
            return null;
          }
          
          const distance = calculateDistance(latitude, longitude, placeLat, placeLng);
          
          return {
            id: place.place_id,
            name: place.name,
            address: place.vicinity || place.formatted_address || "Address not available",
            latitude: placeLat,
            longitude: placeLng,
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
            rating: place.rating,
            types: place.types || [],
            phone: place.formatted_phone_number,
          };
        })
        .filter((hospital: any) => hospital !== null && hospital.distance <= radius / 1000)
        .sort((a: any, b: any) => a.distance - b.distance)
        .slice(0, 10); // Limit to 10 results

      if (hospitals.length > 0) {
        console.log(`[ClinicsService] Found ${hospitals.length} hospitals using Google Places API`);
        return hospitals;
      }
    } else if (data.status === "REQUEST_DENIED") {
      console.warn("[ClinicsService] Google Places API request denied (billing required). Using OpenStreetMap fallback...");
      return getNearbyHospitalsFromOSM(latitude, longitude, radius);
    } else {
      console.warn("[ClinicsService] Google Places API error:", data.status, data.error_message || "Unknown error");
      return getNearbyHospitalsFromOSM(latitude, longitude, radius);
    }
  } catch (error: any) {
    console.error("[ClinicsService] Google Places API error:", error.message || error);
    return getNearbyHospitalsFromOSM(latitude, longitude, radius);
  }

  return [];
}

/**
 * Get nearby hospitals using OpenStreetMap (fallback)
 */
async function getNearbyHospitalsFromOSM(
  latitude: number,
  longitude: number,
  radius: number
): Promise<Hospital[]> {
  try {
    console.log(`[ClinicsService] Using OpenStreetMap to find hospitals near ${latitude},${longitude}`);
    
    const searchRadiusKm = Math.min(radius / 1000, 50); // Max 50km for OSM
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=hospital+near+${latitude},${longitude}&format=json&limit=30&addressdetails=1&extratags=1`;
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'ArogyaVault/1.0',
        'Accept-Language': 'en',
      },
    });
    
    if (!response.ok) {
      throw new Error(`OpenStreetMap API error: ${response.status}`);
    }
    
    const places = await response.json();
    
    if (Array.isArray(places) && places.length > 0) {
      const hospitals = places
        .filter((place: any) => {
          const type = (place.type || '').toLowerCase();
          const classType = (place.class || '').toLowerCase();
          const displayName = (place.display_name || '').toLowerCase();
          const name = (place.name || '').toLowerCase();
          
          // Only accept hospitals
          const isHospital = (classType === 'amenity' && type === 'hospital') ||
                            place.extratags?.amenity === 'hospital';
          
          const hasHospitalKeyword = displayName.includes('hospital') || 
                                    displayName.includes('medical') ||
                                    name.includes('hospital') ||
                                    name.includes('medical');
          
          const normalizedName = (name || displayName.split(',')[0] || '').trim().toLowerCase();
          if (normalizedName === 'hospital') {
            return false;
          }
          
          return isHospital && hasHospitalKeyword;
        })
        .map((place: any) => {
          const placeLat = parseFloat(place.lat);
          const placeLng = parseFloat(place.lon);
          
          if (isNaN(placeLat) || isNaN(placeLng)) {
            return null;
          }
          
          const distance = calculateDistance(latitude, longitude, placeLat, placeLng);
          
          let address = place.display_name || '';
          if (place.address) {
            const addrParts = [];
            if (place.address.road) addrParts.push(place.address.road);
            if (place.address.city || place.address.town || place.address.village) {
              addrParts.push(place.address.city || place.address.town || place.address.village);
            }
            if (addrParts.length > 0) {
              address = addrParts.join(', ');
            }
          }
          
          let hospitalName = place.name || '';
          if (!hospitalName && place.display_name) {
            hospitalName = place.display_name.split(',')[0].trim();
          }
          if (!hospitalName) {
            hospitalName = 'Hospital';
          }
          
          return {
            id: place.place_id?.toString() || `osm-${place.osm_id}`,
            name: hospitalName,
            address: address || 'Address not available',
            latitude: placeLat,
            longitude: placeLng,
            distance: Math.round(distance * 10) / 10,
            rating: undefined,
            types: [place.type || 'hospital'],
            phone: place.address?.phone || place.extratags?.phone,
          };
        })
        .filter((hospital: any) => hospital !== null && hospital.distance <= searchRadiusKm)
        .sort((a: any, b: any) => a.distance - b.distance)
        .slice(0, 10);

      if (hospitals.length > 0) {
        console.log(`[ClinicsService] Found ${hospitals.length} hospitals using OpenStreetMap`);
        return hospitals;
      }
    }
  } catch (error: any) {
    console.error("[ClinicsService] OpenStreetMap API error:", error.message || error);
  }

  return [];
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

