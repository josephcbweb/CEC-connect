import express from "express";
import { Router } from "express";
import {fetchBus, addBus, getBusDetails,addBusStops,deleteBusStop,getBusFeeStatus,toggleBusFee } from "../controllers/busController";

const router = express.Router();

router.get("/fetchbus",fetchBus);
router.post("/addBus", addBus);//route for adding a new bus.
router.get("/busDetails/:busId",getBusDetails);
router.post("/addStop",addBusStops);
router.delete("/deleteStop/:id",deleteBusStop);
router.get("/busFeeStatus", getBusFeeStatus);//returns whether the admin has turned on the bus fees or not.
router.put("/toggleBusFee", toggleBusFee);//used to change the assignBusFee status to true or false

export default router;