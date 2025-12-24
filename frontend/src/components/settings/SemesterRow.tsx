import React, { useEffect, useState } from "react";

type SemesterData = {
  semester: number;
  studentCount: number;
};

interface SemesterRowProps {
  semester: number;
  studentCount: number;
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean; // ✅ ADD THIS
}

function SemesterRow({
  semester,
  studentCount,
  isSelected,
  onToggle,
}: SemesterRowProps) {
  return (
    <tr
      className={`border-b border-gray-100 transition-all duration-200 ${
        isSelected ? "bg-blue-50" : "hover:bg-gray-50"
      }`}
    >
      <td className="px-6 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
        />
      </td>
      <td className="px-6 py-4">
        <span className="font-semibold text-gray-900">Semester {semester}</span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-gray-700 font-medium">{studentCount}</span>
          <span className="text-gray-400 text-sm">students</span>
        </div>
      </td>
    </tr>
  );
}

export default SemesterRow;