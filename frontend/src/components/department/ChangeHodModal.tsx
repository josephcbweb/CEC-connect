import { useEffect, useState } from "react";
import { X, UserCheck } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    departmentId: number;
    departmentName: string;
}

interface Faculty {
    id: number;
    username: string;
    email: string;
}

export default function ChangeHodModal({
    isOpen,
    onClose,
    onSuccess,
    departmentId,
    departmentName,
}: Props) {
    const [facultyList, setFacultyList] = useState<Faculty[]>([]);
    const [selectedHodId, setSelectedHodId] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchEligibleFaculty();
            setSelectedHodId(""); // Reset selection on open
        }
    }, [isOpen]);

    const fetchEligibleFaculty = async () => {
        try {
            setFetchError(false);
            const res = await fetch("http://localhost:3000/api/departments/faculty/eligible");
            if (!res.ok) throw new Error("Failed to fetch faculty");
            const data = await res.json();
            setFacultyList(data);
        } catch (error) {
            console.error(error);
            setFetchError(true);
        }
    };

    const handleSubmit = async () => {
        if (!selectedHodId) return;
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:3000/api/departments/${departmentId}/hod`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hodId: selectedHodId }),
            });

            if (res.ok) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center px-6 pt-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Change HOD</h2>
                            <p className="text-sm text-gray-500">{departmentName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="px-6 pb-6 space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 ml-1">
                            Select New HOD
                        </label>
                        {fetchError ? (
                            <p className="text-red-500 text-sm">Failed to load faculty list.</p>
                        ) : (
                            <select
                                value={selectedHodId}
                                onChange={(e) => setSelectedHodId(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                            >
                                <option value="">Select a faculty member...</option>
                                {facultyList.map((faculty) => (
                                    <option key={faculty.id} value={faculty.id}>
                                        {faculty.username} ({faculty.email})
                                    </option>
                                ))}
                            </select>
                        )}
                        <p className="text-xs text-gray-500 ml-1">
                            Only eligible faculty (not currently assigned as HOD) are shown.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 border-2 border-gray-200 text-gray-700 rounded-xl py-3 px-4 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all hover:cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={loading || !selectedHodId}
                            onClick={handleSubmit}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-3 px-4 font-medium hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none hover:cursor-pointer"
                        >
                            {loading ? "Updating..." : "Update HOD"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
