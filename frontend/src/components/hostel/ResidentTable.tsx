import { useState } from "react";
import { UserMinus, Receipt, Loader2, AlertCircle } from "lucide-react";
import axios from "axios";
import type { Resident } from "./HostelPage";
import HostelLedgerModal from "./HostelLedgerModal";

interface Props {
    residents: Resident[];
    loading: boolean;
    onRefresh: () => void;
}

const ResidentTable = ({ residents, loading, onRefresh }: Props) => {
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [vacatingId, setVacatingId] = useState<number | null>(null);

    const handleVacate = async (studentId: number, studentName: string) => {
        if (!confirm(`Are you sure you want to vacate ${studentName}?`)) return;

        setVacatingId(studentId);
        try {
            await axios.patch(`http://localhost:3000/api/hostel/vacate/${studentId}`);
            alert("Student vacated successfully.");
            onRefresh();
        } catch (err: any) {
            // This catches the "Pending Dues" error from your backend
            alert(err.response?.data?.message || "Failed to vacate student.");
        } finally {
            setVacatingId(null);
        }
    };

    if (loading) return <div className="py-10 text-center text-zinc-500">Loading residents...</div>;

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Student Name</th>
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Class & Sem</th>
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Contact</th>
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-600 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                    {residents.map((resident) => (
                        <tr key={resident.id} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-zinc-900">{resident.name}</td>
                            <td className="px-6 py-4 text-zinc-600">{resident.className} • S{resident.semester}</td>
                            <td className="px-6 py-4 text-zinc-500 text-sm">{resident.phone}</td>
                            <td className="px-6 py-4">
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={() => setSelectedStudentId(resident.id)}
                                        className="p-2 text-zinc-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                                        title="View Fee Ledger"
                                    >
                                        <Receipt className="w-4 h-4" />
                                    </button>
                                    <button 
                                        disabled={vacatingId === resident.id}
                                        onClick={() => handleVacate(resident.id, resident.name)}
                                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                        title="Vacate Student"
                                    >
                                        {vacatingId === resident.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <UserMinus className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Ledger Modal */}
            {selectedStudentId && (
                <HostelLedgerModal 
                    studentId={selectedStudentId} 
                    onClose={() => setSelectedStudentId(null)} 
                />
            )}
        </div>
    );
};

export default ResidentTable;