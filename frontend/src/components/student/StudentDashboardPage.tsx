import React from "react";
import { useOutletContext } from "react-router-dom";
import { type FeeStructure, type Invoice, type Student } from "../../types";
interface StudentWithFees extends Student {
  invoices: (Invoice & { feeStructure: FeeStructure | null })[];
}
const StudentDashboardPage: React.FC = () => {
  const { studentData } = useOutletContext<{ studentData: StudentWithFees }>();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
      <p className="mt-1 text-lg text-gray-600">
        Welcome back, {studentData.name}.
      </p>
      <div className="mt-8 p-6 bg-white border rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold">Quick Overview</h2>
        <p className="mt-2 text-gray-700">
          This is your main dashboard. Important announcements, upcoming
          deadlines, and quick links will be displayed here.
        </p>
      </div>
    </div>
  );
};

export default StudentDashboardPage;
