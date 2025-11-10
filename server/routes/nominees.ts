/**
 * Nominees Routes
 * Handles nominee CRUD operations
 */

import { Router, type Request, Response, NextFunction } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validation";

const router = Router();

// Validation schema for nominee data
const nomineeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  relationship: z.enum(["Parent", "Sibling", "Spouse", "Friend", "Other"], {
    errorMap: () => ({ message: "Invalid relationship type" }),
  }),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  accessScope: z.enum(["emergency-only", "emergency-limited"], {
    errorMap: () => ({ message: "Invalid access scope" }),
  }),
  expiryType: z.enum(["24h", "7d", "custom", "lifetime"], {
    errorMap: () => ({ message: "Invalid expiry type" }),
  }),
  customExpiryDate: z.string().optional().refine(
    (val) => {
      if (!val) return true; // Optional field
      // Accept both date (YYYY-MM-DD) and datetime (ISO) formats
      const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
      return dateRegex.test(val) && !isNaN(Date.parse(val));
    },
    { message: "Invalid date format" }
  ),
});

const updateNomineeSchema = nomineeSchema.partial();

/**
 * GET /api/nominees
 * Get all nominees for the current user
 * Requires authentication
 */
router.get("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const nominees = await storage.getNominees(req.userId);

    res.json({
      success: true,
      nominees: nominees.map(nominee => ({
        id: nominee.id,
        name: nominee.name,
        relationship: nominee.relationship,
        phone: nominee.phoneNumber,
        email: nominee.email,
        scope: nominee.accessScope,
        expiry: nominee.expiryType === 'lifetime' 
          ? 'lifetime' 
          : nominee.expiryType === 'custom' && nominee.customExpiryDate
          ? nominee.customExpiryDate.toISOString().split('T')[0]
          : nominee.expiryType,
        status: nominee.status,
        createdAt: nominee.createdAt,
        updatedAt: nominee.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/nominees/:id
 * Get a specific nominee by ID
 * Requires authentication
 */
router.get("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;
    const nominee = await storage.getNominee(id);

    if (!nominee) {
      return res.status(404).json({
        success: false,
        message: "Nominee not found",
      });
    }

    // Verify the nominee belongs to the current user
    if (nominee.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      nominee: {
        id: nominee.id,
        name: nominee.name,
        relationship: nominee.relationship,
        phone: nominee.phoneNumber,
        email: nominee.email,
        scope: nominee.accessScope,
        expiry: nominee.expiryType === 'lifetime' 
          ? 'lifetime' 
          : nominee.expiryType === 'custom' && nominee.customExpiryDate
          ? nominee.customExpiryDate.toISOString().split('T')[0]
          : nominee.expiryType,
        customExpiryDate: nominee.customExpiryDate,
        status: nominee.status,
        createdAt: nominee.createdAt,
        updatedAt: nominee.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/nominees
 * Create a new nominee
 * Requires authentication
 */
router.post("/", requireAuth, validate(nomineeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const data = req.body;
    // Convert date string to Date object, handling both date-only and datetime formats
    let customExpiryDate: Date | undefined = undefined;
    if (data.customExpiryDate) {
      // If it's just a date (YYYY-MM-DD), set time to end of day
      const dateStr = data.customExpiryDate;
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        customExpiryDate = new Date(dateStr + 'T23:59:59');
      } else {
        customExpiryDate = new Date(dateStr);
      }
      // Validate the date
      if (isNaN(customExpiryDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid custom expiry date",
        });
      }
    }

    const nominee = await storage.createNominee(req.userId, {
      name: data.name,
      relationship: data.relationship,
      phoneNumber: data.phoneNumber,
      email: data.email || undefined,
      accessScope: data.accessScope,
      expiryType: data.expiryType,
      customExpiryDate,
    });

    res.status(201).json({
      success: true,
      message: "Nominee created successfully",
      nominee: {
        id: nominee.id,
        name: nominee.name,
        relationship: nominee.relationship,
        phone: nominee.phoneNumber,
        email: nominee.email,
        scope: nominee.accessScope,
        expiry: nominee.expiryType === 'lifetime' 
          ? 'lifetime' 
          : nominee.expiryType === 'custom' && nominee.customExpiryDate
          ? nominee.customExpiryDate.toISOString().split('T')[0]
          : nominee.expiryType,
        status: nominee.status,
        createdAt: nominee.createdAt,
        updatedAt: nominee.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/nominees/:id
 * Update an existing nominee
 * Requires authentication
 */
router.put("/:id", requireAuth, validate(updateNomineeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;
    const nominee = await storage.getNominee(id);

    if (!nominee) {
      return res.status(404).json({
        success: false,
        message: "Nominee not found",
      });
    }

    // Verify the nominee belongs to the current user
    if (nominee.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const data = req.body;
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.relationship !== undefined) updateData.relationship = data.relationship;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.accessScope !== undefined) updateData.accessScope = data.accessScope;
    if (data.expiryType !== undefined) {
      updateData.expiryType = data.expiryType;
      if (data.expiryType === 'custom' && data.customExpiryDate) {
        updateData.customExpiryDate = new Date(data.customExpiryDate);
      } else if (data.expiryType !== 'custom') {
        updateData.customExpiryDate = null;
      }
    }
    if (data.customExpiryDate !== undefined && nominee.expiryType === 'custom') {
      updateData.customExpiryDate = new Date(data.customExpiryDate);
    }

    const updated = await storage.updateNominee(id, updateData);

    res.json({
      success: true,
      message: "Nominee updated successfully",
      nominee: {
        id: updated.id,
        name: updated.name,
        relationship: updated.relationship,
        phone: updated.phoneNumber,
        email: updated.email,
        scope: updated.accessScope,
        expiry: updated.expiryType === 'lifetime' 
          ? 'lifetime' 
          : updated.expiryType === 'custom' && updated.customExpiryDate
          ? updated.customExpiryDate.toISOString().split('T')[0]
          : updated.expiryType,
        status: updated.status,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/nominees/:id
 * Delete (revoke) a nominee
 * Requires authentication
 */
router.delete("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;
    const nominee = await storage.getNominee(id);

    if (!nominee) {
      return res.status(404).json({
        success: false,
        message: "Nominee not found",
      });
    }

    // Verify the nominee belongs to the current user
    if (nominee.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await storage.deleteNominee(id);

    res.json({
      success: true,
      message: "Nominee revoked successfully",
    });
  } catch (error) {
    next(error);
  }
});

export default router;

