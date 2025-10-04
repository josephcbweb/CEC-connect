// src/pages/admin/fees/components/AssignFeeForm.tsx
import React, { useState, useEffect } from "react";
import type {
  FeeDetails,
  Student,
  Department,
  AssignFeeRequest,
} from "../../types/fee";

interface AssignFeeFormProps {
  feeStructures: FeeDetails[];
}

const AssignFeeForm: React.FC<AssignFeeFormProps> = ({ feeStructures }) => {
  const [targetType, setTargetType] = useState<"student" | "department">(
    "student"
  );
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedFeeId, setSelectedFeeId] = useState<string>("");
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [studentSearch, setStudentSearch] = useState<string>("");

  const searchStudents = async (query: string): Promise<void> => {
    if (!query) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/students?q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const data: Student[] = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error("Error searching students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDepartments = async (): Promise<void> => {
    try {
      const response = await fetch("/api/departments");
      if (response.ok) {
        const data: Department[] = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error("Error loading departments:", error);
    }
  };

  useEffect(() => {
    if (targetType === "department") {
      loadDepartments();
    }
  }, [targetType]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!selectedFeeId || !selectedTargetId) {
      alert("Please select both a fee structure and a target");
      return;
    }

    setIsLoading(true);

    try {
      const selectedFee = feeStructures.find(
        (fee) => fee.id === parseInt(selectedFeeId)
      );

      if (!selectedFee) {
        alert("Selected fee not found");
        return;
      }

      const payload: AssignFeeRequest = {
        feeType: selectedFee.feeType,
        amount: selectedFee.amount,
        dueDate: selectedFee.dueDate,
        target: {
          type: targetType,
          id: parseInt(selectedTargetId),
        },
      };

      const response = await fetch("/api/fees/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        setSelectedFeeId("");
        setSelectedTargetId("");
        setStudentSearch("");
      } else {
        throw new Error(result.error || "Failed to assign fees");
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to assign fees");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Assign Fees to Students
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fee Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Fee Structure
          </label>
          <select
            value={selectedFeeId}
            onChange={(e) => setSelectedFeeId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">Choose a fee structure...</option>
            {feeStructures.map((fee) => (
              <option key={fee.id} value={fee.id}>
                {fee.feeType} - ${fee.amount.toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        {/* Target Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Assign To
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="student"
                checked={targetType === "student"}
                onChange={(e) => setTargetType(e.target.value as "student")}
                className="text-teal-600 focus:ring-teal-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Individual Student
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="department"
                checked={targetType === "department"}
                onChange={(e) => setTargetType(e.target.value as "department")}
                className="text-teal-600 focus:ring-teal-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Entire Department
              </span>
            </label>
          </div>
        </div>

        {/* Target Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {targetType === "student" ? "Select Student" : "Select Department"}
          </label>

          {targetType === "student" ? (
            <div>
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  searchStudents(e.target.value);
                }}
                placeholder="Search for student by name or ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Select a student...</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} - {student.id}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Choose a department...</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !selectedFeeId || !selectedTargetId}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating Invoices...
            </>
          ) : (
            "Assign and Generate Invoices"
          )}
        </button>
      </form>
    </div>
  );
};

export default AssignFeeForm;
