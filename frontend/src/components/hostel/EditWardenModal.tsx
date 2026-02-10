import { useState, useEffect } from "react";
import { X, User, Phone } from "lucide-react";
import axios from "axios";

const EditWardenModal = ({ isOpen, onClose, hostel, onSuccess }: any) => {
    const [data, setData] = useState({ wardenName: "", wardenPhone: "" });

    useEffect(() => {
        if (hostel) setData({ wardenName: hostel.wardenName, wardenPhone: hostel.wardenPhone });
    }, [hostel, isOpen]);

    const handleUpdate = async () => {
        try {
            await axios.patch(`http://localhost:3000/api/hostel/updateWarden/${hostel.id}`, data);
            onSuccess();
            onClose();
        } catch (err) { alert("Update failed"); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">Edit Warden Info</h3>
                    <X className="cursor-pointer" onClick={onClose} />
                </div>
                <div className="space-y-4">
                    <input className="w-full p-3 border rounded-xl" value={data.wardenName} onChange={(e) => setData({...data, wardenName: e.target.value})} />
                    <input className="w-full p-3 border rounded-xl" value={data.wardenPhone} onChange={(e) => setData({...data, wardenPhone: e.target.value})} />
                    <button onClick={handleUpdate} className="w-full bg-violet-600 text-white p-3 rounded-xl font-bold">Update Warden</button>
                </div>
            </div>
        </div>
    );
};
export default EditWardenModal;