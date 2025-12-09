import { Prisma, PrismaClient } from "@prisma/client";
import { Value } from "@prisma/client-runtime-utils";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const toggleSettings = async (req: Request, res: Response) => {
  try {
    const { name, value } = req.body;
    const setting = await prisma.setting.findUnique({ where: { key: name } });
    if (setting) {
      setting.value = value;
    }
    res.status(200).json({ name, value });
  } catch (error) {
    console.error("Error creating fee structure:", error);
    res.status(500).json({ error: "Failed to create fee structure." });
  }
};
