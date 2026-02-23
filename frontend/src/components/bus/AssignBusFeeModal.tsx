import React, { useState, useEffect } from 'react';
import { Calendar, Users, X, CreditCard, Loader2, CheckCircle, AlertCircle, Eye, UserCheck, UserX, Zap } from 'lucide-react';
import axios from 'axios';

interface AssignBusFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface BatchDetail {
  batchId: number;
  batchName: string;
  total: number;
  alreadyBilled: number;
  netNew: number;
}

interface PreviewData {
  eligible: number;
  alreadyBilled: number;
  netNew: number;
  batches: BatchDetail[];
}

const AssignBusFeeModal = ({ isOpen, onClose, onSuccess }: AssignBusFeeModalProps) => {
  const [semesters, setSemesters] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [semester, setSemester] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Fetch active semesters when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      axios.get('http://localhost:3000/bus/active-semesters')
        .then(res => setSemesters(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));

      // Reset state
      setSemester('');
      setDueDate('');
      setPreview(null);
      setResult(null);
    }
  }, [isOpen]);

  // Fetch preview when semester changes
  useEffect(() => {
    if (!semester) {
      setPreview(null);
      return;
    }
    setPreviewLoading(true);
    axios.get(`http://localhost:3000/bus/preview-bulk-fees?semester=${semester}`)
      .then(res => setPreview(res.data))
      .catch(err => console.error(err))
      .finally(() => setPreviewLoading(false));
  }, [semester]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semester || !dueDate || !preview || preview.netNew === 0) return;

    setSubmitting(true);
    try {
      const res = await axios.post('http://localhost:3000/bus/assign-bulk-fees', {
        semester: parseInt(semester),
        dueDate,
      });
      setResult(res.data);
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.error || "Error assigning fees");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#4134bd] p-6 text-white flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6" />
            <div>
              <h3 className="text-xl font-bold">Smart Fee Assignment</h3>
              <p className="text-white/70 text-sm">Auto-detect · Skip duplicates · One click</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1">
          {/* ━━━ Success View ━━━ */}
          {result ? (
            <div className="p-8 space-y-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-800">Fees Assigned Successfully</h4>
                <p className="text-gray-500 mt-2">{result.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-green-700">{result.totalStudentsBilled}</p>
                  <p className="text-xs font-semibold text-green-600 mt-1">Students Billed</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-gray-500">{result.totalSkipped}</p>
                  <p className="text-xs font-semibold text-gray-400 mt-1">Skipped (Already Billed)</p>
                </div>
              </div>

              {result.processedBatches?.length > 0 && (
                <div className="bg-green-50 rounded-xl p-4 text-left">
                  <p className="text-sm font-semibold text-green-700 mb-2">Processed Batches</p>
                  {result.processedBatches.map((name: string) => (
                    <span key={name} className="inline-block bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full mr-2 mb-1">
                      {name}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-3 px-4 bg-[#4134bd] text-white font-semibold rounded-xl hover:bg-[#3529a3] transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            /* ━━━ Form View ━━━ */
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Semester Selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" /> Select Semester
                </label>
                {loading ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm p-3">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading semesters...
                  </div>
                ) : (
                  <select
                    required
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4134bd] focus:border-transparent outline-none appearance-none bg-gray-50"
                  >
                    <option value="">Choose a semester</option>
                    {semesters.map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" /> Due Date
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4134bd] outline-none bg-gray-50"
                />
              </div>

              {/* ━━━ Live Preview Card ━━━ */}
              {semester && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Eye className="w-4 h-4 text-gray-400" /> Live Preview
                  </div>

                  {previewLoading ? (
                    <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-8 bg-gray-50 rounded-xl">
                      <Loader2 className="w-4 h-4 animate-spin" /> Analyzing students...
                    </div>
                  ) : preview ? (
                    <div className="space-y-4">
                      {/* Summary Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                          <div className="flex justify-center mb-1">
                            <UserCheck className="w-4 h-4 text-blue-500" />
                          </div>
                          <p className="text-xl font-black text-blue-700">{preview.eligible}</p>
                          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mt-0.5">Eligible</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                          <div className="flex justify-center mb-1">
                            <UserX className="w-4 h-4 text-amber-500" />
                          </div>
                          <p className="text-xl font-black text-amber-700">{preview.alreadyBilled}</p>
                          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mt-0.5">Already Billed</p>
                        </div>
                        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                          <div className="flex justify-center mb-1">
                            <Zap className="w-4 h-4 text-green-500" />
                          </div>
                          <p className="text-xl font-black text-green-700">{preview.netNew}</p>
                          <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider mt-0.5">Net New</p>
                        </div>
                      </div>

                      {/* Batch Breakdown */}
                      {preview.batches.length > 0 && (
                        <div className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                <th className="text-left py-2.5 pl-4">Batch</th>
                                <th className="text-center py-2.5">Total</th>
                                <th className="text-center py-2.5">Billed</th>
                                <th className="text-center py-2.5 pr-4">New</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {preview.batches.map((b) => (
                                <tr key={b.batchId} className="text-gray-700">
                                  <td className="py-2 pl-4 font-medium">{b.batchName}</td>
                                  <td className="py-2 text-center text-gray-500">{b.total}</td>
                                  <td className="py-2 text-center">
                                    {b.alreadyBilled > 0 ? (
                                      <span className="text-amber-600 font-semibold">{b.alreadyBilled}</span>
                                    ) : (
                                      <span className="text-gray-300">0</span>
                                    )}
                                  </td>
                                  <td className="py-2 text-center pr-4">
                                    {b.netNew > 0 ? (
                                      <span className="text-green-700 font-bold">{b.netNew}</span>
                                    ) : (
                                      <span className="text-gray-300">0</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Net New = 0 warning */}
                      {preview.netNew === 0 && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-amber-700 font-medium">
                            All students for Semester {semester} are already up to date. No new invoices to generate.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

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
                  disabled={submitting || !preview || preview.netNew === 0 || !dueDate}
                  className="flex-1 py-3 px-4 bg-[#4134bd] text-white font-semibold rounded-xl hover:bg-[#3529a3] shadow-lg shadow-[#4134bd]/30 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Assign {preview && preview.netNew > 0 ? `${preview.netNew} Students` : 'All'}</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignBusFeeModal;