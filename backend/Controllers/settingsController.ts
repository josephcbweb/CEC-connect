import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const toggleSettings = async (req: Request, res: Response) => {
  try {
    const { name, value } = req.body;
    const setting = await prisma.setting.upsert({
      where: { key: name },
      update: { key: name, enabled: value },
      create: { key: name, enabled: value },
    });
    if (setting) {
      setting.value = value;
    }
    res.status(200).json({ name, value });
  } catch (error) {
    console.error("Error creating fee structure:", error);
    res.status(500).json({ error: "Failed to create fee structure." });
  }
};
