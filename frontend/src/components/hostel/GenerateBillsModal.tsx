import { useState } from "react";
import { X, Receipt, Calendar, Loader2, AlertCircle } from "lucide-react";
import axios from "axios";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const GenerateBillsModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const currentYear = new Date().getFullYear();

  // States
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(currentYear.toString());
  const [dueDate, setDueDate] = useState(""); // New state for Due Date
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const months = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ];

  const handleSubmit = async () => {
    // Validation
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
          dueDate, // Sending the date string to the backend
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 bg-emerald-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900">Generate Bills</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-200 text-zinc-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Month Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Month
              </label>
              <select
                className="w-full p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all bg-white text-sm"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                <option value="">Select...</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Year
              </label>
              <input
                type="number"
                className="w-full p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all text-sm"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </div>

          {/* Due Date Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Payment Due Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type="date"
                className="w-full pl-10 p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all text-sm"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
              <strong>Admin Note:</strong> This action triggers a database
              transaction. Invoices will be generated for every student
              currently assigned to a hostel.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-6 pt-0">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-emerald-600 text-white p-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Receipt className="w-5 h-5" /> Confirm & Generate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateBillsModal;
