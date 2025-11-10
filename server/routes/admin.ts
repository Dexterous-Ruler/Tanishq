/**
 * Admin Routes
 * Administrative endpoints for database setup and maintenance
 */

import { Router, type Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const { Client } = pg;

const router = Router();

/**
 * POST /api/admin/create-emergency-cards-table
 * Create the emergency_cards table in Supabase
 * This is a one-time setup endpoint
 */
router.post("/create-emergency-cards-table", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const databaseUrl = process.env.DATABASE_URL;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        success: false,
        message: "Supabase configuration missing. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.",
      });
    }

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.emergency_cards (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
        patient_name TEXT NOT NULL,
        blood_group TEXT,
        allergies TEXT,
        chronic_conditions TEXT,
        current_medications TEXT,
        age INTEGER,
        address TEXT,
        qr_code_token TEXT NOT NULL UNIQUE,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_emergency_cards_user_id ON public.emergency_cards(user_id);
      CREATE INDEX IF NOT EXISTS idx_emergency_cards_qr_token ON public.emergency_cards(qr_code_token);
    `;

    // Try using direct database connection if available
    if (databaseUrl) {
      const client = new Client({ connectionString: databaseUrl });
      try {
        await client.connect();
        await client.query(createTableSQL);
        await client.query(createIndexesSQL);
        await client.end();

        return res.json({
          success: true,
          message: "Emergency cards table created successfully",
        });
      } catch (error: any) {
        await client.end();
        throw error;
      }
    }

    // Fallback: Check if table exists using Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if table exists
    const { error: checkError } = await supabase
      .from('emergency_cards')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      // Table doesn't exist - provide SQL to run manually
      return res.status(400).json({
        success: false,
        message: "Table does not exist. Please run the SQL in Supabase SQL Editor.",
        sql: createTableSQL + "\n" + createIndexesSQL,
      });
    } else if (!checkError) {
      return res.json({
        success: true,
        message: "Emergency cards table already exists",
      });
    } else {
      throw checkError;
    }
  } catch (error: any) {
    next(error);
  }
});

export default router;

