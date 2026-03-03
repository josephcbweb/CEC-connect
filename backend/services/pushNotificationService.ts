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
                    where: { studentId },
                    select: { token: true }
                });
                tokens = studentTokens.map(t => t.token);
            }

        } else if (targetType === 'PROGRAM' as NotificationTargetType && targetValue) {
            // Send to all students of a specific programme (BTECH / MCA etc.)
            const studentTokens = await prisma.deviceToken.findMany({
                where: {
                    student: {
                        department: {
                            program: targetValue as any
                        }
                    }
                },
                select: { token: true }
            });
            tokens = studentTokens.map(t => t.token);

        } else if (targetType === 'CLASS' as NotificationTargetType && targetValue) {
            // CLASS = combination of programme + department + semester
            try {
                const classFilter = JSON.parse(targetValue);
                const whereClause: any = {};

                if (classFilter.program) {
                    whereClause.department = { ...whereClause.department, program: classFilter.program };
                }
                if (classFilter.department_code) {
                    whereClause.department = { ...whereClause.department, department_code: classFilter.department_code };
                }
                if (classFilter.semester) {
                    whereClause.currentSemester = classFilter.semester;
                }

                const studentTokens = await prisma.deviceToken.findMany({
                    where: { student: whereClause },
                    select: { token: true }
                });
                tokens = studentTokens.map(t => t.token);
            } catch (e) {
                console.error('Error parsing CLASS targetValue for push:', e);
            }
        }

        if (tokens.length === 0) {
            console.log(`No tokens found for target ${targetType}:${targetValue}`);
            return;
        }

        // De-duplicate tokens
        tokens = Array.from(new Set(tokens));

        // Chunked multicast – FCM supports up to 500 tokens per call
        const chunkSize = 500;
        for (let i = 0; i < tokens.length; i += chunkSize) {
            const chunk = tokens.slice(i, i + chunkSize);

            // Sanitize data payload: FCM requires all values to be strings
            const dataPayload: Record<string, string> = {
                notificationId: notificationId.toString(),
                type: targetType,
            };
            if (data) {
                Object.entries(data).forEach(([key, value]) => {
                   if (value !== null && value !== undefined) {
                       dataPayload[key] = String(value);
                   }
                });
            }

            const message: any = {
                notification: { title, body },
                data: dataPayload,
                tokens: chunk,
                android: {
                    priority: priority === NotificationPriority.URGENT ? 'high' as const : 'normal' as const,
                },
                apns: {
                    payload: {
                        aps: { sound: 'default' }
                    }
                }
            };

            try {
                // Use sendEachForMulticast (replaces deprecated sendMulticast)
                const response = await (messaging as any).sendEachForMulticast(message);
                console.log(`Push batch: ${response.successCount} sent, ${response.failureCount} failed`);

                // Clean up invalid / expired tokens
                if (response.failureCount > 0 && response.responses) {
                    const failedTokens: string[] = [];
                    response.responses.forEach((resp: any, idx: number) => {
                        if (!resp.success) {
                            console.error(`FCM failure for token ending in ...${chunk[idx].slice(-6)}:`, resp.error);
                            const errCode = resp.error?.code;
                            // Only remove tokens that are permanently invalid
                            if (
                                errCode === 'messaging/invalid-registration-token' ||
                                errCode === 'messaging/registration-token-not-registered'
                            ) {
                                failedTokens.push(chunk[idx]);
                            }
                        }
                    });
                    if (failedTokens.length > 0) {
                        await prisma.deviceToken.deleteMany({
                            where: { token: { in: failedTokens } }
                        });
                        console.log(`Removed ${failedTokens.length} invalid tokens`);
                    }
                }
            } catch (batchErr) {
                console.error('Error sending push batch:', batchErr);
            }
        }
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};
