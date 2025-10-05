import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const fetchStats = async (req: Request, res: Response) => {
  try {
    const totalStudents = await prisma.student.count();
    const departmentStats = await prisma.department.findMany({
      select: {
        name: true,
        students: {
          select: {
            id: true, // Just to count
          },
        },
      },
    });

    const departmentCounts = departmentStats.map((dept) => ({
      title: dept.name,
      count: dept.students.length,
    }));

    res.json( [
      { title: 'Total Students', count: totalStudents },
      ...departmentCounts,
    ]);

  } catch (error) {
    console.error("Failed to fetch student stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const fetchAllStudents = async (req: Request, res: Response) => {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        program: true,
        admissionDate: true,
        department: {
          select: {
            name: true,
            departmentCode: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const currentYear = new Date().getFullYear();

    const enriched = students.map((student) => {
      const admissionYear = student.admissionDate
        ? new Date(student.admissionDate).getFullYear()
        : null;

      const year =
        admissionYear && admissionYear <= currentYear
          ? currentYear - admissionYear + 1
          : null;

      return {
        id: student.id,
        name: student.name,
        program: student.program,
        department: student.department?.departmentCode || student.department?.name,
        year,
      };
    });

    // ✅ Extract unique programs
    const uniquePrograms = Array.from(
      new Set(students.map((s) => s.program).filter(Boolean))
    );

    res.json({
      students: enriched,
      programs: uniquePrograms,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
};