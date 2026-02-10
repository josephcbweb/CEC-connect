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
        // Validation check for the new field
        if (!formData.name || !formData.wardenName || !formData.wardenPhone || !formData.monthlyRent) {
            setError("Please fill in all fields");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Sending formData which now includes monthlyRent
            await axios.post("http://localhost:3000/api/hostel/createHostel", {
                ...formData,
                monthlyRent: Number(formData.monthlyRent) // Ensure it's sent as a number
            });
            
            setFormData({ name: "", wardenName: "", wardenPhone: "", monthlyRent: "" });
            onSuccess();
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center px-6 pt-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-violet-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-zinc-900">Add New Hostel</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>

                {/* Form */}
                <div className="px-6 pb-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Hostel Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">Hostel Name *</label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <input
                                placeholder="e.g., Boys Hostel A"
                                value={formData.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                disabled={loading}
                                className="w-full pl-11 pr-4 py-3 border border-zinc-200 rounded-xl focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Monthly Rent Field - NEW */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">Monthly Rent (₹) *</label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                                <IndianRupee className="w-5 h-5" />
                            </div>
                            <input
                                type="number"
                                placeholder="e.g., 5000"
                                value={formData.monthlyRent}
                                onChange={(e) => handleChange("monthlyRent", e.target.value)}
                                disabled={loading}
                                className="w-full pl-11 pr-4 py-3 border border-zinc-200 rounded-xl focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Warden Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">Warden Name *</label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                                <User className="w-5 h-5" />
                            </div>
                            <input
                                placeholder="e.g., John Doe"
                                value={formData.wardenName}
                                onChange={(e) => handleChange("wardenName", e.target.value)}
                                disabled={loading}
                                className="w-full pl-11 pr-4 py-3 border border-zinc-200 rounded-xl focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Warden Phone */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">Warden Phone *</label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                                <Phone className="w-5 h-5" />
                            </div>
                            <input
                                type="tel"
                                placeholder="e.g., +91 9876543210"
                                value={formData.wardenPhone}
                                onChange={(e) => handleChange("wardenPhone", e.target.value)}
                                disabled={loading}
                                className="w-full pl-11 pr-4 py-3 border border-zinc-200 rounded-xl focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 border border-zinc-200 text-zinc-700 rounded-xl py-3 px-4 font-medium hover:bg-zinc-50 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            onClick={handleSubmit}
                            className="flex-1 bg-violet-600 text-white rounded-xl py-3 px-4 font-medium hover:bg-violet-700 transition-colors cursor-pointer disabled:opacity-60"
                        >
                            {loading ? "Creating..." : "Create Hostel"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddHostelModal;