import { Building2, Phone, User, Users } from "lucide-react";
import type { Hostel } from "./HostelPage";

interface Props {
    hostel: Hostel;
    onClick: () => void;
}

const HostelCard = ({ hostel, onClick }: Props) => {
    return (
        <div
            onClick={onClick}
            className="bg-white border border-zinc-200 rounded-xl p-6 cursor-pointer hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100/50 transition-all group"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                    <Building2 className="w-6 h-6 text-violet-600" />
                </div>
                <div className="px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                    <span className="text-sm font-medium text-emerald-700 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {hostel._count.students}
                    </span>
                </div>
            </div>

            {/* Hostel Name */}
            <h3 className="text-lg font-semibold text-zinc-900 mb-3 group-hover:text-violet-700 transition-colors">
                {hostel.name}
            </h3>

            {/* Warden Info */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-zinc-500">
                    <User className="w-4 h-4" />
                    <span className="text-sm">{hostel.wardenName}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{hostel.wardenPhone}</span>
                </div>
            </div>

            {/* View Residents Link */}
            <div className="mt-4 pt-4 border-t border-zinc-100">
                <span className="text-sm font-medium text-violet-600 group-hover:text-violet-700 transition-colors">
                    View Residents →
                </span>
            </div>
        </div>
    );
};

export default HostelCard;
