import { useState, useEffect } from "react";
import { X, IndianRupee } from "lucide-react";
import axios from "axios";

const EditRentModal = ({ isOpen, onClose, hostel, onSuccess }: any) => {
    const [rent, setRent] = useState("");

    useEffect(() => {
        if (hostel) setRent(hostel.monthlyRent.toString());
    }, [hostel, isOpen]);

    const handleUpdate = async () => {
        try {
            await axios.patch(`http://localhost:3000/api/hostel/updateRent/${hostel.id}`, { monthlyRent: Number(rent) });
            onSuccess();
            onClose();
        } catch (err) { alert("Update failed"); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-950/20 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 pb-4 flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Monthly Rent</h3>
                        <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mt-1">Hostel Utility Rate</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 pt-4 space-y-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Amount (₹)</label>
                        <div className="relative group">
                            <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="number"
                                className="w-full pl-16 pr-8 py-5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-teal-200 focus:ring-1 focus:ring-teal-50 transition-all outline-none font-bold text-3xl text-gray-900 tracking-tighter"
                                value={rent}
                                onChange={(e) => setRent(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button onClick={handleUpdate} className="w-full bg-teal-600 text-white py-4 rounded-lg font-semibold shadow-sm hover:bg-teal-700 transition-all active:scale-95 cursor-pointer">Confirm New Rent</button>
                        <button onClick={onClose} className="w-full py-2.5 font-bold text-gray-400 hover:text-gray-600 transition-all text-xs uppercase tracking-widest cursor-pointer border border-gray-200 rounded-lg">Back to overview</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default EditRentModal;