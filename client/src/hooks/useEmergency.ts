/**
 * React Query hooks for emergency card operations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  getEmergencyCard,
  updateEmergencyCard,
  getEmergencyCardByToken,
  getQRCodeImage,
  type EmergencyCardData,
} from "@/lib/api/emergency";

/**
 * Hook to get current user's emergency card
 */
export function useEmergencyCard() {
  return useQuery({
    queryKey: ["emergency-card"],
    queryFn: () => getEmergencyCard(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update emergency card
 */
export function useUpdateEmergencyCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EmergencyCardData) => updateEmergencyCard(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["emergency-card"] });
      toast({
        title: "Success",
        description: data.message || "Emergency card saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save emergency card",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to get emergency card by QR token (public, no auth)
 */
export function useEmergencyCardByToken(token: string | null) {
  return useQuery({
    queryKey: ["emergency-card-token", token],
    queryFn: () => {
      if (!token) throw new Error("Token is required");
      return getEmergencyCardByToken(token);
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get QR code image by token (public, no auth)
 */
export function useQRCodeImage(token: string | null) {
  return useQuery({
    queryKey: ["qr-code-image", token],
    queryFn: () => {
      if (!token) throw new Error("Token is required");
      return getQRCodeImage(token);
    },
    enabled: !!token,
    staleTime: 10 * 60 * 1000, // 10 minutes - QR codes don't change often
  });
}

