import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../utils/types";
import {
  NotificationTargetType,
  NotificationPriority,
  NotificationStatus,
} from "../generated/prisma/enums";
import fs from "fs";
import path from "path";

import { sendPushNotification } from "../services/pushNotificationService";

export const createNotification = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      targetType,
      targetValue,
      priority,
      expiryDate,
      status,
    } = req.body;

    // In a real scenario, get admin ID from token. For now, try to find a default admin or use ID 1.
    // Ensure we have at least one user to assign as sender.
    let senderId = 1;
    const adminUser = await prisma.user.findFirst();
    if (adminUser) senderId = adminUser.id;

    const notification = await prisma.notification.create({
      data: {
        title,
        description,
        targetType: targetType as NotificationTargetType,
        targetValue,
        priority: priority as NotificationPriority,
        status: (status as NotificationStatus) || NotificationStatus.draft,
        expiryDate: expiryDate
          ? new Date(new Date(expiryDate).setUTCHours(23, 59, 59, 999))
          : null,
        senderId: senderId,
      },
    });

    // Send Push Notification if published
    if (notification.status === NotificationStatus.published) {
      // Run asynchronously to not block response
      // In production, use a job queue
      sendPushNotification(
        notification.id,
        notification.targetType,
        notification.targetValue,
        notification.title,
        notification.description || "",
        { notificationId: notification.id },
        notification.priority,
      ).catch((err) => console.error("Async push error", err));
    }

    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: { username: true, email: true },
        },
      },
    });
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

export const getStudentNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    // Student ID comes from token payload (set in middleware)
    const studentId =
      typeof req.user === "object" && req.user
        ? (req.user as any).userId
        : null;

    if (!studentId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No studentId in token" });
    }

    // Fetch complete student details (Semester, Department)
    const student = await prisma.student.findUnique({
      where: { id: parseInt(studentId) },
      include: { department: true },
    });

    if (!student) {
      return res
        .status(404)
        .json({ error: `Student not found for ID ${studentId}` });
    }

    const currentSemester = `S${student.currentSemester}`;
    const deptCode = student.department?.department_code;
    const program = student.department?.program;

    // Fetch all published notifications first, then filter
    const allNotifications = await prisma.notification.findMany({
      where: {
        status: NotificationStatus.published,
        AND: [
          {
            OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
          },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter notifications based on target type
    const notifications = allNotifications.filter((notification) => {
      // ALL - matches everyone
      if (notification.targetType === NotificationTargetType.ALL) {
        return true;
      }

      // SEMESTER - matches current semester
      if (notification.targetType === NotificationTargetType.SEMESTER) {
        return notification.targetValue === currentSemester;
      }

      // DEPARTMENT - matches department code
      if (notification.targetType === NotificationTargetType.DEPARTMENT) {
        return notification.targetValue === deptCode;
      }

      // STUDENT - matches specific student
      if (notification.targetType === NotificationTargetType.STUDENT) {
        return notification.targetValue === studentId.toString();
      }

      // PROGRAM - matches program
      if (notification.targetType === "PROGRAM") {
        return notification.targetValue === program;
      }

      // CLASS - matches combination of program, department, and semester
      if (notification.targetType === "CLASS" && notification.targetValue) {
        try {
          const classFilter = JSON.parse(notification.targetValue);
          let matches = true;

          if (classFilter.program && classFilter.program !== program) {
            matches = false;
          }

          if (
            classFilter.department_code &&
            classFilter.department_code !== deptCode
          ) {
            matches = false;
          }

          if (
            classFilter.semester &&
            classFilter.semester !== student.currentSemester
          ) {
            matches = false;
          }

          return matches;
        } catch (e) {
          console.error("Error parsing CLASS targetValue:", e);
          return false;
        }
      }

      return false;
    });

    // Custom sort: URGENT > IMPORTANT > NORMAL, then by createdAt desc
    const priorityOrder = { URGENT: 0, IMPORTANT: 1, NORMAL: 2 };

    const sortedNotifications = notifications.sort((a, b) => {
      const pA = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
      const pB = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;

      if (pA !== pB) return pA - pB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json(sortedNotifications);
  } catch (error: any) {
    console.error("Error fetching student notifications:", error);
    res.status(500).json({
      error: "Failed to fetch notifications",
      details: error.toString(),
      stack: error.stack,
    });
  }
};

export const updateNotification = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    title,
    description,
    targetType,
    targetValue,
    priority,
    expiryDate,
    status,
  } = req.body;
  try {
    const notification = await prisma.notification.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        targetType: targetType as NotificationTargetType,
        targetValue,
        priority: priority as NotificationPriority,
        status: status as NotificationStatus,
        expiryDate: expiryDate
          ? new Date(new Date(expiryDate).setUTCHours(23, 59, 59, 999))
          : null,
      },
    });
    res.json(notification);
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ error: "Failed to update notification" });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.notification.delete({
      where: { id: Number(id) },
    });
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};

export const registerToken = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { fcmToken, deviceType } = req.body;
    // Assuming userId exists on req.user. If not, this cast might need adjustment based on auth middleware.
    // In student app, standard JWT usually has userId.
    const userId =
      typeof req.user === "object" && req.user
        ? (req.user as any).userId
        : null;

    if (!userId || !fcmToken) {
      return res.status(400).json({ error: "Missing token or user ID" });
    }

    // Check if userId belongs to a student first (as this is student app)
    const student = await prisma.student.findUnique({
      where: { id: parseInt(userId) },
    });

    if (student) {
      await prisma.deviceToken.upsert({
        where: { token: fcmToken },
        update: {
          studentId: student.id,
          deviceType: deviceType || "android",
          userId: null, // Clear userId if it was previously associated with staff
        },
        create: {
          token: fcmToken,
          studentId: student.id,
          deviceType: deviceType || "android",
        },
      });
      res.status(200).json({ message: "Token registered for student" });
      return;
    }

    // If not student, try User (staff/admin)
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (user) {
      await prisma.deviceToken.upsert({
        where: { token: fcmToken },
        update: {
          userId: user.id,
          deviceType: deviceType || "android",
          studentId: null,
        },
        create: {
          token: fcmToken,
          userId: user.id,
          deviceType: deviceType || "android",
        },
      });
      res.status(200).json({ message: "Token registered for user" });
      return;
    }

    res.status(404).json({ error: "User or Student not found" });
  } catch (error) {
    console.error("Error registering token:", error);
    res.status(500).json({ error: "Failed to register token" });
  }
};
