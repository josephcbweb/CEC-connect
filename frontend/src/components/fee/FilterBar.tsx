import React from "react";
import type { FilterConfig } from "../../types";

// Update props to include the new admission_quotas array
interface FilterBarProps {
  filters: FilterConfig;
  departments: string[];
  branches: string[];
  categories: string[];
  programs: string[];
  genders: string[];
  admission_types: string[]; // Changed to admission_types
  feeStatuses: string[];
  semesters?: string[];
  onFilterChange: (key: keyof FilterConfig, value: string) => void;
  onClearFilters: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  departments,
  branches,
  categories,
  programs,
  genders,
  admission_types, // Destructure the new prop
  feeStatuses,
  semesters = [],
  onFilterChange,
  onClearFilters,
}) => {
  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

  const formatOption = (option: string, label?: string) => {
    if (!option) return option;

    // Category values should be all caps
    if (label === "Category") {
      return option.toUpperCase();
    }

    // Special handling for common acronyms
    const acronyms = ["NRI", "BTECH", "MTECH", "MCA", "HOD", "TC", "SC", "ST", "OBC"];
    if (acronyms.includes(option.toUpperCase())) {
      return option.toUpperCase();
    }

    return option
      .split(/[_\s-]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Reusable component for dropdowns to keep code DRY
  const FilterDropdown: React.FC<{
    label: string;
    filterKey: keyof FilterConfig;
    options: string[];
    placeholder: string;
    showAllOption?: boolean;
  }> = ({ label, filterKey, options, placeholder, showAllOption = true }) => (
    <div className="relative z-10">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={filters[filterKey]}
        onChange={(e) => onFilterChange(filterKey, e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-150 ease-in-out"
      >
        {showAllOption && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {label === "Semester"
              ? `Semester ${option}`
              : formatOption(option, label)}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-teal-600 hover:text-teal-800 font-medium transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        <FilterDropdown
          label="Program"
          filterKey="program"
          options={programs}
          placeholder="All Programs"
          showAllOption={false}
        />
        <FilterDropdown
          label="Department"
          filterKey="department"
          options={departments}
          placeholder="All Departments"
          showAllOption={false}
        />
        <FilterDropdown
          label="Semester"
          filterKey="semester"
          options={semesters}
          placeholder="All Semesters"
          showAllOption={false}
        />
        <FilterDropdown
          label="Category"
          filterKey="category"
          options={categories}
          placeholder="All Categories"
        />
        <FilterDropdown
          label="Gender"
          filterKey="gender"
          options={genders}
          placeholder="All Genders"
        />
        {/* New Admission Type Filter */}
        <FilterDropdown
          label="Admission Type"
          filterKey="admission_type"
          options={admission_types}
          placeholder="All Types"
        />
        <FilterDropdown
          label="Fee Status"
          filterKey="feeStatus"
          options={feeStatuses}
          placeholder="All Statuses"
        />
      </div>
    </div>
  );
};

export default FilterBar;
