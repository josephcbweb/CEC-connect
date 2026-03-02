import { useParams, useNavigate } from "react-router-dom";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Calendar,
  Phone,
  MapPin,
  CreditCard,
  Award,
  School,
  Users,
  BookOpen,
  Droplets,
  Globe,
  Building,
  GraduationCap,
  Shield,
  Home,
  ArrowLeft,
} from "lucide-react";

const baseURL = "http://localhost:3000";

const StudentDetails = () => {
  usePageTitle("Student Details");
  const { id } = useParams();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const res = await fetch(`${baseURL}/admin/students/${id}`);
        const data = await res.json();
        setStudent(data);
      } catch (error) {
        console.error("Failed to fetch student details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
          <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Student Not Found</h2>
          <p className="text-slate-500 mb-6">The requested student details could not be loaded or do not exist.</p>
          <button 
            onClick={() => navigate(-1)} 
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { personalDetails, academicDetails, bankDetails } = student;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{personalDetails.name}</h1>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Student Profile Overview</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md text-xs font-semibold border border-indigo-100">
              {personalDetails.program}
            </span>
            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-xs font-semibold border border-slate-200">
              {personalDetails.department}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Personal Details Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-blue-100 bg-blue-50/50">
              <h2 className="text-sm font-bold text-blue-800 flex items-center gap-2 uppercase tracking-wide">
                <User className="h-4 w-4 text-blue-500/70" /> Personal Information
              </h2>
            </div>
            <div className="p-6 space-y-1">
              <DetailItem icon={<Mail />} label="Email" value={personalDetails.email} />
              <DetailItem 
                icon={<Calendar />} 
                label="Date of Birth" 
                value={new Date(personalDetails.dateOfBirth).toLocaleDateString()} 
              />
              <DetailItem icon={<User />} label="Gender" value={personalDetails.gender} />
              <DetailItem icon={<Droplets className="text-rose-400" />} label="Blood Group" value={personalDetails.bloodGroup} />
              <DetailItem icon={<Phone />} label="Phone" value={personalDetails.phone} />
              <DetailItem icon={<Globe />} label="Nationality" value={personalDetails.nationality} />
              <DetailItem icon={<CreditCard />} label="Aadhaar" value={personalDetails.aadhaarNumber} />
              <div className="pt-4 mt-4 border-t border-slate-50">
                <DetailItem icon={<MapPin />} label="Permanent Address" value={personalDetails.permanentAddress} />
                <DetailItem icon={<Home />} label="Contact Address" value={personalDetails.contactAddress} />
              </div>
            </div>
          </div>

          {/* Family Info Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-indigo-100 bg-indigo-50/50">
              <h2 className="text-sm font-bold text-indigo-800 flex items-center gap-2 uppercase tracking-wide">
                <Users className="h-4 w-4 text-indigo-500/70" /> Family & Guardians
              </h2>
            </div>
            <div className="p-6 space-y-1">
              <DetailItem label="Father Name" value={personalDetails.fatherName} />
              <DetailItem label="Father Phone" value={personalDetails.fatherPhone} />
              <DetailItem label="Mother Name" value={personalDetails.motherName} />
              <DetailItem label="Mother Phone" value={personalDetails.motherPhone} />
              <DetailItem label="Parent Email" value={personalDetails.parentEmail} />
              {personalDetails.guardianName && (
                <div className="pt-4 mt-4 border-t border-slate-50">
                  <DetailItem label="Guardian Name" value={personalDetails.guardianName} />
                  <DetailItem label="Guardian Phone" value={personalDetails.guardianPhone} />
                  <DetailItem label="Guardian Address" value={personalDetails.guardianAddress} />
                </div>
              )}
            </div>
          </div>

          {/* Admission Info Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-amber-100 bg-amber-50/50">
              <h2 className="text-sm font-bold text-amber-800 flex items-center gap-2 uppercase tracking-wide">
                <GraduationCap className="h-4 w-4 text-amber-500/70" /> Admission Data
              </h2>
            </div>
            <div className="p-6 space-y-1">
              <DetailItem icon={<BookOpen />} label="Program" value={personalDetails.program} />
              <DetailItem icon={<Building />} label="Department" value={personalDetails.department} />
              <DetailItem icon={<Award />} label="Current Year" value={personalDetails.year} />
              <DetailItem icon={<Users />} label="Admission Type" value={personalDetails.admission_type} />
            </div>
          </div>

          {/* Academic Details Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-rose-100 bg-rose-50/50">
              <h2 className="text-sm font-bold text-rose-800 flex items-center gap-2 uppercase tracking-wide">
                <Award className="h-4 w-4 text-rose-500/70" /> Performance History
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: "Physics", val: academicDetails.physics },
                  { label: "Chemistry", val: academicDetails.chemistry },
                  { label: "Maths", val: academicDetails.maths },
                  { label: "KEAM Total", val: academicDetails.keamTotal },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">{item.label}</p>
                    <p className="text-base font-bold text-slate-800">{item.val}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <DetailItem label="Entrance Total" value={academicDetails.entranceTotal} />
                <DetailItem label="Prev. Institution" value={academicDetails.previousInstitution} />
                <DetailItem label="Prev. Percentage" value={`${academicDetails.previousPercentage}%`} />
              </div>
            </div>
          </div>

          {/* Bank Details Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2">
            <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50/50">
              <h2 className="text-sm font-bold text-emerald-800 flex items-center gap-2 uppercase tracking-wide">
                <CreditCard className="h-4 w-4 text-emerald-500/70" /> Banking & Finance
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Account Number", val: bankDetails.accountNumber },
                { label: "Bank Name", val: bankDetails.bankName },
                { label: "Branch", val: bankDetails.bankBranch },
              ].map((bank, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{bank.label}</span>
                  <span className="text-base font-semibold text-slate-900">{bank.val || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
}) => (
  <div className="flex items-center justify-between py-2.5 group transition-colors">
    <div className="flex items-center">
      {icon && <div className="text-slate-400 mr-3 scale-90">{icon}</div>}
      <span className="text-slate-500 text-sm font-medium">{label}</span>
    </div>
    <span className="text-slate-900 text-sm font-semibold text-right">
      {value || "—"}
    </span>
  </div>
);

export default StudentDetails;