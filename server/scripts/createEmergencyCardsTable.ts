/**
 * Script to create emergency_cards table in Supabase
 * Run with: tsx server/scripts/createEmergencyCardsTable.ts
 * 
 * Note: This script requires DATABASE_URL to be set, or it will use Supabase connection
 */

import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const { Client } = pg;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const databaseUrl = process.env.DATABASE_URL;

async function createEmergencyCardsTable() {
  console.log("🔄 Creating emergency_cards table...");

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

  // Try using direct database connection if DATABASE_URL is available
  if (databaseUrl) {
    console.log("📦 Using direct database connection...");
    const client = new Client({ connectionString: databaseUrl });
    
    try {
      await client.connect();
      console.log("✅ Connected to database");

      // Create table
      await client.query(createTableSQL);
      console.log("✅ Created emergency_cards table");

      // Create indexes
      await client.query(createIndexesSQL);
      console.log("✅ Created indexes");

      await client.end();
      console.log("✨ Table created successfully!");
      return;
    } catch (error: any) {
      console.error("❌ Error using direct connection:", error.message);
      await client.end();
    }
  }

  // Fallback: Use Supabase client to check if table exists
  if (supabaseUrl && supabaseServiceKey) {
    console.log("📦 Using Supabase client to verify table...");
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    try {
      // Check if table exists by trying to query it
      const { data, error } = await supabase
        .from('emergency_cards')
        .select('id')
        .limit(1);

      if (error && error.code === '42P01') {
        // Table doesn't exist
        console.log("❌ Table 'emergency_cards' does not exist.");
        console.log("\n📝 Please run this SQL in your Supabase SQL Editor:");
        console.log("\n" + createTableSQL + "\n" + createIndexesSQL);
        console.log("\nOr set DATABASE_URL environment variable and run this script again.");
        process.exit(1);
      } else if (!error) {
        console.log("✅ Table 'emergency_cards' already exists!");
        return;
      } else {
        throw error;
      }
    } catch (error: any) {
      console.error("❌ Error:", error.message);
      console.log("\n📝 Please run this SQL in your Supabase SQL Editor:");
      console.log("\n" + createTableSQL + "\n" + createIndexesSQL);
      process.exit(1);
    }
  } else {
    console.error("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or DATABASE_URL) must be set");
    console.log("\n📝 Please run this SQL in your Supabase SQL Editor:");
    console.log("\n" + createTableSQL + "\n" + createIndexesSQL);
    process.exit(1);
  }
}

// Run the script
createEmergencyCardsTable()
  .then(() => {
    console.log("✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
