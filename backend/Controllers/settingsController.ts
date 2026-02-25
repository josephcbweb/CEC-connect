import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { format } from "path";

export const toggleSettings = async (req: Request, res: Response) => {
  try {
    const { name, value, action } = req.body;
    const setting = await prisma.setting.upsert({
      where: { key: name },
      update: { enabled: value },
      create: { key: name, enabled: value },
    });

    // If activating noDueRequest, send notification to all students
    if (name === "noDueRequestEnabled" && value === true) {
      const adminUser = await prisma.user.findFirst();
      await prisma.notification.create({
        data: {
          title: "Semester Registration Open",
          description: "No Due requests for the upcoming semester registration are now being accepted. Please visit the Semester Registration page to view your status.",
          targetType: "ALL",
          status: "published",
          priority: "NORMAL",
          senderId: adminUser?.id || 1
        }
      });

      // Handle Reactivation of archived requests if selected
      if (action === "REACTIVATE") {
        const archivedRequests = await prisma.noDueRequest.findMany({
          where: {
            isArchived: true,
            status: "pending"
          },
          include: {
            student: true
          }
        });

        const relevantReqIds = archivedRequests
          .filter(req => req.student && req.targetSemester === req.student.currentSemester)
          .map(req => req.id);

        if (relevantReqIds.length > 0) {
          await prisma.noDueRequest.updateMany({
            where: {
              id: { in: relevantReqIds }
            },
            data: {
              isArchived: false
            }
          });
        }
      }
    }

    // If disabling noDueRequest, handle pending requests based on `action`
    if (name === "noDueRequestEnabled" && value === false) {
      const adminUser = await prisma.user.findFirst();
      await prisma.notification.create({
        data: {
          title: "No Due Status Hidden",
          description: "The No Due clearance period has concluded. Your No Due status is currently hidden.",
          targetType: "ALL",
          status: "published",
          priority: "NORMAL",
          senderId: adminUser?.id || 1,
        },
      });

      if (action === "CLEAR") {
        const pendingReqs = await prisma.noDueRequest.findMany({
          where: { status: "pending", isArchived: false },
          select: { id: true },
        });
        const reqIds = pendingReqs.map((r) => r.id);

        if (reqIds.length > 0) {
          await prisma.noDueRequest.updateMany({
            where: { id: { in: reqIds } },
            data: { status: "approved" },
          });
          await prisma.noDue.updateMany({
            where: { requestId: { in: reqIds }, status: "pending" },
            data: { status: "cleared" },
          });
        }
      } else {
        // Default KEEP behavior
        await prisma.noDueRequest.updateMany({
          where: { status: "pending", isArchived: false },
          data: { isArchived: true },
        });
      }
    }

    res.status(200).json(setting);
  } catch (error) {
    console.error("Error toggling setting:", error);
    res.status(500).json({ error: "Failed to toggle setting." });
  }
};

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.setting.findMany();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch settings" });
  }
};

export const getActiveRequestCount = async (req: Request, res: Response) => {
  try {
    const activeCount = await prisma.noDue.count({
      where: {
        status: "pending",
        request: {
          isArchived: false,
        },
      },
    });

    // Count of archived due entries where targetSemester matches student.currentSemester
    const archivedDues = await prisma.noDue.findMany({
      where: {
        status: "pending",
        request: {
          isArchived: true,
          status: "pending"
        }
      },
      include: {
        request: {
          include: {
            student: true
          }
        }
      }
    });

    const relevantArchivedCount = archivedDues.filter(due =>
      due.request?.student && due.request.targetSemester === due.request.student.currentSemester
    ).length;

    res.json({
      count: activeCount,
      relevantArchivedCount
    });
  } catch (error) {
    console.error("Error fetching active request count:", error);
    res.status(500).json({ message: "Failed to fetch active request count" });
  }
};

export async function getSemesterStats(req: Request, res: Response) {
  try {
    const semesterStats = await prisma.student.groupBy({
      by: ["currentSemester"],
      _count: {
        currentSemester: true,
      },
      orderBy: {
        currentSemester: "asc",
      },
    });

    // Format the result for frontend
    const formatted = semesterStats.map((s) => ({
      semester: s.currentSemester,
      studentCount: s._count.currentSemester,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Error fetching semester stats:", error);
    res.status(500).json({ message: "Failed to fetch semester stats" });
    throw new Error("Failed to fetch semester statistics");
  }
}

export async function promoteStudents(req: Request, res: Response) {
  try {
    const { semesters } = req.body as { semesters: number[] };

    if (!Array.isArray(semesters) || semesters.length === 0) {
      return res.status(400).json({ message: "No semesters provided" });
    }

    // Update all students in selected semesters
    const updated = await prisma.student.updateMany({
      where: {
        currentSemester: {
          in: semesters,
        },
      },
      data: {
        currentSemester: {
          increment: 1,
        },
      },
    });

    res.json({
      message: "Students promoted successfully",
      updatedCount: updated.count,
    });
  } catch (error) {
    console.error("Error promoting students:", error);
    res.status(500).json({ message: "Failed to promote students" });
  }
}
