// src/components/certificate/StudentCertificatePage.tsx
import React, { useState, useEffect } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useOutletContext } from "react-router-dom";
import type {
  Certificate,
  CertificateRequest,
  CertificateType,
} from "../../types/certificate";
import { certificateService } from "../../services/certificateService";
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  UserCog,
  Building2,
  FileText,
  Crown,
  Download,
  Send,
  AlertCircle,
  GraduationCap,
  Award,
  BookOpen,
  UserCheck,
  FileSignature,
  Calendar,
  Shield,
  Sparkles,
  Plus,
  FileCheck,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface OutletContextType {
  studentData: {
    id: number;
    name: string;
    admission_number: string;
    program?: string;
    department?: string;
  };
}

const StudentCertificatePage: React.FC = () => {
  usePageTitle("My Certificates");
  const { studentData } = useOutletContext<OutletContextType>();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState<number | null>(null);
  const [selectedCertificate, setSelectedCertificate] =
    useState<Certificate | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [formErrors, setFormErrors] = useState<{ reason?: string }>({});
  const [submitWarning, setSubmitWarning] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [formData, setFormData] = useState<CertificateRequest>({
    studentId: studentData.id,
    type: "BONAFIDE",
    reason: "",
  });

  useEffect(() => {
    loadCertificates();
    // Trigger animation after mount
    setTimeout(() => setAnimateIn(true), 100);
  }, [studentData.id]);

  const loadCertificates = async () => {
    try {
      const data = await certificateService.getStudentCertificates(
        studentData.id,
      );
      setCertificates(data);
      setTotalItems(data.length);
      setTotalPages(Math.ceil(data.length / limit));
    } catch (error) {
      console.error("Error loading certificates:", error);
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    setTotalPages(Math.ceil(totalItems / newLimit));
  };

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return certificates.slice(startIndex, endIndex);
  };

  const validateForm = (): boolean => {
    const errors: { reason?: string } = {};

    if (!formData.reason.trim()) {
      errors.reason = "Please provide a reason for the certificate";
    } else if (formData.reason.length < 10) {
      errors.reason = "Reason must be at least 10 characters long";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSubmitWarning(null);

    try {
      const response = await certificateService.submitRequest(formData);
      setShowModal(false);
      setFormData({ studentId: studentData.id, type: "BONAFIDE", reason: "" });
      setFormErrors({});
      loadCertificates();

      // Show success toast with warning if any
      if (response.warning) {
        showNotification(response.warning, "warning");
      } else {
        showNotification(
          "Certificate request submitted successfully!",
          "success",
        );
      }
    } catch (error: unknown) {
      console.error("Error submitting request:", error);

      let errorMessage = "Failed to submit request. Please try again.";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (
    message: string,
    type: "success" | "error" | "warning",
  ) => {
    const colors = {
      success: "bg-green-500",
      error: "bg-red-500",
      warning: "bg-yellow-500",
    };

    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 ${
      colors[type]
    } text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("animate-slide-out");
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  const handleDownload = async (certificateId: number) => {
    setDownloadLoading(certificateId);
    try {
      const downloadUrl = certificateService.downloadCertificate(certificateId);
      window.open(downloadUrl, "_blank");

      showNotification("Download started successfully!", "success");
    } catch (error) {
      console.error("Error downloading certificate:", error);
      showNotification(
        "Failed to download certificate. Please try again.",
        "error",
      );
    } finally {
      setDownloadLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "GENERATED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getWorkflowIcon = (status: string) => {
    switch (status) {
      case "WITH_ADVISOR":
        return <UserCog size={20} className="text-blue-600" />;
      case "WITH_HOD":
        return <Building2 size={20} className="text-purple-600" />;
      case "WITH_OFFICE":
        return <FileText size={20} className="text-orange-600" />;
      case "WITH_PRINCIPAL":
        return <Crown size={20} className="text-amber-600" />;
      case "COMPLETED":
        return <CheckCircle size={20} className="text-green-600" />;
      case "REJECTED":
        return <XCircle size={20} className="text-red-600" />;
      default:
        return <Clock size={20} className="text-blue-600" />;
    }
  };

  const getWorkflowStepDescription = (certificate: Certificate) => {
    const workflow = certificate.workflowStatus || "WITH_ADVISOR";

    const steps = [
      {
        key: "WITH_ADVISOR",
        label: "With Advisor",
        description: "Being reviewed by Class Advisor",
        icon: UserCog,
      },
      {
        key: "WITH_HOD",
        label: "With HOD",
        description: "Forwarded to Head of Department",
        icon: Building2,
      },
      {
        key: "WITH_OFFICE",
        label: "With Office",
        description: "Under office verification",
        icon: FileText,
      },
      {
        key: "WITH_PRINCIPAL",
        label: "With Principal",
        description: "Awaiting Principal's approval",
        icon: Crown,
      },
      {
        key: "COMPLETED",
        label: "Completed",
        description: "Process completed",
        icon: CheckCircle,
      },
      {
        key: "REJECTED",
        label: "Rejected",
        description: "Request has been rejected",
        icon: XCircle,
      },
    ];

    return steps.find((s) => s.key === workflow) || steps[0];
  };

  const getProgressPercentage = (status: string) => {
    const progressMap: Record<string, number> = {
      SUBMITTED: 10,
      WITH_ADVISOR: 30,
      WITH_HOD: 50,
      WITH_OFFICE: 70,
      WITH_PRINCIPAL: 90,
      COMPLETED: 100,
      REJECTED: 100,
    };
    return progressMap[status] || 0;
  };

  // Function to check for missing approvers
  const checkForMissingApprovers = (certificate: Certificate) => {
    const warnings = [];

    if (
      certificate.workflowStatus === "WITH_ADVISOR" &&
      !certificate.advisorId
    ) {
      warnings.push("⚠️ No advisor assigned to your class");
    }

    if (certificate.workflowStatus === "WITH_HOD" && !certificate.hodId) {
      warnings.push("⚠️ No HOD assigned to your department");
    }

    if (certificate.workflowStatus === "WITH_OFFICE" && !certificate.officeId) {
      warnings.push("⚠️ No office staff assigned");
    }

    if (
      certificate.workflowStatus === "WITH_PRINCIPAL" &&
      !certificate.principalId
    ) {
      warnings.push("⚠️ No principal assigned");
    }

    return warnings;
  };

  const certificateTypeOptions: {
    value: CertificateType;
    label: string;
    icon: React.ReactNode;
    description: string;
  }[] = [
    {
      value: "BONAFIDE",
      label: "Bonafide Certificate",
      icon: <GraduationCap size={24} />,
      description: "Proof of current enrollment in the institution",
    },
    {
      value: "COURSE_COMPLETION",
      label: "Course Completion",
      icon: <Award size={24} />,
      description: "Certificate for completing a specific course",
    },
    {
      value: "TRANSFER",
      label: "Transfer Certificate",
      icon: <BookOpen size={24} />,
      description: "Required when leaving the institution",
    },
    {
      value: "CHARACTER",
      label: "Character Certificate",
      icon: <UserCheck size={24} />,
      description: "Certificate of good conduct",
    },
    {
      value: "OTHER",
      label: "Other Requests",
      icon: <FileSignature size={24} />,
      description: "Other types of certificates",
    },
  ];

  const stats = {
    total: certificates.length,
    pending: certificates.filter((c) => c.status === "PENDING").length,
    approved: certificates.filter((c) => c.status === "APPROVED").length,
    generated: certificates.filter((c) => c.status === "GENERATED").length,
    rejected: certificates.filter((c) => c.status === "REJECTED").length,
  };

  const paginatedCertificates = getCurrentPageItems();

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 transition-opacity duration-500 ${animateIn ? "opacity-100" : "opacity-0"}`}
    >
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl shadow-lg">
              <FileCheck size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
                Certificate and Requests
              </h1>
              <p className="text-gray-600 flex items-center gap-2 mt-1">
                <Shield size={16} className="text-teal-500" />
                Track and manage your requests
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="group relative overflow-hidden bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Plus
              size={20}
              className="group-hover:rotate-90 transition-transform duration-300"
            />
            <span className="font-medium">New Request</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </button>
        </div>

        {/* Stats Cards - Now 5 cards instead of 6 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <FileText size={20} className="text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.total}
                </p>
                <p className="text-xs text-gray-500">Total Requests</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.pending}
                </p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.approved}
                </p>
                <p className="text-xs text-gray-500">Approved</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Download size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.generated}
                </p>
                <p className="text-xs text-gray-500">Generated</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.rejected}
                </p>
                <p className="text-xs text-gray-500">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-teal-50 to-teal-100/50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-teal-600" />
              <h2 className="font-semibold text-gray-800">Your Requests</h2>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Request Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedCertificates.map((certificate, index) => {
                  const currentStep = getWorkflowStepDescription(certificate);
                  const StepIcon = currentStep.icon;
                  const progress = getProgressPercentage(
                    certificate.workflowStatus,
                  );
                  const missingApprovers =
                    checkForMissingApprovers(certificate);

                  return (
                    <tr
                      key={certificate.id}
                      className="hover:bg-gray-50 transition-colors group animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-teal-50 rounded-lg group-hover:bg-teal-100 transition-colors">
                            {certificate.type === "BONAFIDE" && (
                              <GraduationCap
                                size={20}
                                className="text-teal-600"
                              />
                            )}
                            {certificate.type === "COURSE_COMPLETION" && (
                              <Award size={20} className="text-teal-600" />
                            )}
                            {certificate.type === "TRANSFER" && (
                              <BookOpen size={20} className="text-teal-600" />
                            )}
                            {certificate.type === "CHARACTER" && (
                              <UserCheck size={20} className="text-teal-600" />
                            )}
                            {certificate.type === "OTHER" && (
                              <FileSignature
                                size={20}
                                className="text-teal-600"
                              />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {certificateTypeOptions.find(
                                (opt) => opt.value === certificate.type,
                              )?.label || certificate.type}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: #{certificate.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="text-sm text-gray-600 max-w-xs truncate"
                          title={certificate.reason}
                        >
                          {certificate.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(certificate.requestedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(certificate.status)}`}
                        >
                          {certificate.status === "APPROVED" && (
                            <CheckCircle size={12} />
                          )}
                          {certificate.status === "REJECTED" && (
                            <XCircle size={12} />
                          )}
                          {certificate.status === "GENERATED" && (
                            <Download size={12} />
                          )}
                          {certificate.status === "PENDING" && (
                            <Clock size={12} />
                          )}
                          {certificate.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 min-w-[100px]">
                              <StepIcon
                                size={16}
                                className={
                                  certificate.workflowStatus === "REJECTED"
                                    ? "text-red-500"
                                    : certificate.workflowStatus === "COMPLETED"
                                      ? "text-green-500"
                                      : "text-teal-500"
                                }
                              />
                              <span className="text-sm text-gray-600">
                                {currentStep.label}
                              </span>
                            </div>
                            {certificate.workflowStatus !== "REJECTED" && (
                              <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-500 ${
                                    progress === 100
                                      ? "bg-green-500"
                                      : "bg-teal-500"
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                          {missingApprovers.length > 0 && (
                            <div className="group relative inline-block">
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs cursor-help">
                                <AlertTriangle size={10} />
                                <span>Approver Missing</span>
                              </div>
                              <div className="hidden group-hover:block absolute z-10 bottom-full left-0 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                                <ul className="list-disc pl-4 space-y-1">
                                  {missingApprovers.map((warning, i) => (
                                    <li key={i}>{warning}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedCertificate(certificate);
                              setShowTimeline(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors text-sm font-medium"
                          >
                            <Eye size={16} />
                            Track
                          </button>

                          {certificate.status === "GENERATED" && (
                            <button
                              onClick={() => handleDownload(certificate.id)}
                              disabled={downloadLoading === certificate.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              {downloadLoading === certificate.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Download size={16} />
                              )}
                              PDF
                            </button>
                          )}
                        </div>

                        {certificate.status === "REJECTED" &&
                          certificate.rejectionReason && (
                            <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                              <AlertTriangle size={12} />
                              {certificate.rejectionReason}
                            </div>
                          )}
                      </td>
                    </tr>
                  );
                })}

                {certificates.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-teal-50 rounded-full">
                          <FileText size={48} className="text-teal-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700">
                          No Requests
                        </h3>
                        <p className="text-gray-500 max-w-sm">
                          You haven't submitted any requests yet. Click the "New
                          Request" button to get started.
                        </p>
                        <button
                          onClick={() => setShowModal(true)}
                          className="mt-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
                        >
                          <Plus size={16} />
                          Create Your First Request
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - Only show if there are certificates */}
          {certificates.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Rows per page:</span>
                    <select
                      value={limit}
                      onChange={(e) =>
                        handleLimitChange(Number(e.target.value))
                      }
                      className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {[5, 10, 20, 50, 100].map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Showing</span>
                    <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium">
                      {certificates.length > 0 ? (page - 1) * limit + 1 : 0}
                    </span>
                    <span>to</span>
                    <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium">
                      {Math.min(page * limit, totalItems)}
                    </span>
                    <span>of</span>
                    <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium">
                      {totalItems}
                    </span>
                    <span>results</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronsLeft size={20} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronLeft size={20} className="text-gray-600" />
                  </button>
                  <span className="text-sm font-medium px-4 py-2 bg-white rounded-lg border border-gray-200">
                    Page {page} of {totalPages || 1}
                  </span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronRightIcon size={20} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronsRight size={20} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Certificate Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-teal-100/50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-600 rounded-xl">
                    <FileSignature size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      New Request
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Fill in the details below to submit your request
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setFormErrors({});
                    setSubmitWarning(null);
                    setFormData({
                      studentId: studentData.id,
                      type: "BONAFIDE",
                      reason: "",
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Student Info Card */}
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-4 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <GraduationCap size={20} />
                  <span className="font-medium">Student Information</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-teal-100">Name:</span>
                    <p className="font-medium">{studentData.name}</p>
                  </div>
                  <div>
                    <span className="text-teal-100">Register No:</span>
                    <p className="font-medium">
                      {studentData.admission_number}
                    </p>
                  </div>
                </div>
              </div>

              {/* System Status Warning */}
              {submitWarning && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      size={20}
                      className="text-yellow-600 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <h4 className="font-medium text-yellow-800">
                        System Notice
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        {submitWarning}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Certificate Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {certificateTypeOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.type === option.value
                          ? "border-teal-500 bg-teal-50 shadow-md"
                          : "border-gray-200 hover:border-teal-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="certificateType"
                        value={option.value}
                        checked={formData.type === option.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            type: e.target.value as CertificateType,
                          })
                        }
                        className="sr-only"
                      />
                      <div className="flex gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            formData.type === option.value
                              ? "bg-teal-600 text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {option.icon}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {option.description}
                          </div>
                        </div>
                      </div>
                      {formData.type === option.value && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle size={16} className="text-teal-600" />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Reason Textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Request <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => {
                    setFormData({ ...formData, reason: e.target.value });
                    if (formErrors.reason) {
                      setFormErrors({});
                    }
                  }}
                  className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                    formErrors.reason
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200"
                  }`}
                  rows={4}
                  required
                  placeholder="Please specify the purpose for this certificate in detail..."
                />
                {formErrors.reason && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.reason}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <Info size={12} />
                  Provide a clear reason to help process your request faster
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormErrors({});
                    setSubmitWarning(null);
                    setFormData({
                      studentId: studentData.id,
                      type: "BONAFIDE",
                      reason: "",
                    });
                  }}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all font-medium flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timeline Modal */}
      {showTimeline && selectedCertificate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-teal-100/50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-600 rounded-xl">
                    <Clock size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Request Timeline
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Track the progress of your request
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTimeline(false);
                    setSelectedCertificate(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Request Info Card */}
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-4 text-white">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <FileText size={16} />
                  Request Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-teal-100">Certificate Type:</span>
                    <p className="font-medium">
                      {certificateTypeOptions.find(
                        (opt) => opt.value === selectedCertificate.type,
                      )?.label || selectedCertificate.type}
                    </p>
                  </div>
                  <div>
                    <span className="text-teal-100">Status:</span>
                    <p className="font-medium flex items-center gap-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          selectedCertificate.status === "APPROVED"
                            ? "bg-green-500"
                            : selectedCertificate.status === "REJECTED"
                              ? "bg-red-500"
                              : selectedCertificate.status === "GENERATED"
                                ? "bg-blue-500"
                                : "bg-yellow-500"
                        }`}
                      >
                        {selectedCertificate.status}
                      </span>
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-teal-100">Reason:</span>
                    <p className="mt-1 text-sm bg-white/20 rounded-lg p-2">
                      {selectedCertificate.reason}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-teal-100">Requested On:</span>
                    <p className="font-medium">
                      {new Date(selectedCertificate.requestedAt).toLocaleString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Missing Approvers Warning */}
              {checkForMissingApprovers(selectedCertificate).length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      size={20}
                      className="text-yellow-600 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <h4 className="font-medium text-yellow-800">
                        Approver Assignment Issues
                      </h4>
                      <ul className="mt-2 text-sm text-yellow-700 list-disc pl-4 space-y-1">
                        {checkForMissingApprovers(selectedCertificate).map(
                          (warning, i) => (
                            <li key={i}>{warning}</li>
                          ),
                        )}
                      </ul>
                      <p className="mt-2 text-sm text-yellow-700">
                        Your request may be delayed until these approvers are
                        assigned.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline - with optional chaining and null checks */}
              {selectedCertificate.approvals &&
              selectedCertificate.approvals.length > 0 ? (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Clock size={18} className="text-teal-600" />
                    Approval Timeline
                  </h3>
                  <div className="space-y-4">
                    {selectedCertificate.approvals.map((approval, index) => (
                      <div
                        key={approval?.id || index}
                        className="relative flex gap-4"
                      >
                        {index <
                          (selectedCertificate.approvals?.length || 0) - 1 && (
                          <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-300"></div>
                        )}
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            approval?.action === "FORWARD"
                              ? "bg-green-100"
                              : approval?.action === "REJECT"
                                ? "bg-red-100"
                                : "bg-blue-100"
                          }`}
                        >
                          {approval?.action === "FORWARD" && (
                            <Send size={18} className="text-green-600" />
                          )}
                          {approval?.action === "REJECT" && (
                            <XCircle size={18} className="text-red-600" />
                          )}
                          {approval?.action === "SUBMIT" && (
                            <FileText size={18} className="text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {approval?.role || "Unknown"}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                approval?.action === "FORWARD"
                                  ? "bg-green-100 text-green-800"
                                  : approval?.action === "REJECT"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {approval?.action || "UNKNOWN"}
                            </span>
                            <span className="text-xs text-gray-500 ml-auto">
                              {approval?.createdAt
                                ? new Date(approval.createdAt).toLocaleString()
                                : "N/A"}
                            </span>
                          </div>
                          {approval?.remarks && (
                            <p className="text-sm text-gray-600 bg-white rounded-lg p-2 border border-gray-100">
                              {approval.remarks}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <div className="p-4 bg-teal-50 rounded-full inline-block mb-3">
                    <Clock size={48} className="text-teal-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Awaiting Review
                  </h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    Your request has been submitted and is waiting for the first
                    review by your class advisor.
                  </p>
                </div>
              )}

              {/* Current Status */}
              {selectedCertificate.workflowStatus !== "COMPLETED" &&
                selectedCertificate.workflowStatus !== "REJECTED" && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {getWorkflowIcon(selectedCertificate.workflowStatus)}
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900">
                          Current Status
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          {
                            getWorkflowStepDescription(selectedCertificate)
                              .description
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slide-out {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
        
        .animate-slide-out {
          animation: slide-out 0.3s ease-in forwards;
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slide-up 0.4s ease-out forwards;
        }
        
        tr {
          opacity: 0;
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default StudentCertificatePage;
