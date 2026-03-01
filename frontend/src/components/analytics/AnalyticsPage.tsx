import React, { useState, useEffect } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  Users,
  GraduationCap,
  Building,
  IndianRupee,
  Bus,
  Bed,
  BookOpen,
  CheckCircle,
  FileText,
  Bell,
  LayoutGrid,
  UserCog,
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Mail,
  Shield,
  ArrowUpRight,
  Clock,
  BarChart3,
  Activity,
} from "lucide-react";

// ─── Color Palettes ──────────────────────────────────────────────────────────
const COLORS = [
  "#0ea5e9",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
];
const PIE_COLORS = [
  "#0ea5e9",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];
const STATUS_COLORS: Record<string, string> = {
  approved: "#10b981",
  pending: "#f59e0b",
  rejected: "#ef4444",
  waitlisted: "#6366f1",
  graduated: "#0ea5e9",
  deleted: "#94a3b8",
  paid: "#10b981",
  unpaid: "#f59e0b",
  overdue: "#ef4444",
  cancelled: "#94a3b8",
  cleared: "#10b981",
  due_found: "#ef4444",
  active: "#10b981",
  inactive: "#94a3b8",
  suspended: "#ef4444",
  ACTIVE: "#10b981",
  UPCOMING: "#0ea5e9",
  GRADUATED: "#8b5cf6",
  PENDING: "#f59e0b",
  SENT: "#10b981",
  FAILED: "#ef4444",
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface AnalyticsData {
  students: {
    total: number;
    recentAdmissions: number;
    byStatus: { status: string; count: number }[];
    byProgram: { program: string; count: number }[];
    byGender: { gender: string; count: number }[];
    bySemester: { semester: number; count: number }[];
    byAdmissionType: { type: string; count: number }[];
    byCategory: { category: string; count: number }[];
  };
  departments: {
    id: number;
    name: string;
    code: string;
    program: string;
    status: string;
    studentCount: number;
    courseCount: number;
  }[];
  fees: {
    totalInvoiced: number;
    totalCollected: number;
    totalPending: number;
    totalOverdue: number;
    totalFine: number;
    collectionRate: number;
    invoicesByStatus: Record<string, number>;
    monthlyRevenueTrend: {
      month: string;
      collected: number;
      pending: number;
      count: number;
    }[];
    payments: { status: string; count: number; total: number }[];
    paymentsByMethod: { method: string; count: number; total: number }[];
  };
  bus: {
    totalBuses: number;
    activeBuses: number;
    totalSeats: number;
    totalOccupied: number;
    utilization: {
      id: number;
      name: string;
      route: string;
      totalSeats: number;
      occupied: number;
      stops: number;
      occupancyRate: number;
    }[];
    requestsByStatus: { status: string; count: number }[];
  };
  hostel: {
    totalHostels: number;
    totalOccupants: number;
    hostels: {
      id: number;
      name: string;
      warden: string;
      monthlyRent: any;
      occupants: number;
    }[];
  };
  certificates: {
    total: number;
    byType: { type: string; count: number }[];
    byStatus: { status: string; count: number }[];
    byWorkflow: { stage: string; count: number }[];
  };
  dues: {
    totalRequests: number;
    totalDues: number;
    requestsByStatus: { status: string; count: number }[];
    duesByStatus: { status: string; count: number }[];
    serviceDeptClearance: {
      id: number;
      name: string;
      total: number;
      cleared: number;
      pending: number;
      clearanceRate: number;
    }[];
  };
  courses: {
    total: number;
    active: number;
    inactive: number;
    byType: { type: string; count: number }[];
    byCategory: { category: string; count: number }[];
  };
  staff: {
    total: number;
    byStatus: { status: string; count: number }[];
    byRole: { role: string; count: number }[];
  };
  notifications: {
    total: number;
    byPriority: { priority: string; count: number }[];
    byTarget: { target: string; count: number }[];
  };
  batches: {
    total: number;
    byStatus: { status: string; count: number }[];
  };
  admissionWindows: {
    id: number;
    program: string;
    isOpen: boolean;
    startDate: string;
    endDate: string;
    batch: string;
  }[];
  auditLogs: { total: number; last30Days: number };
  emails: { byStatus: { status: string; count: number }[] };
}

type SectionKey =
  | "overview"
  | "students"
  | "fees"
  | "departments"
  | "bus"
  | "hostel"
  | "certificates"
  | "dues"
  | "courses"
  | "staff"
  | "notifications"
  | "batches";

const SECTION_TABS: {
  key: SectionKey;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "students", label: "Students", icon: Users },
  { key: "fees", label: "Fee & Revenue", icon: IndianRupee },
  { key: "departments", label: "Departments", icon: Building },
  { key: "bus", label: "College Bus", icon: Bus },
  { key: "hostel", label: "Hostel", icon: Bed },
  { key: "certificates", label: "Certificates", icon: FileText },
  { key: "dues", label: "Due Management", icon: CheckCircle },
  { key: "courses", label: "Courses", icon: BookOpen },
  { key: "staff", label: "Staff & Roles", icon: UserCog },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "batches", label: "Batches", icon: LayoutGrid },
];

