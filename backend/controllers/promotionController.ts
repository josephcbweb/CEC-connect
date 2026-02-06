import { Request, Response } from "express";
import { PromotionService } from "../services/promotionService";
import type { AuthenticatedRequest } from "../utils/types";
import { verifyToken } from "../utils/jwt";

export const getSemesterInfo = async (req: Request, res: Response) => {
  try {
    const info = PromotionService.getSemesterInfo();
    res.json(info);
  } catch (error: any) {
    console.error("Error getting semester info:", error);
    res.status(500).json({ error: error.message || "Failed to get semester information" });
  }
};

export const getPromotionPreview = async (req: Request, res: Response) => {
  try {
    const preview = await PromotionService.getPromotionPreview();
    res.json(preview);
  } catch (error: any) {
    console.error("Error getting promotion preview:", error);
    res.status(500).json({ error: error.message || "Failed to get promotion preview" });
  }
};

export const promoteStudents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = req.body;
    
    // Decode token to get user ID
    const authHeader = req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    
    const decoded = verifyToken(token) as any;
    const adminId = decoded.userId;

    if (!adminId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await PromotionService.promoteStudents(config, adminId);
    res.json(result);
  } catch (error: any) {
    console.error("Error promoting students:", error);
    res.status(500).json({ error: error.message || "Failed to promote students" });
  }
};

export const getLastPromotion = async (req: Request, res: Response) => {
  try {
    const lastPromotion = await PromotionService.getLastPromotion();
    res.json(lastPromotion);
  } catch (error: any) {
    console.error("Error getting last promotion:", error);
    res.status(500).json({ error: error.message || "Failed to get last promotion" });
  }
};

export const undoLastPromotion = async (req: Request, res: Response) => {
  try {
    const result = await PromotionService.undoLastPromotion();
    res.json(result);
  } catch (error: any) {
    console.error("Error undoing promotion:", error);
    res.status(500).json({ error: error.message || "Failed to undo promotion" });
  }
};
