import type { FeeStructure, Invoice, Student } from "../../types";

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
interface StudentWithFees extends Student {
  invoices: (Invoice & { FeeStructure: FeeStructure | null })[];
}
export const FeeDetailsContent: React.FC<{ studentData: StudentWithFees }> = ({
  studentData,
}) => {
  const totalDue = studentData.invoices.reduce(
    (sum, inv) => sum + parseFloat(inv.amount as any),
    0,
  );
  const totalPaid = studentData.invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + parseFloat(inv.amount as any), 0);
  const outstandingBalance = totalDue - totalPaid;
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Fee Payment Portal</h1>
      <p className="mt-1 text-lg text-gray-600">
        Here is a summary of your account.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <StatCard title="Total Due Amount" value={formatCurrency(totalDue)} />
        <StatCard
          title="Total Paid"
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
            Invoice History
          </h2>
        </div>
        <div
          className="overflow-x-auto overflow-y-visible"
          style={{ overflowY: "visible" }}
        >
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
              {studentData.invoices.length > 0 ? (
                studentData.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      #{invoice.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      <div>{invoice.FeeStructure?.name || "N/A"}</div>
                      {invoice.FeeStructure?.fineEnabled &&
                        invoice.status !== "paid" && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Late fine applicable
                            </span>
                          </div>
                        )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <div>{formatCurrency(invoice.amount)}</div>
                      {Number(invoice.fineAmount) > 0 && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                              />
                            </svg>
                            Fine: {formatCurrency(invoice.fineAmount)}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(invoice.status)}
                        {invoice.FeeStructure?.fineEnabled && (
                          <div className="group relative">
                            <span className="cursor-help text-amber-500 hover:text-amber-600">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </span>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 hidden group-hover:block z-[100] shadow-2xl ring-1 ring-white/10">
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0 border-4 border-transparent border-b-gray-900"></div>
                              <p className="font-semibold mb-2">
                                Fine Information
                              </p>
                              {invoice.FeeStructure?.fineSlabs &&
                                invoice.FeeStructure.fineSlabs.length > 0 && (
                                  <div className="mb-2">
                                    <p className="text-gray-400 mb-1">
                                      Fine rules (after due date):
                                    </p>
                                    {invoice.FeeStructure.fineSlabs.map(
                                      (slab, i) => (
                                        <div
                                          key={i}
                                          className="flex justify-between text-gray-300"
                                        >
                                          <span>
                                            Day {slab.startDay}
                                            {slab.endDay
                                              ? `–${slab.endDay}`
                                              : "+"}
                                            :
                                          </span>
                                          <span>
                                            {formatCurrency(slab.amountPerDay)}
                                            /day
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              {Number(invoice.fineAmount) > 0 && (
                                <div className="border-t border-gray-600 pt-1.5 space-y-1">
                                  <div className="flex justify-between">
                                    <span>Base Fee:</span>
                                    <span>
                                      {formatCurrency(invoice.baseAmount ?? 0)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-red-300">
                                    <span>Accumulated Fine:</span>
                                    <span>
                                      +{formatCurrency(invoice.fineAmount)}
                                    </span>
                                  </div>
                                  <div className="border-t border-gray-600 pt-1 flex justify-between font-semibold">
                                    <span>Total:</span>
                                    <span>
                                      {formatCurrency(invoice.amount)}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {Number(invoice.fineAmount) === 0 && (
                                <p className="text-gray-400 italic">
                                  No fine charged yet.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {invoice.semester ? invoice.semester : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {invoice.status !== "paid" && (
                        <button className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 text-xs font-semibold">
                          Pay Now
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">
                    You have no invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
