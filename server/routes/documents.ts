/**
 * Document Routes
 * Handles document CRUD operations and file management
 */

import { Router, type Request, Response, NextFunction } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { randomUUID } from "crypto";
import * as fs from "fs/promises";
import * as path from "path";
import multer from "multer";
import { SupabaseStorageService } from "../services/supabaseStorage";
import { OpenAIService, type ExtractedMetadata } from "../services/openaiService";
import { generateDefaultTiming, generateReminders } from "../services/medicationService";

const router = Router();

// File upload directory (create if doesn't exist)
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "documents");

// Ensure upload directory exists
(async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create upload directory:", error);
  }
})();

// Configure multer for file uploads
const storageConfig = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      cb(null, UPLOAD_DIR);
    } catch (error) {
      cb(error as Error, UPLOAD_DIR);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${randomUUID()}`;
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storageConfig,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF, images, DOCX, and ZIP files
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/zip',
      'application/x-zip-compressed',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: PDF, JPG, PNG, DOCX, ZIP`));
    }
  },
});

// Define /analyze route BEFORE requireAuth to ensure it's matched first
// But we still need auth, so we'll add it to the route itself
router.post(
  "/analyze",
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    // Handle multer errors
    upload.single("file")(req, res, (err: any) => {
      if (err) {
        console.error("[Documents] Multer error in analyze:", err);
        return res.status(400).json({
          success: false,
          message: err.message || "File upload error",
        });
      }
      next();
    });
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("[Documents] Analyze endpoint called");
      console.log("[Documents] Request file:", req.file ? `${req.file.originalname} (${req.file.size} bytes)` : "none");
      console.log("[Documents] User ID:", req.userId);

      if (!req.file) {
        console.log("[Documents] No file provided in analyze request");
        return res.status(400).json({
          success: false,
          message: "File is required",
        });
      }

      console.log("[Documents] Reading file buffer...");
      const fileBuffer = await fs.readFile(req.file.path);
      console.log("[Documents] File buffer read, size:", fileBuffer.length);
      const fileType = req.file.mimetype.includes('pdf') ? 'PDF' :
                      req.file.mimetype.includes('image') ? 'IMAGE' :
                      req.file.mimetype.includes('word') ? 'DOCX' :
                      req.file.mimetype.includes('zip') ? 'ZIP' : 'OTHER';

      // Clean up local file
      await fs.unlink(req.file.path).catch(() => {});

      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        console.warn("[Documents] OpenAI API key not configured, skipping AI processing");
        return res.status(500).json({
          success: false,
          message: "AI processing is not configured. Please set OPENAI_API_KEY environment variable.",
          validationError: false,
        });
      }

      // Extract text from document
      console.log("[Documents] Starting OCR extraction...");
      let extractedText = "";
      try {
        const ocrResult = await OpenAIService.processDocument(
          fileBuffer,
          fileType,
          req.file.mimetype
        );
        extractedText = ocrResult.extractedText;
        console.log("[Documents] OCR completed, extracted", extractedText.length, "characters");
      } catch (ocrError: any) {
        console.error("[Documents] OCR failed during analysis:", ocrError);
        // Continue with empty text - will use image analysis
      }

      // Validate if document is medical-related
      console.log("[Documents] Starting medical validation...");
      const validation = await OpenAIService.validateMedicalDocument(
        extractedText,
        fileBuffer,
        req.file.mimetype
      );
      console.log("[Documents] Validation result:", validation.isValid ? "VALID" : "INVALID", "-", validation.reason);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: `This document does not appear to be a medical document. ${validation.reason}`,
          validationError: true,
          isValid: false,
        });
      }

      // Extract metadata from the document
      console.log("[Documents] Starting metadata extraction...");
      let metadata: ExtractedMetadata = {};
      if (extractedText && extractedText.trim().length > 0) {
        try {
          metadata = await OpenAIService.extractMetadata(extractedText);
          console.log("[Documents] Metadata extracted:", metadata);
        } catch (metadataError: any) {
          console.error("[Documents] Metadata extraction failed:", metadataError);
          // Continue with empty metadata
        }
      } else {
        console.log("[Documents] No extracted text, skipping metadata extraction");
      }

      console.log("[Documents] Sending success response with metadata");
      const responseData = {
        success: true,
        isValid: true,
        extractedText: extractedText.substring(0, 1000), // Return first 1000 chars for preview
        metadata: {
          title: metadata.title || undefined,
          provider: metadata.provider || undefined,
          date: metadata.date || undefined,
          documentType: metadata.documentType || undefined,
          tags: metadata.tags || [],
        },
      };
      console.log("[Documents] Response data:", JSON.stringify(responseData, null, 2));
      res.status(200).setHeader('Content-Type', 'application/json').json(responseData);
    } catch (error: any) {
      console.error("[Documents] Analyze error:", error);
      // Ensure we return JSON even on error
      return res.status(500).setHeader('Content-Type', 'application/json').json({
        success: false,
        message: error.message || "Failed to analyze document. Please try again.",
        validationError: false,
      });
    }
  }
);

