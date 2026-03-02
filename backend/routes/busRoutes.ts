import express from "express";
import { Router } from "express";
import {
  fetchBus,
  addBus,
  getBusDetails,
  addBusStops,
  deleteBusStop,
  fetchBusStudents,
  removeStudentFromBus,
  getActiveBusSemesters,
  previewBulkBusFees,
  assignBulkBusFees,
  getSemesterBillingStatus,
  getFeeBatches,
  getBatchDetails,
  updatePaymentStatus,
  archiveFeeBatch,
  getBusRequests,
  updateBusRequestStatus,
  verifyBusPayment,
  getBusInvoices,
  suspendStudentPass,
  reactivateStudentPass,
  getBusFineSettings,
  updateBusFineSettings,
  updateBusDriver
} from "../Controllers/busController";

const router = express.Router();

router.get("/fetchbus", fetchBus);
router.post("/addBus", addBus); //route for adding a new bus.
router.get("/busDetails/:busId", getBusDetails);
router.post("/addStop", addBusStops);
router.delete("/deleteStop/:id", deleteBusStop);
router.get("/fetchBusStudents", fetchBusStudents); //fetch all students who are availing bus.
router.delete("/removeStudent/:studentId", removeStudentFromBus); //remove student from bus service
router.get("/active-semesters", getActiveBusSemesters); //semesters with bus-service students
router.get("/preview-bulk-fees", previewBulkBusFees); //preview which batches will be billed
router.post("/assign-bulk-fees", assignBulkBusFees); //batch-aware fee assignment
router.get("/semester-status", getSemesterBillingStatus); //unified semester billing view
router.get("/fee-batches", getFeeBatches); //retrieve fee-batches(sem 1,sem 2 etc.)
router.get("/batch-details", getBatchDetails); //details of a particular fee batch
router.patch("/update-payment-status/:id", updatePaymentStatus); //allows admin to manually update the payment status.
router.patch("/archive-batch", archiveFeeBatch); //used to archive a fee details of the batch who are promoted to next semester.
router.get("/requests", getBusRequests);
router.patch("/requests/:requestId", updateBusRequestStatus); //for approving the bus request
router.patch("/verify-payment/:invoiceId", verifyBusPayment);
router.get("/invoices", getBusInvoices);
router.post("/suspendStudentPass/:studentId", suspendStudentPass);
router.post("/reactivateStudentPass/:studentId", reactivateStudentPass);
router.get("/fine-settings", getBusFineSettings);
router.put("/fine-settings", updateBusFineSettings);
router.put("/updateDriver/:busId", updateBusDriver);

export default router;
