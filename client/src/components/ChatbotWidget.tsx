/**
 * Chatbot Widget Component
 * Floating chatbot icon with slide-up chat interface
 */

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, Plus, Trash2, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useConversations,
  useMessages,
  useCreateConversation,
  useSendMessage,
  useDeleteConversation,
} from "@/hooks/useChatbot";
import { useAuthStatus } from "@/hooks/useAuth";
import { useLocation } from "@/hooks/useLocation";
import { cn } from "@/lib/utils";

interface ChatbotWidgetProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ChatbotWidget({ isOpen: externalIsOpen, onOpenChange: externalOnOpenChange }: ChatbotWidgetProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [locationRequested, setLocationRequested] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: authStatus } = useAuthStatus();
  const isAuthenticated = authStatus?.authenticated === true;
  
  // Get user's location for hospital queries
  const { location: userLocation, loading: locationLoading, requestLocation } = useLocation();

  // Use external control if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = (open: boolean) => {
    if (externalOnOpenChange) {
      externalOnOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };
  
  // Request location when chatbot opens (only once)
  useEffect(() => {
    if (isOpen && !locationRequested && isAuthenticated) {
      console.log("[ChatbotWidget] Requesting user location for hospital queries");
      requestLocation();
      setLocationRequested(true);
    }
  }, [isOpen, locationRequested, isAuthenticated, requestLocation]);

  // Fetch conversations (only when authenticated and chatbot is open)
  const { data: conversations = [], isLoading: conversationsLoading, error: conversationsError } = useConversations(
    isAuthenticated && isOpen
  );

  // Fetch messages for current conversation (only when authenticated, chatbot is open, and conversationId exists)
  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useMessages(
    isAuthenticated && isOpen && currentConversationId ? currentConversationId : null
  );

  // Mutations
  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage();
  const deleteConversation = useDeleteConversation();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set first conversation as current when conversations load (only when chatbot is open)
  useEffect(() => {
    if (isOpen && conversations.length > 0 && !currentConversationId) {
      setCurrentConversationId(conversations[0].id);
    }
  }, [isOpen, conversations, currentConversationId]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleNewConversation = () => {
    createConversation.mutate(undefined, {
      onSuccess: (conversation) => {
        setCurrentConversationId(conversation.id);
        setMessageInput("");
      },
    });
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const message = messageInput.trim();
    setMessageInput("");

    // Include user location if available (for hospital queries)
    const location = userLocation && !locationLoading 
      ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
      : undefined;
    
    console.log(`[ChatbotWidget] Sending message with location: ${location ? `Yes (${location.latitude}, ${location.longitude})` : 'No'}`);
    console.log(`[ChatbotWidget] User location state:`, { userLocation, locationLoading });

    // If no conversation exists, create one first
    if (!currentConversationId) {
      createConversation.mutate(undefined, {
        onSuccess: (conversation) => {
          setCurrentConversationId(conversation.id);
          // Wait a moment for the conversation to be set, then send message
          setTimeout(() => {
            sendMessage.mutate({
              conversationId: conversation.id,
              message,
              location,
            });
          }, 100);
        },
        onError: (error) => {
          console.error("[Chatbot] Error creating conversation:", error);
          // Reset message input on error
          setMessageInput(message);
        },
      });
    } else {
      sendMessage.mutate({
        conversationId: currentConversationId,
        message,
        location,
      }, {
        onError: (error) => {
          console.error("[Chatbot] Error sending message:", error);
          // Reset message input on error
          setMessageInput(message);
        },
      });
    }
  };

  const handleDeleteConversation = (conversationId: string) => {
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      deleteConversation.mutate(conversationId, {
        onSuccess: () => {
          // Switch to first remaining conversation or clear
          const remaining = conversations.filter((c) => c.id !== conversationId);
          if (remaining.length > 0) {
            setCurrentConversationId(remaining[0].id);
          } else {
            setCurrentConversationId(null);
          }
        },
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Only show chatbot for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Chat Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[85vh] md:h-[80vh] flex flex-col p-0 max-h-[85vh] md:max-h-[80vh]">
          <SheetHeader className="px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg font-semibold">Health Assistant</SheetTitle>
                <SheetDescription className="sr-only">
                  Chat with AI assistant about your health records, medications, and medical information
                </SheetDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewConversation}
                  disabled={createConversation.isPending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Chat
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Conversation Selector */}
            {conversations.length > 0 && (
              <div className="mt-2">
                <Select
                  value={currentConversationId || undefined}
                  onValueChange={setCurrentConversationId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select conversation" />
                  </SelectTrigger>
                  <SelectContent>
                    {conversations.map((conv) => (
                      <SelectItem key={conv.id} value={conv.id}>
                        <span className="truncate">
                          {conv.title || "New Conversation"}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentConversationId && conversations.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteConversation(currentConversationId)}
                    className="mt-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Conversation
                  </Button>
                )}
              </div>
            )}
          </SheetHeader>

          {/* Messages Area */}
          <ScrollArea className="flex-1 px-4 py-4">
            {conversationsError || messagesError ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-destructive px-4">
                <Bot className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Error loading conversation</p>
                <p className="text-sm mt-2 max-w-md text-muted-foreground">
                  {(conversationsError as Error)?.message || (messagesError as Error)?.message || "An error occurred. Please try again."}
                </p>
              </div>
            ) : messagesLoading && currentConversationId ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !currentConversationId && conversations.length === 0 && !createConversation.isPending ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
                <Bot className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Start a conversation</p>
                <p className="text-sm mt-2 max-w-md">
                  Ask me about your medications, health records, blood type, or any health-related questions.
                </p>
              </div>
            ) : messages.length === 0 && currentConversationId ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
                <Bot className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Start a conversation</p>
                <p className="text-sm mt-2 max-w-md">
                  Ask me about your medications, health records, blood type, or any health-related questions.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {sendMessage.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-foreground rounded-lg px-4 py-2 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t px-4 py-3">
            <div className="flex gap-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={sendMessage.isPending || createConversation.isPending}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={sendMessage.isPending || createConversation.isPending || !messageInput.trim()}
                size="default"
              >
                {sendMessage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

