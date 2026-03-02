import { useState, useEffect } from "react";
import { X, Search, User, Phone, Mail, Loader2, CheckCircle2, Building2 } from "lucide-react";
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

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
      setSelectedHostel(selectedHostelId || "");
    }
  }, [isOpen, selectedHostelId]);

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
    if (!selectedStudent || !selectedHostel) return setError("Required");
    setLoading(true);
    try {
      await axios.patch("http://localhost:3000/api/hostel/addStudents", {
        studentId: selectedStudent.id,
        hostelId: selectedHostel,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/20 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] max-w-xl w-full shadow-2xl shadow-violet-200/20 border border-zinc-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Assign Student</h2>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Enrollment Desk</p>
          </div>
          <button onClick={handleClose} className="p-2.5 rounded-2xl hover:bg-zinc-50 text-zinc-400 transition-all cursor-pointer border border-transparent hover:border-zinc-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
              {error}
            </div>
          )}

          {/* Selected Student Card */}
          {selectedStudent ? (
            <div className="group relative p-6 bg-violet-600 rounded-[2rem] text-white shadow-xl shadow-violet-200 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white font-black text-xl backdrop-blur-md">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xl font-black tracking-tight">{selectedStudent.name}</h4>
                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-0.5">ID: {selectedStudent.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="px-4 py-2 bg-white/20 hover:bg-white text-violet-600 text-xs font-black rounded-xl transition-all cursor-pointer backdrop-blur-md border border-white/10 uppercase tracking-widest">
                  Change
                </button>
              </div>
              <div className="mt-6 flex gap-4 text-xs font-bold text-white/80">
                {selectedStudent.student_phone_number && (
                  <span className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
                    <Phone className="w-3 h-3" />
                    {selectedStudent.student_phone_number}
                  </span>
                )}
                {selectedStudent.email && (
                  <span className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 truncate max-w-[200px]">
                    <Mail className="w-3 h-3" />
                    {selectedStudent.email}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Student Lookup</label>
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-violet-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Scan name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-zinc-50 border border-zinc-100 rounded-[2rem] focus:bg-white focus:border-violet-200 focus:ring-[12px] focus:ring-violet-50 transition-all outline-none font-bold text-zinc-900 placeholder:text-zinc-300 shadow-sm"
                />
              </div>

              {/* Search Results */}
              {searchQuery && (
                <div className="max-h-72 overflow-y-auto bg-white border border-zinc-100 rounded-3xl shadow-2xl p-2 space-y-1 animate-in slide-in-from-top-4 duration-300 mt-2">
                  {studentsLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Searching...</span>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-zinc-400 font-bold text-sm">No matches found</p>
                    </div>
                  ) : (
                    filteredStudents.slice(0, 10).map((student) => (
                      <div
                        key={student.id}
                        onClick={() => {
                          setSelectedStudent(student);
                          setSearchQuery("");
                          setError("");
                        }}
                        className="group flex items-center justify-between p-4 hover:bg-zinc-50 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-zinc-100"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                            <User className="w-5 h-5 text-zinc-400 group-hover:text-violet-600" />
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900 group-hover:text-violet-700 transition-colors">{student.name}</p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{student.email}</p>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-all font-black text-[10px] text-violet-600 uppercase tracking-widest">Select Student</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Hostel Selection */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Destination Hostel</label>
            <div className="relative group">
              <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-violet-500 transition-colors pointer-events-none" />
              <select
                value={selectedHostel}
                onChange={(e) => {
                  setSelectedHostel(e.target.value ? Number(e.target.value) : "");
                  setError("");
                }}
                className="w-full pl-14 pr-10 py-5 bg-zinc-50 border border-zinc-100 rounded-[2rem] focus:bg-white focus:border-violet-200 focus:ring-[12px] focus:ring-violet-50 transition-all outline-none font-black text-zinc-700 appearance-none shadow-sm cursor-pointer"
              >
                <option value="">Choose a shelter...</option>
                {hostels.map((hostel) => (
                  <option key={hostel.id} value={hostel.id}>
                    {hostel.name} ({hostel._count.students} capacity occupied)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-zinc-100 bg-zinc-50 flex gap-4">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 py-4 font-black text-zinc-500 hover:bg-zinc-200 rounded-2xl transition-all cursor-pointer text-sm uppercase tracking-widest"
          >
            Cancel
          </button>
          <button
            disabled={loading || !selectedStudent || !selectedHostel}
            onClick={handleSubmit}
            className="flex-[2] bg-zinc-900 text-white rounded-2xl py-4 font-black shadow-xl shadow-zinc-200 hover:bg-black transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Finalize Assignment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignStudentModal;
