import type { Certificate, CertificateRequest } from '../types/certificate';

const API_BASE_URL = 'http://localhost:3000/api';

export const certificateService = {
  // Student: Submit certificate request
  submitRequest: async (request: CertificateRequest): Promise<Certificate> => {
    const response = await fetch(`${API_BASE_URL}/student/certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit certificate request');
    }
    
    return response.json();
  },

  // Student: Get their certificate requests
  getStudentCertificates: async (studentId: number): Promise<Certificate[]> => {
    const response = await fetch(`${API_BASE_URL}/student/certificates/${studentId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch certificates');
    }
    
    return response.json();
  },

  // Admin: Get all certificate requests
  getAllCertificates: async (): Promise<Certificate[]> => {
    const response = await fetch(`${API_BASE_URL}/admin/certificates`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch certificates');
    }
    
    return response.json();
  },

  // Admin: Update certificate status
  updateCertificateStatus: async (
    id: number, 
    status: string, 
    rejectionReason?: string,
    approvedById?: number
  ): Promise<Certificate> => {
    const response = await fetch(`${API_BASE_URL}/admin/certificates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, rejectionReason, approvedById }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update certificate status');
    }
    
    return response.json();
  },

  // Admin: Generate certificate
  generateCertificate: async (id: number): Promise<Certificate> => {
    const response = await fetch(`${API_BASE_URL}/admin/certificates/${id}/generate`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate certificate');
    }
    
    return response.json();
  },
};