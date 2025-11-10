/**
 * Chatbot Context Service
 * Builds user context from database for chatbot responses
 */

import { storage } from "../storage";
import type { User, Medication, Document, EmergencyCard } from "@shared/schema";
import { getNearbyHospitals } from "./clinicsService";

export interface UserContext {
  profile: {
    name: string | null;
    bloodGroup: string | null;
    dateOfBirth: Date | null;
    gender: string | null;
    address: string | null;
  };
  medications: Medication[];
  recentDocuments: Document[];
  emergencyCard: EmergencyCard | null;
  healthSummary: string | null;
  nearbyHospitals: Array<{
    id: string;
    name: string;
    address: string;
    distance: number;
    rating?: number;
    phone?: string;
  }>;
  userLocation: {
    latitude: number | null;
    longitude: number | null;
  } | null;
}

/**
 * Build user context from database
 * Fetches user profile, medications, documents, emergency card, health insights, and nearby hospitals
 * @param userId - User ID
 * @param language - User's language preference
 * @param location - Optional user location (latitude, longitude). If not provided, will try to get from user profile
 */
export async function buildUserContext(
  userId: string, 
  language: 'en' | 'hi' = 'en',
  location?: { latitude: number; longitude: number }
): Promise<UserContext> {
  console.log(`[ChatbotContext] Building context for user ${userId} (language: ${language})`);
  
  // Fetch user profile
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }
  console.log(`[ChatbotContext] User profile: ${user.name || 'No name'}, ${user.bloodGroup || 'No blood group'}`);

  // Fetch active medications
  const medications = await storage.getMedications(userId, { status: 'active' });
  console.log(`[ChatbotContext] Found ${medications.length} active medications`);

  // Fetch recent documents (last 10, ordered by date DESC)
  const documents = await storage.getDocumentsByUserId(userId);
  const recentDocuments = documents
    .sort((a, b) => {
      const dateA = a.date || a.createdAt;
      const dateB = b.date || b.createdAt;
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 10);
  console.log(`[ChatbotContext] Found ${recentDocuments.length} recent documents`);

  // Log document details for debugging
  recentDocuments.forEach((doc, index) => {
    console.log(`[ChatbotContext] Document ${index + 1}: ${doc.type} - ${doc.title}`);
    console.log(`[ChatbotContext]   - Has extracted text: ${doc.extractedText ? 'Yes (' + doc.extractedText.length + ' chars)' : 'No'}`);
    console.log(`[ChatbotContext]   - Has AI insight: ${doc.aiInsight ? 'Yes' : 'No'}`);
  });

  // Fetch emergency card
  const emergencyCard = await storage.getEmergencyCard(userId) || null;
  if (emergencyCard) {
    console.log(`[ChatbotContext] Emergency card: Found`);
    console.log(`[ChatbotContext]   - Patient Name: ${emergencyCard.patientName || 'Not set'}`);
    console.log(`[ChatbotContext]   - Blood Group: ${emergencyCard.bloodGroup || 'Not set'}`);
    console.log(`[ChatbotContext]   - Age: ${emergencyCard.age || 'Not set'}`);
    console.log(`[ChatbotContext]   - Allergies: ${emergencyCard.allergies || 'Not set'}`);
  } else {
    console.log(`[ChatbotContext] Emergency card: Not found`);
  }

  // Fetch health insights summary (if available)
  // Note: Skipping health summary generation for chatbot context to avoid delays
  // The chatbot can answer questions based on individual documents and medications
  let healthSummary: string | null = null;

  // Get user location (from parameter or try to get from profile/emergency card address)
  let userLocation: { latitude: number; longitude: number } | null = location || null;
  let nearbyHospitals: Array<{
    id: string;
    name: string;
    address: string;
    distance: number;
    rating?: number;
    phone?: string;
  }> = [];

  // If location is provided, fetch nearby hospitals
  if (userLocation && userLocation.latitude && userLocation.longitude) {
    try {
      console.log(`[ChatbotContext] Fetching nearby hospitals for location: ${userLocation.latitude}, ${userLocation.longitude}`);
      const hospitals = await getNearbyHospitals(userLocation.latitude, userLocation.longitude, 50000); // 50km radius
      nearbyHospitals = hospitals.map(h => ({
        id: h.id,
        name: h.name,
        address: h.address,
        distance: h.distance,
        rating: h.rating,
        phone: h.phone,
      }));
      console.log(`[ChatbotContext] Found ${nearbyHospitals.length} nearby hospitals`);
    } catch (error: any) {
      console.error(`[ChatbotContext] Error fetching nearby hospitals:`, error.message || error);
      // Continue without hospitals if there's an error
    }
  } else {
    console.log(`[ChatbotContext] No location provided, skipping nearby hospitals`);
  }

  return {
    profile: {
      name: user.name,
      bloodGroup: user.bloodGroup,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      address: user.address || emergencyCard?.address || null,
    },
    medications,
    recentDocuments,
    emergencyCard,
    healthSummary,
    nearbyHospitals,
    userLocation,
  };
}

