import { Link } from "react-router-dom";
import { exportToPDF } from "../../utilities/feereport";
import { Download } from "lucide-react";
import type { StudentFee, SortConfig, FilterConfig } from "../../types";

interface StudentFeeTableProps {
  students: StudentFee[];
  sortConfig: SortConfig;
  onSort: (key: keyof StudentFee) => void;
  selectedStudents: number[];
  setSelectedStudents: React.Dispatch<React.SetStateAction<number[]>>;
  onViewDetails: (student: StudentFee) => void;
  onRefresh: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: FilterConfig;
}

const StudentFeeTable: React.FC<StudentFeeTableProps> = ({
  students,
  sortConfig,
  onSort,
  selectedStudents,
  setSelectedStudents,
  onViewDetails,
  onRefresh,
  searchQuery,
  onSearchChange,
  filters,
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
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <h2 className="text-xl font-semibold text-gray-800">
            Student Fees ({students.length})
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative w-full max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
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
            <button
              onClick={() => exportToPDF(students, filters)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-md transition-colors duration-200 flex justify-around items-center gap-4 w-[65%]"
            >
              <span className="md:block hidden">Export PDF</span>
              <span>
                <Download size={20} />
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="pr-4 pl-2 py-3">
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
                className={`hover:bg-gray-50 ${selectedStudents.includes(student.id) ? "bg-teal-50" : ""
                  }`}
              >
                <td className="pl-4 py-4">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => handleSelectOne(student.id)}
                    aria-label={`Select student ${student.name}`}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 hover:text-teal-600 transition-colors">
                    <Link
                      to={`/admin/studentDetails/${student.id}`}
                      className="hover:underline underline-offset-2"
                    >
                      {student.name}
                    </Link>
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
