/**
 * Chatbot Hooks
 * React Query hooks for chatbot operations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  updateConversationTitle,
  deleteConversation,
  type ChatConversation,
  type ChatMessage,
} from "@/lib/api/chatbot";

/**
 * Hook to fetch all conversations
 * @param enabled - Whether the query should run (default: true)
 */
export function useConversations(enabled: boolean = true) {
  return useQuery({
    queryKey: ["chatbot-conversations"],
    queryFn: getConversations,
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch messages for a conversation
 */
export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["chatbot-messages", conversationId],
    queryFn: () => getMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: 10 * 1000, // 10 seconds
    retry: 1,
  });
}

/**
 * Hook to create a new conversation
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title?: string) => createConversation(title),
    onSuccess: () => {
      // Invalidate conversations list to refetch
      queryClient.invalidateQueries({ queryKey: ["chatbot-conversations"] });
    },
    onError: (error) => {
      console.error("[useCreateConversation] Error creating conversation:", error);
    },
  });
}

/**
 * Hook to send a message and get AI response
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      conversationId, 
      message, 
      location 
    }: { 
      conversationId: string; 
      message: string;
      location?: { latitude: number; longitude: number };
    }) =>
      sendMessage(conversationId, message, location),
    onSuccess: (_, variables) => {
      // Invalidate messages to refetch
      queryClient.invalidateQueries({ queryKey: ["chatbot-messages", variables.conversationId] });
      // Also invalidate conversations to update updatedAt
      queryClient.invalidateQueries({ queryKey: ["chatbot-conversations"] });
    },
    onError: (error) => {
      console.error("[useSendMessage] Error sending message:", error);
    },
  });
}

/**
 * Hook to update conversation title
 */
export function useUpdateConversationTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, title }: { conversationId: string; title: string }) =>
      updateConversationTitle(conversationId, title),
    onSuccess: () => {
      // Invalidate conversations list to refetch
      queryClient.invalidateQueries({ queryKey: ["chatbot-conversations"] });
    },
  });
}

/**
 * Hook to delete a conversation
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => deleteConversation(conversationId),
    onSuccess: () => {
      // Invalidate conversations list to refetch
      queryClient.invalidateQueries({ queryKey: ["chatbot-conversations"] });
    },
  });
}

