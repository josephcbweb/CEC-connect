import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../utils/types";
import { NotificationTargetType, NotificationPriority, NotificationStatus } from "../generated/prisma/enums";
import fs from 'fs';
import path from 'path';

export const createNotification = async (req: Request, res: Response) => {
  try {
    const { title, description, targetType, targetValue, priority, expiryDate, status } = req.body;
    
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
        status: status as NotificationStatus || NotificationStatus.draft,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        senderId: senderId,
      },
    });

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

export const getStudentNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Student ID comes from token payload (set in middleware)
    const studentId = typeof req.user === 'object' && req.user ? (req.user as any).userId : null;
    
    if (!studentId) {
      return res.status(401).json({ error: "Unauthorized: No studentId in token" });
    }

    // Fetch complete student details (Semester, Department)
    const student = await prisma.student.findUnique({
      where: { id: parseInt(studentId) },
      include: { department: true }
    });

    if (!student) {
      return res.status(404).json({ error: `Student not found for ID ${studentId}` });
    }

    const currentSemester = `S${student.currentSemester}`;
    const deptCode = student.department?.department_code;

    // Fetch relevant notifications
    const notifications = await prisma.notification.findMany({
      where: {
        status: NotificationStatus.published,
        OR: [
          { targetType: NotificationTargetType.ALL },
          { 
            targetType: NotificationTargetType.SEMESTER,
            targetValue: currentSemester
          },
          {
            targetType: NotificationTargetType.DEPARTMENT,
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

    res.json(notifications);

  } catch (error: any) {
    console.error("Error fetching student notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications", details: error.toString(), stack: error.stack });
  }
};

export const updateNotification = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, targetType, targetValue, priority, expiryDate, status } = req.body;
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
        expiryDate: expiryDate ? new Date(expiryDate) : null,
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
