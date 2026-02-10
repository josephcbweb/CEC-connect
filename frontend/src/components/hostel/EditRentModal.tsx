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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-zinc-900">Update Monthly Rent</h3>
                    <X className="cursor-pointer text-zinc-400" onClick={onClose} />
                </div>
                <div className="space-y-4">
                    <div className="relative">
                        <IndianRupee className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
                        <input type="number" className="w-full pl-10 p-3 border rounded-xl font-bold text-xl" value={rent} onChange={(e) => setRent(e.target.value)} />
                    </div>
                    <button onClick={handleUpdate} className="w-full bg-emerald-600 text-white p-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors">Confirm New Rent</button>
                </div>
            </div>
        </div>
    );
};
export default EditRentModal;