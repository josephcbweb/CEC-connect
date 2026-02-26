import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getLandingStats = async (req: Request, res: Response) => {
  try {
    const studentCount = await prisma.student.count({
      where: {
        status: {
          notIn: ["graduated", "deleted"],
        },
      },
    });

    const facultyCount = await prisma.user.count({
      where: {
        userRoles: {
          some: {
            role: {
              name: {
                in: ["hod", "faculty", "staff"],
              },
            },
          },
        },
      },
    });

    const departmentCount = await prisma.department.count();

    res.json({
      students: studentCount,
      faculty: facultyCount,
      departments: departmentCount,
    });
  } catch (error) {
    console.error("Failed to fetch landing stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
