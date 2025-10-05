import { useParams,useNavigate } from "react-router-dom";
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
  Heart,
  Building,
  GraduationCap,
  Shield,
  Home,
} from "lucide-react";
import { ArrowLeft } from "lucide-react";

const baseURL = "http://localhost:3000";

const StudentDetails = () => {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Not Found</h2>
          <p className="text-gray-600">The requested student details could not be loaded.</p>
        </div>
      </div>
    );
  }

  const { personalDetails, academicDetails, bankDetails } = student;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {personalDetails.name}
              </h1>
              <p className="text-gray-600 text-lg">Student Profile</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">
                {personalDetails.program}
              </span>
              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                {personalDetails.department}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Details Card - Now includes address */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-3 rounded-xl mr-4">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Personal Details</h2>
            </div>
            
            <div className="space-y-4">
              <DetailItem icon={<Mail className="h-5 w-5" />} label="Email" value={personalDetails.email} />
              <DetailItem icon={<Calendar className="h-5 w-5" />} label="Date of Birth" value={new Date(personalDetails.dateOfBirth).toLocaleDateString()} />
              <DetailItem icon={<User className="h-5 w-5" />} label="Gender" value={personalDetails.gender} />
              <DetailItem icon={<Droplets className="h-5 w-5" />} label="Blood Group" value={personalDetails.bloodGroup} />
              <DetailItem icon={<Phone className="h-5 w-5" />} label="Phone" value={personalDetails.phone} />
              <DetailItem icon={<Globe className="h-5 w-5" />} label="Nationality" value={personalDetails.nationality} />
              <DetailItem icon={<CreditCard className="h-5 w-5" />} label="Aadhaar Number" value={personalDetails.aadhaarNumber} />
              
              {/* Address Information */}
              <div className="pt-2 border-t border-gray-100">
                <DetailItem icon={<MapPin className="h-5 w-5" />} label="Permanent Address" value={personalDetails.permanentAddress} />
                <DetailItem icon={<Home className="h-5 w-5" />} label="Contact Address" value={personalDetails.contactAddress} />
              </div>
            </div>
          </div>

          {/* Guardian & Parent Info Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="bg-purple-100 p-3 rounded-xl mr-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Family Information</h2>
            </div>
            
            <div className="space-y-4">
              <DetailItem icon={<User className="h-5 w-5" />} label="Father Name" value={personalDetails.fatherName} />
              <DetailItem icon={<Phone className="h-5 w-5" />} label="Father Phone" value={personalDetails.fatherPhone} />
              <DetailItem icon={<User className="h-5 w-5" />} label="Mother Name" value={personalDetails.motherName} />
              <DetailItem icon={<Phone className="h-5 w-5" />} label="Mother Phone" value={personalDetails.motherPhone} />
              <DetailItem icon={<Mail className="h-5 w-5" />} label="Parent Email" value={personalDetails.parentEmail} />
              {personalDetails.guardianName && (
                <>
                  <DetailItem icon={<User className="h-5 w-5" />} label="Guardian Name" value={personalDetails.guardianName} />
                  <DetailItem icon={<Phone className="h-5 w-5" />} label="Guardian Phone" value={personalDetails.guardianPhone} />
                  <DetailItem icon={<Home className="h-5 w-5" />} label="Guardian Address" value={personalDetails.guardianAddress} />
                </>
              )}
            </div>
          </div>

          {/* Admission Info Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="bg-orange-100 p-3 rounded-xl mr-4">
                <GraduationCap className="h-6 w-6 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Admission Details</h2>
            </div>
            
            <div className="space-y-4">
              <DetailItem icon={<BookOpen className="h-5 w-5" />} label="Program" value={personalDetails.program} />
              <DetailItem icon={<Building className="h-5 w-5" />} label="Department" value={personalDetails.department} />
              <DetailItem icon={<Award className="h-5 w-5" />} label="Year" value={personalDetails.year} />
              <DetailItem icon={<Shield className="h-5 w-5" />} label="Admitted Category" value={personalDetails.admittedCategory} />
              <DetailItem icon={<Users className="h-5 w-5" />} label="Admission Quota" value={personalDetails.admissionQuota} />
            </div>
          </div>

          {/* Academic Details Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="bg-red-100 p-3 rounded-xl mr-4">
                <Award className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Academic Details</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Physics</p>
                  <p className="text-lg font-semibold text-gray-900">{academicDetails.physics}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Chemistry</p>
                  <p className="text-lg font-semibold text-gray-900">{academicDetails.chemistry}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Mathematics</p>
                  <p className="text-lg font-semibold text-gray-900">{academicDetails.maths}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">KEAM Total</p>
                  <p className="text-lg font-semibold text-gray-900">{academicDetails.keamTotal}</p>
                </div>
              </div>
              
              <DetailItem icon={<Award className="h-5 w-5" />} label="Entrance Total Score" value={academicDetails.entranceTotal} />
              <DetailItem icon={<School className="h-5 w-5" />} label="Previous Institution" value={academicDetails.previousInstitution} />
              <DetailItem icon={<Award className="h-5 w-5" />} label="Previous Percentage" value={academicDetails.previousPercentage} />
            </div>
          </div>

          {/* Bank Details Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 lg:col-span-2">
            <div className="flex items-center mb-6">
              <div className="bg-emerald-100 p-3 rounded-xl mr-4">
                <CreditCard className="h-6 w-6 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Bank Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-emerald-50 to-blue-50 p-6 rounded-xl border border-emerald-100">
                <p className="text-sm text-gray-600 mb-2">Account Number</p>
                <p className="text-xl font-bold text-gray-900">{bankDetails.accountNumber}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-blue-50 p-6 rounded-xl border border-emerald-100">
                <p className="text-sm text-gray-600 mb-2">Bank Name</p>
                <p className="text-xl font-bold text-gray-900">{bankDetails.bankName}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-blue-50 p-6 rounded-xl border border-emerald-100">
                <p className="text-sm text-gray-600 mb-2">Bank Branch</p>
                <p className="text-xl font-bold text-gray-900">{bankDetails.bankBranch}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Detail Item Component
const DetailItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
    <div className="flex items-center">
      <div className="text-gray-400 mr-3">{icon}</div>
      <span className="text-gray-600 font-medium">{label}</span>
    </div>
    <span className="text-gray-900 font-semibold text-right">{value || "—"}</span>
  </div>
);

export default StudentDetails;