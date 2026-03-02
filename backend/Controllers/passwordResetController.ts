/**
 * Password Reset Controller
 * Handles secure password reset functionality with OTP verification
 * 
 * Security Features:
 * - Bcrypt with saltRounds = 10
 * - OTP expires after 5 minutes
 * - No email enumeration (same response for existing/non-existing emails)
 * - OTP cleared after successful reset
 * - Prepared statements (Prisma ORM)
 */

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { 
    sendPasswordResetOTP, 
    sendPasswordResetConfirmation 
} from "../services/mailService";

// Constants
const SALT_ROUNDS = 10;
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;

/**
 * Generate a 6-digit numeric OTP
 */
const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Step 1: Send OTP to student's email
 * POST /api/password-reset/send-otp
 * 
 * Rate Limiting Recommendation: Max 3 attempts per email per hour
 */
export const sendOTP = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        // Validate input
        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Email address is required"
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        // Find student by email
        const student = await prisma.student.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: { id: true, name: true, email: true }
        });

        // Security: Don't reveal if email exists or not
        // Always return success message for security (prevents email enumeration)
        if (!student) {
            console.log(`Password reset attempt for non-existent email: ${email}`);
            return res.status(200).json({
                success: true,
                message: "If this email is registered, you will receive an OTP shortly."
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + OTP_EXPIRY_MINUTES);

        // Store OTP in database
        await prisma.student.update({
            where: { id: student.id },
            data: {
                reset_otp: otp,
                otp_expiry: otpExpiry
            }
        });

        // Send OTP email
        const emailSent = await sendPasswordResetOTP(
            student.email!,
            student.name,
            otp
        );

        if (!emailSent) {
            console.error("Failed to send OTP email to:", email);
            // Clear OTP if email failed
            await prisma.student.update({
                where: { id: student.id },
                data: { reset_otp: null, otp_expiry: null }
            });
            
            return res.status(500).json({
                success: false,
                message: "Failed to send OTP. Please try again later."
            });
        }

        console.log(`OTP sent successfully to: ${email}`);

        return res.status(200).json({
            success: true,
            message: "If this email is registered, you will receive an OTP shortly."
        });

    } catch (error: any) {
        console.error("Error in sendOTP:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while processing your request"
        });
    }
};

/**
 * Step 2: Verify OTP
 * POST /api/password-reset/verify-otp
 */
export const verifyOTP = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;

        // Validate input
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        // Validate OTP format (6 digits)
        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP format"
            });
        }

        // Find student by email
        const student = await prisma.student.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: { 
                id: true, 
                email: true, 
                reset_otp: true, 
                otp_expiry: true 
            }
        });

        if (!student) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or OTP"
            });
        }

        // Check if OTP exists
        if (!student.reset_otp) {
            return res.status(400).json({
                success: false,
                message: "No OTP found. Please request a new one."
            });
        }

        // Check if OTP is expired
        if (!student.otp_expiry || new Date() > student.otp_expiry) {
            // Clear expired OTP
            await prisma.student.update({
                where: { id: student.id },
                data: { reset_otp: null, otp_expiry: null }
            });

            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one."
            });
        }

        // Verify OTP
        if (student.reset_otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        // OTP is valid
        console.log(`OTP verified successfully for: ${email}`);

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully"
        });

    } catch (error: any) {
        console.error("Error in verifyOTP:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while verifying OTP"
        });
    }
};

/**
 * Step 3: Reset Password
 * POST /api/password-reset/reset-password
 */
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, otp, newPassword, confirmPassword } = req.body;

        // Validate input
        if (!email || !otp || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        // Validate password strength
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long"
            });
        }

        // Validate OTP format
        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP format"
            });
        }

        // Find student by email
        const student = await prisma.student.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: { 
                id: true, 
                name: true,
                email: true, 
                reset_otp: true, 
                otp_expiry: true 
            }
        });

        if (!student) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or OTP"
            });
        }

        // Check if OTP exists
        if (!student.reset_otp) {
            return res.status(400).json({
                success: false,
                message: "No OTP found. Please request a new one."
            });
        }

        // Check if OTP is expired
        if (!student.otp_expiry || new Date() > student.otp_expiry) {
            // Clear expired OTP
            await prisma.student.update({
                where: { id: student.id },
                data: { reset_otp: null, otp_expiry: null }
            });

            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one."
            });
        }

        // Verify OTP
        if (student.reset_otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        // Hash new password with bcrypt (salt rounds = 10)
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Update password and clear OTP fields
        await prisma.student.update({
            where: { id: student.id },
            data: {
                password: hashedPassword,
                reset_otp: null,
                otp_expiry: null
            }
        });

        // Send confirmation email
        await sendPasswordResetConfirmation(student.email!, student.name);

        console.log(`Password reset successfully for: ${email}`);

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now login with your new password."
        });

    } catch (error: any) {
        console.error("Error in resetPassword:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while resetting password"
        });
    }
};

