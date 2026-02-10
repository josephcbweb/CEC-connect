import { useEffect, useState } from "react";
import { Loader2, Plus, ArrowLeft, UserPlus } from "lucide-react";
import axios from "axios";

import HostelCard from "./HostelCard";
import ResidentTable from "./ResidentTable";
import AddHostelModal from "./AddHostelModal";
import AssignStudentModal from "./AssignStudentModal";

export interface Hostel {
    id: number;
    name: string;
    wardenName: string;
    wardenPhone: string;
    _count: {
        students: number;
    };
}

export interface Resident {
    id: number;
    name: string;
    phone: string;
    semester: number;
    className: string;
}

const HostelPage = () => {
    const [hostels, setHostels] = useState<Hostel[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
    const [residents, setResidents] = useState<Resident[]>([]);
    const [residentsLoading, setResidentsLoading] = useState(false);

    // Modal States
    const [isAddHostelModalOpen, setIsAddHostelModalOpen] = useState(false);
    const [isAssignStudentModalOpen, setIsAssignStudentModalOpen] = useState(false);

    const fetchHostels = async () => {
        try {
            setLoading(true);
            const res = await axios.get("http://localhost:3000/api/hostel/fetchHostels");
            setHostels(res.data.data);
        } catch (error) {
            console.error("Failed to fetch hostels", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchResidents = async (hostelId: number) => {
        try {
            setResidentsLoading(true);
            const res = await axios.get(`http://localhost:3000/api/hostel/fetchStudents/${hostelId}`);
            setResidents(res.data.students);
        } catch (error) {
            console.error("Failed to fetch residents", error);
            setResidents([]);
        } finally {
            setResidentsLoading(false);
        }
    };

    useEffect(() => {
        fetchHostels();
    }, []);

    const handleHostelClick = (hostel: Hostel) => {
        setSelectedHostel(hostel);
        fetchResidents(hostel.id);
    };

    const handleBackToHostels = () => {
        setSelectedHostel(null);
        setResidents([]);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
                    <p className="text-zinc-500 font-medium">Loading Hostels...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 bg-zinc-50">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            {selectedHostel ? (
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handleBackToHostels}
                                        className="p-2 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
                                    >
                                        <ArrowLeft className="w-5 h-5 text-zinc-600" />
                                    </button>
                                    <div>
                                        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">
                                            {selectedHostel.name}
                                        </h2>
                                        <p className="text-zinc-500 mt-1">
                                            Warden: {selectedHostel.wardenName} • {selectedHostel.wardenPhone}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">
                                        Hostel Management
                                    </h2>
                                    <p className="text-zinc-500 mt-1">
                                        Manage student accommodation and hostel assignments
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            {selectedHostel && (
                                <button
                                    className="py-2.5 px-5 bg-violet-600 text-white flex items-center gap-2 cursor-pointer font-medium rounded-lg hover:bg-violet-700 transition-all shadow-sm"
                                    onClick={() => setIsAssignStudentModalOpen(true)}
                                >
                                    <UserPlus className="w-4 h-4" /> Assign Student
                                </button>
                            )}
                            {!selectedHostel && (
                                <button
                                    className="py-2.5 px-5 bg-violet-600 text-white flex items-center gap-2 cursor-pointer font-medium rounded-lg hover:bg-violet-700 transition-all shadow-sm"
                                    onClick={() => setIsAddHostelModalOpen(true)}
                                >
                                    <Plus className="w-4 h-4" /> Add Hostel
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                {selectedHostel ? (
                    <ResidentTable residents={residents} loading={residentsLoading} />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {hostels.length === 0 ? (
                            <div className="col-span-full text-center py-16">
                                <p className="text-zinc-400 text-lg">No hostels found. Add your first hostel.</p>
                            </div>
                        ) : (
                            hostels.map((hostel) => (
                                <HostelCard
                                    key={hostel.id}
                                    hostel={hostel}
                                    onClick={() => handleHostelClick(hostel)}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <AddHostelModal
                isOpen={isAddHostelModalOpen}
                onClose={() => setIsAddHostelModalOpen(false)}
                onSuccess={() => {
                    fetchHostels();
                    setIsAddHostelModalOpen(false);
                }}
            />

            <AssignStudentModal
                isOpen={isAssignStudentModalOpen}
                onClose={() => setIsAssignStudentModalOpen(false)}
                hostels={hostels}
                selectedHostelId={selectedHostel?.id}
                onSuccess={() => {
                    if (selectedHostel) {
                        fetchResidents(selectedHostel.id);
                        fetchHostels();
                    }
                    setIsAssignStudentModalOpen(false);
                }}
            />
        </div>
    );
};

export default HostelPage;
