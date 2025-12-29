import React from "react";
import { useOutletContext } from "react-router-dom";
import { type FeeStructure, type Invoice, type Student } from "../../types";
import { AlertCircle } from "lucide-react";

interface StudentWithFees extends Student {
  invoices: (Invoice & { feeStructure: FeeStructure | null })[];
}
const StudentDashboardPage: React.FC = () => {
  const { studentData, isRegistrationOpen } = useOutletContext<{
    studentData: StudentWithFees;
    isRegistrationOpen: boolean;
  }>();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
      <p className="mt-1 text-lg text-gray-600">
        Welcome back, {studentData.name}.
      </p>

      {isRegistrationOpen && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-blue-600 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-blue-900">
              Semester Registration Open
            </h3>
            <p className="text-blue-700 text-sm mt-1">
              Registration for the upcoming semester is now open. Please
              complete your registration to initiate the No Due clearance
              process.
            </p>
            <a
              href="/student/register"
              className="inline-block mt-2 text-sm font-medium text-blue-800 hover:underline"
            >
              Go to Registration &rarr;
            </a>
          </div>
        </div>
      )}

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