/**
 * Admin Step 1: Send OTP
 */
export const adminSendOTP = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({ success: false, message: "Email address is required" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: { id: true, username: true, email: true }
        });

        if (!user) {
            console.log(`Admin password reset attempt for non-existent email: ${email}`);
            return res.status(200).json({ success: true, message: "If this email is registered, you will receive an OTP shortly." });
        }

        const otp = generateOTP();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + OTP_EXPIRY_MINUTES);

        await prisma.user.update({
            where: { id: user.id },
            data: { reset_otp: otp, otp_expiry: otpExpiry }
        });

        const emailSent = await sendPasswordResetOTP(user.email!, user.username, otp);

        if (!emailSent) {
            console.error("Failed to send OTP email to admin:", email);
            await prisma.user.update({
                where: { id: user.id },
                data: { reset_otp: null, otp_expiry: null }
            });
            return res.status(500).json({ success: false, message: "Failed to send OTP. Please try again later." });
        }

        console.log(`Admin OTP sent successfully to: ${email}`);
        return res.status(200).json({ success: true, message: "If this email is registered, you will receive an OTP shortly." });

    } catch (error: any) {
        console.error("Error in adminSendOTP:", error);
        return res.status(500).json({ success: false, message: "An error occurred while processing your request" });
    }
};

/**
 * Admin Step 2: Verify OTP
 */
export const adminVerifyOTP = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP are required" });
        if (!/^\d{6}$/.test(otp)) return res.status(400).json({ success: false, message: "Invalid OTP format" });

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: { id: true, email: true, reset_otp: true, otp_expiry: true }
        });

        if (!user) return res.status(400).json({ success: false, message: "Invalid email or OTP" });
        if (!user.reset_otp) return res.status(400).json({ success: false, message: "No OTP found. Please request a new one." });

        if (!user.otp_expiry || new Date() > user.otp_expiry) {
            await prisma.user.update({
                where: { id: user.id },
                data: { reset_otp: null, otp_expiry: null }
            });
            return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
        }

        if (user.reset_otp !== otp) return res.status(400).json({ success: false, message: "Invalid OTP" });

        console.log(`Admin OTP verified successfully for: ${email}`);
        return res.status(200).json({ success: true, message: "OTP verified successfully" });

    } catch (error: any) {
        console.error("Error in adminVerifyOTP:", error);
        return res.status(500).json({ success: false, message: "An error occurred while verifying OTP" });
    }
};

/**
 * Admin Step 3: Reset Password
 */
export const adminResetPassword = async (req: Request, res: Response) => {
    try {
        const { email, otp, newPassword, confirmPassword } = req.body;

        if (!email || !otp || !newPassword || !confirmPassword) return res.status(400).json({ success: false, message: "All fields are required" });
        if (newPassword !== confirmPassword) return res.status(400).json({ success: false, message: "Passwords do not match" });
        if (newPassword.length < 8) return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
        if (!/^\d{6}$/.test(otp)) return res.status(400).json({ success: false, message: "Invalid OTP format" });

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: { id: true, username: true, email: true, reset_otp: true, otp_expiry: true }
        });

        if (!user) return res.status(400).json({ success: false, message: "Invalid email or OTP" });
        if (!user.reset_otp) return res.status(400).json({ success: false, message: "No OTP found. Please request a new one." });

        if (!user.otp_expiry || new Date() > user.otp_expiry) {
            await prisma.user.update({
                where: { id: user.id },
                data: { reset_otp: null, otp_expiry: null }
            });
            return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
        }

        if (user.reset_otp !== otp) return res.status(400).json({ success: false, message: "Invalid OTP" });

        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword,
                reset_otp: null,
                otp_expiry: null
            }
        });

        await sendPasswordResetConfirmation(user.email!, user.username);
        console.log(`Admin Password reset successfully for: ${email}`);
        return res.status(200).json({ success: true, message: "Password reset successfully. You can now login with your new password." });

    } catch (error: any) {
        console.error("Error in adminResetPassword:", error);
        return res.status(500).json({ success: false, message: "An error occurred while resetting password" });
    }
};
