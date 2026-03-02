import { getMessaging } from '../utils/firebase';
import { prisma } from '../lib/prisma';

async function testPush() {
    console.log("Starting Push Notification Test...");

    // 1. Check Firebase Init
    const messaging = getMessaging();
    if (!messaging) {
        console.error("❌ Firebase Admin NOT initialized. check serviceAccountKey.json");
        return;
    }
    console.log("✅ Firebase Admin initialized.");

    // 2. Fetch a token
    const tokenRecord = await prisma.deviceToken.findFirst();
    if (!tokenRecord) {
        console.error("❌ No device tokens found in database. Run the app and login first.");
        return;
    }
    console.log(`✅ Found token for Student ID: ${tokenRecord.studentId}`);

    // 3. Send Message
    const message = {
        token: tokenRecord.token,
        notification: {
            title: "Test Notification",
            body: "This is a test message from the backend script.",
        },
        android: {
            priority: "high" as const, // Fix type literal
        }
    };

    try {
        console.log("Attempting to send...");
        const response = await messaging.send(message);
        console.log("✅ Successfully sent message:", response);
    } catch (error) {
        console.error("❌ Error sending message:", error);
    }
}

testPush()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
