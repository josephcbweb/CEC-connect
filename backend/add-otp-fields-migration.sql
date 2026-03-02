-- Migration: Add OTP fields for password reset functionality
-- Date: 2026-03-01
-- Description: Adds reset_otp and otp_expiry columns to students table

-- Add reset_otp column (6-digit OTP)
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(6);

-- Add otp_expiry column (timestamp for OTP expiration)
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP;

-- Add index for faster OTP lookup
CREATE INDEX IF NOT EXISTS idx_students_reset_otp ON students(reset_otp);
CREATE INDEX IF NOT EXISTS idx_students_otp_expiry ON students(otp_expiry);

-- Comment on columns
COMMENT ON COLUMN students.reset_otp IS '6-digit OTP for password reset';
COMMENT ON COLUMN students.otp_expiry IS 'Expiry timestamp for the OTP (5 minutes from generation)';
