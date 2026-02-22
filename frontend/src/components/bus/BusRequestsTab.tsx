import React, { useEffect, useState } from "react";
import axios from "axios";
import { Check, X, Loader2, AlertCircle } from "lucide-react";

interface BusRequestsTabProps {
    onActionSuccess?: () => void;
}

interface BusRequest {
    id: number;
    student: {
        id: number;
        name: string;
        admission_number: string;
        department: { name: string };
    };
    bus: {
        busName: string;
        busNumber: string;
    };
    busStop: {
        stopName: string;
        feeAmount: number;
    };
    createdAt: string;
}

const BusRequestsTab:React.FC<BusRequestsTabProps>= ({ onActionSuccess }) => {
    const [requests, setRequests] = useState<BusRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchRequests = async () => {
        try {
            const res = await axios.get("http://localhost:3000/bus/requests");
            setRequests(res.data);
        } catch (err) {
            console.error("Failed to fetch requests", err);
            setError("Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (requestId: number, action: "approved" | "rejected") => {
        setProcessingId(requestId);
        try {
            await axios.patch(`http://localhost:3000/bus/requests/${requestId}`, { status: action });
            // Remove from list locally for instant feedback
            setRequests(prev => prev.filter(r => r.id !== requestId));
            if (onActionSuccess) {
                onActionSuccess();
            }
        } catch (err) {
            console.error(`Failed to ${action} request`, err);
            alert(`Failed to ${action} request`);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-gray-400" /></div>;

    if (error) return <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2"><AlertCircle className="w-5 h-5" /> {error}</div>;

    return (
        <div className="bg-white rounded-xl overflow-hidden min-h-[400px]">
            {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <p className="text-lg">No pending requests</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600">Student</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Department</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Requested Route</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Stop & Fee</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {requests.map((request) => (
                                <tr key={request.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{request.student.name}</div>
                                        <div className="text-sm text-gray-400">{request.student.admission_number}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{request.student.department.name}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-900">{request.bus.busNumber}</div>
                                        <div className="text-xs text-gray-400">{request.bus.busName}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-900">{request.busStop.stopName}</div>
                                        <div className="text-xs font-medium text-[#009689]">₹{request.busStop.feeAmount}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleAction(request.id, "approved")}
                                                disabled={processingId === request.id}
                                                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                                                title="Approve"
                                            >
                                                {processingId === request.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                            </button>
                                            <button
                                                onClick={() => handleAction(request.id, "rejected")}
                                                disabled={processingId === request.id}
                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                                title="Reject"
                                            >
                                                {processingId === request.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default BusRequestsTab;
