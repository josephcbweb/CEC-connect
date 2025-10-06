import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const certificateController = {
  // Student: Submit certificate request
  submitRequest: async (req: Request, res: Response) => {
    try {
      const { studentId, type, reason } = req.body;
      
      const certificate = await prisma.certificate.create({
        data: {
          studentId: parseInt(studentId),
          type,
          reason,
          status: 'PENDING'
        }
      });
      
      res.status(201).json(certificate);
    } catch (error) {
      res.status(500).json({ error: 'Failed to submit certificate request' });
    }
  },

  // Student: Get their certificate requests
  getStudentCertificates: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      
      const certificates = await prisma.certificate.findMany({
        where: { studentId: parseInt(studentId) },
        include: {
          student: {
            select: { name: true, admission_number: true }
          }
        },
        orderBy: { requestedAt: 'desc' }
      });
      
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch certificates' });
    }
  },

  // Admin: Get all certificate requests
  getAllCertificates: async (req: Request, res: Response) => {
    try {
      const certificates = await prisma.certificate.findMany({
        include: {
          student: {
            select: { 
              name: true, 
              admission_number: true,
              department: {
                select: { name: true }
              }
            }
          },
          approvedBy: {
            select: { username: true }
          }
        },
        orderBy: { requestedAt: 'desc' }
      });
      
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch certificates' });
    }
  },

  // Admin: Approve/Reject certificate request
  updateCertificateStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, rejectionReason, approvedById } = req.body;
      
      const updateData: any = { status };
      
      if (status === 'APPROVED') {
        updateData.approvedAt = new Date();
        updateData.approvedById = parseInt(approvedById);
      } else if (status === 'REJECTED') {
        updateData.rejectedAt = new Date();
        updateData.rejectionReason = rejectionReason;
        updateData.approvedById = parseInt(approvedById);
      }
      
      const certificate = await prisma.certificate.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          student: {
            select: { name: true, admission_number: true }
          }
        }
      });
      
      res.json(certificate);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update certificate status' });
    }
  },

  // Generate certificate (template)
  generateCertificate: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const certificate = await prisma.certificate.update({
        where: { id: parseInt(id) },
        data: { 
          status: 'GENERATED',
          certificateUrl: `/certificates/generated/${id}.pdf` // Mock URL
        },
        include: {
          student: {
            select: { 
              name: true, 
              admission_number: true,
              program: true,
              department: {
                select: { name: true }
              }
            }
          }
        }
      });
      
      // Here you would integrate with a PDF generation library
      // For now, return the certificate data
      res.json(certificate);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate certificate' });
    }
  }
};