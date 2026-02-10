import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getAllCourses = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const courses = await prisma.course.findMany({
      include: { department: true },
      orderBy: { code: "asc" },
    });
    res.json(courses);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to fetch courses", error: error.message });
  }
};

export const createCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, code, type, category, departmentId, semester, staffId } =
      req.body;

    const course = await prisma.course.create({
      data: {
        name,
        code,
        type,
        category,
        departmentId: parseInt(departmentId),
        semester: parseInt(semester),
        isActive: true,
        staffId: staffId ? parseInt(staffId) : null,
      },
    });

    res.status(201).json(course);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to create course", error: error.message });
  }
};

export const getStudentCourses = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { semester } = req.query;
    // In a real app, we might filter by student's department too.
    // For now, just return active courses for the semester.

    const whereClause: any = { isActive: true };
    if (semester) {
      whereClause.semester = parseInt(semester as string);
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: { department: true },
    });

    res.json(courses);
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch student courses",
      error: error.message,
    });
  }
};
