/**
 * React Query hooks for document operations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  syncDocuments,
  type CreateDocumentData,
  type UpdateDocumentData,
} from "@/lib/api/documents";

/**
 * Hook to get all documents with real-time polling for sync status
 */
export function useDocuments(filters?: { type?: string; search?: string }) {
  return useQuery({
    queryKey: ["documents", filters],
    queryFn: () => getDocuments(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: (query) => {
      // Poll every 3 seconds if there are pending documents
      const data = query.state.data;
      if (data?.documents) {
        const hasPending = data.documents.some((doc: any) => doc.syncStatus === "pending");
        return hasPending ? 3000 : false; // Poll every 3 seconds if pending, otherwise don't poll
      }
      return false;
    },
  });
}

/**
 * Hook to get a specific document
 */
export function useDocument(id: string) {
  return useQuery({
    queryKey: ["documents", id],
    queryFn: () => getDocument(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a document
 */
export function useCreateDocument() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, file }: { data: CreateDocumentData; file?: File | null }) => 
      createDocument(data, file || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Success",
        description: "Document created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create document",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to update a document
 */
export function useUpdateDocument() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentData }) =>
      updateDocument(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["documents", variables.id] });
      toast({
        title: "Success",
        description: "Document updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update document",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to delete a document
 */
export function useDeleteDocument() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to sync pending documents
 */
export function useSyncDocuments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => syncDocuments(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Success",
        description: data.message || `Synced ${data.syncedCount} document(s)`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sync documents",
        variant: "destructive",
      });
    },
  });
}

