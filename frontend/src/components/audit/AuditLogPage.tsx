import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter,
  Clock,
  User,
  Monitor,
  Globe,
  FileText,
  Activity,
  ArrowUpDown,
  X,
} from "lucide-react";

interface AuditLog {
  id: number;
  userId: number | null;
  action: string;
  module: string;
  entityType: string | null;
  entityId: string | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
  user: {
    id: number;
    username: string;
    email: string;
  } | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AuditStats {
  totalLogs: number;
  recentActivity: number;
  moduleBreakdown: { module: string; count: number }[];
}

const MODULE_COLORS: Record<string, { bg: string; text: string; dot: string }> =
  {
    fee: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    admission: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    due: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    due_settings: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      dot: "bg-purple-500",
    },
    general: { bg: "bg-slate-50", text: "text-slate-700", dot: "bg-slate-500" },
  };

const ACTION_LABELS: Record<string, string> = {
  CREATE_FEE_STRUCTURE: "Created Fee Structure",
  UPDATE_FEE_STRUCTURE: "Updated Fee Structure",
  DELETE_FEE_STRUCTURE: "Deleted Fee Structure",
  ASSIGN_FEE_TO_STUDENTS: "Assigned Fee to Students",
  MARK_INVOICE_PAID: "Marked Invoice as Paid",
  UPDATE_ADMISSION_STATUS: "Updated Admission Status",
  DELETE_ADMISSION_ENTRY: "Deleted Admission Entry",
  CREATE_ADMISSION_WINDOW: "Created Admission Window",
  UPDATE_ADMISSION_WINDOW: "Updated Admission Window",
  DELETE_ADMISSION_WINDOW: "Deleted Admission Window",
  BULK_UPDATE_ADMISSION_STATUS: "Bulk Updated Admission Status",
  ASSIGN_STUDENT_TO_CLASS: "Assigned Student to Class",
  AUTO_ASSIGN_STUDENTS_TO_CLASSES: "Auto-Assigned Students to Classes",
  BULK_ASSIGN_TO_CLASS: "Bulk Assigned to Class",
  DELETE_STALE_ADMISSIONS: "Deleted Stale Admissions",
  REGISTER_SEMESTER: "Registered Semester (No Due)",
  CLEAR_DUE: "Cleared Due",
  BULK_INITIATE_NODUE: "Bulk Initiated No Due",
  BULK_CLEAR_DUES: "Bulk Cleared Dues",
  CREATE_DUE_CONFIG: "Created Due Configuration",
  DELETE_DUE_CONFIG: "Deleted Due Configuration",
  CREATE_SERVICE_DEPARTMENT: "Created Service Department",
  UPDATE_SERVICE_DEPARTMENT: "Updated Service Department",
  DELETE_SERVICE_DEPARTMENT: "Deleted Service Department",
};

function parseUserAgent(ua: string | null): string {
  if (!ua) return "Unknown";
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Postman")) return "Postman";
  return "Other";
}

