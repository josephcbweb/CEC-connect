import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
    Search,
    Download,
    RotateCcw,
    ArrowLeft,
    Receipt,
    AlertCircle,
    CheckCircle2,
    Clock,
    Users,
    Loader2
} from "lucide-react";
import axios from "axios";
import { usePageTitle } from "../../hooks/usePageTitle";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import GenerateBillsModal from "./GenerateBillsModal";
import HostelLedgerModal from "./HostelLedgerModal";
import ExportPdfModal from "./ExportPdfModal";

interface Resident {
    id: number;
    name: string;
    phone: string;
    admissionNo: string | null;
    semester: number;
    className: string;
    paymentStatus: 'paid' | 'unpaid' | 'not_generated' | null;
    amount: number | null;
    invoiceId: number | null;
}

const HostelFeePage = () => {
    usePageTitle("Hostel & Utility Fees");
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const hostelId = searchParams.get("id");

    // Data States
    const [residents, setResidents] = useState<Resident[]>([]);
    const [loading, setLoading] = useState(true);
    const [hostelName, setHostelName] = useState("");
    const [metadata, setMetadata] = useState<any>(null);

    // Filter States
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [statusFilter, setStatusFilter] = useState("all");

    // Modal States
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedStudentIds(filteredResidents.map(r => r.id));
        } else {
            setSelectedStudentIds([]);
        }
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedStudentIds(prev => [...prev, id]);
        } else {
            setSelectedStudentIds(prev => prev.filter(studentId => studentId !== id));
        }
    };

    const months = [
        "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
    ];

    const fetchHostelData = async () => {
        if (!hostelId) return;
        try {
            setLoading(true);
            const res = await axios.get(
                `http://localhost:3000/api/hostel/fetchStudents/${hostelId}`,
                {
                    params: {
                        month: selectedMonth || undefined,
                        year: selectedYear || undefined
                    }
                }
            );
            setResidents(res.data.students);
            setHostelName(res.data.hostelName);
            setMetadata(res.data.metadata);
        } catch (error) {
            console.error("Failed to fetch hostel data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHostelData();
    }, [hostelId, selectedMonth, selectedYear]);

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedMonth("");
        setSelectedYear(new Date().getFullYear().toString());
        setStatusFilter("all");
    };

    const filteredResidents = useMemo(() => {
        return residents.filter(resident => {
            const matchesSearch = resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                resident.id.toString().includes(searchTerm);

            const matchesStatus = statusFilter === "all" ||
                (statusFilter === "paid" && resident.paymentStatus === "paid") ||
                (statusFilter === "unpaid" && resident.paymentStatus === "unpaid");

            return matchesSearch && matchesStatus;
        });
    }, [residents, searchTerm, statusFilter]);

    const handleExportPDF = (filterType: 'all' | 'paid' | 'unpaid') => {
        if (!selectedMonth || !selectedYear) {
            alert("Please select a month and year to export the PDF.");
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(18);
        doc.setTextColor(13, 148, 136); // Teal 600
        doc.text(`Hostel Fee Report: ${hostelName}`, pageWidth / 2, 20, { align: "center" });

        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128); // Gray 500
        const period = selectedMonth ? `${selectedMonth} ${selectedYear}` : "All Records";
        const filterLabel = filterType === 'all' ? 'All Residents' : (filterType === 'paid' ? 'Paid Residents Only' : 'Unpaid Residents Only');
        doc.text(`Reporting Period: ${period} | Filter: ${filterLabel}`, pageWidth / 2, 28, { align: "center" });

        // Filter based on the selected criteria
        const residentsToExport = residents.filter(resident => {
            const matchesSearch = resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                resident.id.toString().includes(searchTerm);

            const matchesStatus = filterType === "all" ||
                (filterType === "paid" && resident.paymentStatus === "paid") ||
                (filterType === "unpaid" && resident.paymentStatus === "unpaid");

            return matchesSearch && matchesStatus;
        });

        const tableData = residentsToExport.map((r, index) => [
            index + 1,
            r.name,
            r.admissionNo || r.id.toString(),
            r.className,
            r.amount ? `INR ${r.amount}` : "N/A",
            r.paymentStatus?.toUpperCase().replace('_', ' ') || "PENDING"
        ]);

        autoTable(doc, {
            startY: 35,
            head: [["S.No", "Name", "Admission No.", "Class", "Amount", "Status"]],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [13, 148, 136] },
            styles: { fontSize: 9 }
        });

        doc.save(`${hostelName}_Fees_${filterType}_${period.replace(' ', '_')}.pdf`);
        setIsExportModalOpen(false);
    };

    if (!hostelId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
                <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900">No Hostel Selected</h2>
                <p className="text-gray-500 mt-2 max-w-sm">Please select a hostel from the management page to view fee details.</p>
                <button
                    onClick={() => navigate('/admin/hostel')}
                    className="mt-6 px-6 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-all flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Hostels
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 bg-gray-50/50">
            <div className="max-w-7xl mx-auto">
                {/* Breadcrumbs & Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-teal-600 hover:border-teal-100 hover:shadow-sm transition-all cursor-pointer group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{hostelName}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                {/* <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Financial Settlement Engine</span>
                                <div className="w-1 h-1 bg-teal-300 rounded-full" />
                                <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">v2.0 Beta</span> */}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsExportModalOpen(true)}
                            disabled={!selectedMonth || !selectedYear}
                            title={!selectedMonth || !selectedYear ? "Please select a month and year to export" : "Export PDF report"}
                            className={`flex items-center gap-2 px-5 py-2.5 font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm focus:outline-none ${!selectedMonth || !selectedYear
                                    ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60"
                                    : "bg-white border border-gray-300 text-gray-600 hover:border-teal-200 hover:text-teal-700 hover:shadow-md cursor-pointer active:scale-95"
                                }`}
                        >
                            <Download className="w-4 h-4" />
                            Export PDF
                        </button>
                        <button
                            onClick={() => setIsAssignModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 active:scale-95 cursor-pointer"
                        >
                            <Receipt className="w-4 h-4" />
                            Assign Fee {selectedStudentIds.length > 0 ? `(${selectedStudentIds.length})` : ""}
                        </button>
                    </div>
                </div>

                {/* Filters Panel */}
                <div className="mb-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className="relative group lg:col-span-2">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-teal-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search resident by name or ID..."
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:border-teal-200 focus:ring-4 focus:ring-teal-500/5 transition-all outline-none font-semibold text-gray-700 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <select
                            className="px-4 py-3 bg-white border border-gray-300 rounded-xl focus:border-teal-200 outline-none font-bold text-xs uppercase tracking-wide text-gray-600 shadow-sm cursor-pointer appearance-none text-center"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                            <option value="">Choose Month</option>
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <input
                            type="number"
                            className="px-4 py-3 bg-white border border-gray-300 rounded-xl focus:border-teal-200 outline-none font-bold text-xs uppercase tracking-wide text-gray-600 shadow-sm text-center"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2">
                        <select
                            className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl focus:border-teal-200 outline-none font-bold text-xs uppercase tracking-wide text-gray-600 shadow-sm cursor-pointer appearance-none text-center"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="paid">Paid</option>
                            <option value="unpaid">Unpaid</option>
                        </select>
                        <button
                            onClick={clearFilters}
                            className="p-3 bg-white border border-gray-300 text-gray-500 hover:text-red-500 hover:border-red-100 hover:bg-red-50 rounded-2xl transition-all shadow-sm cursor-pointer"
                            title="Clear all filters"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Invoice Generator Warning */}
                {selectedMonth && metadata && !metadata.invoicesGenerated && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-amber-900 text-sm">Action Required: Billing Cycle Missing</h4>
                            <p className="text-amber-700 text-xs mt-0.5">No invoices have been generated for <strong>{selectedMonth} {selectedYear}</strong>. Resident statuses will appear as "Pending Generation".</p>
                        </div>
                        <button
                            onClick={() => setIsAssignModalOpen(true)}
                            className="ml-auto px-4 py-2 bg-white border border-amber-200 text-amber-600 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                        >
                            Initialize Billing Now
                        </button>
                    </div>
                )}

                {/* Results Table */}
                <div className="bg-white rounded-xl border border-gray-300 shadow-xl shadow-teal-900/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-5 text-center w-16">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded-lg border-gray-200 text-teal-600 focus:ring-teal-500/20 focus:ring-4 transition-all cursor-pointer bg-white"
                                            checked={filteredResidents.length > 0 && selectedStudentIds.length === filteredResidents.length}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                        />
                                    </th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Resident Details</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Class|Sem</th>
                                    {/* <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Settlement Period</th> */}
                                    <th className="px-6 py-5 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">Amount</th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-32 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">Synchronizing Ledgers...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredResidents.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-32 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-200 border border-gray-100">
                                                    <Users className="w-8 h-8" />
                                                </div>
                                                <h4 className="text-xl font-bold text-gray-900">No matches found</h4>
                                                <p className="text-gray-400 text-sm max-w-sm">No residents found matching your current search or filter criteria for this period.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredResidents.map(resident => (
                                        <tr key={resident.id} className="group hover:bg-teal-50/20 transition-all duration-300">
                                            <td className="px-6 py-5 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded-lg border-gray-200 text-teal-600 focus:ring-teal-500/20 focus:ring-4 transition-all cursor-pointer bg-white"
                                                    checked={selectedStudentIds.includes(resident.id)}
                                                    onChange={(e) => handleSelectOne(resident.id, e.target.checked)}
                                                />
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
                                                        {resident.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 leading-none mb-1 group-hover:text-teal-700 transition-colors uppercase">{resident.name}</p>
                                                        <p className="text-[10px] font-black text-gray-400 tracking-tighter uppercase">ID: {resident.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-black rounded-lg border border-gray-100 uppercase tracking-widest">
                                                    {resident.className} | S{resident.semester}
                                                </span>
                                            </td>
                                            {/* <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-700 capitalize">{selectedMonth || "All Time"}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold tracking-widest">{selectedMonth ? selectedYear : "General Overview"}</span>
                                                </div>
                                            </td> */}
                                            <td className="px-6 py-5 text-center">
                                                <p className="text-base font-black text-gray-900 tracking-tighter">
                                                    {resident.amount ? `₹${Number(resident.amount).toLocaleString('en-IN')}` : "—"}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${resident.paymentStatus === 'paid'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : resident.paymentStatus === 'unpaid'
                                                        ? 'bg-rose-50 text-rose-600 border-rose-100'
                                                        : 'bg-gray-50 text-gray-400 border-gray-100'
                                                    }`}>
                                                    {resident.paymentStatus === 'paid' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                                                        resident.paymentStatus === 'unpaid' ? <Clock className="w-3.5 h-3.5" /> :
                                                            <AlertCircle className="w-3.5 h-3.5" />}
                                                    <span className="text-[8px] font-black uppercase tracking-widest leading-none">
                                                        {resident.paymentStatus?.replace('_', ' ') || "PENDING"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    onClick={() => setSelectedStudentId(resident.id)}
                                                    className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-teal-600 hover:text-white transition-all cursor-pointer border border-gray-100 hover:border-teal-600 shadow-sm"
                                                    title="View Digital Ledger"
                                                >
                                                    <Receipt className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isAssignModalOpen && (
                <GenerateBillsModal
                    isOpen={isAssignModalOpen}
                    onClose={() => setIsAssignModalOpen(false)}
                    onSuccess={(msg) => {
                        alert(msg);
                        setSelectedStudentIds([]);
                        fetchHostelData();
                    }}
                    selectedStudentIds={selectedStudentIds}
                />
            )}

            {selectedStudentId && (
                <HostelLedgerModal
                    studentId={selectedStudentId}
                    onClose={() => setSelectedStudentId(null)}
                />
            )}
            {isExportModalOpen && (
                <ExportPdfModal
                    isOpen={isExportModalOpen}
                    onClose={() => setIsExportModalOpen(false)}
                    onExport={handleExportPDF}
                />
            )}
        </div>
    );
};

export default HostelFeePage;
