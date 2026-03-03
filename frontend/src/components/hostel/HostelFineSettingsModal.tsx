import React, { useState, useEffect } from "react";
import { X, Settings, Plus, Trash2, Loader2, AlertCircle, Save } from "lucide-react";
import axios from "axios";

interface FineSlab {
    id?: number;
    startDay: number;
    endDay: number | null;
    amountPerDay: number;
}

interface HostelFineSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const HostelFineSettingsModal: React.FC<HostelFineSettingsModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [fineEnabled, setFineEnabled] = useState(false);
    const [fineSlabs, setFineSlabs] = useState<FineSlab[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchSettings();
        } else {
            resetState();
        }
    }, [isOpen]);

    const resetState = () => {
        setFineEnabled(false);
        setFineSlabs([]);
        setError(null);
    };

    const fetchSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(
                "http://localhost:3000/api/hostel/fine-settings"
            );
            const data = response.data;
            setFineEnabled(data.fineEnabled);
            setFineSlabs(data.fineSlabs || []);
        } catch (err: any) {
            console.error("Failed to fetch hostel fine settings:", err);
            setError("Failed to load fine settings.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // Validate slabs
        if (fineEnabled) {
            for (let i = 0; i < fineSlabs.length; i++) {
                const slab = fineSlabs[i];
                if (slab.startDay <= 0 || slab.amountPerDay <= 0) {
                    setError(`Slab ${i + 1} has invalid values. Start Day and Amount must be > 0.`);
                    return;
                }
                if (slab.endDay !== null && slab.endDay < slab.startDay) {
                    setError(`Slab ${i + 1}: End Day cannot be less than Start Day.`);
                    return;
                }
            }
        }

        try {
            setSaving(true);
            setError(null);
            await axios.post("http://localhost:3000/api/hostel/fine-settings", {
                fineEnabled,
                fineSlabs: fineSlabs.map((s) => ({
                    ...s,
                    endDay: s.endDay === 0 || s.endDay === null || isNaN(s.endDay) ? null : s.endDay,
                })),
            });
            alert("Hostel fine settings saved successfully.");
            onClose();
        } catch (err: any) {
            console.error("Failed to save fine settings:", err);
            setError("Failed to save settings. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const addSlab = () => {
        const lastSlab = fineSlabs[fineSlabs.length - 1];
        const initialStart = lastSlab
            ? lastSlab.endDay
                ? lastSlab.endDay + 1
                : lastSlab.startDay + 1
            : 1;

        setFineSlabs([
            ...fineSlabs,
            { startDay: initialStart, endDay: null, amountPerDay: 50 },
        ]);
    };

    const updateSlab = (index: number, field: keyof FineSlab, value: any) => {
        const newSlabs = [...fineSlabs];
        newSlabs[index] = { ...newSlabs[index], [field]: value };
        setFineSlabs(newSlabs);
    };

    const removeSlab = (index: number) => {
        const newSlabs = [...fineSlabs];
        newSlabs.splice(index, 1);
        setFineSlabs(newSlabs);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-700">
                            <Settings className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900">
                                Hostel Fine Settings
                            </h2>
                            <p className="text-sm text-zinc-500">
                                Configure late payment fines for hostel rent.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-200 text-zinc-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="py-12 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                        </div>
                    ) : (
                        <>
                            {/* Enable Toggle */}
                            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                                <div>
                                    <h3 className="font-semibold text-zinc-900">Enable Fines</h3>
                                    <p className="text-sm text-zinc-500">
                                        Automatically apply fines to overdue hostel invoices.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={fineEnabled}
                                        onChange={(e) => setFineEnabled(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>

                            {/* Fine Slabs */}
                            {fineEnabled && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold text-zinc-900">Fine Slabs</h3>
                                        <button
                                            onClick={addSlab}
                                            className="text-sm flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium rounded-lg transition-colors cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4" /> Add Slab
                                        </button>
                                    </div>

                                    {fineSlabs.length === 0 ? (
                                        <div className="text-center p-8 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50">
                                            <p className="text-zinc-500 font-medium">
                                                No fine slabs configured. Add one to start applying fines.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {fineSlabs.map((slab, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-xl shadow-sm"
                                                >
                                                    <div className="flex-1 space-y-1">
                                                        <label className="text-xs font-bold text-zinc-500 uppercase">
                                                            Start Day
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={slab.startDay}
                                                            onChange={(e) =>
                                                                updateSlab(
                                                                    index,
                                                                    "startDay",
                                                                    parseInt(e.target.value) || 0
                                                                )
                                                            }
                                                            className="w-full p-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                                        />
                                                    </div>

                                                    <div className="self-center pt-5 text-zinc-400">
                                                        to
                                                    </div>

                                                    <div className="flex-1 space-y-1">
                                                        <label className="text-xs font-bold text-zinc-500 uppercase">
                                                            End Day <span className="text-zinc-400 lowercase font-normal">(optional)</span>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min={slab.startDay}
                                                            value={slab.endDay || ""}
                                                            onChange={(e) =>
                                                                updateSlab(
                                                                    index,
                                                                    "endDay",
                                                                    parseInt(e.target.value) || null
                                                                )
                                                            }
                                                            placeholder="Ongoing"
                                                            className="w-full p-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                                        />
                                                    </div>

                                                    <div className="flex-1 space-y-1">
                                                        <label className="text-xs font-bold text-zinc-500 uppercase">
                                                            ₹ / Day
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={slab.amountPerDay}
                                                            onChange={(e) =>
                                                                updateSlab(
                                                                    index,
                                                                    "amountPerDay",
                                                                    parseFloat(e.target.value) || 0
                                                                )
                                                            }
                                                            className="w-full p-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                                        />
                                                    </div>

                                                    <button
                                                        onClick={() => removeSlab(index)}
                                                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-5 cursor-pointer"
                                                        title="Remove Slab"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-medium text-zinc-600 hover:bg-zinc-200 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || saving}
                        className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-200 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HostelFineSettingsModal;
