import express from "express";
import { Router } from "express";
import {
    fetchBus,
    addBus, 
    getBusDetails,
    addBusStops,
    deleteBusStop,
    fetchBusStudents,
    getUniqueSemester,
    assignBusFees,
    getFeeBatches,
    getBatchDetails,
    updatePaymentStatus,
    archiveFeeBatch } from "../controllers/busController";

const router = express.Router();

router.get("/fetchbus",fetchBus);
router.post("/addBus", addBus);//route for adding a new bus.
router.get("/busDetails/:busId",getBusDetails);
router.post("/addStop",addBusStops);
router.delete("/deleteStop/:id",deleteBusStop);
router.get("/fetchBusStudents",fetchBusStudents);//fetch all students who are availing bus.
router.get("/getSemester",getUniqueSemester);//route for fetching unique current semesters from the database so that the admin can only select semesters that are currently available while assigning fees.
router.post('/assign-fees', assignBusFees);//route for assigning bus fees.Populates feeDetails and Invoice table.
router.get('/fee-batches', getFeeBatches);//retrieve fee-batches(sem 1,sem 2 etc.)
router.get('/batch-details', getBatchDetails);//details of a particular fee batch
router.patch('/update-payment-status/:id', updatePaymentStatus);//allows admin to manually update the payment status.
router.patch('/archive-batch', archiveFeeBatch);//used to archive a fee details of the batch who are promoted to next semester.

export default router;