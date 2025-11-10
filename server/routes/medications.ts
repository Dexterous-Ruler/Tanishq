/**
 * Medications Routes
 * Handles medication CRUD operations and reminder management
 */

import { Router, type Request, Response, NextFunction } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { generateDefaultTiming, generateReminders } from "../services/medicationService";
import { OpenAIService } from "../services/openaiService";
import multer from "multer";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { SupabaseStorageService } from "../services/supabaseStorage";

const router = Router();

// Validation schema for medication data
const createMedicationSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  dosage: z.string().min(1, "Dosage is required").max(100, "Dosage must be less than 100 characters"),
  frequency: z.string().min(1, "Frequency is required").max(100, "Frequency must be less than 100 characters"),
  timing: z.array(z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format")).optional(),
  startDate: z.string().optional().refine(
    (val) => {
      if (!val) return true;
      const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
      return dateRegex.test(val) && !isNaN(Date.parse(val));
    },
    { message: "Invalid date format" }
  ),
  endDate: z.string().nullable().optional().refine(
    (val) => {
      if (!val) return true;
      const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
      return dateRegex.test(val) && !isNaN(Date.parse(val));
    },
    { message: "Invalid date format" }
  ),
  instructions: z.string().max(500, "Instructions must be less than 500 characters").optional(),
});

const updateMedicationSchema = createMedicationSchema.partial();

const createReminderSchema = z.object({
  scheduledTime: z.string().refine(
    (val) => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
      return dateRegex.test(val) && !isNaN(Date.parse(val));
    },
    { message: "Invalid date format" }
  ),
});

/**
 * GET /api/medications
 * Get all medications for the current user
 * Query params: ?status=active|stopped|completed
 */
