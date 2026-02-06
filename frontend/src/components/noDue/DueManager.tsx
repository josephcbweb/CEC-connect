import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import CourseManager from "../admin/courses/CourseManager";
import { Settings as SettingsIcon, LayoutList, BookCopy } from "lucide-react";

interface DueItem {
  id: number;
  dueType: string;
  status: "pending" | "cleared";
  updatedAt: string;
}

interface DueRequest {
  id: number;
  studentName: string;
  registerNo: string;
  semester: number;
  status: "pending" | "cleared";
  dues: DueItem[];
  updatedAt: string;
}

const DueManager = () => {
  const [approvals, setApprovals] = useState<DueRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "academic" | "service">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<"pending" | "cleared">(
    "pending",
  );
  const [expandedRequestId, setExpandedRequestId] = useState<number | null>(
    null,
  );
  const [processingDueIds, setProcessingDueIds] = useState<number[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSemester, setBulkSemester] = useState(8);
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

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const handleSelectDue = (dueId: number) => {
    setSelectedDueIds((prev) =>
      prev.includes(dueId)
        ? prev.filter((id) => id !== dueId)
        : [...prev, dueId],
    );
  };

  const handleSelectRequest = (request: DueRequest) => {
    const pendingDueIds = request.dues
      .filter((d) => d.status === "pending")
      .map((d) => d.id);

    const allSelected = pendingDueIds.every((id) =>
      selectedDueIds.includes(id),
    );

    setSelectedDueIds((prev) => {
      if (allSelected) {
        return prev.filter((id) => !pendingDueIds.includes(id));
      } else {
        return [...new Set([...prev, ...pendingDueIds])];
      }
    });
  };

  const handleSelectAll = () => {
    const allPendingDueIds = approvals
      .flatMap((req) => req.dues)
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
      const userString = localStorage.getItem("user");
      const user = userString ? JSON.parse(userString) : {};

      const res = await fetch("http://localhost:3000/api/staff/bulk-clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueIds: selectedDueIds, userId: user?.id }),
      });

      if (res.ok) {
        alert("Selected dues cleared successfully");
        setSelectedDueIds([]);
        fetchApprovals();
      } else {
        alert("Failed to clear selected dues");
      }
    } catch (e) {
      console.error(e);
      alert("Error clearing dues");
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
  }, [showBulkModal, bulkSemester]);

  const checkBulkStats = async () => {
    setCheckingStats(true);
    try {
      const res = await fetch(
        "http://localhost:3000/api/nodue/bulk-initiate-check",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ semester: bulkSemester }),
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ semester: bulkSemester }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        setShowBulkModal(false);
        fetchApprovals();
      } else {
        alert("Failed to initiate bulk request");
      }
    } catch (e) {
      console.error(e);
      alert("Error initiating bulk request");
    } finally {
      setBulkLoading(false);
    }
  };

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const userString = localStorage.getItem("user");
      const user = userString ? JSON.parse(userString) : {};
      const userId = user?.id;

      const queryParams = new URLSearchParams();
      if (semesterFilter !== "all")
        queryParams.append("semester", semesterFilter);
      if (typeFilter !== "all") queryParams.append("type", typeFilter);
      queryParams.append("status", statusFilter);
      if (searchTerm) queryParams.append("search", searchTerm);
      if (userId) queryParams.append("userId", userId);
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      const response = await fetch(
        `http://localhost:3000/api/staff/approvals?${queryParams.toString()}`,
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
  }, [searchTerm, semesterFilter, statusFilter, typeFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchApprovals();
    }, 500);
    return () => clearTimeout(debounce);
  }, [searchTerm, semesterFilter, statusFilter, typeFilter, page, limit]);

  const handleClearDue = async (dueId: number, requestId: number) => {
    setProcessingDueIds((prev) => [...prev, dueId]);
    try {
      const userString = localStorage.getItem("user");
      const user = userString ? JSON.parse(userString) : {};
      const response = await fetch(
        `http://localhost:3000/api/staff/clear/${dueId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.id }),
        },
      );

      if (response.ok) {
        // Optimistic update
        setApprovals((prev) =>
          prev.map((req) => {
            if (req.id !== requestId) return req;

            // Update the specific due within the request
            const updatedDues = req.dues.map((d) =>
              d.id === dueId ? { ...d, status: "cleared" as const } : d,
            );

            // Check if all dues are now cleared for this request
            const allCleared = updatedDues.every((d) => d.status === "cleared");

            return {
              ...req,
              dues: updatedDues,
              status: allCleared ? "cleared" : req.status,
            };
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
          {activeTab === "approvals" && (
            <div className="flex gap-3">
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
              {statusFilter !== "cleared" && (
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
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
              >
                <option value="all">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
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
              {(["pending", "cleared"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
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
                        approvals
                          .flatMap((req) => req.dues)
                          .filter((d) => d.status === "pending").length > 0 &&
                        approvals
                          .flatMap((req) => req.dues)
                          .filter((d) => d.status === "pending")
                          .every((d) => selectedDueIds.includes(d.id))
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4">Register No</th>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Semester</th>
                  <th className="px-6 py-4">Pending Dues</th>
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
                  approvals.map((request) => (
                    <React.Fragment key={request.id}>
                      <tr
                        className={`hover:bg-slate-50 transition-colors ${expandedRequestId === request.id ? "bg-slate-50" : ""}`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:opacity-50"
                            disabled={
                              request.status === "cleared" ||
                              request.dues.every((d) => d.status !== "pending")
                            }
                            checked={
                              request.dues.some(
                                (d) => d.status === "pending",
                              ) &&
                              request.dues
                                .filter((d) => d.status === "pending")
                                .every((d) => selectedDueIds.includes(d.id))
                            }
                            onChange={() => handleSelectRequest(request)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600">
                          {request.registerNo}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {request.studentName}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          S{request.semester}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {request.status === "cleared"
                            ? "None"
                            : `${request.dues.filter((d) => d.status === "pending").length} Pending`}
                        </td>
                        <td className="px-6 py-4">
                          {request.status === "pending" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 transition-all duration-300">
                              <Clock size={12} /> Pending
                            </span>
                          )}
                          {request.status === "cleared" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 animate-in zoom-in duration-300">
                              <CheckCircle size={12} /> Cleared
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleExpand(request.id)}
                            className="text-slate-500 hover:text-slate-700 font-medium text-xs flex items-center gap-1"
                          >
                            {expandedRequestId === request.id
                              ? "Hide Details"
                              : "View Dues"}
                            {expandedRequestId === request.id ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Row for Dues */}
                      {expandedRequestId === request.id && (
                        <tr className="bg-slate-50/50 animate-in fade-in slide-in-from-top-1">
                          <td colSpan={7} className="px-6 py-4 pl-14">
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                              <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-medium">
                                  <tr>
                                    <th className="px-4 py-2 border-b w-8">
                                      {/* Select */}
                                    </th>
                                    <th className="px-4 py-2 border-b">
                                      Due Type / Department
                                    </th>
                                    <th className="px-4 py-2 border-b">
                                      Status
                                    </th>
                                    <th className="px-4 py-2 border-b">
                                      Last Updated
                                    </th>
                                    <th className="px-4 py-2 border-b text-right">
                                      Action
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {request.dues.map((due) => (
                                    <tr
                                      key={due.id}
                                      className="hover:bg-slate-50"
                                    >
                                      <td className="px-4 py-3">
                                        <input
                                          type="checkbox"
                                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:opacity-50"
                                          disabled={due.status !== "pending"}
                                          checked={selectedDueIds.includes(
                                            due.id,
                                          )}
                                          onChange={() =>
                                            handleSelectDue(due.id)
                                          }
                                        />
                                      </td>
                                      <td className="px-4 py-3 font-medium text-slate-700">
                                        {due.dueType}
                                      </td>
                                      <td className="px-4 py-3">
                                        {due.status === "pending" ? (
                                          <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs font-medium">
                                            Pending
                                          </span>
                                        ) : (
                                          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs font-medium">
                                            Cleared
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-slate-500 text-xs">
                                        {new Date(
                                          due.updatedAt,
                                        ).toLocaleDateString()}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        {due.status === "pending" && (
                                          <button
                                            onClick={() =>
                                              handleClearDue(due.id, request.id)
                                            }
                                            disabled={processingDueIds.includes(
                                              due.id,
                                            )}
                                            className="text-white bg-emerald-600 hover:bg-emerald-700 text-xs px-3 py-1.5 rounded transition-colors disabled:opacity-50 flex items-center gap-1 ml-auto"
                                          >
                                            {processingDueIds.includes(
                                              due.id,
                                            ) ? (
                                              <Loader2
                                                size={12}
                                                className="animate-spin"
                                              />
                                            ) : (
                                              <CheckCircle size={12} />
                                            )}
                                            Clear
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                  {request.dues.length === 0 && (
                                    <tr>
                                      <td
                                        colSpan={5}
                                        className="px-4 py-3 text-center text-slate-400 italic"
                                      >
                                        No specific due items found.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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

            <label className="block text-sm font-medium text-slate-700 mb-2">
              Semester
            </label>
            <select
              value={bulkSemester}
              onChange={(e) => setBulkSemester(Number(e.target.value))}
              className="w-full border border-slate-300 p-2 rounded-lg mb-6 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>

            <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-100">
              {checkingStats ? (
                <div className="flex items-center justify-center py-4 text-slate-500 gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span>Checking student records...</span>
                </div>
              ) : initiationStats ? (
                <div className="space-y-2 text-sm">
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
                  initiationStats?.toBeInitiated === 0
                }
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {bulkLoading && <Loader2 size={16} className="animate-spin" />}
                {bulkLoading
                  ? "Initiating..."
                  : `Initiate for ${initiationStats?.toBeInitiated ?? "..."} Students`}
                {bulkLoading ? "Processing..." : "Initiate All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DueManager;
