/**
 * Nominees API Client
 * Functions for making nominee API calls
 */

import { apiRequest } from "../queryClient";

export type Relationship = "Parent" | "Sibling" | "Spouse" | "Friend" | "Other";
export type AccessScope = "emergency-only" | "emergency-limited";
export type ExpiryType = "24h" | "7d" | "custom" | "lifetime";
export type NomineeStatus = "active" | "expiring-soon" | "pending" | "revoked";

export interface NomineeData {
  name: string;
  relationship: Relationship;
  phoneNumber: string;
  email?: string;
  accessScope: AccessScope;
  expiryType: ExpiryType;
  customExpiryDate?: string; // ISO date string
}

export interface Nominee {
  id: string;
  name: string;
  relationship: Relationship;
  phone: string;
  email?: string | null;
  scope: AccessScope;
  expiry: string | "lifetime"; // ISO date string or "lifetime"
  status: NomineeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NomineesResponse {
  success: boolean;
  nominees: Nominee[];
}

export interface NomineeResponse {
  success: boolean;
  nominee: Nominee;
  message?: string;
}

/**
 * Get all nominees for the current user
 */
export async function getNominees(): Promise<NomineesResponse> {
  const res = await apiRequest("GET", "/api/nominees", undefined);
  return res.json();
}

/**
 * Get a specific nominee by ID
 */
export async function getNominee(id: string): Promise<NomineeResponse> {
  const res = await apiRequest("GET", `/api/nominees/${id}`, undefined);
  return res.json();
}

/**
 * Create a new nominee
 */
export async function createNominee(data: NomineeData): Promise<NomineeResponse> {
  try {
    const res = await apiRequest("POST", "/api/nominees", data);
    return res.json();
  } catch (error: any) {
    // If the response is HTML (error page), try to extract a meaningful message
    if (error.message && error.message.includes("<!DOCTYPE")) {
      throw new Error("Server error: Please check if the server is running and the route is registered");
    }
    throw error;
  }
}

/**
 * Update an existing nominee
 */
export async function updateNominee(
  id: string,
  data: Partial<NomineeData>
): Promise<NomineeResponse> {
  const res = await apiRequest("PUT", `/api/nominees/${id}`, data);
  return res.json();
}

/**
 * Delete (revoke) a nominee
 */
export async function deleteNominee(id: string): Promise<{ success: boolean; message: string }> {
  const res = await apiRequest("DELETE", `/api/nominees/${id}`, undefined);
  return res.json();
}

