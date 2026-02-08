import { useState, useEffect } from "react";
import { X, Search, User, Phone, Mail } from "lucide-react";
import axios from "axios";
import type { Hostel } from "./HostelPage";

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

const AssignStudentModal = ({ isOpen, onClose, hostels, selectedHostelId, onSuccess }: Props) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedHostel, setSelectedHostel] = useState<number | "">(selectedHostelId || "");
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
            // Filter out graduated students
            const activeStudents = res.data.filter((s: Student) => s.status !== "graduated");
            setStudents(activeStudents);
        } catch (error) {
            console.error("Failed to fetch students", error);
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

    const filteredStudents = students.filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student_phone_number?.includes(searchQuery) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async () => {
        if (!selectedStudent) {
            setError("Please select a student");
            return;
        }
        if (!selectedHostel) {
            setError("Please select a hostel");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await axios.patch("http://localhost:3000/api/hostel/addStudents", {
                studentId: selectedStudent.id,
                hostelId: selectedHostel,
            });
            resetForm();
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to assign student");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-violet-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-zinc-900">Assign Student to Hostel</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Selected Student Card */}
                    {selectedStudent && (
                        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-zinc-900">{selectedStudent.name}</p>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500">
                                        {selectedStudent.student_phone_number && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {selectedStudent.student_phone_number}
                                            </span>
                                        )}
                                        {selectedStudent.email && (
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {selectedStudent.email}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedStudent(null)}
                                    className="text-sm text-zinc-500 hover:text-zinc-700 cursor-pointer"
                                >
                                    Change
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Student Search */}
                    {!selectedStudent && (
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-zinc-700">Search Student</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, phone, or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg focus:border-zinc-400 focus:outline-none transition-colors placeholder:text-zinc-400"
                                />
                            </div>

                            {/* Search Results */}
                            {searchQuery && (
                                <div className="max-h-48 overflow-y-auto border border-zinc-200 rounded-lg divide-y divide-zinc-100">
                                    {studentsLoading ? (
                                        <div className="p-4 text-center text-zinc-400">Loading...</div>
                                    ) : filteredStudents.length === 0 ? (
                                        <div className="p-4 text-center text-zinc-400">No students found</div>
                                    ) : (
                                        filteredStudents.slice(0, 10).map((student) => (
                                            <div
                                                key={student.id}
                                                onClick={() => {
                                                    setSelectedStudent(student);
                                                    setSearchQuery("");
                                                    setError("");
                                                }}
                                                className="p-3 hover:bg-zinc-50 cursor-pointer transition-colors"
                                            >
                                                <p className="font-medium text-zinc-900">{student.name}</p>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                                                    {student.student_phone_number && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3" />
                                                            {student.student_phone_number}
                                                        </span>
                                                    )}
                                                    {student.email && (
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="w-3 h-3" />
                                                            {student.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Hostel Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">
                            Select Hostel <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedHostel}
                            onChange={(e) => {
                                setSelectedHostel(e.target.value ? Number(e.target.value) : "");
                                setError("");
                            }}
                            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:border-zinc-400 focus:outline-none transition-colors bg-white"
                        >
                            <option value="">Select a hostel...</option>
                            {hostels.map((hostel) => (
                                <option key={hostel.id} value={hostel.id}>
                                    {hostel.name} ({hostel._count.students} students)
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50">
                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            disabled={loading}
                            className="flex-1 border border-zinc-200 text-zinc-700 rounded-xl py-3 px-4 font-medium hover:bg-white transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={loading || !selectedStudent || !selectedHostel}
                            onClick={handleSubmit}
                            className="flex-1 bg-violet-600 text-white rounded-xl py-3 px-4 font-medium hover:bg-violet-700 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? "Assigning..." : "Assign Student"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignStudentModal;
