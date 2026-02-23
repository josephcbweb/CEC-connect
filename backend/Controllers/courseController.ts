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

    if (!staffId) {
      res.status(400).json({ message: "Staff assignment is mandatory" });
      return;
    }

    const existingCourse = await prisma.course.findUnique({
      where: { code },
    });

    if (existingCourse) {
      res.status(400).json({ message: "Course code already exists" });
      return;
    }

    const course = await prisma.course.create({
      data: {
        name,
        code,
        type,
        category: type === "LAB" ? null : category,
        department: {
          connect: { id: parseInt(departmentId) },
        },
        semester: parseInt(semester),
        isActive: true,
        staff: {
          connect: { id: parseInt(staffId) },
        },
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

export const updateCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      type,
      category,
      departmentId,
      semester,
      staffId,
      isActive,
    } = req.body;

    if (!staffId) {
      res.status(400).json({ message: "Staff assignment is mandatory" });
      return;
    }

    // Check if another course with the same code already exists
    const existingCourse = await prisma.course.findFirst({
      where: {
        code,
        id: { not: parseInt(id) },
      },
    });

    if (existingCourse) {
      res.status(400).json({ error: "A course with this code already exists" });
      return;
    }

    const course = await prisma.course.update({
      where: { id: parseInt(id) },
      data: {
        name,
        code,
        type,
        category: type === "LAB" ? null : category,
        department: {
          connect: { id: parseInt(departmentId) },
        },
        semester: parseInt(semester),
        isActive: isActive !== undefined ? isActive : true,
        staff: {
          connect: { id: parseInt(staffId) },
        },
      },
    });

    res.json(course);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to update course", error: error.message });
  }
};

export const deleteCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.course.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Course deleted successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to delete course", error: error.message });
  }
};