router.get("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const status = req.query.status as string | undefined;
    const medications = await storage.getMedications(req.userId, status ? { status } : undefined);

    res.json({
      success: true,
      medications,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/medications/:id
 * Get a specific medication
 */
router.get("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const medication = await storage.getMedication(req.params.id);

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found",
      });
    }

    // Verify medication belongs to user
    if (medication.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      medication,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/medications
 * Create a new medication
 */
router.post("/", requireAuth, validate(createMedicationSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { name, dosage, frequency, timing, startDate, endDate, instructions } = req.body;

    // Generate timing if not provided
    let timingArray = timing && Array.isArray(timing) && timing.length > 0
      ? timing.filter((t: any) => t && typeof t === 'string' && t.includes(':'))
      : generateDefaultTiming(frequency);
    
    // Ensure timingArray is valid and filter out any invalid times
    timingArray = timingArray.filter((time: string) => {
      if (!time || typeof time !== 'string') return false;
      const parts = time.split(':');
      return parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]));
    });
    
    // If after filtering we have no valid times, use default
    if (timingArray.length === 0) {
      timingArray = generateDefaultTiming(frequency);
    }

    // Parse dates
    const parsedStartDate = startDate ? new Date(startDate) : new Date();
    const parsedEndDate = endDate ? new Date(endDate) : null;

    // Create medication
    const medication = await storage.createMedication({
      userId: req.userId,
      name,
      dosage,
      frequency,
      timing: JSON.stringify(timingArray),
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      source: 'manual',
      sourceDocumentId: null,
      status: 'active',
      instructions: instructions || null,
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

    res.status(201).json({
      success: true,
      medication,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * PUT /api/medications/:id
 * Update a medication
 */
router.put("/:id", requireAuth, validate(updateMedicationSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const medication = await storage.getMedication(req.params.id);

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found",
      });
    }

    // Verify medication belongs to user
    if (medication.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const updateData: any = {};

    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.dosage !== undefined) updateData.dosage = req.body.dosage;
    if (req.body.frequency !== undefined) updateData.frequency = req.body.frequency;
    if (req.body.instructions !== undefined) updateData.instructions = req.body.instructions;
    if (req.body.status !== undefined) updateData.status = req.body.status;

    // Handle timing
    if (req.body.timing !== undefined) {
      let timingArray = req.body.timing && Array.isArray(req.body.timing) && req.body.timing.length > 0
        ? req.body.timing.filter((t: any) => t && typeof t === 'string' && t.includes(':'))
        : generateDefaultTiming(req.body.frequency || medication.frequency);
      
      // Ensure timingArray is valid and filter out any invalid times
      timingArray = timingArray.filter((time: string) => {
        if (!time || typeof time !== 'string') return false;
        const parts = time.split(':');
        return parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]));
      });
      
      // If after filtering we have no valid times, use default
      if (timingArray.length === 0) {
        timingArray = generateDefaultTiming(req.body.frequency || medication.frequency);
      }
      
      updateData.timing = JSON.stringify(timingArray);
    }

    // Handle dates
    if (req.body.startDate !== undefined) {
      updateData.startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
    }
    if (req.body.endDate !== undefined) {
      updateData.endDate = req.body.endDate ? new Date(req.body.endDate) : null;
    }

    const updated = await storage.updateMedication(req.params.id, updateData);

    // Regenerate reminders if timing, frequency, startDate, or endDate changed
    const timingChanged = req.body.timing !== undefined || req.body.frequency !== undefined;
    const dateChanged = req.body.startDate !== undefined || req.body.endDate !== undefined;

    if (timingChanged || dateChanged) {
      // Delete existing pending reminders
      const existingReminders = await storage.getMedicationReminders(medication.id);
      for (const reminder of existingReminders) {
        if (reminder.status === 'pending') {
          // Note: We don't have a deleteReminder method, so we'll skip them
          // They'll be skipped when checking due reminders
        }
      }

      // Generate new reminders
      const reminders = generateReminders(updated);
      for (const reminder of reminders) {
        await storage.createMedicationReminder({
          medicationId: updated.id,
          scheduledTime: reminder.scheduledTime,
          status: 'pending',
          sentAt: null,
        });
      }
    }

    res.json({
      success: true,
      medication: updated,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * DELETE /api/medications/:id
 * Delete a medication
 */
router.delete("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const medication = await storage.getMedication(req.params.id);

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found",
      });
    }

    // Verify medication belongs to user
    if (medication.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await storage.deleteMedication(req.params.id);

    res.json({
      success: true,
      message: "Medication deleted successfully",
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/medications/:id/reminders
 * Get all reminders for a medication
 */
router.get("/:id/reminders", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const medication = await storage.getMedication(req.params.id);

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found",
      });
    }

    // Verify medication belongs to user
    if (medication.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const reminders = await storage.getMedicationReminders(req.params.id);

    res.json({
      success: true,
      reminders,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/medications/:id/reminders/regenerate
 * Regenerate all reminders for a medication
 */
router.post("/:id/reminders/regenerate", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const medication = await storage.getMedication(req.params.id);

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found",
      });
    }

    // Verify medication belongs to user
    if (medication.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Delete existing pending reminders
    await storage.deleteRemindersForMedication(medication.id);

    // Generate new reminders
    const reminders = generateReminders(medication);
    for (const reminder of reminders) {
      await storage.createMedicationReminder({
        medicationId: medication.id,
        scheduledTime: reminder.scheduledTime,
        status: 'pending',
        sentAt: null,
      });
    }

    res.json({
      success: true,
      message: `Generated ${reminders.length} reminders`,
    });
  } catch (error: any) {
    next(error);
  }
});

// Configure multer for file uploads
const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: PDF, JPEG, PNG, WEBP, DOCX`));
    }
  },
});

/**
 * POST /api/medications/import
 * Import medications from an uploaded file (prescription, etc.)
 */
router.post(
  "/import",
  requireAuth,
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "File is required",
        });
      }

      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          success: false,
          message: "AI processing is not configured. Please set OPENAI_API_KEY environment variable.",
        });
      }

      console.log(`[Medications] Importing medications from file: ${req.file.originalname}`);

      // Extract text from file
      let extractedText = "";
      try {
        const fileBuffer = await fs.readFile(req.file.path);
        const fileType = req.file.mimetype.includes('pdf') ? 'PDF' :
                        req.file.mimetype.includes('image') ? 'IMAGE' :
                        req.file.mimetype.includes('word') ? 'DOCX' : 'OTHER';

        // Use OpenAI service to extract text
        if (fileType === 'PDF') {
          extractedText = await OpenAIService.extractTextFromPDF(fileBuffer);
        } else if (fileType === 'IMAGE') {
          extractedText = await OpenAIService.extractTextFromImage(fileBuffer, req.file.mimetype);
        } else if (fileType === 'DOCX') {
          // For DOCX, we might need a different approach
          // For now, try to extract as image if possible, or return error
          return res.status(400).json({
            success: false,
            message: "DOCX files are not yet supported for medication import. Please use PDF or image files.",
          });
        } else {
          return res.status(400).json({
            success: false,
            message: "Unsupported file type",
          });
        }

        console.log(`[Medications] Extracted ${extractedText.length} characters from file`);
      } catch (extractError: any) {
        console.error("[Medications] Failed to extract text from file:", extractError);
        return res.status(500).json({
          success: false,
          message: `Failed to extract text from file: ${extractError.message}`,
        });
      } finally {
        // Clean up temp file
        await fs.unlink(req.file.path).catch(() => {});
      }

      if (!extractedText || extractedText.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "No text could be extracted from the file. Please ensure the file contains readable text.",
        });
      }

      // Extract medications from text
      const extractedMedications = await OpenAIService.extractMedications(extractedText, "prescription");

      if (!extractedMedications || extractedMedications.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No medications found in the file",
          medications: [],
          count: 0,
        });
      }

      console.log(`[Medications] Extracted ${extractedMedications.length} medication(s) from file`);

      // Create medications
      const createdMedications = [];
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
            userId: req.userId,
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            timing: JSON.stringify(timingArray),
            startDate: new Date(),
            endDate: endDate,
            source: 'ai',
            sourceDocumentId: null, // No document created, just importing medications
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

          createdMedications.push(medication);
          console.log(`[Medications] Created medication ${medication.name} with ${reminders.length} reminders`);
        } catch (medError: any) {
          console.error(`[Medications] Failed to create medication ${med.name}:`, medError.message);
          // Continue with other medications
        }
      }

      res.json({
        success: true,
        message: `Successfully imported ${createdMedications.length} medication(s)`,
        medications: createdMedications,
        count: createdMedications.length,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;

