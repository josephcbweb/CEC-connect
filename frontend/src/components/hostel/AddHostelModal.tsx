import { useState } from "react";
import { X, Building2, User, Phone, IndianRupee } from "lucide-react"; // Added IndianRupee icon
import axios from "axios";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddHostelModal = ({ isOpen, onClose, onSuccess }: Props) => {
    const [formData, setFormData] = useState({
        name: "",
        wardenName: "",
        wardenPhone: "",
        monthlyRent: "", // Added monthlyRent to state
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async () => {
        // Validation check
        if (!formData.name || !formData.wardenName || !formData.wardenPhone || !formData.monthlyRent) {
            setError("All fields are required");
            return;
        }

        // Phone Validation
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(formData.wardenPhone)) {
            setError("Invalid phone number. Please enter a 10-digit mobile number.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await axios.post("http://localhost:3000/api/hostel/createHostel", {
                ...formData,
                monthlyRent: Number(formData.monthlyRent)
            });

            setFormData({ name: "", wardenName: "", wardenPhone: "", monthlyRent: "" });
            onSuccess();
            onClose(); // FIX: Added onClose to close modal after success
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to create hostel");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
        setError("");
    };

    return (
        <div className="fixed inset-0 bg-zinc-950/20 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl shadow-violet-200/20 border border-zinc-100 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 pt-8 pb-2 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Add Hostel</h2>
                        <p className="text-zinc-500 text-sm mt-1">Create a new student residence</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-400 transition-all cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-8 pt-6 space-y-5">
                    {error && (
                        <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Hostel Name</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-violet-500 transition-colors">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <input
                                    placeholder="e.g., Boys Hostel A"
                                    value={formData.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    disabled={loading}
                                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:bg-white focus:border-violet-200 focus:ring-4 focus:ring-violet-50 transition-all outline-none text-zinc-900 font-medium placeholder:text-zinc-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Monthly Rent</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-violet-500 transition-colors">
                                    <IndianRupee className="w-5 h-5" />
                                </div>
                                <input
                                    type="number"
                                    placeholder="e.g., 5000"
                                    value={formData.monthlyRent}
                                    onChange={(e) => handleChange("monthlyRent", e.target.value)}
                                    disabled={loading}
                                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:bg-white focus:border-violet-200 focus:ring-4 focus:ring-violet-50 transition-all outline-none text-zinc-900 font-medium placeholder:text-zinc-300"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Warden</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-violet-500 transition-colors">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <input
                                        placeholder="Name"
                                        value={formData.wardenName}
                                        onChange={(e) => handleChange("wardenName", e.target.value)}
                                        disabled={loading}
                                        className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:bg-white focus:border-violet-200 focus:ring-4 focus:ring-violet-50 transition-all outline-none text-sm font-medium text-zinc-900 placeholder:text-zinc-300"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Phone</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-violet-500 transition-colors">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="Phone"
                                        value={formData.wardenPhone}
                                        onChange={(e) => handleChange("wardenPhone", e.target.value)}
                                        disabled={loading}
                                        className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:bg-white focus:border-violet-200 focus:ring-4 focus:ring-violet-50 transition-all outline-none text-sm font-medium text-zinc-900 placeholder:text-zinc-300"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-6 py-3.5 rounded-2xl font-bold text-zinc-500 hover:bg-zinc-50 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            onClick={handleSubmit}
                            className="flex-[1.5] bg-violet-600 text-white rounded-2xl py-3.5 px-6 font-bold hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-200 active:scale-95 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Creating...</span>
                                </>
                            ) : "Create Hostel"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddHostelModal;