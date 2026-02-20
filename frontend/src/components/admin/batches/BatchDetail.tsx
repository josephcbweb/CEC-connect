import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Loader2,
    Plus,
    Users,
    GraduationCap,
    X,
    Trash2,
    Calendar,
} from "lucide-react";

interface Advisor {
    id: number;
    username: string;
    email: string;
}

interface ClassItem {
    id: number;
    name: string;
    advisor: Advisor | null;
    _count: { students: number };
}

interface Department {
    id: number;
    name: string;
    department_code: string;
}

interface BatchDepartment {
    id: number;
    department: Department;
    classes: ClassItem[];
}

interface Batch {
    id: number;
    name: string;
    startYear: number;
    endYear: number;
    status: string;
    batchDepartments: BatchDepartment[];
    admissionWindow: {
        program: "BTECH" | "MCA" | "MTECH";
    } | null;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const BatchDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [batch, setBatch] = useState<Batch | null>(null);
    const [loading, setLoading] = useState(true);
    const [availableAdvisors, setAvailableAdvisors] = useState<Advisor[]>([]);

    // Add class modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
    const [suffix, setSuffix] = useState("");
    const [selectedAdvisorId, setSelectedAdvisorId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchBatchDetails();
        fetchAvailableAdvisors();
    }, [id]);

    const fetchBatchDetails = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/batches/${id}`);
            const data = await response.json();
            if (data.success) {
                setBatch(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch batch:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableAdvisors = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/users/available-advisors`);
            const data = await response.json();
            if (data.success) {
                setAvailableAdvisors(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch advisors:", error);
        }
    };

    const handleAddClass = (deptId: number) => {
        setSelectedDeptId(deptId);
        setSuffix("");
        setSelectedAdvisorId(null);
        setError("");
        setShowAddModal(true);
    };

    const getPreviewName = () => {
        if (!selectedDeptId || !suffix.trim()) return "---";
        const dept = batch?.batchDepartments.find((bd) => bd.id === selectedDeptId);
        if (!dept) return "---";
        return `${dept.department.department_code}${suffix.trim().toUpperCase()}`;
    };

    const handleSubmitClass = async () => {
        if (!selectedDeptId || !suffix.trim()) {
            setError("Please enter a class suffix");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const response = await fetch(`${API_BASE}/api/classes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    batchDepartmentId: selectedDeptId,
                    suffix: suffix.trim().toUpperCase(),
                    advisorId: selectedAdvisorId,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setShowAddModal(false);
                fetchBatchDetails();
                fetchAvailableAdvisors();
            } else {
                setError(data.error || "Failed to create class");
            }
        } catch (err) {
            setError("Failed to create class. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClass = async (classId: number) => {
        if (!confirm("Are you sure you want to delete this class?")) return;

        try {
            const response = await fetch(`${API_BASE}/api/classes/${classId}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (data.success) {
                fetchBatchDetails();
                fetchAvailableAdvisors();
            } else {
                alert(data.error || "Failed to delete class");
            }
        } catch (error) {
            console.error("Failed to delete class:", error);
            alert("Failed to delete class");
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            UPCOMING: "bg-yellow-100 text-yellow-700",
            ACTIVE: "bg-green-100 text-green-700",
            GRADUATED: "bg-gray-100 text-gray-600",
        };
        return styles[status] || styles.GRADUATED;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (!batch) {
        return (
            <div className="p-6 text-center">
                <h2 className="text-xl font-medium text-gray-800">Batch not found</h2>
                <button
                    onClick={() => navigate("/admin/batches")}
                    className="mt-4 text-indigo-600 hover:underline"
                >
                    Back to Batch Registry
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Back Button & Header */}
            <button
                onClick={() => navigate("/admin/batches")}
                className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Batch Registry</span>
            </button>

            {/* Batch Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-gray-800">{batch.name}</h1>
                            {batch.admissionWindow?.program && (
                                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded border border-indigo-200 uppercase">
                                    {batch.admissionWindow.program}
                                </span>
                            )}
                            <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                                    batch.status
                                )}`}
                            >
                                {batch.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>
                                Academic Years: {batch.startYear} - {batch.endYear}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600">
                                {batch.batchDepartments.length}
                            </div>
                            <div className="text-gray-500">Departments</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {batch.batchDepartments.reduce(
                                    (acc, bd) => acc + bd.classes.length,
                                    0
                                )}
                            </div>
                            <div className="text-gray-500">Classes</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Department Sections */}
            <div className="space-y-6">
                {batch.batchDepartments.map((bd) => (
                    <div
                        key={bd.id}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                        {/* Department Header */}
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-800">
                                    {bd.department.name}
                                </h3>
                                <span className="text-sm text-gray-500">
                                    Code: {bd.department.department_code}
                                </span>
                            </div>
                            <button
                                onClick={() => handleAddClass(bd.id)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Class
                            </button>
                        </div>

                        {/* Classes Grid */}
                        <div className="p-6">
                            {bd.classes.length === 0 ? (
                                <p className="text-gray-400 text-sm italic">
                                    No classes created yet. Click "Add Class" to create one.
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {bd.classes.map((cls) => (
                                        <div
                                            key={cls.id}
                                            className="border border-gray-200 rounded-xl p-4 hover:border-indigo-200 transition-all"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                                                        {cls.name}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteClass(cls.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete class"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {cls.advisor ? (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Users className="w-4 h-4 text-green-500" />
                                                    <span className="text-gray-700">
                                                        {cls.advisor.username}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                                    <Users className="w-4 h-4" />
                                                    <span>No advisor assigned</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                                                <GraduationCap className="w-4 h-4" />
                                                <span>{cls._count?.students || 0} students</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Class Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">Add New Class</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Suffix Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Class Suffix
                                </label>
                                <input
                                    type="text"
                                    value={suffix}
                                    onChange={(e) => setSuffix(e.target.value)}
                                    placeholder="e.g., A, B, C"
                                    maxLength={5}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            {/* Preview */}
                            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                                <div className="text-sm text-gray-500 mb-1">Class Name Preview:</div>
                                <div className="text-2xl font-bold text-indigo-600">
                                    {getPreviewName()}
                                </div>
                            </div>

                            {/* Advisor Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Assign Advisor (Optional)
                                </label>
                                <select
                                    value={selectedAdvisorId || ""}
                                    onChange={(e) =>
                                        setSelectedAdvisorId(
                                            e.target.value ? parseInt(e.target.value) : null
                                        )
                                    }
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                                >
                                    <option value="">-- Select advisor --</option>
                                    {availableAdvisors.map((advisor) => (
                                        <option key={advisor.id} value={advisor.id}>
                                            {advisor.username} ({advisor.email})
                                        </option>
                                    ))}
                                </select>
                                {availableAdvisors.length === 0 && (
                                    <p className="mt-2 text-sm text-gray-500">
                                        No available faculty members found.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitClass}
                                disabled={submitting || !suffix.trim()}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                            >
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Create Class
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatchDetail;