// All other routes require authentication
router.use(requireAuth);

/**
 * GET /api/documents
 * Get all documents for the current user
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, search } = req.query;
    const filters: { type?: string; search?: string } = {};
    
    if (type && typeof type === "string") {
      filters.type = type;
    }
    if (search && typeof search === "string") {
      filters.search = search;
    }

    const documents = await storage.getDocumentsByUserId(req.userId!, filters);

    // Format response - include AI analysis fields
    const formatted = documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      type: doc.type,
      provider: doc.provider,
      date: doc.date,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      tags: doc.tags ? JSON.parse(doc.tags) : [],
      syncStatus: doc.syncStatus,
      // Include AI analysis fields
      extractedText: doc.extractedText || null,
      ocrProcessed: doc.ocrProcessed || false,
      ocrProcessedAt: doc.ocrProcessedAt || null,
      aiInsight: doc.aiInsight ? JSON.parse(doc.aiInsight) : null,
      aiInsightGeneratedAt: doc.aiInsightGeneratedAt || null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    res.json({
      success: true,
      documents: formatted,
      total: formatted.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/documents/:id
 * Get a specific document
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const document = await storage.getDocument(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check ownership
    if (document.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get versions
    const versions = await storage.getDocumentVersions(id);

    res.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        type: document.type,
        provider: document.provider,
        date: document.date,
        fileUrl: document.fileUrl,
        fileType: document.fileType,
        fileSize: document.fileSize,
        tags: document.tags ? JSON.parse(document.tags) : [],
        syncStatus: document.syncStatus,
        extractedText: document.extractedText,
        embedding: document.embedding,
        ocrProcessed: document.ocrProcessed,
        ocrProcessedAt: document.ocrProcessedAt,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        versions: versions.map((v) => ({
          id: v.id,
          version: v.version,
          note: v.note,
          createdAt: v.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/documents
 * Create a new document (with file upload)
 */
const createDocumentSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["prescription", "lab", "imaging", "billing"]),
  provider: z.string().optional(),
  date: z.string().optional(), // ISO date string
  tags: z.array(z.string()).optional(),
});

/**
 * POST /api/documents
 * Create a new document (with optional file upload)
 * Supports both JSON (with fileUrl) and multipart/form-data (with file)
 */
