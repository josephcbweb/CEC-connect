// src/components/StudentRow.tsx

import React from "react";
import { useNavigate } from "react-router-dom";

interface StudentRowProps {
  id: number;
  name: string;
  program: string;
  department: string;
  year: number | null;
  isSelected: boolean;
  onSelect: (id: number) => void;
}

const StudentRow: React.FC<StudentRowProps> = ({
  id,
  name,
  program,
  department,
  year,
  isSelected,
  onSelect,
}) => {
  const navigate = useNavigate();
  return (
    // CRITICAL: Ensure NO horizontal padding (like px-4) is on this root div
    <div className="flex items-center py-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 text-sm">
      {/* Column 1: Name */}
      <div className="flex items-center w-4/12 pl-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(id)}
          className="mr-4 cursor-pointer"
        />

        {/* The 'truncate' class will add "..." if the name is too long */}
        <div className="font-medium text-gray-800 truncate">{name}</div>
      </div>

      {/* Column 2: Program */}
      <div className="w-3/12 px-2 text-gray-600 truncate">{program}</div>

      {/* Column 3: Department */}
      <div className="w-3/12 px-2 text-gray-600 truncate">{department}</div>

      {/* Column 4: Year */}
      <div className="w-2/12 pr-4 text-gray-600">{year ?? "—"}</div>

      {/* Column 5: View Details Link */}
      <div className="w-2/12 pr-4 text-right">
        <button
          onClick={() => navigate(`/admin/studentDetails/${id}`)}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium cursor-pointer"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default StudentRow;
