// certificateRoutes.ts
import express from 'express';
import { certificateController } from '../controllers/certificateController';

const router = express.Router();

// Student routes
router.post('/student/certificates', certificateController.submitRequest);
router.get('/student/certificates/:studentId', certificateController.getStudentCertificates);

// Admin routes
router.get('/admin/certificates', certificateController.getAllCertificates);
router.put('/admin/certificates/:id', certificateController.updateCertificateStatus);
router.post('/admin/certificates/:id/generate', certificateController.generateCertificate);

// Download route - FIXED: use :id instead of :certificateId
router.get('/certificates/:id/download', certificateController.downloadCertificate);

export default router;