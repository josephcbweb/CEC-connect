import { useEffect, useState } from "react";
import { X, CreditCard, CheckCircle2, Clock ,Loader2} from "lucide-react";
import axios from "axios";

const HostelLedgerModal = ({ studentId, onClose }: { studentId: number; onClose: () => void }) => {
    const [ledger, setLedger] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLedger = async () => {
            try {
                const res = await axios.get(`http://localhost:3000/api/hostel/ledger/${studentId}`);
                setLedger(res.data.data);
            } catch (err) {
                console.error("Ledger fetch failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLedger();
    }, [studentId]);

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-violet-600" /> Payment History
                    </h3>
                    <X className="cursor-pointer text-zinc-400" onClick={onClose} />
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-zinc-300" /></div>
                    ) : ledger.length === 0 ? (
                        <p className="text-center text-zinc-400 py-10">No payment records found.</p>
                    ) : (
                        <div className="space-y-3">
                            {ledger.map((inv) => (
                                <div key={inv.id} className="flex items-center justify-between p-4 border rounded-xl">
                                    <div>
                                        <p className="font-bold text-zinc-900">{inv.fee.feeType.replace(/_/g, ' ')}</p>
                                        <p className="text-xs text-zinc-500">ID: {inv.id}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-bold">₹{inv.amount}</p>
                                            <p className={`text-[10px] font-bold uppercase ${inv.status === 'paid' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {inv.status}
                                            </p>
                                        </div>
                                        {inv.status === 'paid' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Clock className="w-5 h-5 text-red-400" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HostelLedgerModal;