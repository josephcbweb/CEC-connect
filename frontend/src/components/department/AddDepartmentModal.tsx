import { useState, useEffect } from "react";
import { X, Building2, Hash, User } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Faculty {
  id: number;
  username: string;
  email: string;
}

export default function AddDepartmentModal({
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [formData, setFormData] = useState({ name: "", code: "", hodId: "" });
  const [loading, setLoading] = useState(false);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchEligibleFaculty();
    }
  }, [isOpen]);

  const fetchEligibleFaculty = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/departments/faculty/eligible");
      if (res.ok) {
        const data = await res.json();
        setFacultyList(data);
      }
    } catch (error) {
      console.error("Failed to fetch faculty", error);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!formData.name || !formData.code) return;
    setLoading(true);
    const res = await fetch("http://localhost:3000/api/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      onSuccess();
      onClose();
      setFormData({ name: "", code: "", hodId: "" });
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Add Department</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form Content */}
        <div className="px-6 pb-6 space-y-5">
          {/* Department Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 ml-1">
              Department Name
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Building2 className="w-5 h-5" />
              </div>
              <input
                placeholder="e.g., Computer Science and Engineering"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Department Code Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 ml-1">
              Department Code
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Hash className="w-5 h-5" />
              </div>
              <input
                placeholder="e.g., CSE"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* HOD Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 ml-1">
              Assign HOD (Optional)
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <User className="w-5 h-5" />
              </div>
              <select
                value={formData.hodId}
                onChange={(e) => setFormData({ ...formData, hodId: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-white"
              >
                <option value="">Select a faculty member...</option>
                {facultyList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.username} ({f.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 border-2 border-gray-200 text-gray-700 rounded-xl py-3 px-4 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all hover:cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={loading}
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-3 px-4 font-medium hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none hover:cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Adding...
                </span>
              ) : (
                "Add Department"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
