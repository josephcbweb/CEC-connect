"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const busController_1 = require("../controllers/busController");
const router = express_1.default.Router();
router.get("/fetchbus", busController_1.fetchBus);
router.post("/addBus", busController_1.addBus); //route for adding a new bus.
router.get("/busDetails/:busId", busController_1.getBusDetails);
router.post("/addStop", busController_1.addBusStops);
router.delete("/deleteStop/:id", busController_1.deleteBusStop);
router.get("/fetchBusStudents", busController_1.fetchBusStudents); //fetch all students who are availing bus.
router.get("/getSemester", busController_1.getUniqueSemester); //route for fetching unique current semesters from the database so that the admin can only select semesters that are currently available while assigning fees.
router.post('/assign-fees', busController_1.assignBusFees); //route for assigning bus fees.Populates feeDetails and Invoice table.
router.get('/fee-batches', busController_1.getFeeBatches); //retrieve fee-batches(sem 1,sem 2 etc.)
router.get('/batch-details', busController_1.getBatchDetails); //details of a particular fee batch
router.patch('/update-payment-status/:id', busController_1.updatePaymentStatus); //allows admin to manually update the payment status.
router.patch('/archive-batch', busController_1.archiveFeeBatch); //used to archive a fee details of the batch who are promoted to next semester.
router.get('/requests', busController_1.getBusRequests);
router.patch('/requests/:requestId', busController_1.updateBusRequestStatus);
exports.default = router;
