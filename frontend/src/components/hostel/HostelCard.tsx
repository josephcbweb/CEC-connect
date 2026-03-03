import { Building2, ArrowRight } from "lucide-react";
import type { Hostel } from "./types";

interface Props {
    hostel: Hostel;
    onClick: () => void;
}

const HostelCard = ({ hostel, onClick }: Props) => {
    return (
        <div
            onClick={onClick}
            className="group relative bg-white border border-zinc-100 rounded-3xl p-6 cursor-pointer hover:border-violet-200 hover:shadow-2xl hover:shadow-violet-200/20 transition-all duration-500 overflow-hidden"
        >
            {/* Soft decorative background glow on hover */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-violet-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center group-hover:bg-violet-600 group-hover:border-violet-600 group-hover:shadow-lg group-hover:shadow-violet-200 transition-all duration-500">
                        <Building2 className="w-7 h-7 text-zinc-400 group-hover:text-white transition-colors duration-500" />
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Residents</span>
                        <div className="px-3 py-1 bg-violet-50 text-violet-600 rounded-full text-xs font-bold border border-violet-100 group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600 transition-all duration-500">
                            {hostel._count.students}
                        </div>
                    </div>
                </div>

                {/* Hostel Name */}
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-zinc-900 group-hover:text-violet-700 transition-colors duration-300">
                        {hostel.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Status</span>
                    </div>
                </div>

                {/* Info Container */}
                <div className="mt-auto grid grid-cols-2 gap-4 pt-6 border-t border-zinc-50">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Warden</p>
                        <p className="text-sm font-semibold text-zinc-700 truncate">{hostel.wardenName}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Monthly Rent</p>
                        <p className="text-sm font-black text-violet-600">₹{hostel.monthlyRent}</p>
                    </div>
                </div>

                {/* Clean footer arrow that slides in */}
                <div className="mt-6 flex items-center gap-2 text-violet-600 font-bold text-xs uppercase tracking-tighter transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    Manage Residents
                    <ArrowRight className="w-3.5 h-3.5" />
                </div>
            </div>
        </div>
    );
};

export default HostelCard;