router.post(
  "/",
  upload.single("file"), // Handle single file upload
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get data from either JSON body or form fields
      const title = req.body.title || (req.body as any).title;
      const type = req.body.type || (req.body as any).type;
      const provider = req.body.provider || (req.body as any).provider;
      const date = req.body.date || (req.body as any).date;
      const tags = req.body.tags ? (typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags) : [];
      const fileUrl = req.body.fileUrl || (req.body as any).fileUrl;
      const fileType = req.body.fileType || (req.body as any).fileType;
      const fileSize = req.body.fileSize || (req.body as any).fileSize;

      if (!title || !type) {
        return res.status(400).json({
          success: false,
          message: "Title and type are required",
        });
      }

      // Handle file upload if present
      let finalFileUrl = fileUrl;
      let finalFileType = fileType || "PDF";
      let finalFileSize = fileSize ? parseInt(fileSize) : null;

      // Variables for OCR processing
      let extractedText = "";
      let embedding = "";
      let ocrProcessed = false;
      let ocrProcessedAt: Date | null = null;

      if (req.file) {
        try {
          // Upload file to Supabase Storage
          const fileBuffer = await fs.readFile(req.file.path);
          const uploadedUrl = await SupabaseStorageService.uploadFile(
            fileBuffer,
            req.userId!,
            req.file.originalname,
            req.file.mimetype
          );
          
          // Clean up local file after upload
          await fs.unlink(req.file.path).catch(() => {
            // Ignore errors if file doesn't exist
          });

          finalFileUrl = uploadedUrl;
          finalFileType = req.file.mimetype.includes('pdf') ? 'PDF' :
                         req.file.mimetype.includes('image') ? 'IMAGE' :
                         req.file.mimetype.includes('word') ? 'DOCX' :
                         req.file.mimetype.includes('zip') ? 'ZIP' : 'OTHER';
          finalFileSize = req.file.size;
          console.log(`[Documents] File uploaded to Supabase Storage: ${req.file.originalname} (${req.file.size} bytes) -> ${uploadedUrl}`);

          // FIRST: Validate if document is medical-related (before processing)
          // This is critical - we need to validate even if OCR fails
          console.log(`[Documents] Validating if document is medical-related (before OCR)`);
          let validation: { isValid: boolean; reason: string };
          
          try {
            // Try to extract text first for better validation
            let tempExtractedText = "";
            try {
              const tempOcrResult = await OpenAIService.processDocument(
                fileBuffer,
                finalFileType,
                req.file.mimetype
              );
              tempExtractedText = tempOcrResult.extractedText;
            } catch (tempOcrError) {
              console.log("[Documents] OCR failed during validation, will use image analysis");
            }

            // Validate using extracted text or image analysis
            validation = await OpenAIService.validateMedicalDocument(
              tempExtractedText,
              fileBuffer,
              req.file.mimetype
            );

            if (!validation.isValid) {
              // Document is not medical - delete uploaded file and return error
              console.log(`[Documents] Document validation FAILED: ${validation.reason}`);
              
              // Delete uploaded file from Supabase Storage
              try {
                await SupabaseStorageService.deleteFile(uploadedUrl);
                console.log(`[Documents] Deleted non-medical file from Supabase: ${uploadedUrl}`);
              } catch (deleteError) {
                console.error("[Documents] Failed to delete non-medical file:", deleteError);
              }

              return res.status(400).json({
                success: false,
                message: `This document does not appear to be a medical document. ${validation.reason}. Please upload only medical documents such as lab reports, prescriptions, medical imaging reports, or doctor's notes.`,
                validationError: true,
              });
            }

            console.log(`[Documents] Document validation PASSED: ${validation.reason}`);
          } catch (validationError: any) {
            // If validation itself fails, we should block the upload to be safe
            console.error("[Documents] Medical validation error:", validationError);
            
            // Delete uploaded file as a safety measure
            try {
              await SupabaseStorageService.deleteFile(uploadedUrl);
              console.log(`[Documents] Deleted file due to validation error: ${uploadedUrl}`);
            } catch (deleteError) {
              console.error("[Documents] Failed to delete file:", deleteError);
            }

            return res.status(500).json({
              success: false,
              message: `Failed to validate document. Please ensure the file is a medical document and try again.`,
              validationError: true,
            });
          }

          // SECOND: Process document with OpenAI (OCR + embedding) if validation passed
          try {
            console.log(`[Documents] Starting OCR processing for ${req.file.originalname}`);
            const ocrResult = await OpenAIService.processDocument(
              fileBuffer,
              finalFileType,
              req.file.mimetype
            );
            extractedText = ocrResult.extractedText;
            embedding = ocrResult.embedding;
            ocrProcessed = true;
            ocrProcessedAt = new Date();
            console.log(`[Documents] OCR processing completed. Extracted ${extractedText.length} characters.`);
          } catch (ocrError: any) {
            // Don't block document creation if OCR fails (validation already passed)
            console.error("[Documents] OCR processing failed:", ocrError);
            console.log("[Documents] Continuing with document creation without OCR data");
            ocrProcessed = false;
          }
        } catch (uploadError: any) {
          // Clean up local file on error
          await fs.unlink(req.file.path).catch(() => {});
          console.error("[Documents] Supabase Storage upload error:", uploadError);
          return res.status(500).json({
            success: false,
            message: `Failed to upload file: ${uploadError.message}`,
          });
        }
      } else if (!fileUrl) {
        // No file provided, create placeholder
        finalFileUrl = `/uploads/documents/${randomUUID()}.pdf`;
      }

      const document = await storage.createDocument({
        userId: req.userId!,
        title,
        type,
        provider: provider || null,
        date: date ? new Date(date) : null,
        fileUrl: finalFileUrl,
        fileType: finalFileType,
        fileSize: finalFileSize,
        tags: tags ? JSON.stringify(tags) : null,
        syncStatus: "synced",
        extractedText: extractedText || null,
        embedding: embedding || null,
        ocrProcessed,
        ocrProcessedAt: ocrProcessedAt || null,
      });

      // Extract medications from document if text is available
      // Run medication extraction for all document types, but prioritize prescriptions
      if (extractedText && extractedText.trim().length > 0) {
        try {
          // Always attempt medication extraction, but use appropriate document type
          const documentTypeForExtraction = type === 'prescription' ? 'prescription' : type;
          
          console.log(`[Documents] Attempting medication extraction from ${documentTypeForExtraction} document`);
          const extractedMedications = await OpenAIService.extractMedications(extractedText, documentTypeForExtraction);
          
          if (extractedMedications && extractedMedications.length > 0) {
            console.log(`[Documents] Extracted ${extractedMedications.length} medication(s) from ${documentTypeForExtraction} document`);
            
            for (const med of extractedMedications) {
              try {
                // Generate timing if not provided
                let timingArray = med.timing && Array.isArray(med.timing) && med.timing.length > 0
                  ? med.timing.filter((t: any) => t && typeof t === 'string' && t.includes(':'))
                  : generateDefaultTiming(med.frequency);
                
                // Ensure timingArray is valid and filter out any invalid times
                timingArray = timingArray.filter((time: string) => {
                  if (!time || typeof time !== 'string') return false;
                  const parts = time.split(':');
                  return parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]));
                });
                
                // If after filtering we have no valid times, use default
                if (timingArray.length === 0) {
                  timingArray = generateDefaultTiming(med.frequency);
                }
                
                // Parse end date if duration is provided
                let endDate: Date | null = null;
                if (med.duration) {
                  // Try to parse duration (e.g., "7 days", "until 2024-12-31")
                  const durationLower = med.duration.toLowerCase();
                  if (durationLower.includes('day')) {
                    const daysMatch = med.duration.match(/(\d+)\s*days?/i);
                    if (daysMatch) {
                      const days = parseInt(daysMatch[1]);
                      endDate = new Date();
                      endDate.setDate(endDate.getDate() + days);
                    }
                  } else if (durationLower.includes('until') || durationLower.includes('till')) {
                    const dateMatch = med.duration.match(/(\d{4}-\d{2}-\d{2})/);
                    if (dateMatch) {
                      endDate = new Date(dateMatch[1]);
                    }
                  }
                }
                
                // Create medication
                const medication = await storage.createMedication({
                  userId: req.userId!,
                  name: med.name,
                  dosage: med.dosage,
                  frequency: med.frequency,
                  timing: JSON.stringify(timingArray),
                  startDate: new Date(),
                  endDate: endDate,
                  source: 'ai',
                  sourceDocumentId: document.id,
                  status: 'active',
                  instructions: med.instructions || null,
                });
                
                // Generate reminders
                const reminders = generateReminders(medication);
                for (const reminder of reminders) {
                  await storage.createMedicationReminder({
                    medicationId: medication.id,
                    scheduledTime: reminder.scheduledTime,
                    status: 'pending',
                    sentAt: null,
                  });
                }
                
                console.log(`[Documents] Created medication ${medication.name} with ${reminders.length} reminders`);
              } catch (medError: any) {
                console.error(`[Documents] Failed to create medication ${med.name}:`, medError.message);
                // Continue with other medications
              }
            }
          } else {
            console.log(`[Documents] No medications found in ${documentTypeForExtraction} document`);
          }
        } catch (medExtractionError: any) {
          console.error("[Documents] Medication extraction failed:", medExtractionError.message);
          // Don't fail document creation if medication extraction fails
        }
      } else {
        console.log("[Documents] No extracted text available for medication extraction");
      }

      res.status(201).json({
        success: true,
        message: "Document created successfully",
        document: {
          id: document.id,
          title: document.title,
          type: document.type,
          provider: document.provider,
          date: document.date,
          fileUrl: document.fileUrl,
          fileType: document.fileType,
          fileSize: document.fileSize,
          tags: document.tags ? JSON.parse(document.tags) : [],
          createdAt: document.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/documents/analyze
 * Analyze a document without saving it
 * Returns extracted metadata and validates if it's medical
 */
router.post(
  "/analyze",
  (req: Request, res: Response, next: NextFunction) => {
    // Handle multer errors
    upload.single("file")(req, res, (err: any) => {
      if (err) {
        console.error("[Documents] Multer error in analyze:", err);
        return res.status(400).json({
          success: false,
          message: err.message || "File upload error",
        });
      }
      next();
    });
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("[Documents] Analyze endpoint called");
      console.log("[Documents] Request file:", req.file ? `${req.file.originalname} (${req.file.size} bytes)` : "none");
      console.log("[Documents] User ID:", req.userId);

      if (!req.file) {
        console.log("[Documents] No file provided in analyze request");
        return res.status(400).json({
          success: false,
          message: "File is required",
        });
      }

      console.log("[Documents] Reading file buffer...");
      const fileBuffer = await fs.readFile(req.file.path);
      console.log("[Documents] File buffer read, size:", fileBuffer.length);
      const fileType = req.file.mimetype.includes('pdf') ? 'PDF' :
                      req.file.mimetype.includes('image') ? 'IMAGE' :
                      req.file.mimetype.includes('word') ? 'DOCX' :
                      req.file.mimetype.includes('zip') ? 'ZIP' : 'OTHER';

      // Clean up local file
      await fs.unlink(req.file.path).catch(() => {});

      // Extract text from document
      console.log("[Documents] Starting OCR extraction...");
      let extractedText = "";
      try {
        const ocrResult = await OpenAIService.processDocument(
          fileBuffer,
          fileType,
          req.file.mimetype
        );
        extractedText = ocrResult.extractedText;
        console.log("[Documents] OCR completed, extracted", extractedText.length, "characters");
      } catch (ocrError: any) {
        console.error("[Documents] OCR failed during analysis:", ocrError);
        // Continue with empty text - will use image analysis
      }

      // Validate if document is medical-related
      console.log("[Documents] Starting medical validation...");
      const validation = await OpenAIService.validateMedicalDocument(
        extractedText,
        fileBuffer,
        req.file.mimetype
      );
      console.log("[Documents] Validation result:", validation.isValid ? "VALID" : "INVALID", "-", validation.reason);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: `This document does not appear to be a medical document. ${validation.reason}`,
          validationError: true,
          isValid: false,
        });
      }

      // Extract metadata from the document
      console.log("[Documents] Starting metadata extraction...");
      let metadata: ExtractedMetadata = {};
      if (extractedText && extractedText.trim().length > 0) {
        try {
          metadata = await OpenAIService.extractMetadata(extractedText);
          console.log("[Documents] Metadata extracted:", metadata);
        } catch (metadataError: any) {
          console.error("[Documents] Metadata extraction failed:", metadataError);
          // Continue with empty metadata
        }
      } else {
        console.log("[Documents] No extracted text, skipping metadata extraction");
      }

      console.log("[Documents] Sending success response with metadata");
      res.json({
        success: true,
        isValid: true,
        extractedText: extractedText.substring(0, 1000), // Return first 1000 chars for preview
        metadata: {
          title: metadata.title || undefined,
          provider: metadata.provider || undefined,
          date: metadata.date || undefined,
          documentType: metadata.documentType || undefined,
          tags: metadata.tags || [],
        },
      });
    } catch (error: any) {
      console.error("[Documents] Analyze error:", error);
      // Ensure we return JSON even on error
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to analyze document. Please try again.",
        validationError: false,
      });
    }
  }
);

/**
 * PUT /api/documents/:id
 * Update a document
 */
const updateDocumentSchema = z.object({
  title: z.string().optional(),
  provider: z.string().optional(),
  date: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

router.put(
  "/:id",
  validate(updateDocumentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({
          success: false,
          message: "Document not found",
        });
      }

      // Check ownership
      if (document.userId !== req.userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const updateData: any = {};
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.provider !== undefined) updateData.provider = req.body.provider;
      if (req.body.date !== undefined) updateData.date = new Date(req.body.date);
      if (req.body.tags !== undefined) updateData.tags = JSON.stringify(req.body.tags);

      const updated = await storage.updateDocument(id, updateData);

      res.json({
        success: true,
        message: "Document updated successfully",
        document: {
          id: updated.id,
          title: updated.title,
          type: updated.type,
          provider: updated.provider,
          date: updated.date,
          tags: updated.tags ? JSON.parse(updated.tags) : [],
          updatedAt: updated.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/documents/:id
 * Delete a document
 */
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const document = await storage.getDocument(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check ownership (RLS also enforces this, but we check in app code too)
    if (document.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Delete file from Supabase Storage if it exists
    // File URL format: "documents/userId/filename.ext"
    if (document.fileUrl && document.fileUrl.startsWith('documents/')) {
      try {
        await SupabaseStorageService.deleteFile(document.fileUrl);
        console.log(`[Documents] Deleted file from Supabase Storage: ${document.fileUrl}`);
      } catch (error: any) {
        console.error("[Documents] Error deleting file from storage:", error);
        // Continue with document deletion even if file deletion fails
      }
    }

    await storage.deleteDocument(id);

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/documents/:id/file
 * Get document file (download/signed URL)
 */
router.get("/:id/file", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const document = await storage.getDocument(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check ownership (RLS also enforces this, but we check in app code too)
    if (document.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // If file is in Supabase Storage, create signed URL
    // File URL format: "documents/userId/filename.ext"
    if (document.fileUrl && document.fileUrl.startsWith('documents/')) {
      try {
        const signedUrl = await SupabaseStorageService.createSignedUrl(document.fileUrl, 3600); // 1 hour expiry
        
        return res.json({
          success: true,
          fileUrl: signedUrl,
          fileType: document.fileType,
          expiresIn: 3600,
        });
      } catch (error: any) {
        console.error("[Documents] Error creating signed URL:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to generate file access URL",
        });
      }
    }

    // Fallback for old local files
    res.json({
      success: true,
      fileUrl: document.fileUrl,
      fileType: document.fileType,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/documents/:id/insights
 * Get AI insights for a specific document
 */
router.get("/:id/insights", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const documentId = req.params.id;
    console.log(`[Document Insights] Fetching insights for document ${documentId}`);

    // Get user to retrieve language preference
    const user = await storage.getUser(userId);
    const userSettings = user?.settings ? JSON.parse(user.settings) : {};
    const userLanguage = userSettings.language || 'en';
    console.log(`[Document Insights] User language preference: ${userLanguage} (settings: ${JSON.stringify(userSettings)})`);

    // Get document
    const document = await storage.getDocument(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Verify document belongs to user
    if (document.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if document has extracted text
    if (!document.extractedText || document.extractedText.trim().length === 0) {
      const isHindi = userLanguage === 'hi';
      return res.json({
        success: true,
        insight: {
          status: "none",
          summary: isHindi 
            ? "दस्तावेज़ से कोई पाठ निकाला नहीं जा सका। अंतर्दृष्टि उत्पन्न करने में असमर्थ।"
            : "No text extracted from document. Unable to generate insights.",
          hasFullAnalysis: false,
        },
      });
    }

    // Check if cached insight exists and is recent (less than 7 days old)
    // Also check if the cached insight was generated in the same language
    if (document.aiInsight && document.aiInsightGeneratedAt) {
      const insightAge = Date.now() - new Date(document.aiInsightGeneratedAt).getTime();
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      
      if (insightAge < sevenDaysInMs) {
        try {
          const cachedInsight = JSON.parse(document.aiInsight);
          
          // Check if cached insight has language metadata and if it matches current language
          // If no language metadata exists, assume it's in English (old cached insights)
          const cachedLanguage = cachedInsight.language || 'en';
          
          if (cachedLanguage === userLanguage) {
            console.log(`[Document Insights] Returning cached insight for document ${documentId} (language: ${userLanguage})`);
            // Remove language metadata before returning (it's just for cache validation)
            const { language: _, ...insightWithoutLanguage } = cachedInsight;
            return res.json({
              success: true,
              insight: insightWithoutLanguage,
              cached: true,
            });
          } else {
            console.log(`[Document Insights] Cached insight language (${cachedLanguage}) doesn't match user language (${userLanguage}), regenerating`);
          }
        } catch (parseError) {
          console.warn(`[Document Insights] Failed to parse cached insight, regenerating`);
        }
      } else {
        console.log(`[Document Insights] Cached insight is older than 7 days, regenerating`);
      }
    }

    // Generate document insight using OpenAI with user's language preference
    const insight = await OpenAIService.generateDocumentInsight(
      document.extractedText,
      document.type,
      userLanguage
    );

    // Cache the insight in the database with language metadata
    try {
      const insightWithLanguage = {
        ...insight,
        language: userLanguage, // Store language for cache validation
      };
      await storage.updateDocument(documentId, {
        aiInsight: JSON.stringify(insightWithLanguage),
        aiInsightGeneratedAt: new Date(),
      });
      console.log(`[Document Insights] Cached insight for document ${documentId} (language: ${userLanguage})`);
    } catch (cacheError) {
      console.error(`[Document Insights] Failed to cache insight:`, cacheError);
      // Continue even if caching fails
    }

    res.json({
      success: true,
      insight, // Return insight without language metadata (it's only stored in cache)
      cached: false,
    });
  } catch (error: any) {
    console.error("[Document Insights] Error generating document insight:", error);
    next(error);
  }
});

/**
 * GET /api/documents/:id/preview
 * Get document preview/thumbnail URL (optimized for images)
 */
router.get("/:id/preview", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const document = await storage.getDocument(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check ownership
    if (document.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // For images, return the same signed URL as file endpoint
    // In the future, we could generate thumbnails here
    if (document.fileUrl && document.fileUrl.startsWith('documents/')) {
      try {
        const signedUrl = await SupabaseStorageService.createSignedUrl(document.fileUrl, 3600);
        return res.json({
          success: true,
          previewUrl: signedUrl,
          fileType: document.fileType,
          expiresIn: 3600,
        });
      } catch (error: any) {
        console.error("[Documents] Error creating preview URL:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to generate preview URL",
        });
      }
    }

    // Fallback
    res.json({
      success: true,
      previewUrl: document.fileUrl,
      fileType: document.fileType,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/documents/sync
 * Sync all pending documents (update syncStatus from 'pending' to 'synced')
 */
router.post("/sync", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    
    // Get all documents for the user
    const documents = await storage.getDocumentsByUserId(userId);
    
    // Filter pending documents
    const pendingDocuments = documents.filter(doc => doc.syncStatus === "pending");
    
    if (pendingDocuments.length === 0) {
      return res.json({
        success: true,
        message: "No pending documents to sync",
        syncedCount: 0,
      });
    }
    
    // Update each pending document to synced
    let syncedCount = 0;
    for (const doc of pendingDocuments) {
      try {
        await storage.updateDocument(doc.id, { syncStatus: "synced" });
        syncedCount++;
      } catch (error) {
        console.error(`[Documents] Failed to sync document ${doc.id}:`, error);
      }
    }
    
    res.json({
      success: true,
      message: `Synced ${syncedCount} document(s)`,
      syncedCount,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

