/**
 * Medications API Client
 * Functions for fetching and managing medications
 */

import { apiRequest } from "../queryClient";

export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: string; // JSON array of times
  startDate: string;
  endDate: string | null;
  source: 'ai' | 'manual';
  sourceDocumentId: string | null;
  status: 'active' | 'stopped' | 'completed';
  instructions: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationReminder {
  id: string;
  medicationId: string;
  scheduledTime: string;
  status: 'pending' | 'sent' | 'skipped';
  sentAt: string | null;
  createdAt: string;
}

export interface CreateMedicationData {
  name: string;
  dosage: string;
  frequency: string;
  timing?: string[]; // Optional, will be generated from frequency if not provided
  startDate?: string;
  endDate?: string | null;
  instructions?: string;
}

export interface UpdateMedicationData {
  name?: string;
  dosage?: string;
  frequency?: string;
  timing?: string[];
  startDate?: string;
  endDate?: string | null;
  status?: 'active' | 'stopped' | 'completed';
  instructions?: string;
}

export interface MedicationsResponse {
  success: boolean;
  medications: Medication[];
}

export interface MedicationResponse {
  success: boolean;
  medication: Medication;
}

export interface MedicationRemindersResponse {
  success: boolean;
  reminders: MedicationReminder[];
}

/**
 * Get all medications for the current user
 */
export async function getMedications(status?: string): Promise<MedicationsResponse> {
  const url = status ? `/api/medications?status=${status}` : '/api/medications';
  const res = await apiRequest("GET", url, undefined);
  return res.json();
}

/**
 * Get a specific medication by ID
 */
export async function getMedication(id: string): Promise<MedicationResponse> {
  const res = await apiRequest("GET", `/api/medications/${id}`, undefined);
  return res.json();
}

/**
 * Create a new medication
 */
export async function createMedication(data: CreateMedicationData): Promise<MedicationResponse> {
  const res = await apiRequest("POST", "/api/medications", data);
  return res.json();
}

/**
 * Update a medication
 */
export async function updateMedication(id: string, data: UpdateMedicationData): Promise<MedicationResponse> {
  const res = await apiRequest("PUT", `/api/medications/${id}`, data);
  return res.json();
}

/**
 * Delete a medication
 */
export async function deleteMedication(id: string): Promise<{ success: boolean; message: string }> {
  const res = await apiRequest("DELETE", `/api/medications/${id}`, undefined);
  return res.json();
}

/**
 * Get reminders for a medication
 */
export async function getMedicationReminders(medicationId: string): Promise<MedicationRemindersResponse> {
  const res = await apiRequest("GET", `/api/medications/${medicationId}/reminders`, undefined);
  return res.json();
}

/**
 * Regenerate reminders for a medication
 */
export async function regenerateReminders(medicationId: string): Promise<{ success: boolean; message: string }> {
  const res = await apiRequest("POST", `/api/medications/${medicationId}/reminders/regenerate`, undefined);
  return res.json();
}

/**
 * Import medications from a file (prescription, etc.)
 */
export async function importMedicationsFromFile(file: File): Promise<{
  success: boolean;
  message: string;
  medications: Medication[];
  count: number;
}> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/medications/import", {
    method: "POST",
    headers: {
      // Don't set Content-Type, let browser set it with boundary for FormData
    },
    credentials: "include", // Use cookie-based authentication
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to import medications" }));
    throw new Error(error.message || "Failed to import medications");
  }

  return res.json();
}

