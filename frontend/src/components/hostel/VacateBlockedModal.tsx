import { X, AlertTriangle, Receipt, ArrowRight } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  amountDue: number;       // Added this
  onViewLedger: () => void; // Added this
}

const VacateBlockedModal = ({ isOpen, onClose, studentName, amountDue, onViewLedger }: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Warning Icon Header */}
        <div className="bg-red-50 p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900">Vacation Blocked</h2>
          <p className="text-zinc-500 text-sm mt-2">
            Action cannot be completed for <span className="font-bold text-zinc-900">{studentName}</span>.
          </p>
        </div>

        {/* Details Section */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <Receipt className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Outstanding Dues</p>
              <p className="text-xl font-black text-red-600 mt-0.5">
                ₹{amountDue.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 leading-tight">
                All hostel rent must be cleared before the system allows student vacation.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex flex-col gap-3">
          <button 
            onClick={onViewLedger}
            className="w-full bg-zinc-900 text-white p-4 rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
          >
            View Fee Ledger <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={onClose}
            className="w-full bg-white text-zinc-500 p-3 rounded-xl font-semibold hover:text-zinc-700 transition-all text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VacateBlockedModal;