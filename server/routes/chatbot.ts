/**
 * Chatbot Routes
 * Handles chatbot conversation and message operations
 */

import { Router, type Request, Response, NextFunction } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { buildUserContext, formatUserContext } from "../services/chatbotContextService";
import { OpenAIService } from "../services/openaiService";

const router = Router();

// Validation schemas
const createConversationSchema = z.object({
  title: z.string().optional(),
});

const sendMessageSchema = z.object({
  message: z.string().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(), // Optional user location for hospital queries
});

const updateConversationTitleSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
});

// Get all conversations for the user
router.get("/conversations", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const conversations = await storage.getConversations(userId);

    res.json({
      success: true,
      conversations,
    });
  } catch (error: any) {
    console.error("[Chatbot] Error fetching conversations:", error);
    next(error);
  }
});

// Create a new conversation
router.post("/conversations", requireAuth, validate(createConversationSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { title } = req.body;

    const conversation = await storage.createConversation(userId, title);

    res.json({
      success: true,
      conversation,
    });
  } catch (error: any) {
    console.error("[Chatbot] Error creating conversation:", error);
    next(error);
  }
});

// Get messages for a conversation
router.get("/conversations/:id/messages", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const conversationId = req.params.id;

    // Verify conversation belongs to user
    const conversation = await storage.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (conversation.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to conversation",
      });
    }

    const messages = await storage.getMessages(conversationId);

    res.json({
      success: true,
      messages,
    });
  } catch (error: any) {
    console.error("[Chatbot] Error fetching messages:", error);
    next(error);
  }
});

// Send a message and get AI response
router.post("/conversations/:id/messages", requireAuth, validate(sendMessageSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const conversationId = req.params.id;
    const { message } = req.body;

    // Verify conversation belongs to user
    const conversation = await storage.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (conversation.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to conversation",
      });
    }

    // Get user's language preference
    const user = await storage.getUser(userId);
    const userSettings = user?.settings ? JSON.parse(user.settings) : {};
    const language = (userSettings.language === 'hi' ? 'hi' : 'en') as 'en' | 'hi';

    // Get user location from request body (optional)
    const location = req.body.location;
    console.log(`[Chatbot] Received message: "${message.substring(0, 50)}..."`);
    console.log(`[Chatbot] Location provided: ${location ? `Yes (${location.latitude}, ${location.longitude})` : 'No'}`);

    // Build user context (including nearby hospitals if location is provided)
    const userContext = await buildUserContext(userId, language, location);
    const formattedContext = formatUserContext(userContext);
    
    // Log if hospitals are in context
    console.log(`[Chatbot] Nearby hospitals in context: ${userContext.nearbyHospitals.length}`);
    if (userContext.nearbyHospitals.length > 0) {
      console.log(`[Chatbot] First hospital: ${userContext.nearbyHospitals[0].name} (${userContext.nearbyHospitals[0].distance} km away)`);
    }

    // Get conversation history (before saving new message)
    const existingMessages = await storage.getMessages(conversationId);
    const conversationHistory = existingMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Save user message
    const userMessage = await storage.createMessage(conversationId, 'user', message);

    // Generate title from first message if conversation doesn't have one
    if (!conversation.title) {
      // Use first 50 characters of first message as title
      const title = message.substring(0, 50).trim();
      if (title) {
        await storage.updateConversation(conversationId, title);
      }
    }

    // Generate AI response
    // Note: conversationHistory already contains all previous messages
    // The userMessage parameter will be added separately in generateChatbotResponse
    let assistantResponse: string;
    try {
      assistantResponse = await OpenAIService.generateChatbotResponse(
        message,
        conversationHistory,
        formattedContext,
        language
      );
    } catch (error: any) {
      console.error("[Chatbot] Error generating AI response:", error);
      assistantResponse = language === 'hi' 
        ? "क्षमा करें, मुझे आपके प्रश्न का उत्तर देने में समस्या आ रही है। कृपया बाद में पुनः प्रयास करें।"
        : "Sorry, I'm having trouble answering your question. Please try again later.";
    }

    // Save assistant response
    const assistantMessage = await storage.createMessage(conversationId, 'assistant', assistantResponse);

    res.json({
      success: true,
      userMessage,
      assistantMessage,
    });
  } catch (error: any) {
    console.error("[Chatbot] Error sending message:", error);
    next(error);
  }
});

// Update conversation title
router.put("/conversations/:id", requireAuth, validate(updateConversationTitleSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const conversationId = req.params.id;
    const { title } = req.body;

    // Verify conversation belongs to user
    const conversation = await storage.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (conversation.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to conversation",
      });
    }

    const updatedConversation = await storage.updateConversation(conversationId, title);

    res.json({
      success: true,
      conversation: updatedConversation,
    });
  } catch (error: any) {
    console.error("[Chatbot] Error updating conversation:", error);
    next(error);
  }
});

// Delete a conversation
router.delete("/conversations/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const conversationId = req.params.id;

    // Verify conversation belongs to user
    const conversation = await storage.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (conversation.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to conversation",
      });
    }

    await storage.deleteConversation(conversationId);

    res.json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error: any) {
    console.error("[Chatbot] Error deleting conversation:", error);
    next(error);
  }
});

export default router;

