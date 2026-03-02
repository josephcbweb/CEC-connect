/**
 * Password Reset Routes
 * Handles password reset flow with OTP verification
 * 
 * Routes:
 * - POST /api/password-reset/send-otp - Send OTP to email
 * - POST /api/password-reset/verify-otp - Verify OTP
 * - POST /api/password-reset/reset-password - Reset password with verified OTP
 * 
 * Rate Limiting Recommendation:
 * - /send-otp: Max 3 requests per email per hour
 * - /verify-otp: Max 5 requests per IP per 10 minutes
 * - /reset-password: Max 3 requests per IP per 10 minutes
 */

import express from "express";
import { 
    sendOTP, 
    verifyOTP, 
    resetPassword 
} from "../Controllers/passwordResetController";

const router = express.Router();

/**
 * @route   POST /api/password-reset/send-otp
 * @desc    Send OTP to registered email
 * @access  Public
 * @body    { email: string }
 */
router.post("/send-otp", sendOTP);

/**
 * @route   POST /api/password-reset/verify-otp
 * @desc    Verify OTP sent to email
 * @access  Public
 * @body    { email: string, otp: string }
 */
router.post("/verify-otp", verifyOTP);

/**
 * @route   POST /api/password-reset/reset-password
 * @desc    Reset password after OTP verification
 * @access  Public
 * @body    { email: string, otp: string, newPassword: string, confirmPassword: string }
 */
router.post("/reset-password", resetPassword);

export default router;
