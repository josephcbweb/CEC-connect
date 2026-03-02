import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CreditCard, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import axios from "axios";

interface PaymentLocationState {
    invoiceId: number;
    amount: number;
    feeType: string;
}

const PaymentPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("Credit Card");

    // Try mapping state safely
    const state = location.state as PaymentLocationState | null;

    // Protect the route in case it's hit without state setup
    useEffect(() => {
        if (!state?.invoiceId) {
            navigate(-1);
        }
    }, [state, navigate]);

    if (!state) return null;

    const handlePayment = async () => {
        setLoading(true);
        try {
            await axios.post("http://localhost:3000/fee/invoices/mark-paid", {
                invoiceId: state.invoiceId,
                paymentMethod: paymentMethod,
            });

            // Artificial delay for authentic simulation feels
            setTimeout(() => {
                navigate("/student/fees", {
                    state: { paymentSuccess: true, invoiceId: state.invoiceId },
                    replace: true
                });
            }, 1000);

        } catch (error) {
            console.error("Payment failed", error);
            alert("Payment simulation failed. Please try again.");
            setLoading(false);
        }
    };

    const formatCurrency = (amt: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(amt);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center text-teal-600">
                    <ShieldCheck className="w-12 h-12" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Secure Payment Gateway
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Complete your payment for {state.feeType}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">

                    <div className="mb-6 pb-6 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-500 text-center">Amount to Pay</p>
                        <p className="text-4xl font-bold text-gray-900 text-center mt-1">
                            {formatCurrency(state.amount)}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Payment Method
                            </label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
                            >
                                <option value="Credit Card">Credit / Debit Card</option>
                                <option value="UPI">UPI</option>
                                <option value="Net Banking">Net Banking</option>
                            </select>
                        </div>

                        {paymentMethod === "Credit Card" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Card Number</label>
                                    <input type="text" placeholder="0000 0000 0000 0000" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Expiry (MM/YY)</label>
                                        <input type="text" placeholder="12/25" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">CVV</label>
                                        <input type="text" placeholder="123" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Cardholder Name</label>
                                    <input type="text" placeholder="Name on card" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" />
                                </div>
                            </div>
                        )}

                        {paymentMethod === "UPI" && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 py-4">
                                <label className="block text-sm font-medium text-gray-700">UPI ID</label>
                                <input type="text" placeholder="username@upi" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" />
                            </div>
                        )}

                        <button
                            onClick={handlePayment}
                            disabled={loading}
                            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-teal-400 cursor-wait' : 'bg-teal-600 hover:bg-teal-700'
                                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing Payment...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5 mr-2" /> Pay {formatCurrency(state.amount)}
                                </>
                            )}
                        </button>
                        <div className="mt-4 flex items-center justify-center text-xs text-gray-500 gap-1.5 hover:text-gray-700 cursor-pointer transition-colors" onClick={() => navigate(-1)}>
                            Go back to portal
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
