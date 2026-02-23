// backend/src/routes/certificateRoutes.ts
import express from 'express';
import { certificateController } from '../controllers/certificateController';

const router = express.Router();

// Add a test route to verify the router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Certificate routes are working' });
});

// Student routes
router.post('/', certificateController.submitRequest);
router.get('/student/:studentId', certificateController.getStudentCertificates);

// Role-based routes (Advisor, HOD, Office, Principal)
router.get('/role/:role/:userId', certificateController.getCertificatesByRole);

// Process certificate (approve/reject/forward)
router.put('/:id/process', certificateController.processCertificate);

// Get workflow status
router.get('/:id/workflow', certificateController.getWorkflowStatus);

// Generate and download
router.post('/:id/generate', certificateController.generateCertificate);
router.get('/:id/download', certificateController.downloadCertificate);

export default router;