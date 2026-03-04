import { useState } from "react";
import { X, Calendar, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import axios from "axios";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  selectedStudentIds: number[];
}

const GenerateBillsModal = ({ isOpen, onClose, onSuccess, selectedStudentIds }: Props) => {
  const currentYear = new Date().getFullYear();

  // States
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(currentYear.toString());
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const months = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
  ];

  const handleSubmit = async () => {
    if (!month || !year || !dueDate) {
      setError("Please fill in all fields, including the payment due date.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:3000/api/hostel/generate-invoices",
        {
          month,
          year: Number(year),
          dueDate,
          studentIds: selectedStudentIds,
        },
      );

      onSuccess(res.data.message);
      resetForm();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        "Failed to generate invoices. Check your connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMonth("");
    setYear(currentYear.toString());
    setDueDate("");
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-950/20 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Invoice Engine</h2>
            <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mt-1">Billing cycle generator</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-all cursor-pointer border border-transparent hover:border-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-8 pt-4 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bill Month</label>
              <select
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-indigo-200 focus:ring-1 focus:ring-indigo-50 transition-all outline-none font-semibold text-gray-700 appearance-none shadow-sm cursor-pointer"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                <option value="">Month</option>
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bill Year</label>
              <input
                type="number"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-indigo-200 focus:ring-1 focus:ring-indigo-50 transition-all outline-none font-semibold text-gray-700 shadow-sm"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Deadline</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
              <input
                type="date"
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-indigo-200 focus:ring-1 focus:ring-indigo-50 transition-all outline-none font-semibold text-gray-700 shadow-sm"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-white shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Execution Preview</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              {selectedStudentIds.length > 0
                ? `System will generate and deliver invoices to ${selectedStudentIds.length} targeted student(s).`
                : `System will broadcast invoices to all residents currently enrolled in the hostel registry.`}
              <br /><span className="text-emerald-400 font-bold mt-1 block">Duplicate prevention is active.</span>
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-8 border-t border-gray-100 bg-gray-50 flex gap-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3.5 font-bold text-gray-400 hover:bg-gray-200 rounded-lg transition-all cursor-pointer text-xs uppercase tracking-widest border border-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] bg-indigo-600 text-white py-3.5 rounded-lg font-bold shadow-sm hover:bg-indigo-700 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span>Generate Invoices</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateBillsModal;
