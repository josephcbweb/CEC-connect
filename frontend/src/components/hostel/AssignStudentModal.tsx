import { useState, useEffect, useRef } from "react";
import { X, Search, User, Phone, Mail, Loader2, CheckCircle2, Building2, ChevronDown } from "lucide-react";
import axios from "axios";
import type { Hostel } from "./types";

interface Student {
  id: number;
  name: string;
  student_phone_number?: string;
  email?: string;
  status?: string;
  department?: {
    name: string;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  hostels: Hostel[];
  selectedHostelId?: number;
  onSuccess: () => void;
}

const AssignStudentModal = ({
  isOpen,
  onClose,
  hostels,
  selectedHostelId,
  onSuccess,
}: Props) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedHostel, setSelectedHostel] = useState<number | "">(
    selectedHostelId || "",
  );
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
      setSelectedHostel(selectedHostelId || "");
    }
  }, [isOpen, selectedHostelId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const res = await axios.get("http://localhost:3000/students/all");
      const eligible = res.data.filter(
        (s: any) => s.status !== "graduated" && s.hostelId === null,
      );
      setStudents(eligible);
    } catch (error) {
      console.error(error);
    } finally {
      setStudentsLoading(false);
    }
  };

  const resetForm = () => {
    setSearchQuery("");
    setSelectedStudent(null);
    setSelectedHostel(selectedHostelId || "");
    setError("");
    setDropdownOpen(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.student_phone_number?.includes(searchQuery) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSubmit = async () => {
    if (!selectedStudent || !selectedHostel) return setError("Please select both a student and a hostel.");
    setLoading(true);
    try {
      await axios.patch("http://localhost:3000/api/hostel/addStudents", {
        studentId: selectedStudent.id,
        hostelId: selectedHostel,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col overflow-hidden"
        style={{ maxHeight: "90vh", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Assign Student to Hostel</h2>
            <p className="text-xs text-slate-400 mt-0.5">Search and assign an unhoused student</p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-100">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Student Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</label>

            {selectedStudent ? (
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}
                  >
                    {selectedStudent.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{selectedStudent.name}</p>
                    <p className="text-xs text-slate-400">{selectedStudent.email || `ID: ${selectedStudent.id}`}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700 px-2.5 py-1 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                {/* Trigger Input */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, or email..."
                    value={searchQuery}
                    onFocus={() => setDropdownOpen(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setDropdownOpen(true);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                  />
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    {studentsLoading ? (
                      <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Loading students...</span>
                      </div>
                    ) : filteredStudents.length === 0 ? (
                      <div className="py-8 text-center text-sm text-slate-400">
                        No eligible students found
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
                        {filteredStudents.slice(0, 12).map((student) => (
                          <div
                            key={student.id}
                            onClick={() => {
                              setSelectedStudent(student);
                              setSearchQuery("");
                              setDropdownOpen(false);
                              setError("");
                            }}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{student.name}</p>
                              <p className="text-xs text-slate-400 truncate">{student.email}</p>
                            </div>
                            {student.student_phone_number && (
                              <span className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {student.student_phone_number}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hostel Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Hostel</label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedHostel}
                onChange={(e) => {
                  setSelectedHostel(e.target.value ? Number(e.target.value) : "");
                  setError("");
                }}
                className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all appearance-none cursor-pointer"
              >
                <option value="">Select a hostel...</option>
                {hostels.map((hostel) => (
                  <option key={hostel.id} value={hostel.id}>
                    {hostel.name} — {hostel._count.students} occupied
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-7 py-5 border-t border-slate-100 bg-slate-50">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedStudent || !selectedHostel}
            className="flex-[2] py-2.5 text-sm font-semibold text-white rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)" }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirm Assignment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignStudentModal;