import { useEffect, useState } from "react";
import { X, Receipt, CheckCircle2, Clock, Loader2, CreditCard, ArrowRight } from "lucide-react";
import axios from "axios";

const HostelLedgerModal = ({ studentId, onClose }: { studentId: number; onClose: () => void }) => {
    const [ledger, setLedger] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [markingPayment, setMarkingPayment] = useState<number | null>(null);

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

    useEffect(() => {
        fetchLedger();
    }, [studentId]);

    const handleMarkAsPaid = async (invoiceId: number) => {
        if (!window.confirm("Are you sure you want to mark this invoice as paid manually?")) return;

        setMarkingPayment(invoiceId);
        try {
            await axios.post("http://localhost:3000/api/fee/invoices/mark-paid", {
                invoiceId,
                paymentMethod: "MANUAL"
            });
            await fetchLedger();
        } catch (err) {
            console.error("Failed to mark as paid", err);
            alert("Failed to mark invoice as paid. Please try again.");
        } finally {
            setMarkingPayment(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-950/20 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl shadow-teal-200/20 border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-8 pb-4 flex justify-between items-start">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 border border-teal-100">
                            <CreditCard className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Payment Ledger</h3>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">Institutional Billing History</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-2xl hover:bg-gray-50 text-gray-400 transition-all cursor-pointer border border-transparent hover:border-gray-100">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 pt-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Retrieving records...</span>
                        </div>
                    ) : ledger.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-gray-100">
                                <Receipt className="w-10 h-10 text-gray-200" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900">No records found</h4>
                            <p className="text-gray-400 text-sm mt-1">This student has no archived transactions.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {ledger.map((inv) => (
                                <div key={inv.id} className="group relative flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[2rem] hover:border-teal-200 hover:shadow-xl hover:shadow-teal-200/20 transition-all duration-500 overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                    <div className="relative flex items-center gap-5">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'} border transition-colors group-hover:scale-110 duration-500`}>
                                            {inv.month?.charAt(0) || 'B'}
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 text-lg tracking-tight group-hover:text-teal-700 transition-colors uppercase">{inv.fee.feeType.replace(/_/g, ' ')}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{inv.month} {inv.year}</span>
                                                <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                                <span className="text-[10px] text-gray-300 font-bold uppercase tracking-tighter">REF: {inv.id}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="font-black text-xl text-gray-900 tracking-tighter group-hover:scale-110 transition-transform origin-right">₹{inv.amount}</p>
                                            <div className="flex items-center justify-end gap-2 mt-0.5">
                                                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${inv.status === 'paid' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {inv.status}
                                                </p>
                                                {inv.status !== 'paid' && (
                                                    <button
                                                        onClick={() => handleMarkAsPaid(inv.id)}
                                                        disabled={markingPayment === inv.id}
                                                        className="text-[10px] font-black text-teal-600 hover:text-white hover:bg-teal-600 px-2 py-1 rounded-lg border border-teal-100 hover:border-teal-600 transition-all cursor-pointer disabled:opacity-50 uppercase tracking-tighter"
                                                    >
                                                        {markingPayment === inv.id ? "Processing..." : "Mark Paid"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`p-3 rounded-2xl transition-all ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' : 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white'}`}>
                                            {inv.status === 'paid' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-gray-100 bg-gray-50 flex justify-center">
                    <button
                        onClick={onClose}
                        className="group flex items-center gap-3 py-3 px-8 bg-gray-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all hover:shadow-xl active:scale-95 cursor-pointer"
                    >
                        Exit Ledger
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HostelLedgerModal;