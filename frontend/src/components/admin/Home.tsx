import React, { useState, useEffect } from "react";
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
} from "recharts";
import type { Student, Invoice } from "../../types"; // Assuming types are in a shared location

// --- Helper Types for Analytics ---
interface AnalyticsData {
  totalStudents: number;
  totalDepartments: number;
  totalRevenue: number;
  totalPending: number;
  studentsByDept: { name: string; value: number }[];
  monthlyCollections: { month: string; collected: number; pending: number }[];
  admissionTrend: { year: string; count: number }[];
  recentInvoices: Invoice[];
}

const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        // OPTIMIZATION: Fetch all student data, which now includes invoices, in a single call.
        const response = await fetch(
          "http://localhost:3000/students/all?include=department,invoices"
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch student and fee data from the server."
          );
        }

        const students: Student[] = await response.json();

        // --- Create a flat list of all invoices from the students data ---
        const allInvoices: Invoice[] = students.flatMap(
          (s) => s.invoices || []
        );

        // --- Process Data for Analytics ---
        const totalStudents = students.length;

        // FIX: Ensure all calculations use parseFloat to handle decimal-to-string conversion from Prisma.
        const totalRevenue = allInvoices
          .filter((inv) => inv.status === "paid")
          .reduce((sum, inv) => sum + parseFloat(inv.amount as any), 0);

        const totalPending = allInvoices
          .filter((inv) => inv.status !== "paid")
          .reduce((sum, inv) => sum + parseFloat(inv.amount as any), 0);

        const studentsByDept = students.reduce((acc, student) => {
          const deptName = student.department?.name || "No Department";
          acc[deptName] = (acc[deptName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const monthlyCollections = allInvoices.reduce((acc, inv) => {
          const date = new Date(inv.issueDate);
          const month = date.toLocaleString("default", {
            month: "short",
            year: "2-digit",
          });
          if (!acc[month]) {
            acc[month] = { month, collected: 0, pending: 0 };
          }
          if (inv.status === "paid") {
            acc[month].collected += parseFloat(inv.amount as any);
          } else {
            acc[month].pending += parseFloat(inv.amount as any);
          }
          return acc;
        }, {} as Record<string, { month: string; collected: number; pending: number }>);

        const admissionTrend = students.reduce((acc, student) => {
          const year = new Date(student.admission_date || student.createdAt)
            .getFullYear()
            .toString();
          acc[year] = (acc[year] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        setData({
          totalStudents,
          totalDepartments: Object.keys(studentsByDept).length,
          totalRevenue,
          totalPending,
          studentsByDept: Object.entries(studentsByDept).map(
            ([name, value]) => ({ name, value })
          ),
          monthlyCollections: Object.values(monthlyCollections).sort(
            (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
          ),
          admissionTrend: Object.entries(admissionTrend)
            .map(([year, count]) => ({ year, count }))
            .sort((a, b) => a.year.localeCompare(b.year)),
          recentInvoices: allInvoices
            .sort(
              (a, b) =>
                new Date(b.issueDate).getTime() -
                new Date(a.issueDate).getTime()
            )
            .slice(0, 5),
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-red-50 text-red-700 rounded-lg w-full">
        <h2 className="text-xl font-bold">Failed to load Dashboard</h2>
        <p>{error || "Analytics data is unavailable."}</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 w-full">
      <h1 className="text-3xl font-bold text-slate-800">Analytics Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Overview of college finances and student demographics.
      </p>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <StatCard
          title="Total Students"
          value={data.totalStudents.toLocaleString()}
        />
        <StatCard
          title="Total Departments"
          value={data.totalDepartments.toLocaleString()}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(data.totalRevenue)}
          color="text-green-600"
        />
        <StatCard
          title="Pending Dues"
          value={formatCurrency(data.totalPending)}
          color="text-red-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-8">
        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-lg mb-4">Monthly Fee Collection</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthlyCollections}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(val) => `₹${(val as number) / 1000}k`} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar dataKey="collected" fill="#14B8A6" name="Collected" />
              <Bar dataKey="pending" fill="#F43F5E" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-lg mb-4">
            Student Distribution by Department
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.studentsByDept}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {data.studentsByDept.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Admission Trend & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-lg mb-4">Yearly Admission Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.admissionTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                name="New Students"
                stroke="#3AA9AB"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-lg mb-4">Recent Invoices</h3>
          <div className="space-y-3">
            {data.recentInvoices.map((inv) => (
              <div
                key={inv.id}
                className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-800">Invoice #{inv.id}</p>
                  <p className="text-gray-500">Student ID: {inv.studentId}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(inv.amount)}</p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      inv.status === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-components for Cleaner Code ---
const StatCard: React.FC<{
  title: string;
  value: string | number;
  color?: string;
}> = ({ title, value, color = "text-gray-900" }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <p className="text-sm font-medium text-gray-600">{title}</p>
    <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
  </div>
);

// --- Utils ---
const formatCurrency = (amount: number | string) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};
const PIE_COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A234B5",
  "#FF6384",
];

export default AnalyticsDashboard;
