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
            const token = localStorage.getItem("authToken");
            await axios.post("http://localhost:3000/fee/invoices/mark-paid", {
                invoiceId,
                paymentMethod: "MANUAL"
            }, {
                headers: { Authorization: `Bearer ${token}` },
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
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(6px)" }}
        >
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl border border-slate-200 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 border border-teal-100 shrink-0">
                            <CreditCard className="w-4.5 h-4.5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 tracking-tight">Payment Ledger</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Billing history for this student</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-7 py-5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                            <span className="text-xs text-slate-400">Retrieving records...</span>
                        </div>
                    ) : ledger.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                                <Receipt className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-sm font-medium text-slate-700">No records found</p>
                            <p className="text-xs text-slate-400">This student has no archived transactions.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {ledger.map((inv) => (
                                <div
                                    key={inv.id}
                                    className="flex items-center justify-between px-5 py-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                                >
                                    {/* Left: icon + details */}
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border shrink-0 ${
                                            inv.status === 'paid'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : 'bg-rose-50 text-rose-500 border-rose-100'
                                        }`}>
                                            {inv.month?.charAt(0) || 'B'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {inv.fee.feeType.replace(/_/g, ' ')}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-slate-400">{inv.month} {inv.year}</span>
                                                <span className="text-slate-200">·</span>
                                                <span className="text-xs text-slate-300">REF: {inv.id}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: amount + status */}
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-800">₹{inv.amount}</p>
                                            <p className={`text-xs font-medium mt-0.5 ${
                                                inv.status === 'paid' ? 'text-emerald-500' : 'text-rose-500'
                                            }`}>
                                                {inv.status === 'paid' ? 'Paid' : 'Unpaid'}
                                            </p>
                                        </div>

                                        {inv.status !== 'paid' ? (
                                            <button
                                                onClick={() => handleMarkAsPaid(inv.id)}
                                                disabled={markingPayment === inv.id}
                                                className="text-xs font-semibold text-teal-600 hover:text-white hover:bg-teal-600 px-3 py-1.5 rounded-lg border border-teal-200 hover:border-teal-600 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                                            >
                                                {markingPayment === inv.id ? "Processing..." : "Mark Paid"}
                                            </button>
                                        ) : (
                                            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-500 border border-emerald-100">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end px-7 py-5 border-t border-slate-100 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        Close
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HostelLedgerModal;