function parseOS(ua: string | null): string {
  if (!ua) return "Unknown";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Other";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 0,
  });
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Filters
  const [moduleFilter, setModuleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        const params = new URLSearchParams({
          page: String(page),
          limit: "25",
        });
        if (moduleFilter !== "all") params.append("module", moduleFilter);
        if (searchQuery) params.append("search", searchQuery);
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        const res = await fetch(
          `http://localhost:3000/api/audit-logs?${params}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!res.ok) throw new Error("Failed to fetch audit logs");
        const data = await res.json();
        setLogs(data.data);
        setPagination(data.pagination);
      } catch (err) {
        console.error("Error fetching audit logs:", err);
      } finally {
        setLoading(false);
      }
    },
    [moduleFilter, searchQuery, startDate, endDate],
  );

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("http://localhost:3000/api/audit-logs/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setStats(await res.json());
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs]);

  const clearFilters = () => {
    setModuleFilter("all");
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters =
    moduleFilter !== "all" || searchQuery || startDate || endDate;

  return (
    <div className="min-h-screen bg-slate-50 w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-teal-50 p-2.5 rounded-lg">
              <Shield className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Track all actions across Fee, Admission, and Due Management
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              fetchLogs(pagination.page);
              fetchStats();
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="px-6 pt-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Logs</p>
                  <p className="text-xl font-bold text-slate-900">
                    {stats.totalLogs.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 p-2 rounded-lg">
                  <Activity className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last 24 Hours</p>
                  <p className="text-xl font-bold text-slate-900">
                    {stats.recentActivity}
                  </p>
                </div>
              </div>
            </div>
            {stats.moduleBreakdown.slice(0, 2).map((m) => {
              const color = MODULE_COLORS[m.module] || MODULE_COLORS.general;
              return (
                <div
                  key={m.module}
                  className="bg-white rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`${color.bg} p-2 rounded-lg`}>
                      <div className={`h-5 w-5 rounded-full ${color.dot}`} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 capitalize">
                        {m.module.replace("_", " ")}
                      </p>
                      <p className="text-xl font-bold text-slate-900">
                        {m.count.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-6 pt-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search actions, entities, IPs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Module filter */}
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="all">All Modules</option>
              <option value="fee">Fee</option>
              <option value="admission">Admission</option>
              <option value="due">Due Management</option>
              <option value="due_settings">Due Settings</option>
            </select>

            {/* Toggle more filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                showFilters || hasActiveFilters
                  ? "border-teal-300 bg-teal-50 text-teal-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 bg-teal-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  !
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 font-medium">
                  From:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 font-medium">
                  To:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="px-6 pt-4 pb-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
                <p className="text-sm">Loading audit logs...</p>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Shield className="h-12 w-12 mb-3" />
              <p className="text-sm font-medium">No audit logs found</p>
              <p className="text-xs mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div className="col-span-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Timestamp
                </div>
                <div className="col-span-2 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  User
                </div>
                <div className="col-span-3 flex items-center gap-1">
                  <ArrowUpDown className="h-3 w-3" />
                  Action
                </div>
                <div className="col-span-1">Module</div>
                <div className="col-span-2 flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  IP / Device
                </div>
                <div className="col-span-2 flex items-center gap-1">
                  <Monitor className="h-3 w-3" />
                  Entity
                </div>
              </div>

              {/* Log rows */}
              {logs.map((log) => {
                const moduleColor =
                  MODULE_COLORS[log.module] || MODULE_COLORS.general;
                const isExpanded = expandedRow === log.id;
                return (
                  <div
                    key={log.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    {/* Main row */}
                    <div
                      className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 px-5 py-3.5 hover:bg-slate-50/50 cursor-pointer transition-colors"
                      onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                    >
                      {/* Timestamp */}
                      <div className="col-span-2">
                        <p className="text-sm text-slate-700 font-medium">
                          {timeAgo(log.timestamp)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(log.timestamp).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </p>
                      </div>

                      {/* User */}
                      <div className="col-span-2">
                        {log.user ? (
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {log.user.username}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {log.user.email}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400 italic">
                            System
                          </p>
                        )}
                      </div>

                      {/* Action */}
                      <div className="col-span-3">
                        <p className="text-sm font-medium text-slate-800">
                          {ACTION_LABELS[log.action] || log.action}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                          {log.action}
                        </p>
                      </div>

                      {/* Module */}
                      <div className="col-span-1">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${moduleColor.bg} ${moduleColor.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${moduleColor.dot}`}
                          />
                          {log.module.replace("_", " ")}
                        </span>
                      </div>

                      {/* IP / Device */}
                      <div className="col-span-2">
                        <p className="text-sm text-slate-600 font-mono text-xs">
                          {log.ipAddress || "—"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {parseOS(log.userAgent)} ·{" "}
                          {parseUserAgent(log.userAgent)}
                        </p>
                      </div>

                      {/* Entity */}
                      <div className="col-span-2">
                        {log.entityType ? (
                          <div>
                            <p className="text-sm text-slate-600">
                              {log.entityType}
                            </p>
                            {log.entityId && (
                              <p className="text-xs text-slate-400 font-mono">
                                ID: {log.entityId}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">—</p>
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && log.details && (
                      <div className="px-5 pb-4">
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Details
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(log.details).map(([key, value]) => (
                              <div key={key} className="flex flex-col">
                                <span className="text-xs text-slate-400 font-medium capitalize">
                                  {key
                                    .replace(/([A-Z])/g, " $1")
                                    .replace(/_/g, " ")}
                                </span>
                                <span className="text-sm text-slate-700 font-medium break-all">
                                  {typeof value === "object"
                                    ? JSON.stringify(value)
                                    : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                          {log.userAgent && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <span className="text-xs text-slate-400 font-medium">
                                Full User Agent
                              </span>
                              <p className="text-xs text-slate-500 font-mono mt-1 break-all">
                                {log.userAgent}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pagination */}
              <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-t border-slate-200">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-medium text-slate-700">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>
                  –
                  <span className="font-medium text-slate-700">
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-slate-700">
                    {pagination.total.toLocaleString()}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchLogs(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-slate-600 font-medium px-2">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchLogs(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogPage;
