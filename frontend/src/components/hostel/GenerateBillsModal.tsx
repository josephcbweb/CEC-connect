import { useState } from "react";
import { X, Receipt, Calendar, Loader2 } from "lucide-react";
import axios from "axios";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const GenerateBillsModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const currentYear = new Date().getFullYear();
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(currentYear.toString());
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
    if (!month || !year) {
      setError("Please select both month and year");
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
        },
      );
      onSuccess(res.data.message);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to generate invoices");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900">Generate Bills</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <X className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-600">
              Select Month
            </label>
            <select
              className="w-full p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all bg-white"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              <option value="">Choose Month...</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-600">Year</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
              <input
                type="number"
                className="w-full pl-10 p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <p className="text-xs text-amber-700 leading-relaxed">
              <strong>Note:</strong> This will generate invoices for all active
              hostel residents for the selected period. This action cannot be
              easily undone.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-emerald-600 text-white p-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Confirm & Generate Invoices"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateBillsModal;
