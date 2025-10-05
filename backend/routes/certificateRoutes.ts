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

export default router;