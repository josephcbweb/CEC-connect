import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import type { Student, Invoice, FeeStructure } from "../types";
import { StudentNavbar } from "./student/StudentNavbar";

// --- Type Definition ---
interface StudentWithFees extends Student {
  invoices: (Invoice & { feeStructure: FeeStructure | null })[];
}

const StudentLayout: React.FC = () => {
  const [studentData, setStudentData] = useState<StudentWithFees | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Lakshmi fetch the student id from the session and add it here.
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

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <StudentNavbar studentData={studentData} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading Student Portal...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold">Unable to Load Data</h2>
            <p className="mt-2">
              There was an issue fetching your information. Please try again
              later.
            </p>
            <p className="mt-4 text-sm bg-red-100 p-2 rounded">
              Error: {error}
            </p>
          </div>
        )}
        {!loading && !error && studentData && (
          <Outlet context={{ studentData }} />
        )}
      </main>
    </div>
  );
};

export default StudentLayout;
