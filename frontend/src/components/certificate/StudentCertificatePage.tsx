// src/components/certificate/StudentCertificatePage.tsx
import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import type { Certificate, CertificateRequest, CertificateType } from "../../types/certificate";
import { certificateService } from "../../services/certificateService";
import { Clock, CheckCircle, XCircle, Loader2, Eye } from "lucide-react";

interface OutletContextType {
  studentData: {
    id: number;
    name: string;
    admission_number: string;
  };
}

const StudentCertificatePage: React.FC = () => {
  const { studentData } = useOutletContext<OutletContextType>();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState<number | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  
  const [formData, setFormData] = useState<CertificateRequest>({
    studentId: studentData.id,
    type: "BONAFIDE",
    reason: "",
  });

  useEffect(() => {
    loadCertificates();
  }, [studentData.id]);

  const loadCertificates = async () => {
    try {
      const data = await certificateService.getStudentCertificates(studentData.id);
      setCertificates(data);
    } catch (error) {
      console.error("Error loading certificates:", error);
    }
  };

// In StudentCertificatePage.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    await certificateService.submitRequest(formData);
    setShowModal(false);
    setFormData({ studentId: studentData.id, type: "BONAFIDE", reason: "" });
    loadCertificates();
    alert("✅ Certificate request submitted successfully!");
  } catch (error: unknown) {
    console.error("Error submitting request:", error);
    
    // Get error message
    let errorMessage = "Failed to submit request. Please try again.";
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Show more specific error messages based on content
    if (errorMessage.toLowerCase().includes("advisor")) {
      alert("⚠️ " + errorMessage + "\n\nPlease contact the administration to set up your class advisor.");
    } else if (errorMessage.toLowerCase().includes("class")) {
      alert("📚 " + errorMessage + "\n\nPlease contact the administration to set up your class assignment.");
    } else if (errorMessage.toLowerCase().includes("network")) {
      alert("🌐 Network error. Please check your internet connection and try again.");
    } else {
      alert("❌ Error: " + errorMessage);
    }
  } finally {
    setLoading(false);
  }
};

  const handleDownload = async (certificateId: number) => {
    setDownloadLoading(certificateId);
    try {
      const downloadUrl = certificateService.downloadCertificate(certificateId);
      window.open(downloadUrl, "_blank");
    } catch (error) {
      console.error("Error downloading certificate:", error);
      alert("Failed to download certificate. Please try again.");
    } finally {
      setDownloadLoading(null);
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
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getWorkflowStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle size={16} className="text-green-600" />;
      case "REJECTED":
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-blue-600" />;
    }
  };

  const getWorkflowStepDescription = (certificate: Certificate) => {
    const workflow = certificate.workflowStatus || "SUBMITTED";
    
    const steps = [
      { key: "SUBMITTED", label: "Submitted", description: "Your request has been submitted" },
      { key: "WITH_ADVISOR", label: "With Advisor", description: "Being reviewed by Class Advisor" },
      { key: "WITH_HOD", label: "With HOD", description: "Forwarded to Head of Department" },
      { key: "WITH_OFFICE", label: "With Office", description: "Under office verification" },
      { key: "WITH_PRINCIPAL", label: "With Principal", description: "Awaiting Principal's approval" },
      { key: "COMPLETED", label: "Completed", description: "Process completed" },
      { key: "REJECTED", label: "Rejected", description: "Request has been rejected" }
    ];
    
    const currentStep = steps.find(s => s.key === workflow) || steps[0];
    return currentStep;
  };

  const certificateTypeOptions: { value: CertificateType; label: string }[] = [
    { value: "BONAFIDE", label: "Bonafide Certificate" },
    { value: "COURSE_COMPLETION", label: "Course Completion Certificate" },
    { value: "TRANSFER", label: "Transfer Certificate" },
    { value: "CHARACTER", label: "Character Certificate" },
    { value: "OTHER", label: "Other Certificate" },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          My Certificate Requests
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 font-medium"
        >
          New Request
        </button>
      </div>

      {/* Certificate Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">New Certificate Request</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Certificate Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as CertificateType,
                    })
                  }
                  className="w-full p-2 border rounded-lg"
                  required
                >
                  {certificateTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg"
                  rows={4}
                  required
                  placeholder="Please specify the purpose for this certificate..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium"
                >
                  {loading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificates Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Requested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Current Step
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {certificates.map((certificate) => {
                const currentStep = getWorkflowStepDescription(certificate);
                return (
                  <tr key={certificate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {certificateTypeOptions.find(
                        (opt) => opt.value === certificate.type
                      )?.label || certificate.type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 max-w-xs truncate">
                      {certificate.reason}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {new Date(certificate.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          certificate.status
                        )}`}
                      >
                        {certificate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {getWorkflowStatusIcon(certificate.workflowStatus)}
                        <span className="text-gray-700">{currentStep.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedCertificate(certificate);
                            setShowTimeline(true);
                          }}
                          className="text-teal-600 hover:text-teal-800 font-medium text-sm flex items-center gap-1"
                        >
                          <Eye size={16} />
                          Track
                        </button>
                        
                        {certificate.status === "GENERATED" && (
                          <button
                            onClick={() => handleDownload(certificate.id)}
                            disabled={downloadLoading === certificate.id}
                            className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50 font-medium"
                          >
                            {downloadLoading === certificate.id
                              ? "Downloading..."
                              : "Download PDF"}
                          </button>
                        )}
                        
                        {certificate.status === "REJECTED" && certificate.rejectionReason && (
                          <div className="text-xs text-red-600">
                            Reason: {certificate.rejectionReason}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {certificates.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    You have no certificate requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timeline Modal */}
      {showTimeline && selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Request Timeline</h2>
                <button
                  onClick={() => {
                    setShowTimeline(false);
                    setSelectedCertificate(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Request Info */}
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Request Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-2 text-gray-900">
                      {selectedCertificate.type.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                      getStatusColor(selectedCertificate.status)
                    }`}>
                      {selectedCertificate.status}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Reason:</span>
                    <p className="mt-1 text-gray-900">{selectedCertificate.reason}</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
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
                <div className="text-center py-8 text-gray-500">
                  <Clock size={32} className="mx-auto mb-2 text-gray-400" />
                  <p>Your request is awaiting review</p>
                </div>
              )}

              {/* Current Status */}
              {selectedCertificate.workflowStatus !== 'COMPLETED' && 
               selectedCertificate.workflowStatus !== 'REJECTED' && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Clock size={20} />
                    <span className="font-medium">Current Status:</span>
                    <span>{getWorkflowStepDescription(selectedCertificate).description}</span>
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

export default StudentCertificatePage;