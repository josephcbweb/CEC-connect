
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
