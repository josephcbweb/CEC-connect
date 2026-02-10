import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { format } from "path";

export const toggleSettings = async (req: Request, res: Response) => {
  try {
    const { name, value } = req.body;
    const setting = await prisma.setting.upsert({
      where: { key: name },
      update: { enabled: value },
      create: { key: name, enabled: value },
    });

    // If disabling noDueRequest, archive all pending requests
    if (name === "noDueRequestEnabled" && value === false) {
      await prisma.noDueRequest.updateMany({
        where: { status: "pending", isArchived: false },
        data: { isArchived: true },
      });
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
    const count = await prisma.noDueRequest.count({
      where: {
        status: "pending",
        isArchived: false,
      },
    });
    res.json({ count });
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
