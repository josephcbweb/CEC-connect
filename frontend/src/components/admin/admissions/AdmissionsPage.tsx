import React, { useEffect, useState } from "react";
import { admissionService } from "../../../services/admissionService";
import type {
  AdmissionStudent,
  AdmissionStats,
} from "../../../types/admission";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  Loader2,
  User,
  GraduationCap,
  FileText,
  UserPlus,
  Building2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import AdmissionWindowSettings from "./AdmissionWindowSettings";

interface BatchDepartment {
  id: number;
  department: {
    id: number;
    name: string;
    department_code: string;
  };
  classes: {
    id: number;
    name: string;
    _count: { students: number };
  }[];
}

interface Batch {
  id: number;
  name: string;
  startYear: number;
  endYear: number;
  status: string;
  batchDepartments: BatchDepartment[];
  admissionWindow: {
    program: "btech" | "mca";
  } | null;
}

interface ApprovedStudent {
  id: number;
  name: string;
  email: string;
  program: string;
  admission_number: string;
  entrance_rank: number | null;
  admission_type: string;
  category: string;
  preferredDepartmentId: number | null;
  preferredDepartment: {
    id: number;
    name: string;
    department_code: string;
  } | null;
}

type TabType = "applications" | "assign-classes";

const AdmissionsPage: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("applications");
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Applications tab state
  const [students, setStudents] = useState<AdmissionStudent[]>([]);
  const [stats, setStats] = useState<AdmissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: "all",
    program: "all",
    search: "",
    admissionType: "all",
  });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedStudent, setSelectedStudent] =
    useState<AdmissionStudent | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    page: 1,
    limit: 20,
  });

  // Class assignment tab state
  const [approvedStudents, setApprovedStudents] = useState<ApprovedStudent[]>(
    [],
  );
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedDepartment, setSelectedDepartment] =
    useState<BatchDepartment | null>(null);
  const [selectedApprovedIds, setSelectedApprovedIds] = useState<number[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignmentProgramFilter, setAssignmentProgramFilter] = useState("all");
  const [assignmentDepartmentFilter, setAssignmentDepartmentFilter] =
    useState<string>("all");
  const [availableDepartments, setAvailableDepartments] = useState<
    { id: number; name: string; department_code: string }[]
  >([]);

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    if (activeTab === "assign-classes") {
      fetchAssignmentData();
      fetchDepartments();
    }
  }, [activeTab, assignmentProgramFilter, assignmentDepartmentFilter]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/department", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setAvailableDepartments(data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [admissionsData, statsData] = await Promise.all([
        admissionService.getAdmissions(filters),
        admissionService.getStats(),
      ]);
      setStudents(admissionsData.data || []);
      if (admissionsData.pagination) {
        setPagination(admissionsData.pagination);
      }
      setStats(statsData.stats);
    } catch (error) {
      console.error("Error fetching data:", error);
      showMessage("error", "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentData = async () => {
    setAssignmentLoading(true);
    try {
      const [studentsData, batchesData] = await Promise.all([
        admissionService.getApprovedStudentsForAssignment({
          program:
            assignmentProgramFilter !== "all"
              ? assignmentProgramFilter
              : undefined,
          preferredDepartmentId:
            assignmentDepartmentFilter !== "all"
              ? parseInt(assignmentDepartmentFilter)
              : undefined,
        }),
        admissionService.getBatchesForAssignment(),
      ]);
      setApprovedStudents(studentsData.data || []);
      setBatches(batchesData.data || []);
    } catch (error) {
      console.error("Error fetching assignment data:", error);
      showMessage("error", "Failed to fetch assignment data");
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      setUpdating(id);
      await admissionService.updateStatus(id, status);
      await fetchData();
      showMessage("success", `Application ${status} successfully`);
    } catch (error) {
      console.error("Error updating status:", error);
      showMessage("error", "Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const handleBulkUpdate = async (status: string) => {
    if (selectedIds.length === 0) {
      showMessage("error", "Please select at least one application");
      return;
    }
    if (
      !confirm(
        `Are you sure you want to ${status} ${selectedIds.length} applications?`,
      )
    ) {
      return;
    }
    try {
      setBulkUpdating(true);
      await admissionService.bulkUpdateStatus(selectedIds, status);
      setSelectedIds([]);
      await fetchData();
      showMessage(
        "success",
        `${selectedIds.length} applications updated successfully`,
      );
    } catch (error) {
      console.error("Error bulk updating:", error);
      showMessage("error", "Failed to update applications");
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleAutoAssign = async () => {
    if (selectedApprovedIds.length === 0) {
      showMessage("error", "Please select at least one student");
      return;
    }
    if (!selectedDepartment) {
      showMessage("error", "Please select a department");
      return;
    }
    if (selectedDepartment.classes.length === 0) {
      showMessage(
        "error",
        `No classes found for ${selectedDepartment.department.name}. Please create classes first in the Manage Classes section.`,
      );
      return;
    }
    if (
      !confirm(
        `Auto-assign ${selectedApprovedIds.length} students to ${selectedDepartment.department.name} classes?`,
      )
    ) {
      return;
    }

    setAssigning(true);
    try {
      await admissionService.autoAssignStudents(
        selectedApprovedIds,
        selectedDepartment.id,
      );
      showMessage(
        "success",
        `${selectedApprovedIds.length} students assigned successfully`,
      );
      setSelectedApprovedIds([]);
      await fetchAssignmentData();
    } catch (error: any) {
      console.error("Error auto-assigning students:", error);
      showMessage(
        "error",
        error.response?.data?.error || "Failed to assign students",
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignToClass = async (classId: number, className: string) => {
    if (selectedApprovedIds.length === 0) {
      showMessage("error", "Please select at least one student");
      return;
    }
    if (
      !confirm(
        `Assign ${selectedApprovedIds.length} students to class ${className}?`,
      )
    ) {
      return;
    }

    setAssigning(true);
    try {
      await admissionService.bulkAssignToClass(selectedApprovedIds, classId);
      showMessage(
        "success",
        `${selectedApprovedIds.length} students assigned to ${className}`,
      );
      setSelectedApprovedIds([]);
      await fetchAssignmentData();
    } catch (error: any) {
      console.error("Error assigning students:", error);
      showMessage(
        "error",
        error.response?.data?.error || "Failed to assign students",
      );
    } finally {
      setAssigning(false);
    }
  };

  const toggleApprovedSelect = (id: number) => {
    const newSelection = selectedApprovedIds.includes(id)
      ? selectedApprovedIds.filter((i) => i !== id)
      : [...selectedApprovedIds, id];

    setSelectedApprovedIds(newSelection);

    // Auto-suggest department based on preferred department of selected students
    if (newSelection.length === 1) {
      const selectedStudent = approvedStudents.find(
        (s) => s.id === newSelection[0],
      );
      if (selectedStudent?.preferredDepartment && selectedBatch) {
        // Find matching batch department
        const matchingBatchDept = selectedBatch.batchDepartments.find(
          (bd) => bd.department.id === selectedStudent.preferredDepartment?.id,
        );
        if (matchingBatchDept) {
          setSelectedDepartment(matchingBatchDept);
        }
      }
    }
  };

  const toggleSelectAllApproved = () => {
    if (selectedApprovedIds.length === approvedStudents.length) {
      setSelectedApprovedIds([]);
    } else {
      setSelectedApprovedIds(approvedStudents.map((s) => s.id));
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      waitlisted: "bg-blue-100 text-blue-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === students.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map((s) => s.id));
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Admissions Dashboard
        </h1>
        <button
          onClick={() => setShowSettingsModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all transform hover:scale-105"
        >
          <Settings className="w-4 h-4" />
          Manage Windows
        </button>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg animate-slide-down shadow-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("applications")}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === "applications"
                ? "border-teal-500 text-teal-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FileText className="w-5 h-5" />
            Applications
          </button>
          <button
            onClick={() => setActiveTab("assign-classes")}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === "assign-classes"
                ? "border-teal-500 text-teal-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <UserPlus className="w-5 h-5" />
            Assign to Classes
            {(stats?.approved || 0) > 0 && (
              <span className="ml-1 bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                {stats?.approved}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Applications Tab Content */}
      {activeTab === "applications" && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                label: "Total Applications",
                value: stats?.total || 0,
                icon: Users,
                color: "teal",
              },
              {
                label: "Pending",
                value: stats?.pending || 0,
                icon: Clock,
                color: "yellow",
              },
              {
                label: "Approved",
                value: stats?.approved || 0,
                icon: CheckCircle,
                color: "green",
              },
              {
                label: "Rejected",
                value: stats?.rejected || 0,
                icon: XCircle,
                color: "red",
              },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 transition-all hover:shadow-md transform hover:-translate-y-1 animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p
                      className={`text-2xl font-bold text-${stat.color}-600 transition-all`}
                    >
                      {loading ? (
                        <span className="inline-block animate-pulse">---</span>
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>
                  <stat.icon
                    className={`w-10 h-10 text-${stat.color}-600 opacity-80`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Name, email, admission number..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value, page: 1 })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program
                </label>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  value={filters.program}
                  onChange={(e) =>
                    setFilters({ ...filters, program: e.target.value, page: 1 })
                  }
                >
                  <option value="all">All Programs</option>
                  <option value="btech">B.Tech</option>
                  <option value="mca">MCA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value, page: 1 })
                  }
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="waitlisted">Waitlisted</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  value={filters.admissionType}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      admissionType: e.target.value,
                      page: 1,
                    })
                  }
                >
                  <option value="all">All Types</option>
                  <option value="regular">Regular</option>
                  <option value="lateral">Lateral</option>
                  <option value="nri">NRI</option>
                  <option value="management">Management</option>
                </select>
              </div>
              <button
                onClick={fetchData}
                disabled={loading}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 flex items-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="bg-teal-50 p-4 rounded-lg flex items-center justify-between border border-teal-200 animate-slide-down">
              <span className="text-sm font-medium text-teal-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {selectedIds.length} applications selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkUpdate("approved")}
                  disabled={bulkUpdating}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-all transform hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                >
                  {bulkUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Approve Selected
                </button>
                <button
                  onClick={() => handleBulkUpdate("rejected")}
                  disabled={bulkUpdating}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-all transform hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                >
                  {bulkUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Reject Selected
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-4 py-2 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 transition-all"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.length === students.length &&
                          students.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adm. No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Program
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
                          <span className="text-gray-500">
                            Loading applications...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 font-medium">
                          No applications found
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Try adjusting your filters
                        </p>
                      </td>
                    </tr>
                  ) : (
                    students.map((student, index) => (
                      <tr
                        key={student.id}
                        className="hover:bg-gray-50 transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(student.id)}
                            onChange={() => toggleSelect(student.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {student.admission_number || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {student.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {student.student_phone_number}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 uppercase">
                          {student.program}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 capitalize">
                          {student.admission_type}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(student.status)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedStudent(student)}
                              className="text-teal-600 hover:text-teal-900 font-medium transition-colors"
                            >
                              View
                            </button>
                            {student.status === "pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(student.id, "approved")
                                  }
                                  disabled={updating === student.id}
                                  className="text-green-600 hover:text-green-900 font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  {updating === student.id && (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  )}
                                  Approve
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(student.id, "rejected")
                                  }
                                  disabled={updating === student.id}
                                  className="text-red-600 hover:text-red-900 font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  {updating === student.id && (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  )}
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() =>
                  setFilters({
                    ...filters,
                    page: Math.max(1, filters.page - 1),
                  })
                }
                disabled={filters.page <= 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setFilters({
                    ...filters,
                    page: Math.min(
                      pagination.totalPages || 1,
                      filters.page + 1,
                    ),
                  })
                }
                disabled={filters.page >= (pagination.totalPages || 1)}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {students.length > 0
                      ? (filters.page - 1) * filters.limit + 1
                      : 0}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(filters.page * filters.limit, pagination.total)}
                  </span>{" "}
                  of <span className="font-medium">{pagination.total}</span>{" "}
                  results
                </p>
                <select
                  value={filters.limit}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      limit: Number(e.target.value),
                      page: 1,
                    })
                  }
                  className="block rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6"
                >
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>
              </div>
              <div>
                <nav
                  className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() =>
                      setFilters({
                        ...filters,
                        page: Math.max(1, filters.page - 1),
                      })
                    }
                    disabled={filters.page <= 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  {[...Array(Math.min(7, pagination.totalPages || 1))].map(
                    (_, i) => {
                      let pageNum;
                      if ((pagination.totalPages || 1) <= 7) {
                        pageNum = i + 1;
                      } else {
                        const startPage = Math.max(
                          1,
                          Math.min(
                            filters.page - 3,
                            (pagination.totalPages || 1) - 6,
                          ),
                        );
                        pageNum = startPage + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() =>
                            setFilters({ ...filters, page: pageNum })
                          }
                          aria-current={
                            filters.page === pageNum ? "page" : undefined
                          }
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            filters.page === pageNum
                              ? "z-10 bg-teal-600 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                              : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    },
                  )}
                  <button
                    onClick={() =>
                      setFilters({
                        ...filters,
                        page: Math.min(
                          pagination.totalPages || 1,
                          filters.page + 1,
                        ),
                      })
                    }
                    disabled={filters.page >= (pagination.totalPages || 1)}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Student Detail Modal */}
          {selectedStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto animate-fade-in backdrop-blur-sm">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl my-8 animate-scale-in">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-teal-50 to-white">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Application Details
                  </h2>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl transition-colors hover:rotate-90 transform duration-200"
                  >
                    ×
                  </button>
                </div>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  {/* Personal Info */}
                  <div
                    className="animate-slide-down"
                    style={{ animationDelay: "100ms" }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <User className="w-5 h-5 mr-2 text-teal-600" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Name:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedStudent.name}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">
                          Admission Number:
                        </span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedStudent.admission_number}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Email:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedStudent.email}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Phone:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedStudent.student_phone_number}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">
                          Date of Birth:
                        </span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedStudent.dateOfBirth || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Gender:</span>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {selectedStudent.gender}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">
                          Blood Group:
                        </span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedStudent.blood_group || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Aadhaar:</span>
                        <p className="text-sm font-medium text-gray-900">
                          ************{selectedStudent.aadhaar_number.slice(-4)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Parent Info */}
                  <div
                    className="animate-slide-down"
                    style={{ animationDelay: "200ms" }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      Parent/Guardian Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">
                          Father's Name:
                        </span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedStudent.fatherName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">
                          Father's Phone:
                        </span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedStudent.father_phone_number || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">
                          Mother's Name:
                        </span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedStudent.motherName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">
                          Mother's Phone:
                        </span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedStudent.mother_phone_number || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Education Info */}
                  <div
                    className="animate-slide-down"
                    style={{ animationDelay: "300ms" }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <GraduationCap className="w-5 h-5 mr-2 text-purple-600" />
                      Education Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">
                          Qualifying Exam:
                        </span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedStudent.qualifying_exam_name}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">
                          Register No:
                        </span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedStudent.qualifying_exam_register_no}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">
                          Percentage:
                        </span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedStudent.percentage || "N/A"}%
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">
                          Last Institution:
                        </span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedStudent.last_institution}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Admission Info */}
                  <div
                    className="animate-slide-down"
                    style={{ animationDelay: "400ms" }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-orange-600" />
                      Admission Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Program:</span>
                        <p className="text-sm font-medium text-gray-900 uppercase">
                          {selectedStudent.program}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">
                          Admission Type:
                        </span>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {selectedStudent.admission_type}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Status:</span>
                        {getStatusBadge(selectedStudent.status)}
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">
                          Department:
                        </span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedStudent.department?.name || "Not Assigned"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex gap-3 pt-4 border-t animate-slide-down"
                    style={{ animationDelay: "500ms" }}
                  >
                    {selectedStudent.status === "pending" && (
                      <>
                        <button
                          onClick={() => {
                            handleStatusUpdate(selectedStudent.id, "approved");
                            setSelectedStudent(null);
                          }}
                          disabled={updating === selectedStudent.id}
                          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-105 active:scale-95"
                        >
                          {updating === selectedStudent.id && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                          Approve Application
                        </button>
                        <button
                          onClick={() => {
                            handleStatusUpdate(selectedStudent.id, "rejected");
                            setSelectedStudent(null);
                          }}
                          disabled={updating === selectedStudent.id}
                          className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-105 active:scale-95"
                        >
                          {updating === selectedStudent.id && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                          Reject Application
                        </button>
                        <button
                          onClick={() => {
                            handleStatusUpdate(
                              selectedStudent.id,
                              "waitlisted",
                            );
                            setSelectedStudent(null);
                          }}
                          disabled={updating === selectedStudent.id}
                          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-105 active:scale-95"
                        >
                          {updating === selectedStudent.id && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                          Mark as Waitlisted
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Assign to Classes Tab Content */}
      {activeTab === "assign-classes" && (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <UserPlus className="w-6 h-6 text-teal-600" />
                  Assign Students to Classes
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Approved students who haven't been assigned to a class yet
                </p>
              </div>
              <button
                onClick={fetchAssignmentData}
                disabled={assignmentLoading}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${assignmentLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-end flex-wrap">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Program
                </label>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  value={assignmentProgramFilter}
                  onChange={(e) => setAssignmentProgramFilter(e.target.value)}
                >
                  <option value="all">All Programs</option>
                  <option value="btech">B.Tech</option>
                  <option value="mca">MCA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Preferred Department
                </label>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  value={assignmentDepartmentFilter}
                  onChange={(e) =>
                    setAssignmentDepartmentFilter(e.target.value)
                  }
                >
                  <option value="all">All Departments</option>
                  {availableDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id.toString()}>
                      {dept.name} ({dept.department_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {assignmentLoading ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
              <span className="text-gray-500">Loading assignment data...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Students List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    Approved Students ({approvedStudents.length})
                  </h3>
                  {selectedApprovedIds.length > 0 && (
                    <span className="text-sm text-teal-600 font-medium">
                      {selectedApprovedIds.length} selected
                    </span>
                  )}
                </div>

                {approvedStudents.length === 0 ? (
                  <div className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium">
                      All approved students are assigned
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      No students pending class assignment
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-gray-50 border-b flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={
                          selectedApprovedIds.length === approvedStudents.length
                        }
                        onChange={toggleSelectAllApproved}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-600">Select All</span>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                      {approvedStudents.map((student) => (
                        <div
                          key={student.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                            selectedApprovedIds.includes(student.id)
                              ? "bg-teal-50"
                              : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selectedApprovedIds.includes(student.id)}
                              onChange={() => toggleApprovedSelect(student.id)}
                              className="rounded mt-1"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {student.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {student.admission_number}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                                <span className="uppercase bg-gray-100 px-2 py-0.5 rounded">
                                  {student.program}
                                </span>
                                <span className="capitalize">
                                  {student.admission_type}
                                </span>
                                {student.entrance_rank && (
                                  <span>Rank: {student.entrance_rank}</span>
                                )}
                              </div>
                              {student.preferredDepartment && (
                                <div className="mt-2">
                                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-medium">
                                    Preferred:{" "}
                                    {student.preferredDepartment.name} (
                                    {
                                      student.preferredDepartment
                                        .department_code
                                    }
                                    )
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Right: Batch & Class Selection */}
              {approvedStudents.length > 0 && (
                <div className="space-y-4">
                  {/* Batch Selection */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        Select Batch & Department
                      </h3>
                    </div>
                    <div className="p-4 space-y-4">
                      {batches.length === 0 ? (
                        <div className="text-center py-4">
                          <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">
                            No active batches found
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Batch Dropdown */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Batch
                            </label>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              value={selectedBatch?.id || ""}
                              onChange={(e) => {
                                const batch = batches.find(
                                  (b) => b.id === parseInt(e.target.value),
                                );
                                setSelectedBatch(batch || null);
                                setSelectedDepartment(null);
                              }}
                            >
                              <option value="">-- Select Batch --</option>
                              {batches.map((batch) => (
                                <option key={batch.id} value={batch.id}>
                                  {batch.name} (
                                  {batch.admissionWindow?.program?.toUpperCase() ||
                                    "N/A"}
                                  ) - {batch.status}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Department Selection */}
                          {selectedBatch && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Department
                              </label>
                              <div className="space-y-2">
                                {selectedBatch.batchDepartments.map((bd) => (
                                  <div
                                    key={bd.id}
                                    onClick={() => setSelectedDepartment(bd)}
                                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                      selectedDepartment?.id === bd.id
                                        ? "border-teal-500 bg-teal-50"
                                        : "border-gray-200 hover:border-gray-300"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium text-gray-900">
                                          {bd.department.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          Code: {bd.department.department_code}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        {bd.classes.length === 0 ? (
                                          <span className="flex items-center gap-1 text-amber-600 text-sm">
                                            <AlertTriangle className="w-4 h-4" />
                                            No classes
                                          </span>
                                        ) : (
                                          <span className="text-sm text-gray-500">
                                            {bd.classes.length} class
                                            {bd.classes.length > 1 ? "es" : ""}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Classes / Assignment Actions */}
                  {selectedDepartment && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">
                          Classes in {selectedDepartment.department.name}
                        </h3>
                      </div>
                      <div className="p-4">
                        {selectedDepartment.classes.length === 0 ? (
                          <div className="text-center py-6">
                            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-2" />
                            <p className="text-gray-600 font-medium">
                              No classes available
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Please create classes for this department first.
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                              Go to{" "}
                              <span className="font-medium text-teal-600">
                                Manage Batches → {selectedBatch?.name}
                              </span>{" "}
                              to add classes.
                            </p>
                          </div>
                        ) : (
                          <>
                            {/* Auto Assign Button */}
                            <div className="mb-4">
                              <button
                                onClick={handleAutoAssign}
                                disabled={
                                  assigning || selectedApprovedIds.length === 0
                                }
                                className="w-full px-4 py-3 bg-gradient-to-r from-teal-600 to-green-600 text-white rounded-lg hover:from-teal-700 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                              >
                                {assigning ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <UserPlus className="w-5 h-5" />
                                )}
                                Auto-Assign{" "}
                                {selectedApprovedIds.length > 0
                                  ? `(${selectedApprovedIds.length} students)`
                                  : "Selected Students"}
                              </button>
                              <p className="text-xs text-gray-500 text-center mt-2">
                                Distributes students evenly across all classes
                              </p>
                            </div>

                            <div className="border-t pt-4">
                              <p className="text-sm text-gray-600 mb-3">
                                Or assign to specific class:
                              </p>
                              <div className="space-y-2">
                                {selectedDepartment.classes.map((cls) => (
                                  <div
                                    key={cls.id}
                                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-teal-300 transition-colors"
                                  >
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {cls.name}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {cls._count.students} student
                                        {cls._count.students !== 1 ? "s" : ""}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() =>
                                        handleAssignToClass(cls.id, cls.name)
                                      }
                                      disabled={
                                        assigning ||
                                        selectedApprovedIds.length === 0
                                      }
                                      className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded-md hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Assign
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">
                Admission Window Settings
              </h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close settings"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <AdmissionWindowSettings />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slide-down {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
          opacity: 0;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
          opacity: 0;
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AdmissionsPage;
