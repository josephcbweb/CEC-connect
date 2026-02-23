// src/components/certificate/StaffCertificatePage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Certificate } from "../../types/certificate";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2, 
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Send,
  UserCog,
  Building2,
  FileText,
  Crown,
  Download
} from "lucide-react";
import { jwtDecode } from "jwt-decode";

interface UserData {
  userId: string;
  userName: string;
  roles?: string[];
  role?: string;
}

const StaffCertificatePage: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [processing, setProcessing] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState<number | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");
  
  if (!token) {
    navigate("/signup");
    return null;
  }
  
  const tokenData = jwtDecode<UserData>(token);
  const userId = tokenData.userId;
  
  // Determine user role from token
  const userRole = determineUserRole(tokenData);
  
  // Role display names and icons
  const roleConfig: Record<string, { label: string, icon: React.ReactNode, color: string }> = {
    advisor: { 
      label: 'Class Advisor', 
      icon: <UserCog size={18} />, 
      color: 'text-blue-600 bg-blue-50' 
    },
    hod: { 
      label: 'Head of Department', 
      icon: <Building2 size={18} />, 
      color: 'text-purple-600 bg-purple-50' 
    },
    office: { 
      label: 'Office Staff', 
      icon: <FileText size={18} />, 
      color: 'text-orange-600 bg-orange-50' 
    },
    principal: { 
      label: 'Principal', 
      icon: <Crown size={18} />, 
      color: 'text-amber-600 bg-amber-50' 
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [statusFilter, searchTerm, page, limit]);

  const fetchCertificates = async () => {
  setLoading(true);
  try {
    const queryParams = new URLSearchParams();
    if (statusFilter !== "all") queryParams.append("status", statusFilter);
    if (searchTerm) queryParams.append("search", searchTerm);
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    const url = `http://localhost:3000/api/certificates/role/${userRole}/${userId}?${queryParams.toString()}`;
    console.log('Fetching from URL:', url); // Add this line
    
    const response = await fetch(url);
    console.log('Response status:', response.status); // Add this line

    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data); // Add this line
      setCertificates(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.total || 0);
    } else {
      console.error('Response not OK:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
    }
  } catch (error) {
    console.error("Error fetching certificates:", error);
  } finally {
    setLoading(false);
  }
};

  const handleProcess = async (certificateId: number, action: string) => {
    if (action === 'REJECT' && !remarks) {
      alert("Please enter remarks for rejection");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/certificates/${certificateId}/process`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            remarks,
            userId: parseInt(userId),
            role: userRole
          })
        }
      );

      if (response.ok) {
        setShowModal(false);
        setRemarks("");
        setSelectedCertificate(null);
        fetchCertificates();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to process certificate");
      }
    } catch (error) {
      console.error("Error processing certificate:", error);
      alert("Failed to process certificate");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async (certificateId: number) => {
    setDownloadLoading(certificateId);
    try {
      const downloadUrl = `http://localhost:3000/api/certificates/${certificateId}/download`;
      window.open(downloadUrl, "_blank");
    } catch (error) {
      console.error("Error downloading certificate:", error);
      alert("Failed to download certificate. Please try again.");
    } finally {
      setDownloadLoading(null);
    }
  };

  const handleGenerate = async (certificateId: number) => {
    setProcessing(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/certificates/${certificateId}/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        }
      );

      if (response.ok) {
        fetchCertificates();
        alert("Certificate generated successfully");
      } else {
        alert("Failed to generate certificate");
      }
    } catch (error) {
      console.error("Error generating certificate:", error);
      alert("Failed to generate certificate");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "GENERATED":
        return "bg-blue-100 text-blue-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getWorkflowColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-600 bg-green-50";
      case "REJECTED":
        return "text-red-600 bg-red-50";
      case "WITH_ADVISOR":
        return "text-blue-600 bg-blue-50";
      case "WITH_HOD":
        return "text-purple-600 bg-purple-50";
      case "WITH_OFFICE":
        return "text-orange-600 bg-orange-50";
      case "WITH_PRINCIPAL":
        return "text-amber-600 bg-amber-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getWorkflowStep = (status: string) => {
    const steps = [
      { key: 'SUBMITTED', label: 'Submitted', icon: Clock },
      { key: 'WITH_ADVISOR', label: 'With Advisor', icon: UserCog },
      { key: 'WITH_HOD', label: 'With HOD', icon: Building2 },
      { key: 'WITH_OFFICE', label: 'With Office', icon: FileText },
      { key: 'WITH_PRINCIPAL', label: 'With Principal', icon: Crown },
      { key: 'COMPLETED', label: 'Completed', icon: CheckCircle },
      { key: 'REJECTED', label: 'Rejected', icon: XCircle }
    ];
    return steps.find(s => s.key === status) || steps[0];
  };

  const canTakeAction = (certificate: Certificate) => {
    const workflowMap: Record<string, string[]> = {
      'advisor': ['SUBMITTED', 'WITH_ADVISOR'],
      'hod': ['WITH_HOD'],
      'office': ['WITH_OFFICE'],
      'principal': ['WITH_PRINCIPAL']
    };
    
    return workflowMap[userRole]?.includes(certificate.workflowStatus) && 
           certificate.status !== 'REJECTED' && 
           certificate.status !== 'GENERATED';
  };

  const canGenerate = (certificate: Certificate) => {
    return userRole === 'office' && 
           certificate.status === 'APPROVED' && 
           certificate.workflowStatus === 'COMPLETED';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${roleConfig[userRole]?.color || 'bg-gray-100'}`}>
            {roleConfig[userRole]?.icon || <UserCog size={24} />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Certificate Management - {roleConfig[userRole]?.label || userRole}
            </h1>
            <p className="text-gray-500">
              {userRole === 'advisor' && "Review and forward certificate requests from your advisees"}
              {userRole === 'hod' && "Review department certificate requests forwarded by advisors"}
              {userRole === 'office' && "Verify and process certificate requests"}
              {userRole === 'principal' && "Final approval for certificate requests"}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or register number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="WITH_ADVISOR">With Advisor</option>
            <option value="WITH_HOD">With HOD</option>
            <option value="WITH_OFFICE">With Office</option>
            <option value="WITH_PRINCIPAL">With Principal</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Workflow</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <Loader2 className="animate-spin mx-auto text-teal-600" size={32} />
                  </td>
                </tr>
              ) : certificates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No certificates found
                  </td>
                </tr>
              ) : (
                certificates.map((cert) => {
                  const workflowStep = getWorkflowStep(cert.workflowStatus);
                  const WorkflowIcon = workflowStep.icon;
                  
                  return (
                    <tr key={cert.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{cert.student?.name}</div>
                          <div className="text-sm text-gray-500">{cert.student?.admission_number}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {cert.type.replace("_", " ")}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {cert.reason}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cert.status)}`}>
                          {cert.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getWorkflowColor(cert.workflowStatus)}`}>
                          <WorkflowIcon size={12} />
                          {cert.workflowStatus.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(cert.requestedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedCertificate(cert);
                              setShowModal(true);
                            }}
                            className="text-teal-600 hover:text-teal-800 font-medium text-sm flex items-center gap-1"
                          >
                            <Eye size={16} />
                            View
                          </button>
                          
                          {canGenerate(cert) && (
                            <button
                              onClick={() => handleGenerate(cert.id)}
                              disabled={processing}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              <FileText size={14} />
                              Generate
                            </button>
                          )}
                          
                          {cert.status === "GENERATED" && cert.certificateUrl && (
                            <button
                              onClick={() => handleDownload(cert.id)}
                              disabled={downloadLoading === cert.id}
                              className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              <Download size={14} />
                              {downloadLoading === cert.id ? "..." : "PDF"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1"
            >
              {[10, 20, 50, 100].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <span>
              Showing {certificates.length > 0 ? (page - 1) * limit + 1 : 0} -{" "}
              {Math.min(page * limit, totalItems)} of {totalItems}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronsLeft size={20} />
            </button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronsRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Certificate Request Details</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedCertificate(null);
                    setRemarks("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Student Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <span className="ml-2 text-gray-900 font-medium">{selectedCertificate.student?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Register No:</span>
                    <span className="ml-2 text-gray-900">{selectedCertificate.student?.admission_number}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Program:</span>
                    <span className="ml-2 text-gray-900">{selectedCertificate.student?.program}</span>
                  </div>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Certificate Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-2 text-gray-900 font-medium">{selectedCertificate.type.replace("_", " ")}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Reason:</span>
                    <p className="mt-1 text-gray-900 bg-white p-3 rounded border border-gray-200">
                      {selectedCertificate.reason}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Requested:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(selectedCertificate.requestedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Workflow Timeline */}
              {selectedCertificate.approvals && selectedCertificate.approvals.length > 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Approval Timeline</h3>
                  <div className="space-y-3">
                    {selectedCertificate.approvals.map((approval, index) => (
                      <div key={approval.id} className="flex gap-3 text-sm">
                        <div className="flex-shrink-0 w-24 text-gray-500">
                          {new Date(approval.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex-shrink-0 w-24">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            approval.action === 'APPROVE' ? 'bg-green-100 text-green-800' :
                            approval.action === 'REJECT' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {approval.action}
                          </span>
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">{approval.role}</span>
                          {approval.remarks && (
                            <p className="text-gray-600 mt-1">{approval.remarks}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Approval Timeline</h3>
                  <p className="text-gray-500 text-sm">No approvals yet.</p>
                </div>
              )}

              {/* Action Buttons */}
              {canTakeAction(selectedCertificate) && (
                <div className="space-y-4">
                  <textarea
                    placeholder="Enter remarks (required for rejection)..."
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                  
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => handleProcess(selectedCertificate.id, 'REJECT')}
                      disabled={processing || !remarks}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {processing ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                      Reject
                    </button>
                    
                    <button
                      onClick={() => handleProcess(selectedCertificate.id, 'FORWARD')}
                      disabled={processing}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {processing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      {userRole === 'principal' ? 'Approve' : 'Approve & Forward'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to determine user role
function determineUserRole(tokenData: any): string {
  if (tokenData.roles) {
    if (tokenData.roles.includes('advisor')) return 'advisor';
    if (tokenData.roles.includes('hod')) return 'hod';
    if (tokenData.roles.includes('office')) return 'office';
    if (tokenData.roles.includes('principal')) return 'principal';
  }
  
  if (tokenData.role) {
    const role = tokenData.role.toLowerCase();
    if (role.includes('advisor')) return 'advisor';
    if (role.includes('hod')) return 'hod';
    if (role.includes('office')) return 'office';
    if (role.includes('principal')) return 'principal';
  }
  
  return 'advisor';
}

export default StaffCertificatePage;