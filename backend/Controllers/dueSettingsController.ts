import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// GET /api/settings/due-configs
export const getDueConfigs = async (req: Request, res: Response) => {
  try {
    const configs = await prisma.dueConfiguration.findMany({
      include: { serviceDepartment: true },
      orderBy: { semester: "asc" },
    });
    res.json(configs);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to fetch configs", error: error.message });
  }
};

// POST /api/settings/due-configs
export const createDueConfig = async (req: Request, res: Response) => {
  try {
    const { semester, serviceDepartmentId, name, dueDate } = req.body;

    // Check if exists to prevent 500 on unique constraint
    const existing = await prisma.dueConfiguration.findFirst({
      where: {
        semester: Number(semester),
        serviceDepartmentId: serviceDepartmentId
          ? Number(serviceDepartmentId)
          : null,
        name: name || null,
      },
    });

    if (existing) {
      res.status(400).json({ message: "Configuration already exists" });
      return;
    }

    const config = await prisma.dueConfiguration.create({
      data: {
        semester: Number(semester),
        serviceDepartmentId: serviceDepartmentId
          ? Number(serviceDepartmentId)
          : null,
        name,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
    res.status(201).json(config);
  } catch (error: any) {
    console.error("Error creating due config:", error);
    res
      .status(500)
      .json({ message: "Failed to create config", error: error.message });
  }
};

// DELETE /api/settings/due-configs/:id
export const deleteDueConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.dueConfiguration.delete({ where: { id: Number(id) } });
    res.json({ message: "Config deleted" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to delete config", error: error.message });
  }
};

// GET /api/settings/service-departments
export const getServiceDepartments = async (req: Request, res: Response) => {
  try {
    const depts = await prisma.serviceDepartment.findMany();
    res.json(depts);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to fetch departments", error: error.message });
  }
};

// POST /api/settings/service-departments
export const createServiceDepartment = async (req: Request, res: Response) => {
  try {
    const { name, code } = req.body;
    const dept = await prisma.serviceDepartment.create({
      data: { name, code },
    });
    res.status(201).json(dept);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to create department", error: error.message });
  }
};

// DELETE /api/settings/service-departments/:id
export const deleteServiceDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Check if used in any configs or dues
    // Prisma will throw error if foreign key constraint fails, which is good.
    await prisma.serviceDepartment.delete({ where: { id: Number(id) } });
    res.json({ message: "Department deleted" });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to delete department. It might be in use.",
      error: error.message,
    });
  }
};
