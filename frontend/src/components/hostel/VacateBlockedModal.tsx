import { X, AlertTriangle, Receipt, ArrowRight } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  amountDue: number;
  onViewLedger: () => void;
}

const VacateBlockedModal = ({ isOpen, onClose, studentName, amountDue, onViewLedger }: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950/20 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] max-w-md w-full shadow-2xl shadow-red-200/20 border border-zinc-100 overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Warning Icon Header */}
        <div className="bg-red-50/50 p-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-red-600 mb-6 shadow-xl shadow-red-200/50 border border-red-100">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Vacation Blocked</h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2 px-4 leading-relaxed">
            Unresolved financial obligations detected for <br />
            <span className="text-zinc-900 font-black px-2 py-1 bg-white border border-zinc-100 rounded-lg inline-block mt-2 italic">{studentName}</span>
          </p>
        </div>

        {/* Details Section */}
        <div className="p-10 pt-4 space-y-6">
          <div className="flex items-center gap-6 p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-100/30 rounded-full blur-2xl -mr-12 -mt-12" />

            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0 border border-zinc-100">
              <Receipt className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Outstanding Dues</p>
              <p className="text-3xl font-black text-red-600 tracking-tighter mt-1">
                ₹{amountDue.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-zinc-400 font-bold mt-1 leading-tight uppercase tracking-tighter">
                System lock active until cleared
              </p>
            </div>
          </div>

          <div className="px-2">
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              The institutional policy requires all outstanding hostel rent to be reconciled before a student record can be transitioned to vacated status.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-10 pt-0 flex flex-col gap-4">
          <button
            onClick={onViewLedger}
            className="group w-full bg-zinc-900 text-white p-5 rounded-2xl font-black shadow-2xl shadow-zinc-200 hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 cursor-pointer"
          >
            <span>Inspect Fee Ledger</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 font-black text-zinc-400 hover:text-zinc-600 transition-all text-[10px] uppercase tracking-[0.2em] cursor-pointer"
          >
            Dismiss Alert
          </button>
        </div>
      </div>
    </div>
  );
};

export default VacateBlockedModal;