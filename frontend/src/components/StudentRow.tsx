// src/components/StudentRow.tsx

import React from "react";

interface StudentRowProps {
  name: string;
  program: string;
  department: string;
  year: number | null;
}

const StudentRow: React.FC<StudentRowProps> = ({
  name,
  program,
  department,
  year,
}) => {
  return (
    // CRITICAL: Ensure NO horizontal padding (like px-4) is on this root div
    <div className="flex items-center py-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 text-sm">
      {/* Column 1: Name */}
      <div className="flex items-center w-4/12 pl-4">
        <input type="checkbox" className="mr-4 cursor-pointer" />
        {/* The 'truncate' class will add "..." if the name is too long */}
        <div className="font-medium text-gray-800 truncate">{name}</div>
      </div>

      {/* Column 2: Program */}
      <div className="w-3/12 px-2 text-gray-600 truncate">{program}</div>

      {/* Column 3: Department */}
      <div className="w-3/12 px-2 text-gray-600 truncate">{department}</div>

      {/* Column 4: Year */}
      <div className="w-2/12 pr-4 text-gray-600">{year ?? "—"}</div>
    </div>
  );
};

export default StudentRow;
