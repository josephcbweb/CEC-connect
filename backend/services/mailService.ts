
import nodemailer from "nodemailer";

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendAdmissionConfirmation = async (
    email: string,
    name: string,
    admissionNumber: string
) => {
    try {
        // Check if mail config is present before attempting to send
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
            console.warn("Mail configuration missing. Skipping email sending.");
            return false;
        }

        const info = await transporter.sendMail({
            from: process.env.SMTP_USER || '"CEC Admission" <admission@cectl.ac.in>', // sender address
            to: email, // list of receivers
            subject: "Admission Registration Confirmation - CEC Connect", // Subject line
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Admission Registration Received</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Thank you for submitting your admission application to College of Engineering Chengannur.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Admission Number:</strong> ${admissionNumber}</p>
          </div>

          <p>Your application is currently under review. You will be notified via email once your application is approved.</p>
          
          <p>You can also check your application status anytime at our <a href="http://localhost:3001/track-status">Admission Website</a>.</p>
          
          <br>
          <p>Best Regards,</p>
          <p>CEC Connect Team</p>
        </div>
      `,
        });

        console.log("Message sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false; // Don't throw, just return false to allow the main flow to continue
    }
};

/**
 * Send OTP email for password reset
 * @param email - Student's email address
 * @param name - Student's name
 * @param otp - 6-digit OTP
 * @returns Promise<boolean> - true if sent successfully, false otherwise
 */
export const sendPasswordResetOTP = async (
    email: string,
    name: string,
    otp: string
): Promise<boolean> => {
    try {
        // Check if mail config is present before attempting to send
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
            console.warn("Mail configuration missing. Skipping email sending.");
            return false;
        }

        const info = await transporter.sendMail({
            from: process.env.SMTP_USER || '"CEC Connect" <noreply@cectl.ac.in>',
            to: email,
            subject: "Password Reset OTP - CEC Connect",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #031D44; margin-top: 0;">Password Reset Request</h2>
            <p>Dear <strong>${name}</strong>,</p>
            <p>We received a request to reset your password. Use the OTP below to proceed:</p>
            
            <div style="background-color: #f0f7ff; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
              <h1 style="color: #3AA9AB; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
              <p style="color: #666; font-size: 14px; margin-top: 10px;">This OTP will expire in 5 minutes</p>
            </div>

            <p style="color: #d32f2f; font-size: 14px; padding: 15px; background-color: #ffebee; border-radius: 5px;">
              <strong>Security Notice:</strong> If you did not request a password reset, please ignore this email and ensure your account is secure.
            </p>
            
            <p style="margin-top: 25px;">For security reasons, never share this OTP with anyone, including CEC staff.</p>
            
            <br>
            <p style="color: #666; font-size: 12px;">Best Regards,<br>CEC Connect Team</p>
          </div>
          
          <p style="color: #999; font-size: 11px; text-align: center; margin-top: 20px;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      `,
        });

        console.log("Password reset OTP sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending password reset OTP:", error);
        return false;
    }
};

/**
 * Send password reset success confirmation email
 * @param email - Student's email address
 * @param name - Student's name
 * @returns Promise<boolean> - true if sent successfully, false otherwise
 */
export const sendPasswordResetConfirmation = async (
    email: string,
    name: string
): Promise<boolean> => {
    try {
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
            console.warn("Mail configuration missing. Skipping email sending.");
            return false;
        }

        const info = await transporter.sendMail({
            from: process.env.SMTP_USER || '"CEC Connect" <noreply@cectl.ac.in>',
            to: email,
            subject: "Password Reset Successful - CEC Connect",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2e7d32;">Password Reset Successful</h2>
            <p>Dear <strong>${name}</strong>,</p>
            <p>Your password has been successfully reset. You can now log in with your new password.</p>
            
            <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #2e7d32;">✓ Your account is now secure with the new password.</p>
            </div>

            <p style="color: #d32f2f; font-size: 14px; padding: 15px; background-color: #ffebee; border-radius: 5px;">
              <strong>Security Alert:</strong> If you did not perform this action, please contact the administration immediately.
            </p>
            
            <br>
            <p style="color: #666; font-size: 12px;">Best Regards,<br>CEC Connect Team</p>
          </div>
        </div>
      `,
        });

        console.log("Password reset confirmation sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending password reset confirmation:", error);
        return false;
    }
};
