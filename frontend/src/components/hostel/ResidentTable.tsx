import { useState } from "react";
import { UserMinus, Receipt, Loader2 } from "lucide-react";
import axios from "axios";
import type { Resident } from "./HostelPage";
import HostelLedgerModal from "./HostelLedgerModal";
import VacateBlockedModal from "./VacateBlockedModal"; // Ensure you create this component

interface Props {
  residents: Resident[];
  loading: boolean;
  onRefresh: () => void;
}

const ResidentTable = ({ residents, loading, onRefresh }: Props) => {
  // States for Modals
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null,
  );
  const [isDuesModalOpen, setIsDuesModalOpen] = useState(false);

  // States for Data & UI
  const [pendingDuesInfo, setPendingDuesInfo] = useState<{
    name: string;
    amount: number;
  } | null>(null);
  const [vacatingId, setVacatingId] = useState<number | null>(null);

  const handleVacate = async (studentId: number, studentName: string) => {
    // Simple confirmation before proceeding
    if (!confirm(`Are you sure you want to vacate ${studentName}?`)) return;

    setVacatingId(studentId);
    try {
      await axios.patch(`http://localhost:3000/api/hostel/vacate/${studentId}`);
      alert("Student vacated successfully.");
      onRefresh();
    } catch (err: any) {
      // Check if backend returned a 400 error (Blocked due to dues)
      if (err.response?.status === 400) {
        setPendingDuesInfo({
          name: studentName,
          amount: err.response.data.totalDue || 0, // Assuming backend sends totalDue
        });
        setIsDuesModalOpen(true);
      } else {
        alert(
          err.response?.data?.message ||
            "An error occurred during the vacation process.",
        );
      }
    } finally {
      setVacatingId(null);
    }
  };

  if (loading)
    return (
      <div className="py-20 text-center text-zinc-500 flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <p className="font-medium">Fetching residents...</p>
      </div>
    );

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead className="bg-zinc-50 border-b border-zinc-200">
          <tr>
            <th className="px-6 py-4 text-sm font-semibold text-zinc-600 uppercase tracking-wider">
              Student Name
            </th>
            <th className="px-6 py-4 text-sm font-semibold text-zinc-600 uppercase tracking-wider">
              Class & Sem
            </th>
            <th className="px-6 py-4 text-sm font-semibold text-zinc-600 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-4 text-sm font-semibold text-zinc-600 text-right uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {residents.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-6 py-12 text-center text-zinc-400 italic"
              >
                No residents currently assigned to this hostel.
              </td>
            </tr>
          ) : (
            residents.map((resident) => (
              <tr
                key={resident.id}
                className="hover:bg-zinc-50/50 transition-colors group"
              >
                <td className="px-6 py-4 font-semibold text-zinc-900">
                  {resident.name}
                </td>
                <td className="px-6 py-4 text-zinc-600 text-sm">
                  {resident.className}{" "}
                  <span className="mx-1 text-zinc-300">|</span> S
                  {resident.semester}
                </td>
                <td className="px-6 py-4 text-zinc-500 text-sm font-mono">
                  {resident.phone}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setSelectedStudentId(resident.id)}
                      className="p-2 text-zinc-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all cursor-pointer"
                      title="View Fee Ledger"
                    >
                      <Receipt className="w-5 h-5" />
                    </button>
                    <button
                      disabled={vacatingId === resident.id}
                      onClick={() => handleVacate(resident.id, resident.name)}
                      className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      title="Vacate Student"
                    >
                      {vacatingId === resident.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <UserMinus className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Fee Ledger Modal */}
      {selectedStudentId && (
        <HostelLedgerModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}

      {/* Vacation Blocked Modal (Unpaid Dues) */}
      <VacateBlockedModal
        isOpen={isDuesModalOpen}
        onClose={() => setIsDuesModalOpen(false)}
        studentName={pendingDuesInfo?.name || ""}
        amountDue={pendingDuesInfo?.amount || 0}
        onViewLedger={() => {
          // Logic to switch from warning modal to ledger modal
          setIsDuesModalOpen(false);
          // Find the ID based on the name from our local state
          const student = residents.find(
            (r) => r.name === pendingDuesInfo?.name,
          );
          if (student) setSelectedStudentId(student.id);
        }}
      />
    </div>
  );
};

export default ResidentTable;
