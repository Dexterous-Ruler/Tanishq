-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  timing TEXT NOT NULL, -- JSON array of times in HH:MM format
  start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP, -- Nullable for indefinite medications
  source VARCHAR(20) NOT NULL, -- 'ai' | 'manual'
  source_document_id VARCHAR REFERENCES documents(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active' | 'stopped' | 'completed'
  instructions TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create medication_reminders table
CREATE TABLE IF NOT EXISTS medication_reminders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id VARCHAR NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'sent' | 'skipped'
  sent_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_status ON medications(status);
CREATE INDEX IF NOT EXISTS idx_medications_source_document_id ON medications(source_document_id);
CREATE INDEX IF NOT EXISTS idx_medication_reminders_medication_id ON medication_reminders(medication_id);
CREATE INDEX IF NOT EXISTS idx_medication_reminders_scheduled_time ON medication_reminders(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_medication_reminders_status ON medication_reminders(status);
CREATE INDEX IF NOT EXISTS idx_medication_reminders_due ON medication_reminders(scheduled_time, status) WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medications table
-- Users can only see their own medications
CREATE POLICY "Users can view their own medications"
  ON medications FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can insert their own medications
CREATE POLICY "Users can insert their own medications"
  ON medications FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own medications
CREATE POLICY "Users can update their own medications"
  ON medications FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Users can delete their own medications
CREATE POLICY "Users can delete their own medications"
  ON medications FOR DELETE
  USING (auth.uid()::text = user_id);

-- RLS Policies for medication_reminders table
-- Users can only see reminders for their own medications
CREATE POLICY "Users can view reminders for their medications"
  ON medication_reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM medications
      WHERE medications.id = medication_reminders.medication_id
      AND medications.user_id = auth.uid()::text
    )
  );

-- Users can insert reminders for their own medications
CREATE POLICY "Users can insert reminders for their medications"
  ON medication_reminders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM medications
      WHERE medications.id = medication_reminders.medication_id
      AND medications.user_id = auth.uid()::text
    )
  );

-- Users can update reminders for their own medications
CREATE POLICY "Users can update reminders for their medications"
  ON medication_reminders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM medications
      WHERE medications.id = medication_reminders.medication_id
      AND medications.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM medications
      WHERE medications.id = medication_reminders.medication_id
      AND medications.user_id = auth.uid()::text
    )
  );

-- Users can delete reminders for their own medications
CREATE POLICY "Users can delete reminders for their medications"
  ON medication_reminders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM medications
      WHERE medications.id = medication_reminders.medication_id
      AND medications.user_id = auth.uid()::text
    )
  );

-- Note: For server-side operations using service role key, RLS is bypassed
-- These policies are for direct client access if needed

