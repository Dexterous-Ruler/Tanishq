/**
 * React Query hooks for nominee operations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  getNominees,
  getNominee,
  createNominee,
  updateNominee,
  deleteNominee,
  type NomineeData,
} from "@/lib/api/nominees";

/**
 * Hook to get all nominees for the current user
 */
export function useNominees() {
  return useQuery({
    queryKey: ["nominees"],
    queryFn: () => getNominees(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to get a specific nominee by ID
 */
export function useNominee(id: string | null) {
  return useQuery({
    queryKey: ["nominee", id],
    queryFn: () => {
      if (!id) throw new Error("Nominee ID is required");
      return getNominee(id);
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to create a new nominee
 */
export function useCreateNominee() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NomineeData) => createNominee(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["nominees"] });
      toast({
        title: "Success",
        description: data.message || "Nominee added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add nominee",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to update an existing nominee
 */
export function useUpdateNominee() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NomineeData> }) =>
      updateNominee(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["nominees"] });
      queryClient.invalidateQueries({ queryKey: ["nominee"] });
      toast({
        title: "Success",
        description: data.message || "Nominee updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update nominee",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to delete (revoke) a nominee
 */
export function useDeleteNominee() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNominee(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["nominees"] });
      queryClient.invalidateQueries({ queryKey: ["nominee"] });
      toast({
        title: "Success",
        description: data.message || "Nominee revoked successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke nominee",
        variant: "destructive",
      });
    },
  });
}

