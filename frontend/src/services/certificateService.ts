// certificateService.ts
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

  // Student: Download certificate PDF - SIMPLIFIED VERSION
  downloadCertificate: async (certificateId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/certificates/${certificateId}/download`);
    
    if (!response.ok) {
      throw new Error('Failed to download certificate');
    }

    // Create blob and trigger download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `certificate-${certificateId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Alternative: Get certificate blob for custom handling
  getCertificateBlob: async (certificateId: number): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/certificates/${certificateId}/download`);
    
    if (!response.ok) {
      throw new Error('Failed to download certificate');
    }
    
    return response.blob();
  },

  // Get certificate URL for direct opening
  getCertificateUrl: (certificateId: number): string => {
    return `${API_BASE_URL}/certificates/${certificateId}/download`;
  }
};