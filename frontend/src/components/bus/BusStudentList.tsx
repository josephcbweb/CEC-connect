import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import BusStudentRow from "./BusStudentRow";

const BusStudentList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [semester, setSemester] = useState("All");
  const [loading, setLoading] = useState(true);
  const [bus, setBus] = useState("All");

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:3000/bus/fetchBusStudents")
      .then((res) => res.json())
      .then((data) => setStudents(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const semesters = Array.from(
    new Set(students.map((student) => student.semester))
  ).sort((a, b) => a - b);

  const buses = Array.from(
    new Set(students.map((student) => student.busName))
  ).sort();

  const handleRemoveStudent = async (studentId: number) => {
    try {
      const res = await fetch(`http://localhost:3000/bus/removeStudent/${studentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s.id !== studentId));
      } else {
        console.error("Failed to remove student");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesSemester =
      semester === "All" || student.semester === Number(semester);

    const matchesBus = bus === "All" || student.busName === bus;

    return matchesSearch && matchesSemester && matchesBus;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Bus Students</h2>
        <p className="text-sm text-gray-500">
          List of students availing bus service
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="h-4 w-4 text-gray-400 absolute top-3 left-3" />
          <input
            type="text"
            placeholder="Search by student name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>

        {/* Semester Filter */}
        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="w-full sm:max-w-xs px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
        >
          <option value="All">All Semesters</option>
          {semesters.map((sem) => (
            <option key={sem} value={sem.toString()}>
              Semester {sem}
            </option>
          ))}
        </select>

        {/* Filter students by bus */}
        <select
          value={bus}
          onChange={(e) => setBus(e.target.value)}
          className="w-full sm:max-w-xs px-3 py-2 text-sm border border-gray-300 rounded-md"
        >
          <option value="All">All Buses</option>
          {buses.map((busName) => (
            <option key={busName} value={busName}>
              {busName}
            </option>
          ))}
        </select>
      </div>

      {/* Table Header */}
      <div className="flex items-center py-3 border-b border-gray-200 mt-5 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
        <div className="w-4/12 flex items-center pl-4">Name</div>
        <div className="w-3/12 flex items-center px-2">Department</div>
        <div className="w-2/12 flex items-center px-2">Semester</div>
        <div className="w-3/12 flex items-center px-2">Bus</div>
        <div className="w-2/12 flex items-center px-2">Phone</div>
        <div className="w-2/12 flex items-center justify-end pr-4">Actions</div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">
          Loading students...
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">
          No students match your criteria
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filteredStudents.map((student) => (
            <BusStudentRow
              key={student.id}
              student={student}
              onRemove={handleRemoveStudent}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BusStudentList;
