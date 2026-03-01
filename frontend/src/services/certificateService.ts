// src/services/certificateService.ts
import axios, { AxiosError } from "axios";
import type { Certificate, CertificateRequest } from "../types/certificate";

const API_BASE = "http://localhost:3000";

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem("authToken") || localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const certificateService = {
  // Student: Submit request
  submitRequest: async (data: CertificateRequest): Promise<Certificate & { warning?: string }> => {
    try {
      console.log("Submitting certificate request:", data);
      
      const response = await axios.post(
        `${API_BASE}/api/certificates`,
        data,
        { headers: getAuthHeader() }
      );
      
      console.log("Submit response:", response.data);
      
      // Return the certificate data along with any warnings
      return {
        ...(response.data.certificate || response.data),
        warning: response.data.warning
      };
    } catch (error: unknown) {
      console.error("Error submitting request:", error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string; details?: string; code?: string }>;
        
        const serverError = axiosError.response?.data?.error;
        const errorCode = axiosError.response?.data?.code;
        
        if (serverError) {
          // Create a more descriptive error message
          const errorMessage = errorCode === 'NEXT_APPROVER_MISSING' 
            ? serverError
            : serverError;
          throw new Error(errorMessage);
        }
        
        if (axiosError.message === 'Network Error') {
          throw new Error("Network error. Please check your connection.");
        }
        
        throw new Error(axiosError.message || "Failed to submit request");
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error("An unexpected error occurred");
    }
  },

  // Student: Get their certificates
  getStudentCertificates: async (studentId: number): Promise<Certificate[]> => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/certificates/student/${studentId}`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Error fetching certificates:", error);
      
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || "Failed to fetch certificates");
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error("An unexpected error occurred");
    }
  },

  // Staff: Get certificates by role
  getCertificatesByRole: async (role: string, userId: number, params?: any) => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/certificates/role/${role}/${userId}`,
        { 
          params,
          headers: getAuthHeader() 
        }
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Error fetching certificates by role:", error);
      
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || "Failed to fetch certificates");
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error("An unexpected error occurred");
    }
  },

  // Process certificate (approve/reject/forward)
  processCertificate: async (id: number, action: string, remarks: string, userId: number, role: string) => {
    try {
      const response = await axios.put(
        `${API_BASE}/api/certificates/${id}/process`,
        { action, remarks, userId, role },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Error processing certificate:", error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string; code?: string }>;
        
        // Check if it's the special "NEXT_APPROVER_MISSING" error
        if (axiosError.response?.data?.code === 'NEXT_APPROVER_MISSING') {
          throw new Error(axiosError.response.data.error);
        }
        
        throw new Error(axiosError.response?.data?.error || "Failed to process certificate");
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error("An unexpected error occurred");
    }
  },

  // Get workflow status
  getWorkflowStatus: async (id: number): Promise<Certificate> => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/certificates/${id}/workflow`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Error fetching workflow status:", error);
      
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || "Failed to fetch workflow status");
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error("An unexpected error occurred");
    }
  },

  // Generate certificate (Office only)
  generateCertificate: async (id: number): Promise<Certificate> => {
    try {
      const response = await axios.post(
        `${API_BASE}/api/certificates/${id}/generate`,
        {},
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Error generating certificate:", error);
      
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || "Failed to generate certificate");
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error("An unexpected error occurred");
    }
  },

  // Download certificate
  downloadCertificate: (id: number): string => {
    return `${API_BASE}/api/certificates/${id}/download`;
  },
};