import React from "react";
import type { StudentFee, SortConfig } from "../../types";

interface StudentFeeTableProps {
  students: StudentFee[];
  sortConfig: SortConfig;
  onSort: (key: keyof StudentFee) => void;
  selectedStudents: number[];
  setSelectedStudents: React.Dispatch<React.SetStateAction<number[]>>;
  onViewDetails: (student: StudentFee) => void;
  onRefresh: () => void;
}

const StudentFeeTable: React.FC<StudentFeeTableProps> = ({
  students,
  sortConfig,
  onSort,
  selectedStudents,
  setSelectedStudents,
  onViewDetails,
  onRefresh,
}) => {
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudents(students.map((s) => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectOne = (id: number) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter((sId) => sId !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  const getSortIcon = (key: keyof StudentFee): string => {
    if (sortConfig.key !== key) return "↕️";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const getStatusBadge = (status: StudentFee["feeStatus"]) => {
    const statusConfig = {
      paid: { color: "bg-green-100 text-green-800", label: "Paid" },
      due: { color: "bg-yellow-100 text-yellow-800", label: "Due" },
      overdue: { color: "bg-red-100 text-red-800", label: "Overdue" },
      pending: { color: "bg-gray-100 text-gray-800", label: "No Dues" },
    };
    const config = statusConfig[status];
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          Student Fees ({students.length} students)
        </h2>
        <button
          onClick={onRefresh}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="pr-4 px-2 py-4">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  onChange={handleSelectAll}
                  checked={
                    students.length > 0 &&
                    selectedStudents.length === students.length
                  }
                  aria-label="Select all students"
                />
              </th>
              <th
                onClick={() => onSort("name")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Student Info {getSortIcon("name")}
              </th>
              <th
                onClick={() => onSort("feeStatus")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Fee Status {getSortIcon("feeStatus")}
              </th>
              <th
                onClick={() => onSort("totalDue")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Total Due {getSortIcon("totalDue")}
              </th>
              <th
                onClick={() => onSort("totalPaid")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Total Paid {getSortIcon("totalPaid")}
              </th>
              <th
                onClick={() => onSort("pendingAmount")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Pending {getSortIcon("pendingAmount")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr
                key={student.id}
                className={`hover:bg-gray-50 ${
                  selectedStudents.includes(student.id) ? "bg-teal-50" : ""
                }`}
              >
                <td className="p-4">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => handleSelectOne(student.id)}
                    aria-label={`Select student ${student.name}`}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {student.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {student.admission_number || student.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(student.feeStatus)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  ₹{student.totalDue.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                  ₹{student.totalPaid.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                  ₹{student.pendingAmount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onViewDetails(student)}
                    className="text-teal-600 hover:text-teal-800"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {students.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No students found.</p>
            <p className="text-gray-400 text-sm mt-2">
              Try adjusting your filters or clearing them to see results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFeeTable;