// ─── Utility Components ──────────────────────────────────────────────────────
const StatCard = ({
  title,
  value,
  icon: Icon,
  color = "teal",
  subtitle,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
  subtitle?: string;
  trend?: { value: number; label: string };
}) => {
  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> =
    {
      teal: { bg: "bg-teal-50", text: "text-teal-700", iconBg: "bg-teal-100" },
      blue: { bg: "bg-blue-50", text: "text-blue-700", iconBg: "bg-blue-100" },
      purple: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        iconBg: "bg-purple-100",
      },
      amber: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        iconBg: "bg-amber-100",
      },
      rose: { bg: "bg-rose-50", text: "text-rose-700", iconBg: "bg-rose-100" },
      emerald: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        iconBg: "bg-emerald-100",
      },
      slate: {
        bg: "bg-slate-50",
        text: "text-slate-700",
        iconBg: "bg-slate-100",
      },
      indigo: {
        bg: "bg-indigo-50",
        text: "text-indigo-700",
        iconBg: "bg-indigo-100",
      },
    };
  const c = colorMap[color] || colorMap.teal;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.value >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
              )}
              <span
                className={`text-xs font-medium ${trend.value >= 0 ? "text-emerald-600" : "text-rose-600"}`}
              >
                {trend.value >= 0 ? "+" : ""}
                {trend.value} {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={`${c.iconBg} p-2.5 rounded-lg`}>
          <Icon className={`h-5 w-5 ${c.text}`} />
        </div>
      </div>
    </div>
  );
};

