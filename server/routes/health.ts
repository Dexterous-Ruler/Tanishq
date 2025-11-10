/**
 * Health Insights Routes
 * Handles AI-powered health insights and summaries
 */

import { Router, type Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth";
import { OpenAIService } from "../services/openaiService";

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/health/insights
 * Get overall health summary based on all user documents
 */
router.get("/insights", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    console.log(`[Health Insights] Fetching health summary for user ${userId}`);

    // Get user to retrieve language preference
    const user = await storage.getUser(userId);
    const userSettings = user?.settings ? JSON.parse(user.settings) : {};
    const userLanguage = userSettings.language || 'en';
    console.log(`[Health Insights] User language preference: ${userLanguage} (settings: ${JSON.stringify(userSettings)})`);

    // Get all user documents
    const documents = await storage.getDocumentsByUserId(userId);
    
    const isHindi = userLanguage === 'hi';
    
    if (!documents || documents.length === 0) {
      return res.json({
        success: true,
        insight: {
          status: "good",
          message: isHindi
            ? "कोई दस्तावेज़ उपलब्ध नहीं है। AI स्वास्थ्य अंतर्दृष्टि शुरू करने के लिए लैब रिपोर्ट अपलोड करें।"
            : "No documents available. Upload lab reports to get started with AI health insights.",
        },
      });
    }

    // Filter documents that have extracted text
    const documentsWithText = documents
      .filter((doc: any) => doc.extractedText && doc.extractedText.trim().length > 0)
      .map((doc: any) => ({
        type: doc.type,
        extractedText: doc.extractedText || "",
        date: doc.date ? new Date(doc.date).toISOString() : undefined,
        title: doc.title,
      }));

    if (documentsWithText.length === 0) {
      return res.json({
        success: true,
        insight: {
          status: "good",
          message: isHindi
            ? "दस्तावेज़ अपलोड किए गए हैं लेकिन अभी तक कोई पाठ निकाला नहीं गया है। कृपया प्रसंस्करण पूरा होने की प्रतीक्षा करें।"
            : "Documents uploaded but no text extracted yet. Please wait for processing to complete.",
        },
      });
    }

    // Generate health summary using OpenAI with user's language preference
    const summary = await OpenAIService.generateHealthSummary(documentsWithText, userLanguage);

    res.json({
      success: true,
      insight: summary,
    });
  } catch (error: any) {
    console.error("[Health Insights] Error generating health summary:", error);
    next(error);
  }
});

export default router;

