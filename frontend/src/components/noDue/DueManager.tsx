import React, { useState, useEffect } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { Link } from "react-router-dom";
import {
  Search,
  Clock,
  Loader2,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import jsPDF from "jspdf";
import { usePermissions } from "../../hooks/usePermissions";
import CourseManager from "../admin/courses/CourseManager";
import DueSettingsPanel from "./DueSettingsPanel";
import { Settings as SettingsIcon, LayoutList, BookCopy } from "lucide-react";

interface DueItem {
  id: number;
  requestId: number;
  studentId?: number;
  studentName?: string;
  registerNo?: string;
  semester?: number;
  program?: string;
  department?: string | { name: string };
  student?: {
    id: number;
    name: string;
    registerNo: string;
    semester: number;
    program: string;
    department: {
      name: string;
    };
  };
  dueType: string;
  status: "pending" | "cleared" | "archived";
  updatedAt: string;
}

const DueManager = () => {
  usePageTitle("Due Management");
  const [approvals, setApprovals] = useState<DueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [programFilter, setProgramFilter] = useState<string>("BTECH");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [departments, setDepartments] = useState<
    { id: number; name: string; program: string }[]
  >([]);
  const [typeFilter, setTypeFilter] = useState<"all" | "academic" | "service">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<
    "pending" | "cleared" | "archived"
  >("pending");
  const [expandedRequestId, setExpandedRequestId] = useState<number | null>(
    null,
  );
  const [processingDueIds, setProcessingDueIds] = useState<number[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSemester, setBulkSemester] = useState(1);
  const [bulkProgram, setBulkProgram] = useState("BTECH");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [initiationStats, setInitiationStats] = useState<{
    total: number;
    initiated: number;
    toBeInitiated: number;
  } | null>(null);
  const [checkingStats, setCheckingStats] = useState(false);
  const [selectedDueIds, setSelectedDueIds] = useState<number[]>([]);
  const [bulkClearLoading, setBulkClearLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "approvals" | "settings" | "courses"
  >("approvals");

  // Global Due Request Settings
  const [noDueRequestEnabled, setNoDueRequestEnabled] = useState(false);
  const [activeRequestCount, setActiveRequestCount] = useState(0);
  const [showActivationModal, setShowActivationModal] = useState<{
    show: boolean;
    activating: boolean;
  }>({ show: false, activating: false });
  const [togglingSettings, setTogglingSettings] = useState(false);
  const [deactivationAction, setDeactivationAction] = useState<
    "" | "CLEAR" | "KEEP"
  >("");
  const [relevantArchivedCount, setRelevantArchivedCount] = useState(0);
  const [activationAction, setActivationAction] = useState<
    "" | "REACTIVATE" | "KEEP"
  >("");
  const [fetchingCounts, setFetchingCounts] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [notification, setNotification] = useState<{
    show: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  // RBAC State
  const { hasPermission } = usePermissions();
  const canManageDues = hasPermission("manage:due");

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch("http://localhost:3000/api/departments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setDepartments(data);
        }
      } catch (error) {
        console.error("Failed to fetch departments", error);
      }
    };

    const fetchSystemSettings = async () => {
      try {
        const res = await fetch("http://localhost:3000/settings");
        if (res.ok) {
          const data = await res.json();
          const noDueSetting = data.find(
            (s: any) => s.key === "noDueRequestEnabled",
          );
          if (noDueSetting) setNoDueRequestEnabled(noDueSetting.enabled);
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
      }
    };

    fetchDepartments();
    fetchSystemSettings();
  }, []);

  const fetchActiveRequestCount = async () => {
    setFetchingCounts(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(
        "http://localhost:3000/settings/active-requests-count",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const data = await res.json();
        setActiveRequestCount(data.count);
        setRelevantArchivedCount(data.relevantArchivedCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch active requests count", error);
    } finally {
      setFetchingCounts(false);
    }
  };

  useEffect(() => {
    fetchActiveRequestCount();
  }, [noDueRequestEnabled]);

  const handleToggleNoDue = async () => {
    setTogglingSettings(true);
    const targetState = showActivationModal.activating;
    const action = targetState ? activationAction : deactivationAction;

    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("http://localhost:3000/settings/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: "noDueRequestEnabled",
          value: targetState,
          action: action || (targetState ? undefined : "KEEP"),
        }),
      });
      if (res.ok) {
        setNoDueRequestEnabled(targetState);
        setShowActivationModal({ show: false, activating: false });
        if (!targetState) setDeactivationAction("");
        fetchApprovals(); // Refresh list
      }
    } catch (error) {
      console.error("Failed to toggle setting", error);
    } finally {
      setTogglingSettings(false);
    }
  };

  const handleSelectDue = (dueId: number) => {
    setSelectedDueIds((prev) =>
      prev.includes(dueId)
        ? prev.filter((id) => id !== dueId)
        : [...prev, dueId],
    );
  };

  const handleSelectAll = () => {
    const allPendingDueIds = approvals
      .filter((d) => d.status === "pending")
      .map((d) => d.id);

    const isAllSelected =
      allPendingDueIds.length > 0 &&
      allPendingDueIds.every((id) => selectedDueIds.includes(id));

    if (isAllSelected) {
      setSelectedDueIds([]);
    } else {
      setSelectedDueIds(allPendingDueIds);
    }
  };

  const handleBulkClear = async () => {
    if (
      !confirm(`Are you sure you want to clear ${selectedDueIds.length} dues?`)
    )
      return;

    setBulkClearLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("http://localhost:3000/api/staff/bulk-clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dueIds: selectedDueIds }),
      });

      if (res.ok) {
        setNotification({
          show: true,
          type: "success",
          title: "Success",
          message: "Selected dues cleared successfully",
        });
        setSelectedDueIds([]);
        fetchApprovals();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setNotification({
          show: true,
          type: "error",
          title: "Failed to Clear",
          message: errorData.message || "Failed to clear selected dues",
        });
      }
    } catch (e: any) {
      console.error(e);
      setNotification({
        show: true,
        type: "error",
        title: "Error",
        message: e.message || "Error clearing dues",
      });
    } finally {
      setBulkClearLoading(false);
    }
  };

  useEffect(() => {
    if (showBulkModal) {
      checkBulkStats();
    } else {
      setInitiationStats(null);
    }
  }, [showBulkModal, bulkSemester, bulkProgram]);

  const checkBulkStats = async () => {
    setCheckingStats(true);
    try {
      const res = await fetch(
        "http://localhost:3000/api/nodue/bulk-initiate-check",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            semester: bulkSemester,
            program: bulkProgram,
          }),
        },
      );
      if (res.ok) {
        setInitiationStats(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingStats(false);
    }
  };

  const handleBulkInitiate = async () => {
    setBulkLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/nodue/bulk-initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          semester: bulkSemester,
          program: bulkProgram,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotification({
          show: true,
          type: "success",
          title: "Bulk Initiation Started",
          message: data.message,
        });
        setShowBulkModal(false);
        // Auto-sync filters to match the bulk initiation so the new entries are visible
        setSemesterFilter(bulkSemester.toString());
        setProgramFilter(bulkProgram);
        setStatusFilter("pending");
        setPage(1);
        fetchApprovals();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setNotification({
          show: true,
          type: "error",
          title: "Failed to Initiate",
          message: errorData.message || "Failed to initiate bulk request",
        });
      }
    } catch (e: any) {
      console.error(e);
      setNotification({
        show: true,
        type: "error",
        title: "Error",
        message: e.message || "Error initiating bulk request",
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");

      const queryParams = new URLSearchParams();
      if (semesterFilter !== "all")
        queryParams.append("semester", semesterFilter);
      if (programFilter !== "all") queryParams.append("program", programFilter);
      if (departmentFilter !== "all")
        queryParams.append("departmentId", departmentFilter);
      if (typeFilter !== "all") queryParams.append("type", typeFilter);
      queryParams.append("status", statusFilter);
      if (searchTerm) queryParams.append("search", searchTerm);
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      const response = await fetch(
        `http://localhost:3000/api/staff/approvals?${queryParams.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.ok) {
        const result = await response.json();
        // Handle both old (array) and new (object) response formats for smoother dev transition
        if (Array.isArray(result)) {
          setApprovals(result);
          // Assume single page or unknown pagination if old API
        } else {
          setApprovals(result.data);
          setTotalPages(result.pagination.totalPages);
          setTotalItems(result.pagination.total);
        }
      } else {
        console.error(
          "Fetch approvals failed:",
          response.status,
          await response.text(),
        );
        setApprovals([]);
      }
    } catch (error) {
      console.error("Failed to fetch approvals", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset to page 1 when filters change
    setPage(1);
  }, [
    searchTerm,
    semesterFilter,
    programFilter,
    departmentFilter,
    statusFilter,
    typeFilter,
  ]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchApprovals();
    }, 500);
    return () => clearTimeout(debounce);
  }, [
    searchTerm,
    semesterFilter,
    programFilter,
    departmentFilter,
    statusFilter,
    typeFilter,
    page,
    limit,
  ]);

  const handleClearDue = async (dueId: number) => {
    setProcessingDueIds((prev) => [...prev, dueId]);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:3000/api/staff/clear/${dueId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        // Optimistic update
        setApprovals((prev) =>
          prev.map((due) => {
            if (due.id !== dueId) return due;
            return { ...due, status: "cleared" as const };
          }),
        );
      }
    } catch (error) {
      console.error("Failed to clear due", error);
    } finally {
      setProcessingDueIds((prev) => prev.filter((pid) => pid !== dueId));
    }
  };

  const handleExport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("No Due Clearance Report", 14, 22);
    // ... Simplified Export logic as structure changed ...
    // Note: Export logic needs significant update for nested structure if required.
    // For now, let's just log or simplified export.
  };

  const toggleExpand = (requestId: number) => {
    setExpandedRequestId(expandedRequestId === requestId ? null : requestId);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Due Management
            </h1>
            <p className="text-slate-500">
              Manage no-due clearances for students
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-3">
              {canManageDues &&
                (noDueRequestEnabled ? (
                  <button
                    onClick={() =>
                      setShowActivationModal({ show: true, activating: false })
                    }
                    className="bg-amber-100 text-amber-700 px-4 py-2 flex items-center gap-2 rounded-lg hover:bg-amber-200 transition-colors font-medium border border-amber-200"
                  >
                    <AlertCircle size={18} />
                    Deactivate Requests
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setShowActivationModal({ show: true, activating: true })
                    }
                    className="bg-teal-600 text-white px-4 py-2 flex items-center gap-2 rounded-lg hover:bg-teal-700 transition-colors font-medium"
                  >
                    <CheckCircle size={18} />
                    Activate Requests
                  </button>
                ))}
            </div>
            {activeTab === "approvals" && (
              <div className="flex gap-3 border-l border-slate-200 pl-4">
                {selectedDueIds.length > 0 && (
                  <button
                    onClick={handleBulkClear}
                    disabled={bulkClearLoading}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 animate-in fade-in"
                  >
                    {bulkClearLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle size={18} />
                    )}
                    Clear Selected ({selectedDueIds.length})
                  </button>
                )}
                {statusFilter !== "cleared" && canManageDues && (
                  <>
                    <button
                      onClick={() => setShowBulkModal(true)}
                      className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
                    >
                      <Clock size={18} />
                      Bulk Initiate
                    </button>
                  </>
                )}
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  <Download size={18} />
                  Export PDF
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("approvals")}
            className={`pb-2 px-1 flex items-center gap-2 font-medium text-sm transition-colors relative ${
              activeTab === "approvals"
                ? "text-teal-600 border-b-2 border-teal-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <LayoutList size={18} />
            Approvals
          </button>
          {canManageDues && (
            <>
              <button
                onClick={() => setActiveTab("courses")}
                className={`pb-2 px-1 flex items-center gap-2 font-medium text-sm transition-colors relative ${
                  activeTab === "courses"
                    ? "text-teal-600 border-b-2 border-teal-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <BookCopy size={18} />
                Courses
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`pb-2 px-1 flex items-center gap-2 font-medium text-sm transition-colors relative ${
                  activeTab === "settings"
                    ? "text-teal-600 border-b-2 border-teal-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <SettingsIcon size={18} />
                Settings
              </button>
            </>
          )}
        </div>
      </div>

      {activeTab === "approvals" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-left-4 duration-300">
          {/* Top Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search by Name or Register No..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                value={programFilter}
                onChange={(e) => {
                  const newProgram = e.target.value;
                  setProgramFilter(newProgram);
                  setDepartmentFilter("all"); // Reset department when program changes
                  if (
                    (newProgram === "MCA" || newProgram === "MTECH") &&
                    semesterFilter !== "all" &&
                    parseInt(semesterFilter) > 4
                  ) {
                    setSemesterFilter("all");
                  }
                }}
              >
                <option value="BTECH">B.Tech</option>
                <option value="MTECH">M.Tech</option>
                <option value="MCA">MCA</option>
              </select>
              <select
                className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-50"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                disabled={programFilter === "all"}
              >
                <option value="all">All Departments</option>
                {departments
                  .filter(
                    (d) =>
                      programFilter === "all" || d.program === programFilter,
                  )
                  .map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
              </select>
              <select
                className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
              >
                <option value="all">All Semesters</option>
                {Array.from(
                  {
                    length:
                      programFilter === "MCA" || programFilter === "MTECH"
                        ? 4
                        : 8,
                  },
                  (_, i) => i + 1,
                ).map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
              <select
                className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
              >
                <option value="all">All Types</option>
                <option value="academic">Academic</option>
                <option value="service">Service</option>
              </select>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-lg">
              {(["pending", "cleared", "archived"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setStatusFilter(tab);
                    // setPagination({ ...pagination, page: 1 }); // Assuming pagination state is not directly available here
                    setPage(1); // Reset page to 1 when filter changes
                  }}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
                    statusFilter === tab
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      checked={
                        approvals.length > 0 &&
                        approvals.filter((d) => d.status === "pending").length >
                          0 &&
                        approvals
                          .filter((d) => d.status === "pending")
                          .every((d) => selectedDueIds.includes(d.id))
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4">Register No</th>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Semester</th>
                  <th className="px-6 py-4">Due Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <Loader2
                          size={32}
                          className="animate-spin mb-2 text-emerald-600"
                        />
                        <p>Loading approvals...</p>
                      </div>
                    </td>
                  </tr>
                ) : approvals.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      No records found.
                    </td>
                  </tr>
                ) : (
                  approvals.map((due) => (
                    <tr
                      key={due.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:opacity-50"
                          disabled={due.status !== "pending"}
                          checked={selectedDueIds.includes(due.id)}
                          onChange={() => handleSelectDue(due.id)}
                        />
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">
                        {due.registerNo || due.student?.registerNo || "N/A"}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 hover:text-teal-600 transition-colors">
                        <Link
                          to={`/admin/studentDetails/${due.studentId || due.student?.id}`}
                          className="hover:underline underline-offset-2"
                        >
                          {due.studentName || due.student?.name || "N/A"}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        S{due.semester || due.student?.semester || "?"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {due.dueType}
                      </td>
                      <td className="px-6 py-4">
                        {due.status === "pending" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 transition-all duration-300">
                            <Clock size={12} /> Pending
                          </span>
                        ) : due.status === "cleared" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 animate-in zoom-in duration-300">
                            <CheckCircle size={12} /> Cleared
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-700">
                            <AlertCircle size={12} /> Archived
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {due.status === "pending" && (
                          <button
                            onClick={() => handleClearDue(due.id)}
                            disabled={processingDueIds.includes(due.id)}
                            className="text-white bg-emerald-600 hover:bg-emerald-700 text-xs px-3 py-1.5 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {processingDueIds.includes(due.id) ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <CheckCircle size={12} />
                            )}
                            Clear
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              >
                {[10, 20, 50, 100].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <span className="ml-2">
                Showing {approvals.length > 0 ? (page - 1) * limit + 1 : 0} -{" "}
                {Math.min(page * limit, totalItems)} of {totalItems}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronsLeft size={20} />
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={20} />
              </button>

              <span className="text-sm font-medium text-slate-700 min-w-[3rem] text-center">
                Page {page} of {totalPages || 1}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronRight size={20} />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages || totalPages === 0}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronsRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" && <DueSettingsPanel />}
      {activeTab === "courses" && <CourseManager />}

      {/* Bulk Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-scale-in">
            <h2 className="text-xl font-bold mb-4 text-slate-900">
              Bulk Initiate No Due
            </h2>
            <p className="text-slate-600 mb-4">
              Select a semester to initiate No Due requests for all students in
              that semester.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Program
                </label>
                <select
                  value={bulkProgram}
                  onChange={(e) => {
                    setBulkProgram(e.target.value);
                    setBulkSemester(1);
                  }}
                  className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="BTECH">B.Tech</option>
                  <option value="MTECH">M.Tech</option>
                  <option value="MCA">MCA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Semester
                </label>
                <select
                  value={bulkSemester}
                  onChange={(e) => setBulkSemester(Number(e.target.value))}
                  className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  {Array.from(
                    { length: bulkProgram === "BTECH" ? 8 : 4 },
                    (_, i) => i + 1,
                  ).map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-100">
              {checkingStats ? (
                <div className="flex items-center justify-center py-4 text-slate-500 gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span>Checking student records...</span>
                </div>
              ) : initiationStats ? (
                <div className="space-y-4">
                  <div className="space-y-2 text-sm bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Students:</span>
                      <span className="font-medium text-slate-900">
                        {initiationStats.total}
                      </span>
                    </div>
                    <div className="flex justify-between text-amber-600">
                      <span>Already Initiated:</span>
                      <span className="font-medium">
                        {initiationStats.initiated}
                      </span>
                    </div>
                    <div className="flex justify-between text-teal-600 pt-2 border-t border-slate-200 mt-2">
                      <span className="font-semibold">To Be Initiated:</span>
                      <span className="font-bold text-lg">
                        {initiationStats.toBeInitiated}
                      </span>
                    </div>
                  </div>

                  {initiationStats.toBeInitiated > 0 && (
                    <div className="relative overflow-hidden border border-red-200 p-4 rounded-lg flex gap-3 shadow-sm">
                      {/* Animated Gradient Background */}
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-red-50 via-red-100 to-red-50 opacity-50"
                        style={{
                          backgroundSize: "200% 200%",
                          animation: "gradientMove 3s ease infinite",
                        }}
                      />
                      {/* Add keyframes inline for simplicity as we don't want to touch index.css */}
                      <style
                        dangerouslySetInnerHTML={{
                          __html: `
                        @keyframes gradientMove {
                          0% { background-position: 0% 50%; }
                          50% { background-position: 100% 50%; }
                          100% { background-position: 0% 50%; }
                        }
                      `,
                        }}
                      />

                      <div className="flex-shrink-0 mt-0.5 relative z-10">
                        <AlertCircle
                          className="text-red-600 animate-pulse"
                          size={20}
                        />
                      </div>
                      <div className="flex-1 text-sm text-red-800 relative z-10">
                        <h4 className="font-bold mb-1">Irreversible Action</h4>
                        <p>
                          Once initiated, these dues are permanently assigned.
                          Any
                          <strong> new courses</strong> or changes to{" "}
                          <strong>default dues</strong> added later will{" "}
                          <strong>not</strong> be applied to these students.
                        </p>
                        <p className="mt-2 font-medium">
                          Please proceed with caution.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkInitiate}
                disabled={
                  bulkLoading ||
                  checkingStats ||
                  (initiationStats ? initiationStats.toBeInitiated === 0 : true)
                }
                className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 font-medium ${
                  initiationStats?.toBeInitiated &&
                  initiationStats.toBeInitiated > 0
                    ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
                    : "bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400"
                }`}
              >
                {bulkLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Initiating...</span>
                  </>
                ) : (
                  <span>
                    Initiate for {initiationStats?.toBeInitiated ?? "..."}{" "}
                    Students
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activation Confirmation Modal */}
      {showActivationModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg relative animate-scale-in">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {showActivationModal.activating
                ? "Activate Due Requests"
                : "Deactivate Due Requests"}
            </h2>

            <div className="mb-6 space-y-4 min-h-[100px] flex flex-col justify-center">
              {fetchingCounts ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                  <p className="text-sm text-slate-500">
                    Checking request statistics...
                  </p>
                </div>
              ) : showActivationModal.activating ? (
                <>
                  <div className="rounded-md bg-amber-50 p-4 border border-amber-200 text-amber-800 text-sm">
                    <div className="flex gap-3 mb-2 font-medium">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <p>Important Notice</p>
                    </div>
                    <p className="ml-8 text-amber-700">
                      Students will now be able to access the due details from
                      their profile. Please ensure that all necessary procedures
                      and fee structures for all students have been fully
                      configured before activating.
                    </p>
                  </div>

                  {relevantArchivedCount > 0 && (
                    <div className="mt-6 space-y-4">
                      <div className="rounded-md bg-blue-50 p-4 border border-blue-200 text-blue-800 text-sm">
                        <div className="flex gap-3 mb-2 font-medium">
                          <Clock className="h-5 w-5 flex-shrink-0" />
                          <p>Relevant Archived Dues Found</p>
                        </div>
                        <p className="ml-8 text-blue-700">
                          We found <strong>{relevantArchivedCount}</strong>{" "}
                          archived pending due entries that match the students'
                          current semester. How would you like to handle them?
                        </p>
                      </div>

                      <div className="space-y-3">
                        <label
                          className={`flex p-4 border rounded-lg cursor-pointer transition-colors ${activationAction === "REACTIVATE" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
                        >
                          <input
                            type="radio"
                            name="actAction"
                            className="w-4 h-4 text-blue-600 mt-1 focus:ring-blue-500"
                            checked={activationAction === "REACTIVATE"}
                            onChange={() => setActivationAction("REACTIVATE")}
                          />
                          <div className="ml-3">
                            <h5 className="font-medium text-slate-900">
                              Reactivate Relevant Archived Entries
                            </h5>
                            <p className="text-sm text-slate-500">
                              Restore previous pending due entries for students
                              who are still in the same semester. This allows
                              them to continue their previous clearance process.
                            </p>
                          </div>
                        </label>

                        <label
                          className={`flex p-4 border rounded-lg cursor-pointer transition-colors ${activationAction === "KEEP" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
                        >
                          <input
                            type="radio"
                            name="actAction"
                            className="w-4 h-4 text-blue-600 mt-1 focus:ring-blue-500"
                            checked={activationAction === "KEEP"}
                            onChange={() => setActivationAction("KEEP")}
                          />
                          <div className="ml-3">
                            <h5 className="font-medium text-slate-900">
                              Keep All Archived
                            </h5>
                            <p className="text-sm text-slate-500">
                              Keep all previous dues archived. Students will
                              need to have new dues initiated for them.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                </>
              ) : activeRequestCount > 0 ? (
                <>
                  <div className="rounded-md bg-rose-50 p-4 border border-rose-200 text-rose-800 text-sm">
                    <div className="flex gap-3 mb-2 font-medium">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <p>Warning: Active Requests Discovered</p>
                    </div>
                    <p className="ml-8 text-rose-700">
                      There are currently <strong>{activeRequestCount}</strong>{" "}
                      active no-due requests. Please select how you want to
                      handle these pending dues.
                    </p>
                  </div>

                  <div className="space-y-3 mt-4">
                    <label
                      className={`flex p-4 border rounded-lg cursor-pointer transition-colors ${deactivationAction === "CLEAR" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
                    >
                      <input
                        type="radio"
                        name="deacAction"
                        className="w-4 h-4 text-blue-600 mt-1 focus:ring-blue-500"
                        checked={deactivationAction === "CLEAR"}
                        onChange={() => setDeactivationAction("CLEAR")}
                      />
                      <div className="ml-3">
                        <h5 className="font-medium text-slate-900">
                          Clear All Dues
                        </h5>
                        <p className="text-sm text-slate-500">
                          All pending dues will be marked as cleared and their
                          requests approved.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex p-4 border rounded-lg cursor-pointer transition-colors ${deactivationAction === "KEEP" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
                    >
                      <input
                        type="radio"
                        name="deacAction"
                        className="w-4 h-4 text-blue-600 mt-1 focus:ring-blue-500"
                        checked={deactivationAction === "KEEP"}
                        onChange={() => setDeactivationAction("KEEP")}
                      />
                      <div className="ml-3">
                        <h5 className="font-medium text-slate-900">
                          Keep as Archived
                        </h5>
                        <p className="text-sm text-slate-500">
                          Archive the dues without clearing them.
                        </p>
                      </div>
                    </label>
                  </div>

                  {deactivationAction === "KEEP" && (
                    <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm animate-in fade-in zoom-in duration-200">
                      <strong>Note:</strong> These requests will be hidden from
                      students and only be visible to administrators.
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-600">
                  Are you sure you want to deactivate new due requests? Students
                  will no longer be able to initiate clearances.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowActivationModal({ show: false, activating: false });
                  setDeactivationAction("");
                  setActivationAction("");
                }}
                disabled={togglingSettings}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleNoDue}
                disabled={
                  togglingSettings ||
                  (!showActivationModal.activating &&
                    activeRequestCount > 0 &&
                    !deactivationAction) ||
                  (showActivationModal.activating &&
                    relevantArchivedCount > 0 &&
                    !activationAction)
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-white ${
                  showActivationModal.activating
                    ? "bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400"
                    : "bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:opacity-50"
                }`}
              >
                {togglingSettings ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>
                    {showActivationModal.activating ? "Activate" : "Deactivate"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {notification && notification.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-scale-in text-center relative">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 align-middle">
              {notification.type === "success" && (
                <div className="bg-emerald-100 p-3 rounded-full">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
              )}
              {notification.type === "error" && (
                <div className="bg-rose-100 p-3 rounded-full">
                  <AlertCircle className="h-8 w-8 text-rose-600" />
                </div>
              )}
              {notification.type === "info" && (
                <div className="bg-blue-100 p-3 rounded-full">
                  <AlertCircle className="h-8 w-8 text-blue-600" />
                </div>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {notification.title}
            </h3>
            <p className="text-slate-600 text-sm mb-6">
              {notification.message}
            </p>
            <div className="flex justify-center">
              <button
                onClick={() =>
                  setNotification({ ...notification, show: false })
                }
                className={`px-6 py-2 text-white rounded-lg transition-colors font-medium w-full ${
                  notification.type === "success"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : notification.type === "error"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DueManager;
