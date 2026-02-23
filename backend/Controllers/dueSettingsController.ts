import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// GET /api/settings/due-configs
export const getDueConfigs = async (req: Request, res: Response) => {
  try {
    const { program } = req.query;
    const configs = await prisma.dueConfiguration.findMany({
      where: program ? { program: program as any } : {},
      include: {
        serviceDepartment: {
          include: { assignedUser: { select: { id: true, username: true } } },
        },
      },
      orderBy: { semester: "asc" },
    });
    res.json(configs);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch configs", error: error.message });
  }
};

// POST /api/settings/due-configs
export const createDueConfig = async (req: Request, res: Response) => {
  try {
    const { semester, serviceDepartmentId, name, dueDate, program } = req.body;

    // Check if exists to prevent 500 on unique constraint
    const existing = await prisma.dueConfiguration.findFirst({
      where: {
        semester: Number(semester),
        program: program || "BTECH",
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
        program: program || "BTECH",
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
    const { program } = req.query;
    const depts = await prisma.serviceDepartment.findMany({
      where: program ? { program: program as any } : {},
      include: {
        assignedUser: { select: { id: true, username: true, email: true } },
      },
      orderBy: { name: "asc" },
    });
    res.json(depts);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch departments", error: error.message });
  }
};

// POST /api/settings/service-departments
export const createServiceDepartment = async (req: Request, res: Response) => {
  try {
    const { name, code, program, assignedUserId } = req.body;
    const dept = await prisma.serviceDepartment.create({
      data: {
        name,
        code: code || name.toUpperCase().slice(0, 5),
        program: program || "BTECH",
        assignedUserId: assignedUserId ? Number(assignedUserId) : null,
      },
    });
    res.status(201).json(dept);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to create department", error: error.message });
  }
};

// PUT /api/settings/service-departments/:id
export const updateServiceDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, program, assignedUserId } = req.body;

    const dept = await prisma.serviceDepartment.update({
      where: { id: Number(id) },
      data: {
        name,
        program,
        assignedUserId: assignedUserId ? Number(assignedUserId) : null,
      },
      include: {
        assignedUser: { select: { id: true, username: true, email: true } },
      },
    });

    res.json(dept);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ message: "A fee type with this name already exists for this program." });
      return;
    }
    res.status(500).json({ message: "Failed to update department", error: error.message });
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

// GET /api/settings/users – All users for assignment dropdown
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { status: "active" },
      select: { id: true, username: true, email: true },
      orderBy: { username: "asc" },
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
};
