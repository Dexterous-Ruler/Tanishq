/**
 * Medications Hooks
 * React Query hooks for medication management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMedications,
  getMedication,
  createMedication,
  updateMedication,
  deleteMedication,
  getMedicationReminders,
  regenerateReminders,
  importMedicationsFromFile,
  type Medication,
  type CreateMedicationData,
  type UpdateMedicationData,
} from "@/lib/api/medications";

/**
 * Hook to fetch all medications
 */
export function useMedications(status?: string) {
  return useQuery({
    queryKey: ["medications", status],
    queryFn: () => getMedications(status),
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });
}

/**
 * Hook to fetch a specific medication
 */
export function useMedication(id: string | null) {
  return useQuery({
    queryKey: ["medication", id],
    queryFn: () => getMedication(id!),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });
}

/**
 * Hook to create a medication
 */
export function useCreateMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMedicationData) => createMedication(data),
    onSuccess: () => {
      // Invalidate medications list to refetch
      queryClient.invalidateQueries({ queryKey: ["medications"] });
    },
  });
}

/**
 * Hook to update a medication
 */
export function useUpdateMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMedicationData }) =>
      updateMedication(id, data),
    onSuccess: (_, variables) => {
      // Invalidate medications list and specific medication
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      queryClient.invalidateQueries({ queryKey: ["medication", variables.id] });
    },
  });
}

/**
 * Hook to delete a medication
 */
export function useDeleteMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMedication(id),
    onSuccess: () => {
      // Invalidate medications list to refetch
      queryClient.invalidateQueries({ queryKey: ["medications"] });
    },
  });
}

/**
 * Hook to fetch reminders for a medication
 */
export function useMedicationReminders(medicationId: string | null) {
  return useQuery({
    queryKey: ["medication-reminders", medicationId],
    queryFn: () => getMedicationReminders(medicationId!),
    enabled: !!medicationId,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });
}

/**
 * Hook to regenerate reminders for a medication
 */
export function useRegenerateReminders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (medicationId: string) => regenerateReminders(medicationId),
    onSuccess: (_, medicationId) => {
      // Invalidate reminders for this medication
      queryClient.invalidateQueries({ queryKey: ["medication-reminders", medicationId] });
    },
  });
}

/**
 * Hook to import medications from a file
 */
export function useImportMedications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => importMedicationsFromFile(file),
    onSuccess: () => {
      // Invalidate medications list to refetch
      queryClient.invalidateQueries({ queryKey: ["medications"] });
    },
  });
}

