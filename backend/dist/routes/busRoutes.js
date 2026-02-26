"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const busController_1 = require("../Controllers/busController");
const router = express_1.default.Router();
router.get("/fetchbus", busController_1.fetchBus);
router.post("/addBus", busController_1.addBus); //route for adding a new bus.
router.get("/busDetails/:busId", busController_1.getBusDetails);
router.post("/addStop", busController_1.addBusStops);
router.delete("/deleteStop/:id", busController_1.deleteBusStop);
router.get("/fetchBusStudents", busController_1.fetchBusStudents); //fetch all students who are availing bus.
router.get("/active-semesters", busController_1.getActiveBusSemesters); //semesters with bus-service students
router.get("/preview-bulk-fees", busController_1.previewBulkBusFees); //preview which batches will be billed
router.post("/assign-bulk-fees", busController_1.assignBulkBusFees); //batch-aware fee assignment
router.get("/semester-status", busController_1.getSemesterBillingStatus); //unified semester billing view
router.get('/fee-batches', busController_1.getFeeBatches); //retrieve fee-batches(sem 1,sem 2 etc.)
router.get('/batch-details', busController_1.getBatchDetails); //details of a particular fee batch
router.patch('/update-payment-status/:id', busController_1.updatePaymentStatus); //allows admin to manually update the payment status.
router.patch('/archive-batch', busController_1.archiveFeeBatch); //used to archive a fee details of the batch who are promoted to next semester.
router.get('/requests', busController_1.getBusRequests);
router.patch('/requests/:requestId', busController_1.updateBusRequestStatus); //for approving the bus request
router.patch("/verify-payment/:invoiceId", busController_1.verifyBusPayment);
router.get("/invoices", busController_1.getBusInvoices);
exports.default = router;
