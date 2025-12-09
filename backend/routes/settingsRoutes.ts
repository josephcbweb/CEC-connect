import express from "express";
import { toggleSettings } from "../controllers/settingsController";
const router = express.Router();

router.put("/settings", toggleSettings);
