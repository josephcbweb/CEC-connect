"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/certificateRoutes.ts
const express_1 = __importDefault(require("express"));
const certificateController_1 = require("../controllers/certificateController");
const router = express_1.default.Router();
// Add a test route to verify the router is working
router.get('/test', (req, res) => {
    res.json({ message: 'Certificate routes are working' });
});
// Student routes
router.post('/', certificateController_1.certificateController.submitRequest);
router.get('/student/:studentId', certificateController_1.certificateController.getStudentCertificates);
// Role-based routes (Advisor, HOD, Office, Principal)
router.get('/role/:role/:userId', certificateController_1.certificateController.getCertificatesByRole);
// Process certificate (approve/reject/forward)
router.put('/:id/process', certificateController_1.certificateController.processCertificate);
// Get workflow status
router.get('/:id/workflow', certificateController_1.certificateController.getWorkflowStatus);
// Generate and download
router.post('/:id/generate', certificateController_1.certificateController.generateCertificate);
router.get('/:id/download', certificateController_1.certificateController.downloadCertificate);
exports.default = router;
