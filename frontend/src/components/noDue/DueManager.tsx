import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Download,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Approval {
  id: number;
  studentName: string;
  registerNo: string;
  semester: number;
  dueType: string;
  status: "pending" | "cleared" | "due_found";
  courses: any[];
  updatedAt: string;
}

const DueManager = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "academic" | "service">(
    "all"
  );
  const [statusFilter, setStatusFilter] = useState<"pending" | "cleared">(
    "pending"
  );
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [processingIds, setProcessingIds] = useState<number[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSemester, setBulkSemester] = useState(8);
  const [bulkLoading, setBulkLoading] = useState(false);

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

      const response = await fetch(
        `http://localhost:3000/api/staff/approvals?${queryParams.toString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setApprovals(data);
      }
    } catch (error) {
      console.error("Failed to fetch approvals", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchApprovals();
    }, 500);
    return () => clearTimeout(debounce);
  }, [searchTerm, semesterFilter, statusFilter, typeFilter]);

  const handleClearDue = async (id: number) => {
    setProcessingIds((prev) => [...prev, id]);
    try {
      const userString = localStorage.getItem("user");
      const user = userString ? JSON.parse(userString) : {};
      console.log(user);
      const response = await fetch(
        `http://localhost:3000/api/staff/clear/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user?.id }),
        }
      );

      if (response.ok) {
        // Optimistic update
        setApprovals((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "cleared" } : a))
        );
      }
    } catch (error) {
      console.error("Failed to clear due", error);
    } finally {
      setProcessingIds((prev) => prev.filter((pid) => pid !== id));
    }
  };

  const handleExport = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("No Due Clearance Report", 14, 22);
    doc.setFontSize(11);
    doc.text(`Status: ${statusFilter.toUpperCase()}`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);

    const tableColumn = [
      "Register No",
      "Student Name",
      "Semester",
      "Due Type",
      "Status",
      "Updated At",
    ];

    const tableRows = approvals.map((approval) => [
      approval.registerNo,
      approval.studentName,
      approval.semester,
      approval.dueType,
      approval.status,
      new Date(approval.updatedAt).toLocaleDateString(),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 44,
      theme: "grid",
      headStyles: { fillColor: [22, 160, 133] },
    });

    doc.save(`nodue_report_${statusFilter}_${new Date().getTime()}.pdf`);
  };

  const handleBulkClear = async () => {
    // Implement bulk clear logic (loop or new API endpoint)
    // For now, loop
    for (const id of selectedIds) {
      await handleClearDue(id);
    }
    setSelectedIds([]);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Due Management</h1>
          <p className="text-slate-500">
            Manage no-due clearances for students
          </p>
        </div>
        <div className="flex gap-3">
          {statusFilter !== "cleared" && (
            <>
              <button
                onClick={() => setShowBulkModal(true)}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
              >
                <Clock size={18} />
                Bulk Initiate
              </button>
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkClear}
                  disabled={processingIds.length > 0}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {processingIds.length > 0 &&
                  selectedIds.some((id) => processingIds.includes(id)) ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    `Clear Selected (${selectedIds.length})`
                  )}
                </button>
              )}
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
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                    className="rounded border-slate-300"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(approvals.map((a) => a.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    checked={
                      approvals.length > 0 &&
                      selectedIds.length === approvals.length
                    }
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
                approvals.map((approval) => (
                  <tr key={approval.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        checked={selectedIds.includes(approval.id)}
                        onChange={() => toggleSelect(approval.id)}
                        disabled={approval.status === "cleared"}
                      />
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {approval.registerNo}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {approval.studentName}
                      {approval.courses && approval.courses.length > 0 && (
                        <div className="text-xs text-slate-500 mt-1">
                          {approval.courses.map((c) => c.name).join(", ")}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      S{approval.semester}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {approval.dueType}
                    </td>
                    <td className="px-6 py-4">
                      {approval.status === "pending" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 transition-all duration-300">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                      {approval.status === "cleared" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 animate-in zoom-in duration-300">
                          <CheckCircle size={12} /> Cleared
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {approval.status === "pending" ? (
                        <button
                          onClick={() => handleClearDue(approval.id)}
                          disabled={processingIds.includes(approval.id)}
                          className="text-emerald-600 hover:text-emerald-700 font-medium text-xs bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {processingIds.includes(approval.id) ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              Clearing...
                            </>
                          ) : (
                            "Clear Due"
                          )}
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-2">
                          Cleared
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkInitiate}
                disabled={bulkLoading}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {bulkLoading && <Loader2 size={16} className="animate-spin" />}
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
