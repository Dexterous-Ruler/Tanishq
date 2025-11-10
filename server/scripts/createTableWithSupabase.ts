/**
 * Create emergency_cards table using Supabase connection
 * This script attempts to create the table using the Supabase connection string
 * 
 * To get your Supabase connection string:
 * 1. Go to Supabase Dashboard > Settings > Database
 * 2. Copy the "Connection string" (URI format)
 * 3. Set it as DATABASE_URL environment variable
 * 
 * Run: DATABASE_URL="your-connection-string" npx tsx server/scripts/createTableWithSupabase.ts
 */

import pg from "pg";
const { Client } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL environment variable is required");
  console.log("\nTo get your Supabase connection string:");
  console.log("1. Go to Supabase Dashboard > Settings > Database");
  console.log("2. Copy the 'Connection string' (URI format)");
  console.log("3. Run: DATABASE_URL='your-connection-string' npx tsx server/scripts/createTableWithSupabase.ts");
  console.log("\nOr run the SQL manually in Supabase SQL Editor (see create_emergency_cards_table.sql)");
  process.exit(1);
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

CREATE INDEX IF NOT EXISTS idx_emergency_cards_user_id ON public.emergency_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_cards_qr_token ON public.emergency_cards(qr_code_token);
`;

async function createTable() {
  const client = new Client({ connectionString: databaseUrl });

  try {
    console.log("🔄 Connecting to database...");
    await client.connect();
    console.log("✅ Connected");

    console.log("🔄 Creating emergency_cards table...");
    await client.query(createTableSQL);
    console.log("✅ Table and indexes created successfully!");

    // Verify table exists
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'emergency_cards' 
      ORDER BY ordinal_position;
    `);

    console.log(`\n✅ Verified: Table has ${result.rows.length} columns`);
    console.log("✨ Done! The emergency_cards table is ready to use.");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.code === '42P01') {
      console.log("\nNote: If you see 'relation does not exist', the table creation might have failed.");
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTable();

