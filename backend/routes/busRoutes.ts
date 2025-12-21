import express from "express";
import { Router } from "express";
import {fetchBus, addBus } from "../controllers/busController";

const router = express.Router();

router.get("/fetchbus",fetchBus);
router.post("/addBus", addBus);//route for adding a new bus.

export default router;