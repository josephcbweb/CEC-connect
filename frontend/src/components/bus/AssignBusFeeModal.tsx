import React, { useState, useEffect } from 'react';
import { Calendar, Users, X, CreditCard, Loader2 } from 'lucide-react';
import axios from 'axios';

interface AssignBusFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AssignBusFeeModal = ({ isOpen, onClose, onSuccess }: AssignBusFeeModalProps) => {
  const [semesters, setSemesters] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    semester: 'all', // Default to all
    dueDate: '',
    feeName: ''
  });

  // Fetch unique semesters when modal opens
  useEffect(() => {
    if (isOpen) {
      axios.get('http://localhost:3000/bus/getSemester')
        .then(res => setSemesters(res.data))
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:3000/bus/assign-fees', formData);
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error assigning fees");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-[#4134bd] p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6" />
            <h3 className="text-xl font-bold">Assign Bus Fee</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Semester Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" /> Select Semester
            </label>
            <select
              required
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4134bd] focus:border-transparent outline-none appearance-none bg-gray-50"
            >
              <option value="all">All Semesters</option>
              {semesters.map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          {/* Fee Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Fee Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Bus Fee - Jan 2026"
              value={formData.feeName}
              onChange={(e) => setFormData({ ...formData, feeName: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4134bd] outline-none bg-gray-50"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" /> Due Date
            </label>
            <input
              type="date"
              required
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4134bd] outline-none bg-gray-50"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-[#4134bd] text-white font-semibold rounded-xl hover:bg-[#3529a3] shadow-lg shadow-[#4134bd]/30 transition-all flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm & Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignBusFeeModal;