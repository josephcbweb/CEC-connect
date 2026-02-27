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
  X
} from "lucide-react";
import { jwtDecode } from "jwt-decode";

interface UserData {
  userId?: string;
  id?: string | number;
  userName: string;
  name?: string;
  email?: string;
}

interface Department {
  id: number;
  name: string;
  department_code: string;
  program: string;
}

// Extend the Certificate type to include currentSemester
interface ExtendedCertificate extends Certificate {
  student?: Certificate['student'] & {
    currentSemester?: number;
    department?: {
      id?: number;
      name: string;
    };
  };
}

const StaffCertificatePage: React.FC = () => {
  const [certificates, setCertificates] = useState<ExtendedCertificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<ExtendedCertificate | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [processing, setProcessing] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState<number | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  
  // State for user role and loading
  const [userRole, setUserRole] = useState<string>("");
  const [loadingRole, setLoadingRole] = useState(true);
  
  // Advisor details state (just for display)
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
  
  // Only get userId from token
  const tokenData = jwtDecode<UserData>(token);
  console.log('Decoded token data:', tokenData);
  
  const userId = String(tokenData.userId || tokenData.id || '');
  console.log('Extracted userId:', userId);

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  // Determine user role by trying each certificate endpoint
  useEffect(() => {
    if (userId) {
      determineUserRole();
    }
  }, [userId]);

  const determineUserRole = async () => {
    setLoadingRole(true);
    
    try {
      // Check HOD first (highest priority)
      const hodResponse = await fetch(
        `http://localhost:3000/api/certificates/role/hod/${userId}?limit=5`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (hodResponse.ok) {
        const hodData = await hodResponse.json();
        if (hodData.data && hodData.data.length > 0) {
          console.log('User is HOD - found certificates');
          setUserRole('hod');
          setAdvisorName('Head of Department');
          setLoadingRole(false);
          return;
        }
      }

      // Check Principal
      const principalResponse = await fetch(
        `http://localhost:3000/api/certificates/role/principal/${userId}?limit=5`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (principalResponse.ok) {
        const principalData = await principalResponse.json();
        if (principalData.data && principalData.data.length > 0) {
          console.log('User is Principal - found certificates');
          setUserRole('principal');
          setAdvisorName('Principal');
          setLoadingRole(false);
          return;
        }
      }

      // Check Office
      const officeResponse = await fetch(
        `http://localhost:3000/api/certificates/role/office/${userId}?limit=5`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (officeResponse.ok) {
        const officeData = await officeResponse.json();
        if (officeData.data && officeData.data.length > 0) {
          console.log('User is Office Staff - found certificates');
          setUserRole('office');
          setAdvisorName('Office Staff');
          setLoadingRole(false);
          return;
        }
      }

      // Check Advisor (lowest priority)
      const advisorResponse = await fetch(
        `http://localhost:3000/api/certificates/role/advisor/${userId}?limit=5`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (advisorResponse.ok) {
        console.log('User is Advisor');
        setUserRole('advisor');
        
        if (tokenData.name) {
          setAdvisorName(tokenData.name);
        } else {
          setAdvisorName('Class Advisor');
        }
        setLoadingRole(false);
        return;
      }

      // If none of the above worked, default to advisor
      console.log('No role detected, defaulting to advisor');
      setUserRole('advisor');
      setAdvisorName('Class Advisor');
      
    } catch (error) {
      console.error("Error determining user role:", error);
      setUserRole('advisor');
      setAdvisorName('Class Advisor');
    } finally {
      setLoadingRole(false);
    }
  };

  // Fetch certificates based on role with all filters
  const fetchCertificates = async () => {
    if (!userId || !userRole) {
      console.error('Missing userId or userRole');
      return;
    }

    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== "all") queryParams.append("status", statusFilter);
      if (searchTerm) queryParams.append("search", searchTerm);
      
      if (departmentFilter !== "all") queryParams.append("departmentId", departmentFilter);
      if (semesterFilter !== "all") queryParams.append("semester", semesterFilter);
      
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      const url = `http://localhost:3000/api/certificates/role/${userRole}/${userId}?${queryParams.toString()}`;
      
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        setCertificates(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.total || 0);
      } else {
        console.error('Response not OK:', response.status);
      }
    } catch (error) {
      console.error("Error fetching certificates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && userRole && !loadingRole) {
      fetchCertificates();
    }
  }, [statusFilter, searchTerm, departmentFilter, semesterFilter, page, limit, userId, userRole, loadingRole]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchTerm, departmentFilter, semesterFilter]);

  // Role display names and icons with teal theme
  const roleConfig: Record<string, { label: string, icon: React.ReactNode, color: string, bgGradient: string }> = {
    advisor: { 
      label: 'Class Advisor', 
      icon: <UserCog size={20} />, 
      color: 'text-teal-600 bg-teal-50',
      bgGradient: 'from-teal-500 to-teal-600'
    },
    hod: { 
      label: 'Head of Department', 
      icon: <Building2 size={20} />, 
      color: 'text-emerald-600 bg-emerald-50',
      bgGradient: 'from-emerald-500 to-teal-600'
    },
    office: { 
      label: 'Office Staff', 
      icon: <FileText size={20} />, 
      color: 'text-amber-600 bg-amber-50',
      bgGradient: 'from-amber-500 to-orange-500'
    },
    principal: { 
      label: 'Principal', 
      icon: <Crown size={20} />, 
      color: 'text-purple-600 bg-purple-50',
      bgGradient: 'from-purple-500 to-pink-500'
    }
  };

  // Show loading while determining role
  if (loadingRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-teal-500" size={24} />
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Get display name based on role
  const getDisplayName = () => {
    if (advisorName) return advisorName;
    return roleConfig[userRole]?.label || userRole;
  };

  // Get welcome message based on role
  const getWelcomeMessage = () => {
    switch(userRole) {
      case 'hod':
        return "Review department certificate requests forwarded by advisors";
      case 'principal':
        return "Final approval for certificate requests";
      case 'office':
        return "Verify and process certificate requests";
      case 'advisor':
        return "Review and forward certificate requests from your advisees";
      default:
        return "Manage certificate requests";
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
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
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
        
        // Show success notification
        showNotification("Certificate processed successfully!", "success");
      } else {
        const error = await response.json();
        showNotification(error.error || "Failed to process certificate", "error");
      }
    } catch (error) {
      console.error("Error processing certificate:", error);
      showNotification("Failed to process certificate", "error");
    } finally {
      setProcessing(false);
    }
  };

  const showNotification = (message: string, type: "success" | "error") => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    } text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('animate-slide-out');
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
      showNotification("Failed to download certificate. Please try again.", "error");
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
            "Authorization": `Bearer ${token}`
          }
        }
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
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 transition-opacity duration-500 ${animateIn ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 bg-gradient-to-r ${roleConfig[userRole]?.bgGradient || 'from-teal-500 to-teal-600'} rounded-xl shadow-lg`}>
              {userRole === 'advisor' && <UserCog size={32} className="text-white" />}
              {userRole === 'hod' && <Building2 size={32} className="text-white" />}
              {userRole === 'office' && <FileText size={32} className="text-white" />}
              {userRole === 'principal' && <Crown size={32} className="text-white" />}
              {!userRole && <FileCheck size={32} className="text-white" />}
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
                Certificate Management
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${roleConfig[userRole]?.color || 'bg-gray-100 text-gray-700'}`}>
                  {getDisplayName()}
                </span>
                <p className="text-gray-600 flex items-center gap-1">
                  <Shield size={14} className="text-teal-500" />
                  {getWelcomeMessage()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters - Enhanced with Department and Semester */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-50 to-teal-100/50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-teal-600" />
              <h3 className="font-semibold text-gray-800">Filter Certificates</h3>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
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
                <option value="all">Requests</option>
                <option value="WITH_ADVISOR">Advisor</option>
                <option value="WITH_HOD">HOD</option>
                <option value="WITH_OFFICE">Office</option>
                <option value="WITH_PRINCIPAL">Principal</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>

              {/* Department Filter */}
              {(userRole === 'hod' || userRole === 'office' || userRole === 'principal') && (
                <select
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
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
                {semesters.map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>

            {/* Active filters display */}
            {(statusFilter !== 'all' || departmentFilter !== 'all' || semesterFilter !== 'all' || searchTerm) && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500 mr-2">Active filters:</span>
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium border border-teal-200">
                    Status: {statusFilter.replace('_', ' ')}
                    <button onClick={() => setStatusFilter('all')} className="hover:text-teal-900 ml-1">
                      <X size={14} />
                    </button>
                  </span>
                )}
                {departmentFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-200">
                    Dept: {departments.find(d => d.id === Number(departmentFilter))?.name || departmentFilter}
                    <button onClick={() => setDepartmentFilter('all')} className="hover:text-purple-900 ml-1">
                      <X size={14} />
                    </button>
                  </span>
                )}
                {semesterFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
                    Semester: {semesterFilter}
                    <button onClick={() => setSemesterFilter('all')} className="hover:text-blue-900 ml-1">
                      <X size={14} />
                    </button>
                  </span>
                )}
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium border border-gray-200">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm('')} className="hover:text-gray-900 ml-1">
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
              <h2 className="font-semibold text-gray-800">Certificate Requests</h2>
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Workflow</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dept/Sem</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Requested</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                          <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-teal-500" size={16} />
                        </div>
                        <p className="text-gray-500">Loading certificates...</p>
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
                        <h3 className="text-lg font-semibold text-gray-700">No Certificate Requests</h3>
                        <p className="text-gray-500 max-w-sm">
                          No certificate requests match your current filters.
                        </p>
                        <button
                          onClick={() => {
                            setStatusFilter('all');
                            setDepartmentFilter('all');
                            setSemesterFilter('all');
                            setSearchTerm('');
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
                    
                    return (
                      <tr 
                        key={cert.id} 
                        className="hover:bg-gray-50 transition-colors group"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-semibold text-sm">
                              {cert.student?.name?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{cert.student?.name}</div>
                              <div className="text-xs text-gray-500">{cert.student?.admission_number}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {cert.type.replace("_", " ")}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate" title={cert.reason}>
                            {cert.reason}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(cert.status)}`}>
                            {cert.status === "APPROVED" && <CheckCircle size={12} />}
                            {cert.status === "REJECTED" && <XCircle size={12} />}
                            {cert.status === "GENERATED" && <Download size={12} />}
                            {cert.status === "PENDING" && <Clock size={12} />}
                            {cert.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getWorkflowColor(cert.workflowStatus)}`}>
                            <WorkflowIcon size={12} />
                            {cert.workflowStatus.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{cert.student?.department?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">Sem {cert.student?.currentSemester || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={14} className="text-gray-400" />
                            {new Date(cert.requestedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
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
                            
                            {cert.status === "GENERATED" && cert.certificateUrl && (
                              <button
                                onClick={() => handleDownload(cert.id)}
                                disabled={downloadLoading === cert.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                {downloadLoading === cert.id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Download size={16} />
                                )}
                                PDF
                              </button>
                            )}
                          </div>
                          
                          {cert.status === "REJECTED" && cert.rejectionReason && (
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
                        <option key={l} value={l}>{l}</option>
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
                    <h2 className="text-2xl font-bold text-gray-900">Certificate Request Details</h2>
                    <p className="text-sm text-gray-600 mt-1">Review and process the certificate request</p>
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
                    <p className="font-medium">{selectedCertificate.student?.name}</p>
                  </div>
                  <div>
                    <span className="text-teal-100">Register No:</span>
                    <p className="font-medium">{selectedCertificate.student?.admission_number}</p>
                  </div>
                  <div>
                    <span className="text-teal-100">Program:</span>
                    <p className="font-medium">{selectedCertificate.student?.program || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-teal-100">Department:</span>
                    <p className="font-medium">{selectedCertificate.student?.department?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-teal-100">Semester:</span>
                    <p className="font-medium">{selectedCertificate.student?.currentSemester || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-teal-600" />
                  Certificate Details
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
                      {new Date(selectedCertificate.requestedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Workflow Timeline */}
              {selectedCertificate.approvals && selectedCertificate.approvals.length > 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock size={16} className="text-teal-600" />
                    Approval Timeline
                  </h3>
                  <div className="space-y-4">
                    {selectedCertificate.approvals.map((approval, index) => (
                      <div key={approval.id} className="relative flex gap-4">
                        {index < (selectedCertificate.approvals?.length || 0) - 1 && (
                          <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-300"></div>
                        )}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          approval.action === 'FORWARD' ? 'bg-green-100' :
                          approval.action === 'REJECT' ? 'bg-red-100' :
                          approval.action === 'APPROVE' ? 'bg-green-100' :
                          'bg-teal-100'
                        }`}>
                          {approval.action === 'FORWARD' && <Send size={18} className="text-green-600" />}
                          {approval.action === 'APPROVE' && <CheckCircle size={18} className="text-green-600" />}
                          {approval.action === 'REJECT' && <XCircle size={18} className="text-red-600" />}
                          {approval.action === 'SUBMIT' && <FileText size={18} className="text-teal-600" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{approval.role}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              approval.action === 'FORWARD' ? 'bg-green-100 text-green-800' :
                              approval.action === 'APPROVE' ? 'bg-green-100 text-green-800' :
                              approval.action === 'REJECT' ? 'bg-red-100 text-red-800' :
                              'bg-teal-100 text-teal-800'
                            }`}>
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
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Approvals Yet</h3>
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
                      Remarks {userRole !== 'principal' && '(required for rejection)'}
                    </label>
                    <textarea
                      placeholder={userRole === 'principal' 
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
                      onClick={() => handleProcess(selectedCertificate.id, 'REJECT')}
                      disabled={processing || (!remarks && userRole !== 'principal')}
                      className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2 font-medium"
                    >
                      {processing ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                      Reject
                    </button>
                    
                    <button
                      onClick={() => handleProcess(selectedCertificate.id, 'FORWARD')}
                      disabled={processing}
                      className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all font-medium flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      {processing ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                      {userRole === 'principal' ? 'Approve' : 'Approve & Forward'}
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