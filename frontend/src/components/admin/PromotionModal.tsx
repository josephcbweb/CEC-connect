import React, { useState, useEffect } from "react";
import {
  Loader2,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  X,
} from "lucide-react";

interface Transition {
  from: number;
  to: number | "GRADUATED";
  label: string;
}

interface PromotionStats {
  counts: Record<string, number>;
  pendingDues: Record<string, number>;
  pendingFees: Record<string, number>;
  currentType: "ODD" | "EVEN";
  recommendedTransitions: Transition[];
}

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  allStudents: any[];
}

const baseURL = "http://localhost:3000";

const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  allStudents,
}) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<PromotionStats | null>(null);
  const [selectedTransitions, setSelectedTransitions] = useState<
    Record<string, boolean>
  >({});

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dueAction, setDueAction] = useState<"CLEAR" | "KEEP" | "">("");
  const [feeAction, setFeeAction] = useState<"CLEAR" | "ARCHIVE" | "KEEP" | "">("");

  const [yearBackCandidates, setYearBackCandidates] = useState<any[]>([]);
  const [selectedYearBackIds, setSelectedYearBackIds] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchStats();
      setStep(1);
      setError(null);
      setSelectedYearBackIds([]);
      setDueAction("");
      setFeeAction("");
    }
  }, [isOpen]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseURL}/api/promotion/stats`);
      if (!res.ok) throw new Error("Failed to fetch promotion stats");
      const data = await res.json();
      setStats(data);

      // Initialize checkboxes
      const initialSelection: Record<string, boolean> = {};
      data.recommendedTransitions.forEach((t: Transition) => {
        // S1 -> S2 is optional (default unchecked usually, but prompt says "Optional (checkbox controlled)", S3->S4 Default Checked)
        // Prompt: "S1 -> S2 (OPTIONAL via checkbox), S3 -> S4 (Default checked)..."
        // I will default S1->S2 to false, others to true.
        if (t.from === 1 && t.to === 2) {
          initialSelection[`${t.from}-${t.to}`] = false;
        } else {
          initialSelection[`${t.from}-${t.to}`] = true;
        }
      });
      setSelectedTransitions(initialSelection);
    } catch (err) {
      setError("Could not load promotion data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: string) => {
    setSelectedTransitions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getTransitionLabel = (t: Transition) => {
    const count = stats?.counts[t.from] || 0;
    return (
      <div className="flex justify-between items-center w-full">
        <span>{t.label}</span>
        <span className="text-gray-500 text-sm">{count} Students</span>
      </div>
    );
  };

  const handleNext = () => {
    if (step === 1) {
      // Check if any selected transition has pending dues or fees
      const hasPendingDues = stats?.recommendedTransitions.some(
        (t) => selectedTransitions[`${t.from}-${t.to}`] && (stats.pendingDues[t.from] || 0) > 0
      );
      const hasPendingFees = stats?.recommendedTransitions.some(
        (t) => selectedTransitions[`${t.from}-${t.to}`] && (stats.pendingFees[t.from] || 0) > 0
      );

      if (hasPendingDues || hasPendingFees) {
        setStep(2); // Show warning step
      } else {
        setStep(3); // Skip to confirmation
      }
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePromote = async () => {
    if (!stats) return;
    setProcessing(true);
    try {
      const activeTransitions = stats.recommendedTransitions
        .filter((t) => selectedTransitions[`${t.from}-${t.to}`])
        .map((t) => ({ from: t.from, to: t.to }));

      const res = await fetch(`${baseURL}/api/promotion/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          semesterType: stats.currentType,
          transitions: activeTransitions,
          // No yearBackIds sent as per new requirement
          yearBackIds: [],
          dueAction: dueAction || "NONE",
          feeAction: feeAction || "NONE",
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Promotion failed");

      onSuccess();
      onClose();
      // Ideally show a toast success here, handled by parent or a simple alert
      alert(result.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {step === 1 && "Semester Promotion"}
            {step === 2 && "Pending Clearances & Fees"}
            {step === 3 && "Confirm Promotion"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="text-red-600 bg-red-50 p-3 rounded-md flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          ) : stats ? (
            <>
              {step === 1 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm">
                    Current detected semester:{" "}
                    <strong>{stats.currentType}</strong>.
                    <br />
                    Select the batches you want to promote.
                  </div>

                  <div className="space-y-2 mt-4">
                    {stats.recommendedTransitions.map((t) => (
                      <label
                        key={`${t.from}-${t.to}`}
                        className="flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          checked={
                            selectedTransitions[`${t.from}-${t.to}`] || false
                          }
                          onChange={() => handleToggle(`${t.from}-${t.to}`)}
                        />
                        <div className="ml-3 w-full">
                          {getTransitionLabel(t)}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  {/* Pending Dues Section */}
                  {stats.recommendedTransitions.some(
                    (t) => selectedTransitions[`${t.from}-${t.to}`] && (stats.pendingDues[t.from] || 0) > 0
                  ) && (
                      <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg flex gap-3">
                          <AlertTriangle className="w-6 h-6 shrink-0 text-yellow-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-yellow-900">Pending No Due Requests</h4>
                            <div className="mt-2 space-y-1 text-sm">
                              {stats.recommendedTransitions
                                .filter((t) => selectedTransitions[`${t.from}-${t.to}`] && (stats.pendingDues[t.from] || 0) > 0)
                                .map((t) => (
                                  <div key={t.from}>
                                    Semester {t.from}: <strong>{stats.pendingDues[t.from]}</strong> student(s)
                                  </div>
                                ))}
                            </div>
                            <p className="mt-3 text-sm">
                              Select how you want to handle these pending no-due clearances.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <label className={`flex p-3 border rounded-lg cursor-pointer transition-colors ${dueAction === "CLEAR" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
                            <input
                              type="radio"
                              name="dueAction"
                              className="w-4 h-4 text-blue-600 mt-1 focus:ring-blue-500"
                              checked={dueAction === "CLEAR"}
                              onChange={() => setDueAction("CLEAR")}
                            />
                            <div className="ml-3">
                              <h5 className="font-medium text-sm text-gray-900">Clear Dues</h5>
                              <p className="text-xs text-gray-500">Mark all requests as approved.</p>
                            </div>
                          </label>

                          <label className={`flex p-3 border rounded-lg cursor-pointer transition-colors ${dueAction === "KEEP" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
                            <input
                              type="radio"
                              name="dueAction"
                              className="w-4 h-4 text-blue-600 mt-1 focus:ring-blue-500"
                              checked={dueAction === "KEEP"}
                              onChange={() => setDueAction("KEEP")}
                            />
                            <div className="ml-3">
                              <h5 className="font-medium text-sm text-gray-900">Archive Dues</h5>
                              <p className="text-xs text-gray-500">Keep them as-is but hide from active view.</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}

                  {/* Pending Fees Section */}
                  {stats.recommendedTransitions.some(
                    (t) => selectedTransitions[`${t.from}-${t.to}`] && (stats.pendingFees[t.from] || 0) > 0
                  ) && (
                      <div className="space-y-4 pt-4 border-t border-gray-100">
                        <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg flex gap-3">
                          <AlertTriangle className="w-6 h-6 shrink-0 text-orange-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-orange-900">Pending Student Fees</h4>
                            <div className="mt-2 space-y-1 text-sm">
                              {stats.recommendedTransitions
                                .filter((t) => selectedTransitions[`${t.from}-${t.to}`] && (stats.pendingFees[t.from] || 0) > 0)
                                .map((t) => (
                                  <div key={t.from}>
                                    Semester {t.from}: <strong>{stats.pendingFees[t.from]}</strong> invoice(s)
                                  </div>
                                ))}
                            </div>
                            <p className="mt-3 text-sm">
                              Select how you want to handle these unpaid fees before promotion.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <label className={`flex p-3 border rounded-lg cursor-pointer transition-colors ${feeAction === "CLEAR" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
                            <input
                              type="radio"
                              name="feeAction"
                              className="w-4 h-4 text-blue-600 mt-1 focus:ring-blue-500"
                              checked={feeAction === "CLEAR"}
                              onChange={() => setFeeAction("CLEAR")}
                            />
                            <div className="ml-3">
                              <h5 className="font-medium text-sm text-gray-900">Clear Fees (Mark Paid)</h5>
                              <p className="text-xs text-gray-500">Mark all pending invoices as paid.</p>
                            </div>
                          </label>

                          <label className={`flex p-3 border rounded-lg cursor-pointer transition-colors ${feeAction === "ARCHIVE" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
                            <input
                              type="radio"
                              name="feeAction"
                              className="w-4 h-4 text-blue-600 mt-1 focus:ring-blue-500"
                              checked={feeAction === "ARCHIVE"}
                              onChange={() => setFeeAction("ARCHIVE")}
                            />
                            <div className="ml-3">
                              <h5 className="font-medium text-sm text-gray-900">Archive Fees</h5>
                              <p className="text-xs text-gray-500">Move them to the archived section, keeping balance clean.</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Summary</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    {stats.recommendedTransitions
                      .filter((t) => selectedTransitions[`${t.from}-${t.to}`])
                      .map((t) => (
                        <li key={t.from}>
                          Batch <b>S{t.from}</b> →{" "}
                          <b>
                            {t.to === "GRADUATED" ? "Graduated" : `S${t.to}`}
                          </b>
                        </li>
                      ))}
                  </ul>

                  <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm flex gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p>This action will update student records permanently.</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                {step > 1 && (
                  <button
                    onClick={() => {
                      if (step === 3) {
                        const hasPendingDues = stats?.recommendedTransitions.some(
                          (t) => selectedTransitions[`${t.from}-${t.to}`] && (stats.pendingDues[t.from] || 0) > 0
                        );
                        const hasPendingFees = stats?.recommendedTransitions.some(
                          (t) => selectedTransitions[`${t.from}-${t.to}`] && (stats.pendingFees[t.from] || 0) > 0
                        );
                        setStep(hasPendingDues || hasPendingFees ? 2 : 1);
                      } else {
                        setStep(1);
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    disabled={processing}
                  >
                    Back
                  </button>
                )}

                {step < 3 ? (
                  <button
                    onClick={handleNext}
                    disabled={
                      (step === 1 && Object.values(selectedTransitions).every((v) => !v)) ||
                      (step === 2 && (
                        (stats.recommendedTransitions.some(t => selectedTransitions[`${t.from}-${t.to}`] && (stats.pendingDues[t.from] || 0) > 0) && !dueAction) ||
                        (stats.recommendedTransitions.some(t => selectedTransitions[`${t.from}-${t.to}`] && (stats.pendingFees[t.from] || 0) > 0) && !feeAction)
                      ))
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-2"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handlePromote}
                    disabled={processing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Promotion
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PromotionModal;
