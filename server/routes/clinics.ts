/**
 * Clinics Routes
 * Handles nearby clinics search using location data
 */

import { Router, type Request, Response, NextFunction } from "express";
import { z } from "zod";

const router = Router();

// Validation schema for nearby clinics request
const nearbyClinicsSchema = z.object({
  lat: z.string().transform(Number),
  lng: z.string().transform(Number),
  radius: z.string().transform(Number).optional().default(100000), // 100km default
});

/**
 * GET /api/clinics/nearby
 * Get nearby clinics, hospitals, and labs based on user location
 * Uses Google Places API or fallback to mock data
 */
router.get("/nearby", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate query parameters
    const validationResult = nearbyClinicsSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid location parameters",
        errors: validationResult.error.errors,
      });
    }

    const { lat, lng, radius } = validationResult.data;

    // Check if Google Places API key is configured
    const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (googlePlacesApiKey) {
      // Use Google Places API - search only for hospitals
      try {
        // Google Places API: type=hospital searches for hospitals only
        // Max radius is 50000m (50km) per request
        // For 100km, we'll make requests at different center points or use pagination
        const maxRadius = Math.min(radius, 50000); // Google Places max is 50km per request
        
        // Try Text Search API as it might work better for hospital searches
        // Format: search for "hospital" near the location
        const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=hospital&location=${lat},${lng}&radius=${maxRadius}&key=${googlePlacesApiKey}`;
        const nearbySearchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${maxRadius}&type=hospital&key=${googlePlacesApiKey}`;
        
        console.log(`[Clinics] Searching for hospitals within ${maxRadius}m of ${lat},${lng}`);
        
        // Try text search first (sometimes works better)
        let response = await fetch(textSearchUrl);
        let data = await response.json();
        
        // If text search fails or returns no results, try nearby search
        if (data.status !== "OK" || !data.results || data.results.length === 0) {
          console.log(`[Clinics] Text search returned ${data.status}, trying nearby search...`);
          response = await fetch(nearbySearchUrl);
          data = await response.json();
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log(`[Clinics] Google Places API response status: ${data.status}`);

        if (data.status === "OK" && data.results && data.results.length > 0) {
          // Filter to only hospitals and calculate distances
          const hospitals = data.results
            .filter((place: any) => {
              // Ensure it's actually a hospital (check types)
              const types = place.types || [];
              return types.some((type: string) => 
                type === 'hospital' || 
                type === 'health' ||
                type.includes('hospital')
              );
            })
            .map((place: any) => {
              // Calculate distance using Haversine formula
              const placeLat = place.geometry?.location?.lat;
              const placeLng = place.geometry?.location?.lng;
              
              if (!placeLat || !placeLng) {
                console.warn(`[Clinics] Place ${place.name} missing coordinates`);
                return null;
              }
              
              const distance = calculateDistance(lat, lng, placeLat, placeLng);
              
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
            .filter((hospital: any) => hospital !== null && hospital.distance <= radius / 1000) // Filter by actual distance (convert radius to km)
            .sort((a: any, b: any) => a.distance - b.distance)
            .slice(0, 10); // Limit to 10 results

          if (hospitals.length > 0) {
            console.log(`[Clinics] Found ${hospitals.length} hospitals`);
            return res.json({
              success: true,
              clinics: hospitals,
            });
          } else {
            console.warn("[Clinics] No hospitals found in results after filtering");
          }
        } else if (data.status === "ZERO_RESULTS") {
          console.log("[Clinics] No hospitals found in the area");
        } else if (data.status === "REQUEST_DENIED") {
          console.warn("[Clinics] Google Places API request denied (billing required). Using OpenStreetMap fallback...");
          // Fall through to OpenStreetMap API
        } else {
          console.warn("[Clinics] Google Places API error:", data.status, data.error_message || "Unknown error");
          // Fall through to OpenStreetMap API
        }
      } catch (error: any) {
        console.error("[Clinics] Google Places API error:", error.message || error);
        // Fall through to OpenStreetMap API
      }
    }

    // Fallback: Use OpenStreetMap Nominatim API (free, no billing required)
    try {
      console.log(`[Clinics] Using OpenStreetMap to find hospitals near ${lat},${lng}`);
      
      // OpenStreetMap Nominatim API - search for hospitals near location
      // Use a simpler search query that works better
      const searchRadiusKm = Math.min(radius / 1000, 50); // Max 50km for OSM
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=hospital+near+${lat},${lng}&format=json&limit=30&addressdetails=1&extratags=1`;
      
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'ArogyaVault/1.0', // Required by Nominatim
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
            // Filter to hospitals only - check multiple fields
            const type = (place.type || '').toLowerCase();
            const category = (place.category || '').toLowerCase();
            const classType = (place.class || '').toLowerCase();
            const displayName = (place.display_name || '').toLowerCase();
            const name = (place.name || '').toLowerCase();
            
            // Exclude non-hospital places (bus stops, highways, etc.)
            // Check class first - only 'amenity' class can be hospitals
            if (classType !== 'amenity' && classType !== '') {
              // If class is explicitly set and it's not amenity, exclude
              if (classType === 'highway' || 
                  classType === 'transport' ||
                  classType === 'public_transport' ||
                  classType === 'railway') {
                return false;
              }
            }
            
            // Exclude if type is clearly not a hospital
            if (type === 'bus_stop' || 
                type === 'bus_station' ||
                type === 'subway_station' ||
                category === 'transport' ||
                place.extratags?.amenity === 'bus_station') {
              return false;
            }
            
            // Must be a hospital - VERY strict check
            // Only accept if:
            // 1. class is 'amenity' AND type is 'hospital', OR
            // 2. extratags explicitly says amenity='hospital'
            const isHospital = (classType === 'amenity' && type === 'hospital') ||
                              place.extratags?.amenity === 'hospital';
            
            // Additional check: name or display name should contain hospital/medical keywords
            const hasHospitalKeyword = displayName.includes('hospital') || 
                                      displayName.includes('medical') ||
                                      name.includes('hospital') ||
                                      name.includes('medical');
            
            // Exclude places with generic names (likely data quality issues)
            // Real hospitals usually have more specific names
            // If name is exactly "Hospital" (case-insensitive), exclude it
            const normalizedName = (name || displayName.split(',')[0] || '').trim().toLowerCase();
            if (normalizedName === 'hospital') {
              return false;
            }
            
            // Only return true if BOTH conditions are met:
            // 1. It's confirmed as a hospital in OSM data
            // 2. It has hospital keywords in the name
            // This ensures we don't include bus stops or other places with "hospital" in the name
            return isHospital && hasHospitalKeyword;
          })
          .map((place: any) => {
            const placeLat = parseFloat(place.lat);
            const placeLng = parseFloat(place.lon);
            
            if (isNaN(placeLat) || isNaN(placeLng)) {
              return null;
            }
            
            const distance = calculateDistance(lat, lng, placeLat, placeLng);
            
            // Extract address - use display_name or construct from address parts
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
            
            // Extract hospital name
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
          console.log(`[Clinics] Found ${hospitals.length} hospitals using OpenStreetMap`);
          return res.json({
            success: true,
            clinics: hospitals,
          });
        } else {
          console.log(`[Clinics] OpenStreetMap returned ${places.length} places but none matched hospital criteria`);
        }
      } else {
        console.log(`[Clinics] OpenStreetMap returned no results`);
      }
    } catch (error: any) {
      console.error("[Clinics] OpenStreetMap API error:", error.message || error);
    }

    // Return empty array if no hospitals found
    res.json({
      success: true,
      clinics: [],
      message: "No hospitals found within the specified radius. Try a different location.",
    });
  } catch (error) {
    next(error);
  }
});

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

/**
 * Calculate bounding box for a given location and radius
 * Used for OpenStreetMap API queries
 */
function calculateBoundingBox(lat: number, lng: number, radiusMeters: number): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  const R = 6371000; // Earth radius in meters
  const latRad = toRad(lat);
  const lngRad = toRad(lng);
  
  // Calculate offsets
  const dLat = radiusMeters / R;
  const dLng = radiusMeters / (R * Math.cos(latRad));
  
  return {
    minLat: lat - (dLat * 180 / Math.PI),
    maxLat: lat + (dLat * 180 / Math.PI),
    minLng: lng - (dLng * 180 / Math.PI),
    maxLng: lng + (dLng * 180 / Math.PI),
  };
}

export default router;

