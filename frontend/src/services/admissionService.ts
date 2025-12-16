import axios from "axios";

const API_BASE = "http://localhost:3000";

// Get auth token from localStorage
const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export interface AdmissionFilters {
  page?: number;
  limit?: number;
  status?: string;
  program?: string;
  search?: string;
  admissionType?: string;
}

export const admissionService = {
  // Get admissions list
  getAdmissions: async (params: AdmissionFilters) => {
    const response = await axios.get(
      `${API_BASE}/api/admission/admin/admissions`,
      {
        params,
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  // Get admission details
  getAdmissionById: async (id: number) => {
    const response = await axios.get(
      `${API_BASE}/api/admission/admin/admissions/${id}`,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  // Update admission status
  updateStatus: async (id: number, status: string, comments?: string) => {
    const response = await axios.put(
      `${API_BASE}/api/admission/admin/admissions/${id}/status`,
      { status, comments },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Bulk update status
  bulkUpdateStatus: async (ids: number[], status: string) => {
    const response = await axios.post(
      `${API_BASE}/api/admission/admin/admissions/bulk-update`,
      { ids, status },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Get admission windows
  getAdmissionWindows: async () => {
    const response = await axios.get(
      `${API_BASE}/api/admission/admin/admission-windows`,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  // Create admission window
  createAdmissionWindow: async (data: {
    program: string;
    startDate: string;
    endDate: string;
    description?: string;
    isOpen?: boolean;
  }) => {
    const response = await axios.post(
      `${API_BASE}/api/admission/admin/admission-windows`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Update admission window
  updateAdmissionWindow: async (id: number, data: any) => {
    const response = await axios.put(
      `${API_BASE}/api/admission/admin/admission-windows/${id}`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Delete admission window
  deleteAdmissionWindow: async (id: number) => {
    const response = await axios.delete(
      `${API_BASE}/api/admission/admin/admission-windows/${id}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Get statistics
  getStats: async () => {
    const response = await axios.get(`${API_BASE}/api/admission/admin/stats`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Check admission status (public)
  checkAdmissionStatus: async () => {
    const response = await axios.get(`${API_BASE}/api/admission/status`);
    return response.data;
  },

  // Validate student (public)
  validateStudent: async (email: string, aadhaar: string) => {
    const response = await axios.post(`${API_BASE}/api/admission/validate`, {
      email,
      aadhaar,
    });
    return response.data;
  },

  // Submit admission form (public)
  submitAdmissionForm: async (formData: any) => {
    const response = await axios.post(
      `${API_BASE}/api/admission/submit`,
      formData
    );
    return response.data;
  },

  // Get admission by number (public)
  getAdmissionByNumber: async (admissionNumber: string) => {
    const response = await axios.get(
      `${API_BASE}/api/admission/check/${admissionNumber}`
    );
    return response.data;
  },
};
