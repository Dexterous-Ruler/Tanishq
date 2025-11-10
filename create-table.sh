#!/bin/bash
# Script to create emergency_cards table in Supabase
# Usage: ./create-table.sh

echo "🔄 Creating emergency_cards table in Supabase..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set"
  echo ""
  echo "To get your Supabase connection string:"
  echo "1. Go to your Supabase project dashboard"
  echo "2. Navigate to Settings > Database"
  echo "3. Copy the 'Connection string' under 'Connection pooling'"
  echo "4. Set it as DATABASE_URL environment variable"
  echo ""
  echo "Or run the SQL manually in Supabase SQL Editor:"
  echo ""
  cat create_emergency_cards_table.sql
  exit 1
fi

# Execute SQL using psql if available
if command -v psql &> /dev/null; then
  echo "📦 Using psql to create table..."
  psql "$DATABASE_URL" -f create_emergency_cards_table.sql
  if [ $? -eq 0 ]; then
    echo "✅ Table created successfully!"
    exit 0
  else
    echo "❌ Error creating table"
    exit 1
  fi
else
  echo "❌ psql not found. Please install PostgreSQL client tools"
  echo "Or run the SQL manually in Supabase SQL Editor"
  exit 1
fi

