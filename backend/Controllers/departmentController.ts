import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getDepartment = async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch departments" });
  }
};

export const addDepartment = async (req: Request, res: Response) => {
  try {
    const { name, code } = req.body;
    const department = await prisma.department.create({
      data: {
        name,
        department_code: code, // ✅ correct Prisma field
      }
    });
    res.status(201).json(department);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
}
};

export const deleteDepartment = async (req:Request,res:Response)=>{
    try {
    console.log(req.params);
    const { id } = req.params;

    await prisma.department.delete({
      where: {
        id: Number(id),
      },
    });

    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    res.status(400).json({
      message: "Failed to delete department. It may not exist.",
    });
  }
}
