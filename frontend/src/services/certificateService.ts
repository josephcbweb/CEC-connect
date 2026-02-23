// src/services/certificateService.ts
import axios, { AxiosError } from "axios";
import type { Certificate, CertificateRequest } from "../types/certificate";

const API_BASE = "http://localhost:3000";

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken");
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const certificateService = {
  // Student: Submit request
  submitRequest: async (data: CertificateRequest): Promise<Certificate> => {
    try {
      console.log("Submitting certificate request:", data);
      
      const response = await axios.post(
        `${API_BASE}/api/certificates`,
        data,
        { headers: getAuthHeader() }
      );
      
      console.log("Submit response:", response.data);
      return response.data;
    } catch (error: unknown) {
      console.error("Error submitting request:", error);
      
      // Handle Axios errors
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string; details?: string }>;
        
        // Get server response error message
        const serverError = axiosError.response?.data?.error;
        const serverDetails = axiosError.response?.data?.details;
        
        if (serverError) {
          // Create a detailed error message
          let errorMessage = serverError;
          if (process.env.NODE_ENV === 'development' && serverDetails) {
            errorMessage += ` (${serverDetails})`;
          }
          throw new Error(errorMessage);
        }
        
        // Handle network errors
        if (axiosError.message === 'Network Error') {
          throw new Error("Network error. Please check your connection.");
        }
        
        // Handle other Axios errors
        throw new Error(axiosError.message || "Failed to submit request");
      }
      
      // Handle standard Error objects
      if (error instanceof Error) {
        throw error;
      }
      
      // Handle unknown errors
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
        throw new Error(error.response?.data?.error || "Failed to process certificate");
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