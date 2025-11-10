/**
 * Emergency API Client
 * Functions for making emergency card API calls
 */

import { apiRequest } from "../queryClient";

export interface EmergencyCardData {
  patientName: string;
  bloodGroup?: string;
  allergies?: string;
  chronicConditions?: string;
  currentMedications?: string;
  age?: number;
  address?: string;
}

export interface EmergencyCard extends EmergencyCardData {
  id: string;
  qrCodeToken: string;
  qrCodeDataURL?: string;
  qrUrl?: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface EmergencyCardResponse {
  success: boolean;
  card: EmergencyCard | null;
  message?: string;
}

export interface PublicEmergencyCardResponse {
  success: boolean;
  card: {
    patientName: string;
    bloodGroup?: string | null;
    allergies?: string | null;
    chronicConditions?: string | null;
    currentMedications?: string | null;
    age?: number | null;
    address?: string | null;
  };
}

/**
 * Get current user's emergency card
 */
export async function getEmergencyCard(): Promise<EmergencyCardResponse> {
  const res = await apiRequest("GET", "/api/emergency/card", undefined);
  return res.json();
}

/**
 * Create or update emergency card
 */
export async function updateEmergencyCard(
  data: EmergencyCardData
): Promise<EmergencyCardResponse> {
  const res = await apiRequest("PUT", "/api/emergency/card", data);
  return res.json();
}

/**
 * Get emergency card by QR token (public, no auth required)
 */
export async function getEmergencyCardByToken(
  token: string
): Promise<PublicEmergencyCardResponse> {
  const res = await fetch(`/api/emergency/qr/${token}`, {
    method: "GET",
    credentials: "include",
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch emergency card");
  }
  
  return res.json();
}

/**
 * Get QR code image for a token (public, no auth required)
 */
export async function getQRCodeImage(
  token: string
): Promise<{ success: boolean; qrCodeDataURL: string; qrUrl: string }> {
  const res = await fetch(`/api/emergency/qr-image/${token}`, {
    method: "GET",
    credentials: "include",
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch QR code");
  }
  
  return res.json();
}

