"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.updateNotification = exports.getStudentNotifications = exports.getNotifications = exports.createNotification = void 0;
const prisma_1 = require("../lib/prisma");
const enums_1 = require("../generated/prisma/enums");
const createNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, targetType, targetValue, priority, expiryDate, status } = req.body;
        // In a real scenario, get admin ID from token. For now, try to find a default admin or use ID 1.
        // Ensure we have at least one user to assign as sender.
        let senderId = 1;
        const adminUser = yield prisma_1.prisma.user.findFirst();
        if (adminUser)
            senderId = adminUser.id;
        const notification = yield prisma_1.prisma.notification.create({
            data: {
                title,
                description,
                targetType: targetType,
                targetValue,
                priority: priority,
                status: status || enums_1.NotificationStatus.draft,
                expiryDate: expiryDate ? new Date(new Date(expiryDate).setUTCHours(23, 59, 59, 999)) : null,
                senderId: senderId,
            },
        });
        res.status(201).json(notification);
    }
    catch (error) {
        console.error("Error creating notification:", error);
        res.status(500).json({ error: "Failed to create notification" });
    }
});
exports.createNotification = createNotification;
const getNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notifications = yield prisma_1.prisma.notification.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                sender: {
                    select: { username: true, email: true },
                },
            },
        });
        res.json(notifications);
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});
exports.getNotifications = getNotifications;
const getStudentNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Student ID comes from token payload (set in middleware)
        const studentId = typeof req.user === 'object' && req.user ? req.user.userId : null;
        if (!studentId) {
            return res.status(401).json({ error: "Unauthorized: No studentId in token" });
        }
        // Fetch complete student details (Semester, Department)
        const student = yield prisma_1.prisma.student.findUnique({
            where: { id: parseInt(studentId) },
            include: { department: true }
        });
        if (!student) {
            return res.status(404).json({ error: `Student not found for ID ${studentId}` });
        }
        const currentSemester = `S${student.currentSemester}`;
        const deptCode = (_a = student.department) === null || _a === void 0 ? void 0 : _a.department_code;
        // Fetch relevant notifications
        const notifications = yield prisma_1.prisma.notification.findMany({
            where: {
                status: enums_1.NotificationStatus.published,
                OR: [
                    { targetType: enums_1.NotificationTargetType.ALL },
                    {
                        targetType: enums_1.NotificationTargetType.SEMESTER,
                        targetValue: currentSemester
                    },
                    {
                        targetType: enums_1.NotificationTargetType.DEPARTMENT,
                        targetValue: deptCode
                    }
                ],
                AND: [
                    {
                        OR: [
                            { expiryDate: null },
                            { expiryDate: { gte: new Date() } }
                        ]
                    }
                ]
            },
            orderBy: { createdAt: "desc" }
        });
        // Custom sort: URGENT > IMPORTANT > NORMAL, then by createdAt desc
        const priorityOrder = { "URGENT": 0, "IMPORTANT": 1, "NORMAL": 2 };
        const sortedNotifications = notifications.sort((a, b) => {
            var _a, _b;
            const pA = (_a = priorityOrder[a.priority]) !== null && _a !== void 0 ? _a : 2;
            const pB = (_b = priorityOrder[b.priority]) !== null && _b !== void 0 ? _b : 2;
            if (pA !== pB)
                return pA - pB;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        res.json(sortedNotifications);
    }
    catch (error) {
        console.error("Error fetching student notifications:", error);
        res.status(500).json({ error: "Failed to fetch notifications", details: error.toString(), stack: error.stack });
    }
});
exports.getStudentNotifications = getStudentNotifications;
const updateNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { title, description, targetType, targetValue, priority, expiryDate, status } = req.body;
    try {
        const notification = yield prisma_1.prisma.notification.update({
            where: { id: Number(id) },
            data: {
                title,
                description,
                targetType: targetType,
                targetValue,
                priority: priority,
                status: status,
                expiryDate: expiryDate ? new Date(new Date(expiryDate).setUTCHours(23, 59, 59, 999)) : null,
            },
        });
        res.json(notification);
    }
    catch (error) {
        console.error("Error updating notification:", error);
        res.status(500).json({ error: "Failed to update notification" });
    }
});
exports.updateNotification = updateNotification;
const deleteNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield prisma_1.prisma.notification.delete({
            where: { id: Number(id) },
        });
        res.json({ message: "Notification deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ error: "Failed to delete notification" });
    }
});
exports.deleteNotification = deleteNotification;
