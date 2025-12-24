import React, { useEffect, useState } from "react";
import SemesterRow from "./SemesterRow";

const baseURL = `http://localhost:3000`;

type SemesterData = {
  semester: number;
  studentCount: number;
};

export default function SemesterTable() {
  const [semesters, setSemesters] = useState<SemesterData[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false); // ✅ NEW

  // reusable fetch function
  const fetchSemesters = async () => {
    const res = await fetch(`${baseURL}/settings/semStats`);
    const data = await res.json();
    setSemesters(data);
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  const toggleAll = () => {
    if (selected.length === semesters.length) {
      setSelected([]);
    } else {
      setSelected(semesters.map((s) => s.semester));
    }
  };

  const toggleOne = (sem: number) => {
    setSelected((prev) =>
      prev.includes(sem) ? prev.filter((x) => x !== sem) : [...prev, sem]
    );
  };

  const promote = async () => {
    if (selected.length === 0 || processing) return;

    try {
      setProcessing(true); // 🔄 START PROCESSING

      await fetch(`${baseURL}/settings/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ semesters: selected }),
      });

      alert("✅ Promotion successful!");

      // 🔄 Refetch updated semester stats
      await fetchSemesters();

      // reset selection
      setSelected([]);
    } catch (error) {
      alert("❌ Promotion failed. Please try again.");
      console.error(error);
    } finally {
      setProcessing(false); // 🔄 STOP PROCESSING
    }
  };

  return (
    <div className="pt-5 mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Semester Promotion
        </h2>
        <p className="text-gray-500">
          Select semesters to promote students to the next level
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  checked={
                    selected.length === semesters.length &&
                    semesters.length > 0
                  }
                  onChange={toggleAll}
                  disabled={processing} // ✅ prevent changes while processing
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Semester
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                No. of Students
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {semesters.map((s) => (
              <SemesterRow
                key={s.semester}
                semester={s.semester}
                studentCount={s.studentCount}
                isSelected={selected.includes(s.semester)}
                onToggle={() => toggleOne(s.semester)}
                disabled={processing} // ✅ pass down
              />
            ))}
          </tbody>
        </table>
      </div>

      {selected.length > 0 && (
        <div className="mt-6 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {selected.length}
            </div>
            <span className="text-gray-700 font-medium">
              {selected.length}{" "}
              {selected.length === 1 ? "semester" : "semesters"} selected
            </span>
          </div>

          <button
            onClick={promote}
            disabled={processing}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md
              ${
                processing
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-95 hover:shadow-lg text-white"
              }`}
          >
            {processing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : (
              "Promote Selected →"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
