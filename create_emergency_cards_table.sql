-- SQL script to create the emergency_cards table in Supabase
-- Run this in your Supabase SQL Editor

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

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_emergency_cards_user_id ON public.emergency_cards(user_id);

-- Create index on qr_code_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_emergency_cards_qr_token ON public.emergency_cards(qr_code_token);

-- Enable Row Level Security (RLS) if needed
ALTER TABLE public.emergency_cards ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own emergency cards
CREATE POLICY "Users can view their own emergency cards"
    ON public.emergency_cards
    FOR SELECT
    USING (auth.uid()::text = user_id);

-- Create policy to allow users to insert their own emergency cards
CREATE POLICY "Users can insert their own emergency cards"
    ON public.emergency_cards
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- Create policy to allow users to update their own emergency cards
CREATE POLICY "Users can update their own emergency cards"
    ON public.emergency_cards
    FOR UPDATE
    USING (auth.uid()::text = user_id);

-- Note: Public read access for QR code viewing is handled by the backend API
-- The /api/emergency/qr/:token endpoint doesn't require authentication

