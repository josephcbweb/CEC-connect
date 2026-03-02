import { useState } from "react";
import { Receipt, LogOut, Users } from "lucide-react";
import axios from "axios";
import type { Resident } from "./types";
import HostelLedgerModal from "./HostelLedgerModal";
import VacateBlockedModal from "./VacateBlockedModal";

interface Props {
  residents: Resident[];
  loading: boolean;
  selectedResidentIds: number[];
  onSelectionChange: (ids: number[]) => void;
  onRefresh: () => void;
}

const ResidentTable = ({
  residents,
  loading,
  selectedResidentIds,
  onSelectionChange,
  onRefresh,
}: Props) => {
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [isDuesModalOpen, setIsDuesModalOpen] = useState(false);
  const [pendingDuesInfo, setPendingDuesInfo] = useState<{
    name: string;
    amount: number;
  } | null>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(residents.map((r) => r.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedResidentIds, id]);
    } else {
      onSelectionChange(selectedResidentIds.filter((cid) => cid !== id));
    }
  };

  const handleVacate = async (id: number, name: string) => {
    try {
      const res = await axios.get(
        `http://localhost:3000/api/hostel/check-dues/${id}`,
      );
      if (res.data.hasDues) {
        setPendingDuesInfo({ name, amount: res.data.totalDues });
        setIsDuesModalOpen(true);
        return;
      }

      if (window.confirm(`Are you sure you want to vacate ${name}?`)) {
        await axios.post(`http://localhost:3000/api/hostel/vacate/${id}`);
        onRefresh();
      }
    } catch (error) {
      console.error(error);
      alert("Error checking dues");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin" />
        <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest animate-pulse">Syncing Database...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-50/50 border-b border-zinc-100">
              <th className="px-8 py-5 text-center">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded-lg border-zinc-200 text-violet-600 focus:ring-violet-500/20 focus:ring-4 transition-all cursor-pointer bg-white"
                  checked={
                    residents.length > 0 &&
                    selectedResidentIds.length === residents.length
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Resident</th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Contact</th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Class</th>
              <th className="px-6 py-5 text-right text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {residents.map((resident) => (
              <tr key={resident.id} className="group hover:bg-violet-50/30 transition-all duration-300">
                <td className="px-8 py-5 text-center">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded-lg border-zinc-200 text-violet-600 focus:ring-violet-500/20 focus:ring-4 transition-all cursor-pointer bg-white"
                    checked={selectedResidentIds.includes(resident.id)}
                    onChange={(e) => handleSelectOne(resident.id, e.target.checked)}
                  />
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-500 font-black text-xs group-hover:bg-violet-600 group-hover:text-white transition-all duration-500 shadow-sm border border-zinc-200 group-hover:border-violet-600">
                      {resident.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900 group-hover:text-violet-700 transition-colors">{resident.name}</p>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">ID: {resident.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-sm font-semibold text-zinc-600">{resident.phone || "No contact"}</span>
                </td>
                <td className="px-6 py-5">
                  <span className="px-3 py-1 bg-zinc-50 text-zinc-500 text-[10px] font-black rounded-lg border border-zinc-100 group-hover:bg-white group-hover:text-violet-600 group-hover:border-violet-100 uppercase tracking-widest transition-all">
                    {resident.className} | S{resident.semester}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedStudentId(resident.id)}
                      className="p-2.5 rounded-2xl hover:bg-white hover:text-violet-600 text-zinc-400 transition-all border border-transparent hover:border-violet-100 hover:shadow-xl hover:shadow-violet-200/20 cursor-pointer group/btn"
                      title="View Ledger"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleVacate(resident.id, resident.name)}
                      className="p-2.5 rounded-2xl hover:bg-white hover:text-red-600 text-zinc-400 transition-all border border-transparent hover:border-red-100 hover:shadow-xl hover:shadow-red-200/20 cursor-pointer"
                      title="Vacate Student"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {residents.length === 0 && (
        <div className="p-20 text-center">
          <div className="w-20 h-20 bg-zinc-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-zinc-100">
            <Users className="w-10 h-10 text-zinc-300" />
          </div>
          <h4 className="text-xl font-bold text-zinc-900">No residents found</h4>
          <p className="text-zinc-400 text-sm mt-2">This hostel seems to be empty for now.</p>
        </div>
      )}

      {selectedStudentId && (
        <HostelLedgerModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}

      <VacateBlockedModal
        isOpen={isDuesModalOpen}
        onClose={() => setIsDuesModalOpen(false)}
        studentName={pendingDuesInfo?.name || ""}
        amountDue={pendingDuesInfo?.amount || 0}
        onViewLedger={() => {
          setIsDuesModalOpen(false);
          const student = residents.find((r) => r.name === pendingDuesInfo?.name);
          if (student) setSelectedStudentId(student.id);
        }}
      />
    </div>
  );
};

export default ResidentTable;
