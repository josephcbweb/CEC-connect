import { useState, useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (filters: {
    program: string;
    departments?: string[];
    years?: number[];
  }) => void;
  programs: string[];
  departments: string[];
}

const PdfModal = ({
  isOpen,
  onClose,
  onGenerate,
  programs,
  departments,
}: Props) => {
  const [program, setProgram] = useState("btech");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);

  const yearOptions = program === "btech" ? [1, 2, 3, 4] : [1, 2];

  useEffect(() => {
    if (isOpen) {
      setProgram("btech");
      setSelectedDepartments([]);
      setSelectedYears([]);
    }
  }, [isOpen]);

  const handleGenerate = () => {
    onGenerate({
      program,
      departments:
        selectedDepartments.length > 0 ? selectedDepartments : undefined,
      years: selectedYears.length > 0 ? selectedYears : undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-blue-50 bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-[90%] max-w-md shadow-lg">
        <h3 className="text-xl font-bold mb-4">Generate Student Report</h3>

        <label className="block mb-2 font-semibold">Program</label>
        <select
          value={program}
          onChange={(e) => {
            setProgram(e.target.value);
            setSelectedDepartments([]);
            setSelectedYears([]);
          }}
          className="w-full mb-4 p-2 border rounded"
        >
          {programs.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {program === "btech" && (
          <>
            <label className="block mb-2 font-semibold">Departments</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() =>
                    setSelectedDepartments((prev) =>
                      prev.includes(dept)
                        ? prev.filter((d) => d !== dept)
                        : [...prev, dept]
                    )
                  }
                  className={`px-4 py-2 rounded-md border text-sm font-medium ${
                    selectedDepartments.includes(dept)
                      ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                      : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </>
        )}

        <label className="block mb-2 font-semibold">Years</label>
        <div className="flex gap-2 flex-wrap mb-4">
          {yearOptions.map((y) => (
            <button
              key={y}
              onClick={() =>
                setSelectedYears((prev) =>
                  prev.includes(y)
                    ? prev.filter((yr) => yr !== y)
                    : [...prev, y]
                )
              }
              className={`px-4 py-2 rounded-md border text-sm font-medium ${
                selectedYears.includes(y)
                  ? "bg-teal-100 text-teal-800 border-teal-300"
                  : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
              }`}
            >
              Year {y}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-teal-600 text-white rounded cursor-pointer"
          >
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfModal;
