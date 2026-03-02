import { useState, useEffect } from "react";
import { X, User, Phone } from "lucide-react";
import axios from "axios";

const EditWardenModal = ({ isOpen, onClose, hostel, onSuccess }: any) => {
    const [data, setData] = useState({ wardenName: "", wardenPhone: "" });

    useEffect(() => {
        if (hostel) setData({ wardenName: hostel.wardenName, wardenPhone: hostel.wardenPhone });
    }, [hostel, isOpen]);

    const handleUpdate = async () => {
        // Phone Validation
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(data.wardenPhone)) {
            alert("Invalid phone number. Please enter a 10-digit mobile number.");
            return;
        }

        try {
            await axios.patch(`http://localhost:3000/api/hostel/updateWarden/${hostel.id}`, data);
            onSuccess();
            onClose();
        } catch (err) { alert("Update failed"); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-zinc-950/20 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] max-w-sm w-full shadow-2xl shadow-violet-200/20 border border-zinc-100 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 pb-4 flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Warden Info</h3>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Update contact details</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-50 text-zinc-400 cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 pt-4 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-violet-500 transition-colors" />
                                <input
                                    className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:bg-white focus:border-violet-200 focus:ring-4 focus:ring-violet-50 transition-all outline-none font-bold text-zinc-700"
                                    value={data.wardenName}
                                    onChange={(e) => setData({ ...data, wardenName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Phone Number</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-violet-500 transition-colors" />
                                <input
                                    className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:bg-white focus:border-violet-200 focus:ring-4 focus:ring-violet-50 transition-all outline-none font-bold text-zinc-700"
                                    value={data.wardenPhone}
                                    onChange={(e) => setData({ ...data, wardenPhone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 py-4 font-bold text-zinc-500 hover:bg-zinc-50 rounded-2xl transition-all cursor-pointer">Cancel</button>
                        <button onClick={handleUpdate} className="flex-[1.5] bg-violet-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all active:scale-95 cursor-pointer">Update Warden</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default EditWardenModal;