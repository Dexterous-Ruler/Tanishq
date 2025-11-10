/**
 * Chatbot API Client
 * API client functions for chatbot operations
 */

import { apiRequest } from "../queryClient";

export interface ChatConversation {
  id: string;
  userId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface ConversationsResponse {
  success: boolean;
  conversations: ChatConversation[];
}

export interface ConversationResponse {
  success: boolean;
  conversation: ChatConversation;
}

export interface MessagesResponse {
  success: boolean;
  messages: ChatMessage[];
}

export interface SendMessageResponse {
  success: boolean;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

export interface DeleteConversationResponse {
  success: boolean;
  message: string;
}

/**
 * Get all conversations for the current user
 */
export async function getConversations(): Promise<ChatConversation[]> {
  const res = await apiRequest("GET", "/api/chatbot/conversations", undefined);
  const response: ConversationsResponse = await res.json();
  return response.conversations.map((conv) => ({
    ...conv,
    createdAt: new Date(conv.createdAt),
    updatedAt: new Date(conv.updatedAt),
  }));
}

/**
 * Create a new conversation
 */
export async function createConversation(title?: string): Promise<ChatConversation> {
  const res = await apiRequest("POST", "/api/chatbot/conversations", { title });
  const response: ConversationResponse = await res.json();
  return {
    ...response.conversation,
    createdAt: new Date(response.conversation.createdAt),
    updatedAt: new Date(response.conversation.updatedAt),
  };
}

/**
 * Get messages for a conversation
 */
export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const res = await apiRequest("GET", `/api/chatbot/conversations/${conversationId}/messages`, undefined);
  const response: MessagesResponse = await res.json();
  return response.messages.map((msg) => ({
    ...msg,
    createdAt: new Date(msg.createdAt),
  }));
}

/**
 * Send a message and get AI response
 * @param conversationId - Conversation ID
 * @param message - User's message
 * @param location - Optional user location (for hospital queries)
 */
export async function sendMessage(
  conversationId: string, 
  message: string,
  location?: { latitude: number; longitude: number }
): Promise<SendMessageResponse> {
  const body: { message: string; location?: { latitude: number; longitude: number } } = { message };
  if (location) {
    body.location = location;
  }
  
  const res = await apiRequest("POST", `/api/chatbot/conversations/${conversationId}/messages`, body);
  const response: SendMessageResponse = await res.json();
  return {
    ...response,
    userMessage: {
      ...response.userMessage,
      createdAt: new Date(response.userMessage.createdAt),
    },
    assistantMessage: {
      ...response.assistantMessage,
      createdAt: new Date(response.assistantMessage.createdAt),
    },
  };
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(conversationId: string, title: string): Promise<ChatConversation> {
  const res = await apiRequest("PUT", `/api/chatbot/conversations/${conversationId}`, { title });
  const response: ConversationResponse = await res.json();
  return {
    ...response.conversation,
    createdAt: new Date(response.conversation.createdAt),
    updatedAt: new Date(response.conversation.updatedAt),
  };
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  await apiRequest("DELETE", `/api/chatbot/conversations/${conversationId}`, undefined);
}

