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
        <div className="fixed inset-0 bg-gray-950/20 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 pb-4 flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Warden Info</h3>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Update contact details</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 pt-4 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                                <input
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-teal-200 focus:ring-1 focus:ring-teal-50 transition-all outline-none font-bold text-gray-700"
                                    value={data.wardenName}
                                    onChange={(e) => setData({ ...data, wardenName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                                <input
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-teal-200 focus:ring-1 focus:ring-teal-50 transition-all outline-none font-bold text-gray-700"
                                    value={data.wardenPhone}
                                    onChange={(e) => setData({ ...data, wardenPhone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 py-3 font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-all cursor-pointer border border-gray-200">Cancel</button>
                        <button onClick={handleUpdate} className="flex-[1.5] bg-teal-600 text-white py-3 rounded-lg font-semibold shadow-sm hover:bg-teal-700 transition-all active:scale-95 cursor-pointer">Update Warden</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default EditWardenModal;