import React, { useEffect } from "react";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import type { Student, Invoice, FeeStructure } from "../../types";

interface StudentWithFees extends Student {
  invoices: (Invoice & { feeStructure: FeeStructure | null })[];
}

interface OutletContextType {
  studentData: StudentWithFees;
}

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(num);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const SuccessBanner = ({ message, onDismiss }: { message: string, onDismiss: () => void }) => {
  React.useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex justify-between items-center shadow-sm animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center">
        <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <p className="text-sm font-medium text-green-800">{message}</p>
      </div>
    </div>
  );
};

const getStatusBadge = (status: "paid" | "unpaid" | "overdue") => {
  const styles = {
    paid: "bg-green-100 text-green-800",
    unpaid: "bg-yellow-100 text-yellow-800",
    overdue: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const StatCard: React.FC<{ title: string; value: string; color?: string }> = ({
  title,
  value,
  color = "text-gray-800",
}) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <p className="text-sm font-medium text-gray-600">{title}</p>
    <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
  </div>
);

const StudentFeePage: React.FC = () => {
  const { studentData } = useOutletContext<OutletContextType>();
  const navigate = useNavigate();
  const location = useLocation();

  const activeInvoices = studentData.invoices.filter((inv) => !inv.fee?.archived);
  const archivedInvoices = studentData.invoices.filter((inv) => inv.fee?.archived);

  const totalDue = activeInvoices.reduce(
    (sum, inv) => sum + parseFloat(inv.amount as any),
    0,
  );
  const totalPaid = activeInvoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + parseFloat(inv.amount as any), 0);
  const outstandingBalance = totalDue - totalPaid;

  const dismissSuccess = () => {
    navigate(location.pathname, { replace: true, state: {} });
  };

  return (
    <div>
      {location?.state?.paymentSuccess && (
        <SuccessBanner
          message={`Payment successful! Invoice #${location.state.invoiceId} has been paid.`}
          onDismiss={dismissSuccess}
        />
      )}
      <h1 className="text-3xl font-bold text-gray-900">Fee Payment Portal</h1>
      <p className="mt-1 text-lg text-gray-600">
        Here is a summary of your account.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <StatCard
          title="Total Paid (Active)"
          value={formatCurrency(totalPaid)}
          color="text-green-600"
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(outstandingBalance)}
          color={outstandingBalance > 0 ? "text-red-600" : "text-gray-800"}
        />
      </div>

      <div className="mt-10 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Active Invoices
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Invoice ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fee Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Semester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeInvoices.length > 0 ? (
                activeInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      #{invoice.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {invoice.FeeStructure?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {invoice.semester ? invoice.semester : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {invoice.status !== "paid" && (
                        <button
                          onClick={() => {
                            if (navigate) {
                              navigate("/student/payment", {
                                state: {
                                  invoiceId: invoice.id,
                                  amount: invoice.amount,
                                  feeType: invoice.FeeStructure?.name || "Fee",
                                }
                              });
                            }
                          }}
                          className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 text-xs font-semibold"
                        >
                          Pay Now
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">
                    You have no active invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {archivedInvoices.length > 0 && (
        <div className="mt-12 bg-gray-50 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-100 flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-700">
              Archived Invoices
            </h2>
            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
              Historic Records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Invoice ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fee Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Semester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {archivedInvoices.map((invoice) => (
                  <tr key={invoice.id} className="opacity-75">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      #{invoice.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {invoice.FeeStructure?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {invoice.semester ? `S${invoice.semester}` : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs font-medium">
                        ARCHIVED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFeePage;
