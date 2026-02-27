import { getMessaging } from '../utils/firebase';
import { prisma } from '../lib/prisma';
import { NotificationTargetType, NotificationPriority } from '../generated/prisma/enums';

export const sendPushNotification = async (
    notificationId: number,
    targetType: NotificationTargetType,
    targetValue: string | null,
    title: string,
    body: string,
    data?: any,
    priority: NotificationPriority = NotificationPriority.NORMAL
) => {
    try {
        const messaging = getMessaging();
        if (!messaging) return;

        // Fetch tokens based on target
        let tokens: string[] = [];

        if (targetType === NotificationTargetType.ALL) {
            // Fetch all student tokens
            const studentTokens = await prisma.deviceToken.findMany({
                where: { studentId: { not: null } },
                select: { token: true }
            });
            tokens = studentTokens.map(t => t.token);
        } else if (targetType === NotificationTargetType.DEPARTMENT) {
             const studentTokens = await prisma.deviceToken.findMany({
                where: {
                    student: {
                        department: {
                            department_code: targetValue || ''
                        }
                    }
                },
                select: { token: true }
             });
             tokens = studentTokens.map(t => t.token);
        } else if (targetType === NotificationTargetType.SEMESTER) {
             // Assuming targetValue is like "S3"
             const semester = parseInt(targetValue?.replace('S', '') || '0');
             const studentTokens = await prisma.deviceToken.findMany({
                where: {
                    student: {
                        currentSemester: semester
                    }
                },
                select: { token: true }
             });
             tokens = studentTokens.map(t => t.token);
        } else if (targetType === NotificationTargetType.STUDENT && targetValue) {
             const studentId = parseInt(targetValue);
             if (!isNaN(studentId)) {
                const studentTokens = await prisma.deviceToken.findMany({
                    where: {
                        studentId: studentId
                    },
                    select: { token: true }
                });
                tokens = studentTokens.map(t => t.token);
             }
        }
        
        if (tokens.length === 0) {
            console.log(`No tokens found for target ${targetType}:${targetValue}`);
            return;
        }

        // Limit tokens per batch if needed (FCM limit is usually 500 or 1000)
        // Here we do simple chunking
        const chunkSize = 500;
        for (let i = 0; i < tokens.length; i += chunkSize) {
            const chunk = tokens.slice(i, i + chunkSize);
            const message: any = { // Cast to any to avoid strict type checks on MulticastMessage structure
                notification: {
                    title: title,
                    body: body,
                },
                data: {
                    notificationId: notificationId.toString(),
                    ...data
                },
                tokens: chunk,
                android: {
                    // map to 'normal' or 'high' as string literals
                    priority: priority === NotificationPriority.URGENT ? "high" : "normal",
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                        }
                    }
                }
            };

            // Cast messaging to any because sometimes types are tricky with firebase-admin imports
            const msgAny = messaging as any;
            if (msgAny.sendMulticast) {
                 const response = await msgAny.sendMulticast(message);
                 console.log(`Sent ${response.successCount} messages, failed ${response.failureCount}`);
            
                 if (response.failureCount > 0) {
                     const failedTokens: string[] = [];
                     if (response.responses && Array.isArray(response.responses)) {
                         response.responses.forEach((resp: any, idx: number) => {
                             if (!resp.success) {
                                 failedTokens.push(chunk[idx]);
                             }
                         });
                     }
                     // Remove invalid tokens
                     if (failedTokens.length > 0) {
                          await prisma.deviceToken.deleteMany({
                              where: { token: { in: failedTokens } }
                          });
                          console.log(`Removed ${failedTokens.length} invalid tokens`);
                     }
                 }
            } else {
                 console.warn("Messaging object does not support sendMulticast");
            }
        }

    } catch (error) {
        console.error("Error sending push notification:", error);
    }
};
