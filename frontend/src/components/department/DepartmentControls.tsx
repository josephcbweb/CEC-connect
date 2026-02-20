import { Search, Plus } from "lucide-react";

import { AVAILABLE_PROGRAMS } from "../../utils/constants";

interface Props {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  programFilter: string;
  setProgramFilter: (value: string) => void;
  onAddClick: () => void;
}

export default function DepartmentControls({
  searchTerm,
  setSearchTerm,
  programFilter,
  setProgramFilter,
  onAddClick,
}: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-400 rounded-[1.5rem] focus:outline-none"
          />
        </div>

        <div className="flex-1 max-w-xs">
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Programs</option>
            {AVAILABLE_PROGRAMS.map((prog) => (
              <option key={prog.id} value={prog.id}>
                {prog.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onAddClick}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 hover:cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Department
        </button>
      </div>
    </div>
  );
}