const ChartCard = ({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white rounded-xl border border-slate-200 p-5 overflow-hidden min-w-0 ${className}`}
  >
    <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
    {children}
  </div>
);

const MiniTable = ({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number)[][];
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-100">
          {headers.map((h, i) => (
            <th
              key={i}
              className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} className="border-b border-slate-50 hover:bg-slate-50">
            {row.map((cell, ci) => (
              <td key={ci} className="py-2 px-3 text-slate-700">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const bgColor = STATUS_COLORS[status]
    ? `bg-[${STATUS_COLORS[status]}]/10`
    : "bg-slate-100";
  const textColor = STATUS_COLORS[status] || "#64748b";
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `${textColor}18`,
        color: textColor,
      }}
    >
      {status}
    </span>
  );
};

const ProgressBar = ({
  value,
  max,
  color = "#10b981",
}: {
  value: number;
  max: number;
  color?: string;
}) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-medium text-slate-600 w-10 text-right">
        {pct}%
      </span>
    </div>
  );
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="flex gap-2">
          <span>{p.name}:</span>
          <span className="font-bold">
            {typeof p.value === "number"
              ? p.value.toLocaleString("en-IN")
              : p.value}
          </span>
        </p>
      ))}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const AnalyticsPage: React.FC = () => {
  usePageTitle("Analytics");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("http://localhost:3000/api/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch analytics data");
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
          <p className="text-sm font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-rose-500">
          <AlertCircle className="h-10 w-10" />
          <p className="text-sm font-medium">{error || "No data available"}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-2 text-xs text-teal-600 hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ─── Section Renderers ───────────────────────────────────────────────────
  const renderOverview = () => {
    const activeStudents =
      data.students.byStatus.find((s) => s.status === "approved")?.count || 0;
    return (
      <div className="space-y-6">
        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Students"
            value={data.students.total.toLocaleString("en-IN")}
            icon={Users}
            color="blue"
            subtitle={`${activeStudents} active`}
            trend={{ value: data.students.recentAdmissions, label: "last 30d" }}
          />
          <StatCard
            title="Total Revenue"
            value={`₹${data.fees.totalCollected.toLocaleString("en-IN")}`}
            icon={IndianRupee}
            color="emerald"
            subtitle={`${data.fees.collectionRate}% collected`}
          />
          <StatCard
            title="Staff Members"
            value={data.staff.total}
            icon={UserCog}
            color="purple"
          />
          <StatCard
            title="Departments"
            value={data.departments.length}
            icon={Building}
            color="amber"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Courses"
            value={data.courses.total}
            icon={BookOpen}
            color="indigo"
            subtitle={`${data.courses.active} active`}
          />
          <StatCard
            title="No-Due Requests"
            value={data.dues.totalRequests}
            icon={CheckCircle}
            color="teal"
          />
          <StatCard
            title="Certificates"
            value={data.certificates.total}
            icon={FileText}
            color="rose"
          />
          <StatCard
            title="Notifications"
            value={data.notifications.total}
            icon={Bell}
            color="slate"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Students by Program">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.students.byProgram}
                  dataKey="count"
                  nameKey="program"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={3}
                  label={({ program, count }) => `${program}: ${count}`}
                >
                  {data.students.byProgram.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Fee Collection Trend">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.fees.monthlyRevenueTrend}>
                <defs>
                  <linearGradient id="gCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="collected"
                  stroke="#10b981"
                  fill="url(#gCollected)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="pending"
                  stroke="#f59e0b"
                  fill="url(#gPending)"
                  strokeWidth={2}
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Strength */}
          <ChartCard title="Department Strength" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.departments} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="code"
                  type="category"
                  width={60}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="studentCount"
                  fill="#0ea5e9"
                  radius={[0, 4, 4, 0]}
                  name="Students"
                />
                <Bar
                  dataKey="courseCount"
                  fill="#8b5cf6"
                  radius={[0, 4, 4, 0]}
                  name="Courses"
                />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Quick Stats */}
          <ChartCard title="System Health">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Fee Collection</span>
                  <span className="font-semibold text-slate-700">
                    {data.fees.collectionRate}%
                  </span>
                </div>
                <ProgressBar
                  value={data.fees.totalCollected}
                  max={data.fees.totalInvoiced}
                  color="#10b981"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Bus Utilization</span>
                  <span className="font-semibold text-slate-700">
                    {data.bus.totalSeats > 0
                      ? Math.round(
                          (data.bus.totalOccupied / data.bus.totalSeats) * 100,
                        )
                      : 0}
                    %
                  </span>
                </div>
                <ProgressBar
                  value={data.bus.totalOccupied}
                  max={data.bus.totalSeats}
                  color="#0ea5e9"
                />
              </div>
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Active Buses</span>
                  <span className="font-semibold">
                    {data.bus.activeBuses}/{data.bus.totalBuses}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Hostels</span>
                  <span className="font-semibold">
                    {data.hostel.totalHostels} ({data.hostel.totalOccupants}{" "}
                    occupants)
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Active Batches</span>
                  <span className="font-semibold">
                    {data.batches.byStatus.find((b) => b.status === "ACTIVE")
                      ?.count || 0}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Audit Logs (30d)</span>
                  <span className="font-semibold">
                    {data.auditLogs.last30Days.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-2">
                  Email Queue
                </p>
                <div className="flex gap-2 flex-wrap">
                  {data.emails.byStatus.map((e) => (
                    <StatusBadge key={e.status} status={e.status} />
                  ))}
                </div>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>
    );
  };

  const renderStudents = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={data.students.total.toLocaleString("en-IN")}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Recent Admissions"
          value={data.students.recentAdmissions}
          icon={TrendingUp}
          color="emerald"
          subtitle="Last 30 days"
        />
        <StatCard
          title="Active Students"
          value={
            data.students.byStatus.find((s) => s.status === "approved")
              ?.count || 0
          }
          icon={CheckCircle}
          color="teal"
        />
        <StatCard
          title="Graduated"
          value={
            data.students.byStatus.find((s) => s.status === "graduated")
              ?.count || 0
          }
          icon={GraduationCap}
          color="purple"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Students by Status">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data.students.byStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={55}
                paddingAngle={3}
                label={({ status, count }) => `${status}: ${count}`}
              >
                {data.students.byStatus.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      STATUS_COLORS[entry.status] || COLORS[i % COLORS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Students by Program">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.students.byProgram}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="program" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                fill="#0ea5e9"
                radius={[6, 6, 0, 0]}
                name="Students"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Gender Distribution">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data.students.byGender}
                dataKey="count"
                nameKey="gender"
                cx="50%"
                cy="50%"
                outerRadius={85}
                innerRadius={45}
                paddingAngle={4}
              >
                {data.students.byGender.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Students by Semester">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.students.bySemester}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="semester" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                fill="#8b5cf6"
                radius={[6, 6, 0, 0]}
                name="Students"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Admission Type">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data.students.byAdmissionType.filter(
                  (a) => a.type !== null,
                )}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={85}
                innerRadius={45}
                paddingAngle={4}
              >
                {data.students.byAdmissionType.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      {data.students.byCategory.length > 0 && (
        <ChartCard title="Students by Category">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={data.students.byCategory.filter((c) => c.category !== null)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                fill="#f59e0b"
                radius={[6, 6, 0, 0]}
                name="Students"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );

  const renderFees = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Invoiced"
          value={`₹${data.fees.totalInvoiced.toLocaleString("en-IN")}`}
          icon={IndianRupee}
          color="blue"
        />
        <StatCard
          title="Collected"
          value={`₹${data.fees.totalCollected.toLocaleString("en-IN")}`}
          icon={TrendingUp}
          color="emerald"
          subtitle={`${data.fees.collectionRate}% rate`}
        />
        <StatCard
          title="Pending"
          value={`₹${data.fees.totalPending.toLocaleString("en-IN")}`}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Overdue"
          value={`₹${data.fees.totalOverdue.toLocaleString("en-IN")}`}
          icon={AlertCircle}
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Monthly Revenue Trend">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.fees.monthlyRevenueTrend}>
              <defs>
                <linearGradient id="feeCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="feePending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="collected"
                stroke="#10b981"
                fill="url(#feeCollected)"
                strokeWidth={2}
                name="Collected"
              />
              <Area
                type="monotone"
                dataKey="pending"
                stroke="#f59e0b"
                fill="url(#feePending)"
                strokeWidth={2}
                name="Pending"
              />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Invoice Status Breakdown">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={Object.entries(data.fees.invoicesByStatus).map(
                  ([status, count]) => ({ status, count }),
                )}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={55}
                paddingAngle={3}
              >
                {Object.keys(data.fees.invoicesByStatus).map((status, i) => (
                  <Cell
                    key={i}
                    fill={STATUS_COLORS[status] || COLORS[i % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Payment Status">
          <MiniTable
            headers={["Status", "Count", "Total (₹)"]}
            rows={data.fees.payments.map((p) => [
              p.status,
              p.count,
              `₹${p.total.toLocaleString("en-IN")}`,
            ])}
          />
        </ChartCard>
        <ChartCard title="Payment Methods">
          <MiniTable
            headers={["Method", "Count", "Total (₹)"]}
            rows={data.fees.paymentsByMethod.map((p) => [
              p.method || "N/A",
              p.count,
              `₹${p.total.toLocaleString("en-IN")}`,
            ])}
          />
        </ChartCard>
      </div>

      <StatCard
        title="Total Fines Collected"
        value={`₹${data.fees.totalFine.toLocaleString("en-IN")}`}
        icon={AlertCircle}
        color="rose"
        subtitle="Across all overdue invoices"
      />
    </div>
  );

  const renderDepartments = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Departments"
          value={data.departments.length}
          icon={Building}
          color="amber"
        />
        <StatCard
          title="Total Students"
          value={data.departments.reduce((s, d) => s + d.studentCount, 0)}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Courses"
          value={data.departments.reduce((s, d) => s + d.courseCount, 0)}
          icon={BookOpen}
          color="indigo"
        />
      </div>
      <ChartCard title="Department-wise Student & Course Count">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data.departments} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              dataKey="name"
              type="category"
              width={140}
              tick={{ fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="studentCount"
              fill="#0ea5e9"
              radius={[0, 4, 4, 0]}
              name="Students"
            />
            <Bar
              dataKey="courseCount"
              fill="#8b5cf6"
              radius={[0, 4, 4, 0]}
              name="Courses"
            />
            <Legend />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="All Departments">
        <MiniTable
          headers={["Name", "Code", "Program", "Status", "Students", "Courses"]}
          rows={data.departments.map((d) => [
            d.name,
            d.code,
            d.program,
            d.status,
            d.studentCount,
            d.courseCount,
          ])}
        />
      </ChartCard>
    </div>
  );

  const renderBus = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Buses"
          value={data.bus.totalBuses}
          icon={Bus}
          color="blue"
        />
        <StatCard
          title="Active Buses"
          value={data.bus.activeBuses}
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Total Seats"
          value={data.bus.totalSeats}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Occupied"
          value={data.bus.totalOccupied}
          icon={Activity}
          color="teal"
          subtitle={`${data.bus.totalSeats > 0 ? Math.round((data.bus.totalOccupied / data.bus.totalSeats) * 100) : 0}% utilization`}
        />
      </div>

      <ChartCard title="Bus Occupancy Rate">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.bus.utilization}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="occupancyRate"
              fill="#0ea5e9"
              radius={[6, 6, 0, 0]}
              name="Occupancy %"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Bus Details">
          <MiniTable
            headers={["Bus", "Route", "Seats", "Occupied", "Stops", "Rate"]}
            rows={data.bus.utilization.map((b) => [
              b.name,
              b.route || "N/A",
              b.totalSeats,
              b.occupied,
              b.stops,
              `${b.occupancyRate}%`,
            ])}
          />
        </ChartCard>
        <ChartCard title="Bus Requests by Status">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data.bus.requestsByStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={85}
                innerRadius={45}
                paddingAngle={3}
              >
                {data.bus.requestsByStatus.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      STATUS_COLORS[entry.status] || COLORS[i % COLORS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );

  const renderHostel = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Hostels"
          value={data.hostel.totalHostels}
          icon={Bed}
          color="purple"
        />
        <StatCard
          title="Total Occupants"
          value={data.hostel.totalOccupants}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Monthly Revenue"
          value={`₹${data.hostel.hostels
            .reduce(
              (s, h) => s + parseFloat(h.monthlyRent || 0) * h.occupants,
              0,
            )
            .toLocaleString("en-IN")}`}
          icon={IndianRupee}
          color="emerald"
          subtitle="Estimated from occupancy"
        />
      </div>
      <ChartCard title="Hostel Occupancy">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.hostel.hostels}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="occupants"
              fill="#8b5cf6"
              radius={[6, 6, 0, 0]}
              name="Occupants"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Hostel Details">
        <MiniTable
          headers={["Name", "Warden", "Monthly Rent (₹)", "Occupants"]}
          rows={data.hostel.hostels.map((h) => [
            h.name,
            h.warden || "N/A",
            `₹${parseFloat(h.monthlyRent || 0).toLocaleString("en-IN")}`,
            h.occupants,
          ])}
        />
      </ChartCard>
    </div>
  );

  const renderCertificates = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Requests"
          value={data.certificates.total}
          icon={FileText}
          color="indigo"
        />
        <StatCard
          title="Approved"
          value={
            data.certificates.byStatus.find((s) => s.status === "APPROVED")
              ?.count || 0
          }
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Pending"
          value={
            data.certificates.byStatus.find((s) => s.status === "PENDING")
              ?.count || 0
          }
          icon={Clock}
          color="amber"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="By Type">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.certificates.byType}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={50}
                paddingAngle={3}
              >
                {data.certificates.byType.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="By Status">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.certificates.byStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={50}
                paddingAngle={3}
              >
                {data.certificates.byStatus.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      STATUS_COLORS[entry.status] || COLORS[i % COLORS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Workflow Stage Distribution">
          <div className="space-y-3">
            {data.certificates.byWorkflow.map((w) => (
              <div key={w.stage}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">
                    {w.stage.replace(/_/g, " ")}
                  </span>
                  <span className="font-semibold">{w.count}</span>
                </div>
                <ProgressBar
                  value={w.count}
                  max={data.certificates.total}
                  color={
                    COLORS[
                      data.certificates.byWorkflow.indexOf(w) % COLORS.length
                    ]
                  }
                />
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );

  const renderDues = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={data.dues.totalRequests}
          icon={FileText}
          color="teal"
        />
        <StatCard
          title="Total Dues"
          value={data.dues.totalDues}
          icon={CheckCircle}
          color="blue"
        />
        <StatCard
          title="Cleared"
          value={
            data.dues.duesByStatus.find((d) => d.status === "cleared")?.count ||
            0
          }
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Pending"
          value={
            data.dues.duesByStatus.find((d) => d.status === "pending")?.count ||
            0
          }
          icon={Clock}
          color="amber"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Request Status">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.dues.requestsByStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={50}
                paddingAngle={3}
              >
                {data.dues.requestsByStatus.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      STATUS_COLORS[entry.status] || COLORS[i % COLORS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Due Status">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.dues.duesByStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={50}
                paddingAngle={3}
              >
                {data.dues.duesByStatus.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      STATUS_COLORS[entry.status] || COLORS[i % COLORS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <ChartCard title="Service Department Clearance Rates">
        <div className="space-y-4">
          {data.dues.serviceDeptClearance.map((sd) => (
            <div key={sd.id}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">{sd.name}</span>
                <span className="text-slate-500">
                  {sd.cleared}/{sd.total} cleared ({sd.clearanceRate}%)
                </span>
              </div>
              <ProgressBar value={sd.cleared} max={sd.total} color="#10b981" />
            </div>
          ))}
          {data.dues.serviceDeptClearance.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">
              No service department clearance data available.
            </p>
          )}
        </div>
      </ChartCard>
    </div>
  );

  const renderCourses = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Courses"
          value={data.courses.total}
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          title="Active"
          value={data.courses.active}
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Inactive"
          value={data.courses.inactive}
          icon={AlertCircle}
          color="slate"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Course Type (Theory vs Lab)">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.courses.byType}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={50}
                paddingAngle={4}
              >
                {data.courses.byType.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Course Category">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.courses.byCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                fill="#8b5cf6"
                radius={[6, 6, 0, 0]}
                name="Courses"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );

  const renderStaff = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Staff"
          value={data.staff.total}
          icon={UserCog}
          color="purple"
        />
        <StatCard
          title="Active"
          value={
            data.staff.byStatus.find((s) => s.status === "active")?.count || 0
          }
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Roles"
          value={data.staff.byRole.length}
          icon={Shield}
          color="indigo"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Staff Status">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.staff.byStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={50}
                paddingAngle={4}
              >
                {data.staff.byStatus.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      STATUS_COLORS[entry.status] || COLORS[i % COLORS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Staff by Role">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.staff.byRole} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="role"
                type="category"
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                fill="#6366f1"
                radius={[0, 6, 6, 0]}
                name="Users"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <StatCard
        title="Total Notifications"
        value={data.notifications.total}
        icon={Bell}
        color="indigo"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="By Priority">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.notifications.byPriority}
                dataKey="count"
                nameKey="priority"
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={50}
                paddingAngle={4}
              >
                {data.notifications.byPriority.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="By Target Type">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.notifications.byTarget}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="target" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                fill="#ec4899"
                radius={[6, 6, 0, 0]}
                name="Notifications"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Email Queue">
          <MiniTable
            headers={["Status", "Count"]}
            rows={data.emails.byStatus.map((e) => [e.status, e.count])}
          />
        </ChartCard>
        <ChartCard title="Audit Activity">
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Total Audit Logs</span>
              <span className="text-lg font-bold text-slate-900">
                {data.auditLogs.total.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Last 30 Days</span>
              <span className="text-lg font-bold text-teal-600">
                {data.auditLogs.last30Days.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );

  const renderBatches = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Batches"
          value={data.batches.total}
          icon={LayoutGrid}
          color="indigo"
        />
        <StatCard
          title="Active"
          value={
            data.batches.byStatus.find((b) => b.status === "ACTIVE")?.count || 0
          }
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Upcoming"
          value={
            data.batches.byStatus.find((b) => b.status === "UPCOMING")?.count ||
            0
          }
          icon={Clock}
          color="blue"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Batch Status Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.batches.byStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={50}
                paddingAngle={4}
              >
                {data.batches.byStatus.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      STATUS_COLORS[entry.status] || COLORS[i % COLORS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Recent Admission Windows">
          <MiniTable
            headers={["Batch", "Program", "Open", "Start", "End"]}
            rows={data.admissionWindows.map((w) => [
              w.batch,
              w.program,
              w.isOpen ? "Yes" : "No",
              new Date(w.startDate).toLocaleDateString(),
              new Date(w.endDate).toLocaleDateString(),
            ])}
          />
        </ChartCard>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return renderOverview();
      case "students":
        return renderStudents();
      case "fees":
        return renderFees();
      case "departments":
        return renderDepartments();
      case "bus":
        return renderBus();
      case "hostel":
        return renderHostel();
      case "certificates":
        return renderCertificates();
      case "dues":
        return renderDues();
      case "courses":
        return renderCourses();
      case "staff":
        return renderStaff();
      case "notifications":
        return renderNotifications();
      case "batches":
        return renderBatches();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
            <p className="text-sm text-slate-500 mt-1">
              Comprehensive platform insights across all modules
            </p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
          >
            <Activity className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex gap-1 overflow-x-auto scrollbar-thin py-1">
          {SECTION_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  activeSection === tab.key
                    ? "bg-teal-50 text-teal-700"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">{renderSection()}</div>
    </div>
  );
};

export default AnalyticsPage;
