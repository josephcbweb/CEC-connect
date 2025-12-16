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
} from "lucide-react";

const AdmissionsPage: React.FC = () => {
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

  useEffect(() => {
    fetchData();
  }, [filters]);

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
      setStats(statsData.stats);
    } catch (error) {
      console.error("Error fetching data:", error);
      showMessage("error", "Failed to fetch data");
    } finally {
      setLoading(false);
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
        `Are you sure you want to ${status} ${selectedIds.length} applications?`
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
        `${selectedIds.length} applications updated successfully`
      );
    } catch (error) {
      console.error("Error bulk updating:", error);
      showMessage("error", "Failed to update applications");
    } finally {
      setBulkUpdating(false);
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
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
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
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
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
                    <span className="text-sm text-gray-600">Blood Group:</span>
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
                    <span className="text-sm text-gray-600">Register No:</span>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedStudent.qualifying_exam_register_no}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Percentage:</span>
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
                    <span className="text-sm text-gray-600">Department:</span>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedStudent.department.name}
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
                        handleStatusUpdate(selectedStudent.id, "waitlisted");
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
