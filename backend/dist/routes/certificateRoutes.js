"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// certificateRoutes.ts
const express_1 = __importDefault(require("express"));
const certificateController_1 = require("../controllers/certificateController");
const router = express_1.default.Router();
// Student routes
router.post('/student/certificates', certificateController_1.certificateController.submitRequest);
router.get('/student/certificates/:studentId', certificateController_1.certificateController.getStudentCertificates);
// Admin routes
router.get('/admin/certificates', certificateController_1.certificateController.getAllCertificates);
router.put('/admin/certificates/:id', certificateController_1.certificateController.updateCertificateStatus);
router.post('/admin/certificates/:id/generate', certificateController_1.certificateController.generateCertificate);
// Download route - FIXED: use :id instead of :certificateId
router.get('/certificates/:id/download', certificateController_1.certificateController.downloadCertificate);
exports.default = router;
