import express from "express";
import { Router } from "express";
import {fetchBus, addBus, getBusDetails,addBusStops,deleteBusStop } from "../controllers/busController";

const router = express.Router();

router.get("/fetchbus",fetchBus);
router.post("/addBus", addBus);//route for adding a new bus.
router.get("/busDetails/:busId",getBusDetails);
router.post("/addStop",addBusStops);
router.delete("/deleteStop/:id",deleteBusStop);
export default router;