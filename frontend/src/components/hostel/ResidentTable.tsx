import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import type { Resident } from "./HostelPage";

interface Props {
    residents: Resident[];
    loading: boolean;
}

const ResidentTable = ({ residents, loading }: Props) => {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredResidents = residents.filter((resident) =>
        resident.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resident.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resident.phone?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="bg-white border border-zinc-200 rounded-xl p-12 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mx-auto mb-3" />
                    <p className="text-zinc-500">Loading residents...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            {/* Search Bar */}
            <div className="p-4 border-b border-zinc-200">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search by name, class, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg focus:border-zinc-400 focus:outline-none transition-colors placeholder:text-zinc-400"
                    />
                </div>
            </div>

            {/* Table */}
            {residents.length === 0 ? (
                <div className="p-12 text-center">
                    <p className="text-zinc-400 text-lg">No students assigned to this hostel</p>
                </div>
            ) : filteredResidents.length === 0 ? (
                <div className="p-12 text-center">
                    <p className="text-zinc-400 text-lg">No matching students found</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-zinc-50">
                                <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-600">Name</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-600">Class</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-600">Semester</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-600">Phone</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-zinc-100">
                            {filteredResidents.map((resident) => (
                                <tr key={resident.id} className="hover:bg-zinc-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-zinc-900">{resident.name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-zinc-600">{resident.className}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-zinc-600">Sem {resident.semester}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-zinc-600">{resident.phone || "—"}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Footer */}
            {residents.length > 0 && (
                <div className="px-6 py-3 border-t border-zinc-200 bg-zinc-50">
                    <p className="text-sm text-zinc-500">
                        Showing {filteredResidents.length} of {residents.length} students
                    </p>
                </div>
            )}
        </div>
    );
};

export default ResidentTable;
