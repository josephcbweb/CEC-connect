// src/components/certificate/StaffCertificatePage.tsx

import React, { useState, useEffect } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
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
  Download,
  Filter,
  GraduationCap,
  BookOpen,
  Sparkles,
  Shield,
  FileCheck,
  AlertTriangle,
  Info,
  Calendar,
  ChevronRight as ChevronRightIcon,
  X,
  RefreshCw,
  Users,
  GitBranch,
} from "lucide-react";
import { jwtDecode } from "jwt-decode";

interface UserData {
  userId?: string;
  id?: string | number;
  userName: string;
  name?: string;
  email?: string;
  role?: string; // Some tokens might have a role field
}

interface Department {
  id: number;
  name: string;
  department_code: string;
  program: string;
}

// Extend the Certificate type to include currentSemester
interface ExtendedCertificate extends Certificate {
  student?: Certificate["student"] & {
    currentSemester?: number;
    department?: {
      id?: number;
      name: string;
    };
  };
}

// Define user roles with their properties
interface UserRoleInfo {
  role: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  description: string;
  departmentId?: number | null;
  departmentName?: string;
}

const StaffCertificatePage: React.FC = () => {
  usePageTitle("Certificates");
  const [certificates, setCertificates] = useState<ExtendedCertificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCertificate, setSelectedCertificate] =
    useState<ExtendedCertificate | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [processing, setProcessing] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState<number | null>(null);
  const [animateIn, setAnimateIn] = useState(false);

  // Multi-role support
  const [userRoles, setUserRoles] = useState<UserRoleInfo[]>([]);
  const [activeRole, setActiveRole] = useState<string>("");
  const [loadingRole, setLoadingRole] = useState(true);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  // Advisor details state
  const [advisorName, setAdvisorName] = useState<string>("");

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Department and Semester filters
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [semesters] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8]);

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

  // Trigger animation after mount
  useEffect(() => {
    setTimeout(() => setAnimateIn(true), 100);
  }, []);

  // Get userId from token
  const tokenData = jwtDecode<UserData>(token);
  console.log("Decoded token data:", tokenData);

  const userId = String(tokenData.userId || tokenData.id || "");
  console.log("Extracted userId:", userId);

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/departments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  // Determine all user roles
  useEffect(() => {
    if (userId) {
      determineAllUserRoles();
    }
  }, [userId]);

  // src/components/certificate/StaffCertificatePage.tsx

  const determineAllUserRoles = async () => {
    setLoadingRole(true);
    const detectedRoles: UserRoleInfo[] = [];

    try {
      // Check all possible roles and collect them

      // Check HOD
      try {
        const hodResponse = await fetch(
          `http://localhost:3000/api/certificates/role/hod/${userId}?limit=1`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (hodResponse.ok) {
          const hodData = await hodResponse.json();
          // Also check if user has certificates or just has the role
          const hasHODRole = hodData.data || hodResponse.status === 200;

          // Get department info for HOD
          let departmentName = "Department";
          let departmentId = null;

          // Try to get department from user profile or another endpoint
          try {
            const deptResponse = await fetch(
              `http://localhost:3000/api/users/${userId}/departments`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            if (deptResponse.ok) {
              const deptData = await deptResponse.json();
              if (deptData.hodDepartment) {
                departmentName = deptData.hodDepartment.name;
                departmentId = deptData.hodDepartment.id;
              }
            }
          } catch (error) {
            console.error("Error fetching HOD department:", error);
          }

          detectedRoles.push({
            role: "hod",
            label: "Head of Department",
            icon: <Building2 size={18} />,
            color: "text-emerald-600 bg-emerald-50",
            bgGradient: "from-emerald-500 to-teal-600",
            description: `Manage ${departmentName} certificates`,
            departmentId,
            departmentName,
          });
          console.log("HOD role detected");
        }
      } catch (error) {
        console.log("HOD role check failed:", error);
      }

      // Check Principal
      try {
        const principalResponse = await fetch(
          `http://localhost:3000/api/certificates/role/principal/${userId}?limit=1`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (principalResponse.ok) {
          detectedRoles.push({
            role: "principal",
            label: "Principal",
            icon: <Crown size={18} />,
            color: "text-purple-600 bg-purple-50",
            bgGradient: "from-purple-500 to-pink-500",
            description: "Final approval for all certificates",
            departmentId: null,
            departmentName: undefined,
          });
          console.log("Principal role detected");
        }
      } catch (error) {
        console.log("Principal role check failed:", error);
      }

      // Check Office
      try {
        const officeResponse = await fetch(
          `http://localhost:3000/api/certificates/role/office/${userId}?limit=1`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (officeResponse.ok) {
          detectedRoles.push({
            role: "office",
            label: "Office Staff",
            icon: <FileText size={18} />,
            color: "text-amber-600 bg-amber-50",
            bgGradient: "from-amber-500 to-orange-500",
            description: "Process and generate certificates",
            departmentId: null,
            departmentName: undefined,
          });
          console.log("Office role detected");
        }
      } catch (error) {
        console.log("Office role check failed:", error);
      }

      // Check Advisor
      try {
        const advisorResponse = await fetch(
          `http://localhost:3000/api/certificates/role/advisor/${userId}?limit=1`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (advisorResponse.ok) {
          const advisorData = await advisorResponse.json();

          // Get class info for advisor
          let className = "Class";
          try {
            const classResponse = await fetch(
              `http://localhost:3000/api/users/${userId}/advisor-class`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            if (classResponse.ok) {
              const classData = await classResponse.json();
              className = classData.className || "Class";
            }
          } catch (error) {
            console.error("Error fetching advisor class:", error);
          }

          detectedRoles.push({
            role: "advisor",
            label: "Class Advisor",
            icon: <UserCog size={18} />,
            color: "text-teal-600 bg-teal-50",
            bgGradient: "from-teal-500 to-teal-600",
            description: `Manage ${className} advisee certificates`,
            departmentId: null,
            departmentName: undefined,
          });
          console.log("Advisor role detected");

          // Set advisor name from token if available
          if (tokenData.name) {
            setAdvisorName(tokenData.name);
          }
        }
      } catch (error) {
        console.log("Advisor role check failed:", error);
      }

      // Check Admin
      try {
        const adminResponse = await fetch(
          `http://localhost:3000/api/certificates/role/admin/${userId}?limit=1`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (adminResponse.ok) {
          detectedRoles.push({
            role: "admin",
            label: "Administrator",
            icon: <Shield size={18} />,
            color: "text-red-600 bg-red-50",
            bgGradient: "from-red-500 to-rose-600",
            description: "View all certificate flows",
            departmentId: null,
            departmentName: undefined,
          });
          console.log("Admin role detected");
        }
      } catch (error) {
        console.log("Admin role check failed:", error);
      }

      // If no roles detected, add a default role
      if (detectedRoles.length === 0) {
        detectedRoles.push({
          role: "viewer",
          label: "Viewer",
          icon: <Users size={18} />,
          color: "text-gray-600 bg-gray-50",
          bgGradient: "from-gray-500 to-gray-600",
          description: "View certificates",
          departmentId: null,
          departmentName: undefined,
        });
      }

      setUserRoles(detectedRoles);

      // Set active role to the first one (or try to get from localStorage)
      const savedRole = localStorage.getItem(`activeRole_${userId}`);
      if (savedRole && detectedRoles.some((r) => r.role === savedRole)) {
        setActiveRole(savedRole);
      } else {
        setActiveRole(detectedRoles[0].role);
      }
    } catch (error) {
      console.error("Error determining user roles:", error);
      // Fallback to a default role
      setUserRoles([
        {
          role: "advisor",
          label: "Class Advisor",
          icon: <UserCog size={18} />,
          color: "text-teal-600 bg-teal-50",
          bgGradient: "from-teal-500 to-teal-600",
          description: "Default role",
          departmentId: null,
          departmentName: undefined,
        },
      ]);
      setActiveRole("advisor");
    } finally {
      setLoadingRole(false);
    }
  };

  // Switch role
  const switchRole = (role: string) => {
    setActiveRole(role);
    localStorage.setItem(`activeRole_${userId}`, role);
    setShowRoleSwitcher(false);
    setPage(1); // Reset pagination
    // Clear filters that might not be relevant for the new role
    if (role === "advisor") {
      setDepartmentFilter("all");
    }
  };

  // Fetch certificates based on active role with all filters
  const fetchCertificates = async () => {
    if (!userId || !activeRole) {
      console.error("Missing userId or activeRole");
      return;
    }

    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== "all") queryParams.append("status", statusFilter);
      if (searchTerm) queryParams.append("search", searchTerm);

      // Only apply department filter if role supports it (not advisor)
      if (activeRole !== "advisor" && departmentFilter !== "all") {
        queryParams.append("departmentId", departmentFilter);
      }

      if (semesterFilter !== "all")
        queryParams.append("semester", semesterFilter);

      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      const url = `http://localhost:3000/api/certificates/role/${activeRole}/${userId}?${queryParams.toString()}`;

      console.log("Fetching from URL:", url);

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Response data:", data);
        setCertificates(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.total || 0);
      } else {
        const errorData = await response.json();
        console.error("Response not OK:", response.status, errorData);
        // Show error notification
        showNotification(
          errorData.error || "Failed to fetch certificates",
          "error",
        );
      }
    } catch (error) {
      console.error("Error fetching certificates:", error);
      showNotification("Failed to fetch certificates", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && activeRole && !loadingRole) {
      fetchCertificates();
    }
  }, [
    statusFilter,
    searchTerm,
    departmentFilter,
    semesterFilter,
    page,
    limit,
    userId,
    activeRole,
    loadingRole,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchTerm, departmentFilter, semesterFilter, activeRole]);

  // Get active role config
  const activeRoleConfig =
    userRoles.find((r) => r.role === activeRole) || userRoles[0];

  // Function to show approver missing error modal
  const showApproverError = (errorMessage: string) => {
    const errorModal = document.createElement("div");
    errorModal.className =
      "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in";
    errorModal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up overflow-hidden">
        <div class="p-6 bg-red-50 border-b border-red-200">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-red-600 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900">Cannot Forward Request</h2>
              <p class="text-sm text-gray-600 mt-1">Approver not assigned</p>
            </div>
          </div>
        </div>
        <div class="p-6">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p class="text-red-700 flex items-start gap-2">
              <span>⚠️</span>
              <span>${errorMessage}</span>
            </p>
          </div>
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 class="font-medium text-yellow-800 mb-2">What to do next:</h3>
            <ul class="text-sm text-yellow-700 space-y-1 list-disc pl-4">
              <li>Contact the administration department</li>
              <li>Request them to assign the missing approver</li>
              <li>Try forwarding again after the approver is assigned</li>
            </ul>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="mt-6 w-full px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">
            Close
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(errorModal);

    setTimeout(() => {
      if (document.body.contains(errorModal)) {
        errorModal.remove();
      }
    }, 8000);
  };

  const handleProcess = async (certificateId: number, action: string) => {
    if (action === "REJECT" && !remarks) {
      alert("Please enter remarks for rejection");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/certificates/${certificateId}/process`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action,
            remarks,
            userId: parseInt(userId),
            role: activeRole, // Use active role instead of userRole
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setShowModal(false);
        setRemarks("");
        setSelectedCertificate(null);
        fetchCertificates();
        showNotification("Certificate processed successfully!", "success");
      } else {
        if (data.code === "NEXT_APPROVER_MISSING") {
          showApproverError(data.error);
        } else {
          showNotification(
            data.error || "Failed to process certificate",
            "error",
          );
        }
      }
    } catch (error) {
      console.error("Error processing certificate:", error);
      showNotification("Failed to process certificate", "error");
    } finally {
      setProcessing(false);
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
      const downloadUrl = `http://localhost:3000/api/certificates/${certificateId}/download`;
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

  const handleGenerate = async (certificateId: number) => {
    setProcessing(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/certificates/${certificateId}/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        fetchCertificates();
        showNotification("Certificate generated successfully!", "success");
      } else {
        showNotification("Failed to generate certificate", "error");
      }
    } catch (error) {
      console.error("Error generating certificate:", error);
      showNotification("Failed to generate certificate", "error");
    } finally {
      setProcessing(false);
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

  const getWorkflowColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-50 text-green-700 border-green-200";
      case "REJECTED":
        return "bg-red-50 text-red-700 border-red-200";
      case "WITH_ADVISOR":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "WITH_HOD":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "WITH_OFFICE":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "WITH_PRINCIPAL":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getWorkflowStep = (status: string) => {
    const steps = [
      { key: "SUBMITTED", label: "Submitted", icon: Clock },
      { key: "WITH_ADVISOR", label: "With Advisor", icon: UserCog },
      { key: "WITH_HOD", label: "With HOD", icon: Building2 },
      { key: "WITH_OFFICE", label: "With Office", icon: FileText },
      { key: "WITH_PRINCIPAL", label: "With Principal", icon: Crown },
      { key: "COMPLETED", label: "Completed", icon: CheckCircle },
      { key: "REJECTED", label: "Rejected", icon: XCircle },
    ];
    return steps.find((s) => s.key === status) || steps[0];
  };

  const canTakeAction = (certificate: Certificate) => {
    const workflowMap: Record<string, string[]> = {
      advisor: ["SUBMITTED", "WITH_ADVISOR"],
      hod: ["WITH_HOD"],
      office: ["WITH_OFFICE"],
      principal: ["WITH_PRINCIPAL"],
      admin: [
        "SUBMITTED",
        "WITH_ADVISOR",
        "WITH_HOD",
        "WITH_OFFICE",
        "WITH_PRINCIPAL",
      ], // Admin can act on any
    };

    return (
      workflowMap[activeRole]?.includes(certificate.workflowStatus) &&
      certificate.status !== "REJECTED" &&
      certificate.status !== "GENERATED"
    );
  };

  const canGenerate = (certificate: Certificate) => {
    return (
      (activeRole === "office" || activeRole === "admin") && // Admin can also generate
      certificate.status === "APPROVED" &&
      certificate.workflowStatus === "COMPLETED"
    );
  };

  // Function to check for missing approvers in a certificate
  const checkForMissingApprovers = (certificate: ExtendedCertificate) => {
    const warnings = [];

    if (
      certificate.workflowStatus === "WITH_ADVISOR" &&
      !certificate.advisorId
    ) {
      warnings.push("⚠️ No advisor assigned to this student's class");
    }

    if (certificate.workflowStatus === "WITH_HOD" && !certificate.hodId) {
      warnings.push("⚠️ No HOD assigned to this department");
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

  // Get welcome message based on active role
  const getWelcomeMessage = () => {
    switch (activeRole) {
      case "hod":
        return "Review department requests forwarded by advisors";
      case "principal":
        return "Final approval for  requests";
      case "office":
        return "Verify and process requests";
      case "advisor":
        return "Review and forward requests from your advisees";
      case "admin":
        return "View all  requests across the institution";
      default:
        return "Manage requests";
    }
  };

  // Show loading while determining roles
  if (loadingRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto"></div>
            <Sparkles
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-teal-500"
              size={24}
            />
          </div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading your roles...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 transition-opacity duration-500 ${animateIn ? "opacity-100" : "opacity-0"}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section with Role Switcher */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 bg-gradient-to-r ${activeRoleConfig?.bgGradient || "from-teal-500 to-teal-600"} rounded-xl shadow-lg relative`}
            >
              {activeRoleConfig?.icon}

              {/* Role indicator badge for multi-role users */}
              {userRoles.length > 1 && (
                <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-200">
                  <GitBranch size={14} className="text-teal-600" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
                  Request Management
                </h1>

                {/* Role Switcher Button - Only show if multiple roles */}
                {userRoles.length > 1 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      <RefreshCw size={16} className="text-teal-600" />
                      <span className="text-sm font-medium">Switch Role</span>
                    </button>

                    {/* Role Switcher Dropdown */}
                    {showRoleSwitcher && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                        <div className="p-2 bg-gray-50 border-b border-gray-200">
                          <p className="text-xs font-medium text-gray-500">
                            SELECT ROLE
                          </p>
                        </div>
                        <div className="p-1">
                          {userRoles.map((role) => (
                            <button
                              key={role.role}
                              onClick={() => switchRole(role.role)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                activeRole === role.role
                                  ? "bg-teal-50 border border-teal-200"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              <div className={`p-2 rounded-lg ${role.color}`}>
                                {role.icon}
                              </div>
                              <div className="flex-1 text-left">
                                <p className="font-medium text-gray-900">
                                  {role.label}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {role.description}
                                </p>
                              </div>
                              {activeRole === role.role && (
                                <CheckCircle
                                  size={16}
                                  className="text-teal-600"
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${activeRoleConfig?.color || "bg-gray-100 text-gray-700"}`}
                >
                  {activeRoleConfig?.label}
                </span>
                <p className="text-gray-600 flex items-center gap-1">
                  <Shield size={14} className="text-teal-500" />
                  {getWelcomeMessage()}
                </p>
              </div>

              {/* Show department info for HOD */}
              {activeRole === "hod" && activeRoleConfig?.departmentName && (
                <p className="text-xs text-gray-500 mt-1">
                  Department: {activeRoleConfig.departmentName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-50 to-teal-100/50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-teal-600" />
              <h3 className="font-semibold text-gray-800">
                Filter Requests {activeRole && `as ${activeRoleConfig?.label}`}
              </h3>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search by name or register no..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <select
                className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="WITH_ADVISOR">With Advisor</option>
                <option value="WITH_HOD">With HOD</option>
                <option value="WITH_OFFICE">With Office</option>
                <option value="WITH_PRINCIPAL">With Principal</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>

              {/* Department Filter - Hide for advisor */}
              {activeRole !== "advisor" && (
                <select
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Semester Filter */}
              <select
                className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
              >
                <option value="all">All Semesters</option>
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>

            {/* Active filters display */}
            {(statusFilter !== "all" ||
              (activeRole !== "advisor" && departmentFilter !== "all") ||
              semesterFilter !== "all" ||
              searchTerm) && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500 mr-2">
                  Active filters:
                </span>
                {statusFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium border border-teal-200">
                    Status: {statusFilter.replace("_", " ")}
                    <button
                      onClick={() => setStatusFilter("all")}
                      className="hover:text-teal-900 ml-1"
                    >
                      <X size={14} />
                    </button>
                  </span>
                )}
                {activeRole !== "advisor" && departmentFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-200">
                    Dept:{" "}
                    {departments.find((d) => d.id === Number(departmentFilter))
                      ?.name || departmentFilter}
                    <button
                      onClick={() => setDepartmentFilter("all")}
                      className="hover:text-purple-900 ml-1"
                    >
                      <X size={14} />
                    </button>
                  </span>
                )}
                {semesterFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
                    Semester: {semesterFilter}
                    <button
                      onClick={() => setSemesterFilter("all")}
                      className="hover:text-blue-900 ml-1"
                    >
                      <X size={14} />
                    </button>
                  </span>
                )}
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium border border-gray-200">
                    Search: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm("")}
                      className="hover:text-gray-900 ml-1"
                    >
                      <X size={14} />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Certificates Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-50 to-teal-100/50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-teal-600" />
              <h2 className="font-semibold text-gray-800">
                Requests {activeRole && `(${activeRoleConfig?.label})`}
              </h2>
              {totalItems > 0 && (
                <span className="ml-auto text-sm text-gray-500">
                  Showing {certificates.length} of {totalItems} requests
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Workflow
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Dept/Sem
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                          <Sparkles
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-teal-500"
                            size={16}
                          />
                        </div>
                        <p className="text-gray-500">Loading Requests...</p>
                      </div>
                    </td>
                  </tr>
                ) : certificates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-teal-50 rounded-full">
                          <FileText size={48} className="text-teal-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700">
                          No Requests
                        </h3>
                        <p className="text-gray-500 max-w-sm">
                          No requests match your current filters.
                        </p>
                        <button
                          onClick={() => {
                            setStatusFilter("all");
                            setDepartmentFilter("all");
                            setSemesterFilter("all");
                            setSearchTerm("");
                          }}
                          className="mt-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  certificates.map((cert, index) => {
                    const workflowStep = getWorkflowStep(cert.workflowStatus);
                    const WorkflowIcon = workflowStep.icon;
                    const missingApprovers = checkForMissingApprovers(cert);

                    return (
                      <tr
                        key={cert.id}
                        className="hover:bg-gray-50 transition-colors group"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-semibold text-sm">
                              {cert.student?.name?.charAt(0) || "S"}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {cert.student?.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {cert.student?.admission_number}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {cert.type.replace("_", " ")}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className="text-sm text-gray-600 max-w-xs truncate"
                            title={cert.reason}
                          >
                            {cert.reason}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(cert.status)}`}
                          >
                            {cert.status === "APPROVED" && (
                              <CheckCircle size={12} />
                            )}
                            {cert.status === "REJECTED" && (
                              <XCircle size={12} />
                            )}
                            {cert.status === "GENERATED" && (
                              <Download size={12} />
                            )}
                            {cert.status === "PENDING" && <Clock size={12} />}
                            {cert.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getWorkflowColor(cert.workflowStatus)}`}
                            >
                              <WorkflowIcon size={12} />
                              {cert.workflowStatus.replace("_", " ")}
                            </span>
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
                          <div className="text-sm text-gray-900">
                            {cert.student?.department?.name || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500">
                            Sem {cert.student?.currentSemester || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={14} className="text-gray-400" />
                            {new Date(cert.requestedAt).toLocaleDateString(
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
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedCertificate(cert);
                                setShowModal(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors text-sm font-medium"
                            >
                              <Eye size={16} />
                              View
                            </button>

                            {canGenerate(cert) && (
                              <button
                                onClick={() => handleGenerate(cert.id)}
                                disabled={processing}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                <FileText size={16} />
                                Generate
                              </button>
                            )}

                            {cert.status === "GENERATED" &&
                              cert.certificateUrl && (
                                <button
                                  onClick={() => handleDownload(cert.id)}
                                  disabled={downloadLoading === cert.id}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
                                >
                                  {downloadLoading === cert.id ? (
                                    <Loader2
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Download size={16} />
                                  )}
                                  PDF
                                </button>
                              )}
                          </div>

                          {cert.status === "REJECTED" &&
                            cert.rejectionReason && (
                              <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                <AlertTriangle size={12} />
                                {cert.rejectionReason}
                              </div>
                            )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {certificates.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Rows per page:</span>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
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
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronsLeft size={20} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronLeft size={20} className="text-gray-600" />
                  </button>
                  <span className="text-sm font-medium px-4 py-2 bg-white rounded-lg border border-gray-200">
                    Page {page} of {totalPages || 1}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronRightIcon size={20} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
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

      {/* Approval Modal */}
      {showModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-teal-100/50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-600 rounded-xl">
                    <FileCheck size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Request Details
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Review and process the request
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedCertificate(null);
                    setRemarks("");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Info Card */}
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-4 text-white">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <GraduationCap size={16} />
                  Student Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-teal-100">Name:</span>
                    <p className="font-medium">
                      {selectedCertificate.student?.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-teal-100">Register No:</span>
                    <p className="font-medium">
                      {selectedCertificate.student?.admission_number}
                    </p>
                  </div>
                  <div>
                    <span className="text-teal-100">Program:</span>
                    <p className="font-medium">
                      {selectedCertificate.student?.program || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-teal-100">Department:</span>
                    <p className="font-medium">
                      {selectedCertificate.student?.department?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-teal-100">Semester:</span>
                    <p className="font-medium">
                      {selectedCertificate.student?.currentSemester || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-teal-600" />
                  Request Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-2 text-gray-900 font-medium">
                      {selectedCertificate.type.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Reason:</span>
                    <p className="mt-1 text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                      {selectedCertificate.reason}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Requested:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(
                        selectedCertificate.requestedAt,
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Workflow Timeline */}
              {selectedCertificate.approvals &&
              selectedCertificate.approvals.length > 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock size={16} className="text-teal-600" />
                    Approval Timeline
                  </h3>
                  <div className="space-y-4">
                    {selectedCertificate.approvals.map((approval, index) => (
                      <div key={approval.id} className="relative flex gap-4">
                        {index <
                          (selectedCertificate.approvals?.length || 0) - 1 && (
                          <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-300"></div>
                        )}
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            approval.action === "FORWARD"
                              ? "bg-green-100"
                              : approval.action === "REJECT"
                                ? "bg-red-100"
                                : approval.action === "APPROVE"
                                  ? "bg-green-100"
                                  : "bg-teal-100"
                          }`}
                        >
                          {approval.action === "FORWARD" && (
                            <Send size={18} className="text-green-600" />
                          )}
                          {approval.action === "APPROVE" && (
                            <CheckCircle size={18} className="text-green-600" />
                          )}
                          {approval.action === "REJECT" && (
                            <XCircle size={18} className="text-red-600" />
                          )}
                          {approval.action === "SUBMIT" && (
                            <FileText size={18} className="text-teal-600" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {approval.role}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                approval.action === "FORWARD"
                                  ? "bg-green-100 text-green-800"
                                  : approval.action === "APPROVE"
                                    ? "bg-green-100 text-green-800"
                                    : approval.action === "REJECT"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-teal-100 text-teal-800"
                              }`}
                            >
                              {approval.action}
                            </span>
                            <span className="text-xs text-gray-500 ml-auto">
                              {new Date(approval.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {approval.remarks && (
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
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <div className="p-4 bg-teal-50 rounded-full inline-block mb-3">
                    <Clock size={32} className="text-teal-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No Approvals Yet
                  </h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    This request hasn't been processed yet.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {canTakeAction(selectedCertificate) && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Remarks{" "}
                      {activeRole !== "principal" && "(required for rejection)"}
                    </label>
                    <textarea
                      placeholder={
                        activeRole === "principal"
                          ? "Enter remarks (optional for approval)..."
                          : "Enter remarks (required for rejection)..."
                      }
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      rows={3}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() =>
                        handleProcess(selectedCertificate.id, "REJECT")
                      }
                      disabled={
                        processing || (!remarks && activeRole !== "principal")
                      }
                      className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2 font-medium"
                    >
                      {processing ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <XCircle size={18} />
                      )}
                      Reject
                    </button>

                    <button
                      onClick={() =>
                        handleProcess(selectedCertificate.id, "FORWARD")
                      }
                      disabled={processing}
                      className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all font-medium flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      {processing ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                      {activeRole === "principal"
                        ? "Approve"
                        : "Approve & Forward"}
                    </button>
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
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default StaffCertificatePage;
