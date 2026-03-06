import { X, CheckCircle2, Clock, Users } from "lucide-react";

interface ExportPdfModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (filterType: 'all' | 'paid' | 'unpaid') => void;
}

const ExportPdfModal = ({ isOpen, onClose, onExport }: ExportPdfModalProps) => {
    if (!isOpen) return null;

    const options = [
        {
            id: 'all',
            label: 'All Students',
            description: 'Include every resident in the current report.',
            icon: Users,
            color: 'text-gray-600',
            bg: 'bg-gray-50'
        },
        {
            id: 'paid',
            label: 'Paid Students Only',
            description: 'Only include residents who have cleared their dues.',
            icon: CheckCircle2,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        {
            id: 'unpaid',
            label: 'Unpaid Students Only',
            description: 'Focus on residents with outstanding payments.',
            icon: Clock,
            color: 'text-rose-600',
            bg: 'bg-rose-50'
        }
    ];

    return (
        <div className="fixed inset-0 bg-gray-950/20 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 pt-8 pb-4 flex justify-between items-start border-b border-gray-50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Export PDF Report</h2>
                        <p className="text-gray-500 text-xs mt-1 uppercase font-bold tracking-widest">Select data inclusion criteria</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-all cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-4">
                    <div className="grid gap-3">
                        {options.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => onExport(option.id as any)}
                                className="group flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-teal-200 hover:bg-teal-50/30 transition-all text-left cursor-pointer active:scale-[0.98]"
                            >
                                <div className={`w-10 h-10 rounded-lg ${option.bg} ${option.color} flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors`}>
                                    <option.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{option.label}</p>
                                    <p className="text-xs text-gray-400 mt-0.5 font-medium">{option.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 pb-8 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-gray-400 hover:bg-gray-50 border border-gray-100 transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportPdfModal;
