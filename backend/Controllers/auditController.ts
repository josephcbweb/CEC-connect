import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "25",
      module,
      action,
      userId,
      search,
      startDate,
      endDate,
      entityType,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (module && module !== "all") {
      where.module = module;
    }

    if (action && action !== "all") {
      where.action = { contains: action as string, mode: "insensitive" };
    }

    if (userId && userId !== "all") {
      where.userId = parseInt(userId as string);
    }

    if (entityType && entityType !== "all") {
      where.entityType = entityType;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.timestamp.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { action: { contains: search as string, mode: "insensitive" } },
        { entityType: { contains: search as string, mode: "insensitive" } },
        { entityId: { contains: search as string, mode: "insensitive" } },
        { ipAddress: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, username: true, email: true },
          },
        },
        orderBy: { timestamp: "desc" },
        skip,
        take: limitNum,
      }),
    ]);

    res.json({
      data: logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("Error fetching audit logs:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch audit logs", error: error.message });
  }
};

export const getAuditLogStats = async (_req: Request, res: Response) => {
  try {
    const [totalLogs, moduleBreakdown, recentActivity] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.groupBy({
        by: ["module"],
        _count: true,
      }),
      prisma.auditLog.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    res.json({
      totalLogs,
      recentActivity,
      moduleBreakdown: moduleBreakdown.map((m) => ({
        module: m.module,
        count: m._count,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching audit stats:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch audit stats", error: error.message });
  }
};
