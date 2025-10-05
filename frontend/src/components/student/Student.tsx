import React, { useState, useEffect } from "react";
import type { Student, Invoice, FeeStructure } from "../../types";
import { StudentNavbar } from "./StudentNavbar";
import { FeeDetailsContent } from "./FeeDetailsContent";

interface StudentWithFees extends Student {
  invoices: (Invoice & { feeStructure: FeeStructure | null })[];
}

const StudentDashboardContent: React.FC<{ studentData: StudentWithFees }> = ({
  studentData,
}) => (
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

const Student: React.FC = () => {
  const [studentData, setStudentData] = useState<StudentWithFees | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"dashboard" | "fees">(
    "dashboard"
  );

  useEffect(() => {
    // --- AUTHENTICATION INTEGRATION POINT ---
    // Hardcoded studentId for development.
    // Lakshmi Kutti. You should get this from the user's session or auth context.
    const studentId = 20;

    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `http://localhost:3000/students/${studentId}/fees`
        );
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}.`);
        }
        const data: StudentWithFees = await response.json();
        setStudentData(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Student Portal...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold">Unable to Load Data</h2>
          <p className="mt-2">
            There was an issue fetching your information. Please try again
            later.
          </p>
          <p className="mt-4 text-sm bg-red-100 p-2 rounded">Error: {error}</p>
        </div>
      );
    }

    if (studentData) {
      switch (activeView) {
        case "dashboard":
          return <StudentDashboardContent studentData={studentData} />;
        case "fees":
          return <FeeDetailsContent studentData={studentData} />;
        default:
          return <StudentDashboardContent studentData={studentData} />;
      }
    }

    return null; // Should not happen if loading/error/data states are handled correctly
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <StudentNavbar
        studentData={studentData}
        activeView={activeView}
        onNavigate={setActiveView}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Student;
