import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Settings, Loader2, Save } from "lucide-react";
import axios from "axios";

interface FineSlab {
    id?: number;
    startDay: number;
    endDay: number | null;
    amountPerDay: number;
}

interface BusFineSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const BusFineSettingsModal: React.FC<BusFineSettingsModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fineEnabled, setFineEnabled] = useState(false);
    const [slabs, setSlabs] = useState<FineSlab[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchSettings();
        } else {
            // Reset state when closed
            setSlabs([]);
            setError(null);
        }
    }, [isOpen]);

    const fetchSettings = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get("http://localhost:3000/bus/fine-settings");
            setFineEnabled(res.data.fineEnabled || false);
            setSlabs(res.data.fineSlabs || []);
        } catch (err: any) {
            console.error("Error fetching fine settings:", err);
            setError("Failed to load fine settings. Ensure the bus fee structure exists.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlab = () => {
        const lastSlab = slabs[slabs.length - 1];
        const newStartDay = lastSlab ? (lastSlab.endDay ? lastSlab.endDay + 1 : lastSlab.startDay + 1) : 1;
        setSlabs([
            ...slabs,
            { startDay: newStartDay, endDay: null, amountPerDay: 0 },
        ]);
    };

    const handleRemoveSlab = (index: number) => {
        const newSlabs = [...slabs];
        newSlabs.splice(index, 1);
        setSlabs(newSlabs);
    };

    const handleSlabChange = (
        index: number,
        field: keyof FineSlab,
        value: number | null
    ) => {
        const newSlabs = [...slabs];
        newSlabs[index] = { ...newSlabs[index], [field]: value };
        setSlabs(newSlabs);
    };

    const handleSave = async () => {
        // Basic Validation
        setError(null);
        for (let i = 0; i < slabs.length; i++) {
            if (slabs[i].startDay <= 0) {
                setError(`Row ${i + 1}: Start Day must be greater than 0.`);
                return;
            }
            if (slabs[i].endDay !== null && slabs[i].endDay! < slabs[i].startDay) {
                setError(
                    `Row ${i + 1}: End Day cannot be less than Start Day.`
                );
                return;
            }
            if (slabs[i].amountPerDay < 0) {
                setError(`Row ${i + 1}: Amount per day cannot be negative.`);
                return;
            }
            if (i > 0 && slabs[i - 1].endDay) {
                if (slabs[i].startDay <= slabs[i - 1].endDay!) {
                    setError(
                        `Row ${i + 1}: Start Day must be after the previous row's End Day.`
                    );
                    return;
                }
            }
            if (i < slabs.length - 1 && slabs[i].endDay === null) {
                setError(
                    `Row ${i + 1}: Only the last period can be open-ended (empty End Day).`
                );
                return;
            }
        }

        setSaving(true);
        try {
            await axios.put("http://localhost:3000/bus/fine-settings", {
                fineEnabled,
                fineSlabs: slabs,
            });
            onClose();
        } catch (err: any) {
            console.error("Error saving fine settings:", err);
            setError(err.response?.data?.error || "Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl animate-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-violet-50 rounded-xl text-[#4134bd]">
                            <Settings className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                Bus Fee Fine Configuration
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Manage late payment fines after due date
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Loader2 className="w-8 h-8 font-bold animate-spin mb-3 text-[#4134bd]" />
                            <p>Loading configuration...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 flex items-start gap-3">
                                    <div className="mt-0.5">⚠️</div> {error}
                                </div>
                            )}

                            {/* Master Toggle */}
                            <div className="bg-white border text-gray-800 border-gray-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
                                <div>
                                    <h3 className="font-semibold">Enable Fines for Bus Fees</h3>
                                    <p className="text-sm text-gray-500">
                                        Automatically calculate fines for past due bus fee payments.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={fineEnabled}
                                        onChange={(e) => setFineEnabled(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4134bd]"></div>
                                </label>
                            </div>

                            {/* Slabs Section */}
                            {fineEnabled && (
                                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden text-gray-800">
                                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                        <h3 className="font-semibold text-gray-700">Fine Periods</h3>
                                        <button
                                            onClick={handleAddSlab}
                                            className="text-[#4134bd] text-sm font-medium hover:bg-violet-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                                        >
                                            <Plus className="w-4 h-4" /> Add Period
                                        </button>
                                    </div>

                                    <div className="p-5 space-y-4">
                                        {slabs.length === 0 ? (
                                            <div className="text-center py-6 text-gray-400 text-sm">
                                                No fine periods defined. Click "Add Period" to start.
                                            </div>
                                        ) : (
                                            slabs.map((slab, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50/30 group hover:border-[#4134bd]/30 transition-colors"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-violet-100 text-[#4134bd] flex items-center justify-center font-bold text-sm shrink-0">
                                                        {idx + 1}
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-4 flex-1">
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                                                Start Day (After Due)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={slab.startDay}
                                                                onChange={(e) =>
                                                                    handleSlabChange(
                                                                        idx,
                                                                        "startDay",
                                                                        parseInt(e.target.value) || 0
                                                                    )
                                                                }
                                                                className="w-full bg-white px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4134bd]/20 focus:border-[#4134bd] outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                                                End Day <span className="text-gray-400 font-normal"></span>
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                placeholder="Until paid"
                                                                value={slab.endDay || ""}
                                                                onChange={(e) =>
                                                                    handleSlabChange(
                                                                        idx,
                                                                        "endDay",
                                                                        e.target.value ? parseInt(e.target.value) : null
                                                                    )
                                                                }
                                                                className="w-full bg-white px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4134bd]/20 focus:border-[#4134bd] outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                                                Fine Amount / Day (₹)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={slab.amountPerDay}
                                                                onChange={(e) =>
                                                                    handleSlabChange(
                                                                        idx,
                                                                        "amountPerDay",
                                                                        parseFloat(e.target.value) || 0
                                                                    )
                                                                }
                                                                className="w-full bg-white px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4134bd]/20 focus:border-[#4134bd] outline-none"
                                                            />
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => handleRemoveSlab(idx)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-5 ml-2"
                                                        title="Remove Period"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-white rounded-b-2xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#4134bd] text-white font-semibold rounded-xl hover:bg-[#3529a3] shadow-lg shadow-violet-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BusFineSettingsModal;
