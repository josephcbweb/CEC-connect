import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getDepartment = async (req: Request, res: Response) => {
  try {
    const { program } = req.query;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {};
    if (program && program !== "all") {
      whereClause.program = program;
    }

    const departments = await prisma.department.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: {
        hodDetails: {
          include: {
            user: {
              select: {
                username: true,
                email: true,
              },
            },
          },
        },
      },
    });
    res.json(departments);
  } catch (error) {
    console.error("GET DEPT ERROR:", error);
    res.status(500).json({ message: "Failed to fetch departments" });
  }
};

export const addDepartment = async (req: Request, res: Response) => {
  try {
    const { name, code, hodId, program } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: "Name and Code are required" });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create Department
      const department = await tx.department.create({
        data: {
          name,
          department_code: code,
          hodId: hodId ? Number(hodId) : null,
          program: program || "BTECH",
        },
      });

      // If HOD is assigned, create HodDetails
      if (hodId) {
        await tx.hodDetails.create({
          data: {
            userId: Number(hodId),
            departmentId: department.id,
          },
        });
      }

      return department;
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: "A department with this name or code already exists in the selected program." });
    }
    res.status(400).json({ message: "Failed to create department", error });
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      // Delete HodDetails first (if exists)
      await tx.hodDetails.deleteMany({
        where: { departmentId: Number(id) },
      });

      // Delete Department
      await tx.department.delete({
        where: { id: Number(id) },
      });
    });

    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "Failed to delete department. It may not exist.",
    });
  }
};

export const updateDepartmentHod = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { hodId } = req.body; // New HOD User ID

    if (!hodId) {
      return res.status(400).json({ message: "HOD ID is required" });
    }

    await prisma.$transaction(async (tx) => {
      const deptId = Number(id);
      const newHodId = Number(hodId);

      // 1. Remove existing HOD details for this department
      await tx.hodDetails.deleteMany({
        where: { departmentId: deptId },
      });

      // 2. Update Department record
      await tx.department.update({
        where: { id: deptId },
        data: { hodId: newHodId },
      });

      // 3. Create new HodDetails
      await tx.hodDetails.create({
        data: {
          userId: newHodId,
          departmentId: deptId,
        },
      });
    });

    res.json({ message: "HOD updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Failed to update HOD", error });
  }
};

export const getEligibleFaculty = async (req: Request, res: Response) => {
  try {
    // 1. Find role ID for 'Faculty'
    const facultyRole = await prisma.role.findUnique({
      where: { name: "faculty" },
    });

    if (!facultyRole) {
      return res.status(404).json({ message: "Faculty role not found" });
    }

    // 2. Find eligible users:
    //    - Have 'Faculty' role
    //    - NOT present in HodDetails
    const eligibleUsers = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            roleId: facultyRole.id,
          },
        },
        hodDetails: {
          is: null, // Ensure they are not currently an HOD
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    res.json(eligibleUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch eligible faculty" });
  }
};