/**
 * Format user context into a string for OpenAI prompt
 */
export function formatUserContext(context: UserContext): string {
  console.log(`[ChatbotContext] Formatting context: ${context.profile.name || 'No name'}, ${context.medications.length} medications, ${context.recentDocuments.length} documents`);
  
  const parts: string[] = [];

  // Profile information (ALWAYS include if available)
  // Priority: Emergency card > User profile
  parts.push("=== PATIENT INFORMATION ===");
  
  // Name: Check emergency card first, then profile
  const patientName = context.emergencyCard?.patientName || context.profile.name;
  if (patientName) {
    parts.push(`Name: ${patientName}`);
  } else {
    parts.push("Name: Not provided");
  }
  
  // Blood Group: Check emergency card first, then profile
  const bloodGroup = context.emergencyCard?.bloodGroup || context.profile.bloodGroup;
  if (bloodGroup) {
    parts.push(`Blood Group: ${bloodGroup}`);
  }
  
  // Age: From emergency card or calculated from DOB
  if (context.emergencyCard?.age) {
    parts.push(`Age: ${context.emergencyCard.age} years`);
  } else if (context.profile.dateOfBirth) {
    const age = Math.floor((Date.now() - context.profile.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 365));
    parts.push(`Age: ${age} years (DOB: ${context.profile.dateOfBirth.toISOString().split('T')[0]})`);
  }
  
  if (context.profile.gender) {
    parts.push(`Gender: ${context.profile.gender}`);
  }
  
  // Address from emergency card or profile
  const userAddress = context.emergencyCard?.address || context.profile.address;
  if (userAddress) {
    parts.push(`Address: ${userAddress}`);
  }
  
  // User location (if available)
  if (context.userLocation && context.userLocation.latitude && context.userLocation.longitude) {
    parts.push(`Location: ${context.userLocation.latitude.toFixed(6)}, ${context.userLocation.longitude.toFixed(6)}`);
  }

  // Medications
  if (context.medications.length > 0) {
    parts.push("\n=== CURRENT MEDICATIONS ===");
    context.medications.forEach((med) => {
      let medInfo = `- ${med.name} (${med.dosage})`;
      if (med.frequency) {
        medInfo += `, Frequency: ${med.frequency}`;
      }
      if (med.timing) {
        try {
          const timingArray = JSON.parse(med.timing);
          if (Array.isArray(timingArray) && timingArray.length > 0) {
            medInfo += `, Times: ${timingArray.join(', ')}`;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      if (med.instructions) {
        medInfo += `, Instructions: ${med.instructions}`;
      }
      if (med.startDate) {
        medInfo += `, Started: ${med.startDate.toISOString().split('T')[0]}`;
      }
      if (med.endDate) {
        medInfo += `, End Date: ${med.endDate.toISOString().split('T')[0]}`;
      }
      parts.push(medInfo);
    });
  } else {
    parts.push("\n=== CURRENT MEDICATIONS ===");
    parts.push("No active medications recorded.");
  }

  // Emergency card information (additional details not in profile)
  if (context.emergencyCard) {
    parts.push("\n=== EMERGENCY INFORMATION ===");
    // Note: Name, blood group, and age are already included in PATIENT INFORMATION section above
    if (context.emergencyCard.allergies) {
      parts.push(`Allergies: ${context.emergencyCard.allergies}`);
    }
    if (context.emergencyCard.chronicConditions) {
      parts.push(`Chronic Conditions: ${context.emergencyCard.chronicConditions}`);
    }
    if (context.emergencyCard.currentMedications) {
      parts.push(`Emergency Medications: ${context.emergencyCard.currentMedications}`);
    }
  }

  // Recent documents with content and insights
  if (context.recentDocuments.length > 0) {
    parts.push("\n=== RECENT MEDICAL DOCUMENTS ===");
    context.recentDocuments.forEach((doc, index) => {
      const docDate = doc.date ? doc.date.toISOString().split('T')[0] : doc.createdAt.toISOString().split('T')[0];
      parts.push(`\n${index + 1}. ${doc.type.toUpperCase()}: ${doc.title} (Date: ${docDate})`);
      if (doc.provider) {
        parts.push(`   Provider: ${doc.provider}`);
      }
      
      // Include AI insight if available (prioritize this as it's more useful)
      if (doc.aiInsight) {
        try {
          const insight = JSON.parse(doc.aiInsight);
          if (insight.summary) {
            parts.push(`   AI Analysis Summary: ${insight.summary}`);
          }
          if (insight.status) {
            parts.push(`   Health Status: ${insight.status}`);
          }
          if (insight.message) {
            parts.push(`   Details: ${insight.message}`);
          }
        } catch (e) {
          console.warn(`[ChatbotContext] Failed to parse AI insight for document ${doc.id}:`, e);
        }
      }
      
      // Include extracted text (first 300 characters to avoid token limits, only if no AI insight or as supplement)
      if (doc.extractedText && doc.extractedText.trim().length > 0) {
        // Include shorter text if we have AI insight, longer if we don't
        const maxLength = doc.aiInsight ? 200 : 500;
        const textPreview = doc.extractedText.substring(0, maxLength);
        parts.push(`   Document Content: ${textPreview}${doc.extractedText.length > maxLength ? '...' : ''}`);
      }
    });
  } else {
    parts.push("\n=== RECENT MEDICAL DOCUMENTS ===");
    parts.push("No recent documents found.");
  }

  // Nearby hospitals - ALWAYS include this section if location is available
  if (context.userLocation && context.userLocation.latitude && context.userLocation.longitude) {
    parts.push("\n=== NEARBY HOSPITALS ===");
    if (context.nearbyHospitals && context.nearbyHospitals.length > 0) {
      parts.push(`Found ${context.nearbyHospitals.length} nearby hospitals:`);
      context.nearbyHospitals.forEach((hospital, index) => {
        parts.push(`\n${index + 1}. ${hospital.name}`);
        parts.push(`   Distance: ${hospital.distance} km away`);
        parts.push(`   Address: ${hospital.address}`);
        if (hospital.rating) {
          parts.push(`   Rating: ${hospital.rating}/5.0`);
        }
        if (hospital.phone) {
          parts.push(`   Phone: ${hospital.phone}`);
        }
      });
    } else {
      parts.push("No hospitals found nearby within the search radius.");
    }
  }

  // Health summary
  if (context.healthSummary) {
    parts.push(`\n=== HEALTH SUMMARY ===\n${context.healthSummary}`);
  }

  const formattedContext = parts.join("\n");
  console.log(`[ChatbotContext] Formatted context length: ${formattedContext.length} characters`);
  
  // Log key information for debugging
  console.log(`[ChatbotContext] Key info check:`);
  console.log(`  - Name: ${context.emergencyCard?.patientName || context.profile.name || 'NOT FOUND'}`);
  console.log(`  - Blood Group: ${context.emergencyCard?.bloodGroup || context.profile.bloodGroup || 'NOT FOUND'}`);
  console.log(`  - Medications: ${context.medications.length}`);
  console.log(`  - Documents with AI insights: ${context.recentDocuments.filter(d => d.aiInsight).length}`);
  console.log(`  - Emergency card: ${context.emergencyCard ? 'YES' : 'NO'}`);
  console.log(`  - Nearby hospitals: ${context.nearbyHospitals.length}`);
  console.log(`  - User location: ${context.userLocation ? `${context.userLocation.latitude}, ${context.userLocation.longitude}` : 'NOT PROVIDED'}`);
  
  // Log if NEARBY HOSPITALS section is in the formatted context
  if (formattedContext.includes("=== NEARBY HOSPITALS ===")) {
    const hospitalsSection = formattedContext.split("=== NEARBY HOSPITALS ===")[1]?.split("\n===")[0] || "";
    console.log(`[ChatbotContext] NEARBY HOSPITALS section found in context (${hospitalsSection.length} chars)`);
    console.log(`[ChatbotContext] Hospitals section preview: ${hospitalsSection.substring(0, 500)}...`);
  } else {
    console.log(`[ChatbotContext] WARNING: NEARBY HOSPITALS section NOT found in formatted context!`);
  }
  
  console.log(`[ChatbotContext] Context preview (first 1500 chars):\n${formattedContext.substring(0, 1500)}...`);
  
  return formattedContext;
}

