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
            description: 'Include every student in the selected program and semester.',
            icon: Users,
            color: 'text-violet-600',
            bg: 'bg-violet-50'
        },
        {
            id: 'paid',
            label: 'Paid Students Only',
            description: 'Only include students who have cleared their bus fees.',
            icon: CheckCircle2,
            color: 'text-green-600',
            bg: 'bg-green-50'
        },
        {
            id: 'unpaid',
            label: 'Unpaid Students Only',
            description: 'Focus on students with outstanding bus fee payments.',
            icon: Clock,
            color: 'text-orange-600',
            bg: 'bg-orange-50'
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 pt-8 pb-4 flex justify-between items-start border-b border-gray-50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Export Bus Fee Report</h2>
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
                                className="group flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all text-left cursor-pointer active:scale-[0.98]"
                            >
                                <div className={`w-10 h-10 rounded-lg ${option.bg} ${option.color} flex items-center justify-center shrink-0 group-hover:bg-[#4134bd] group-hover:text-white transition-colors`}>
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
