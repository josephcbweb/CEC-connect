import React, { useState, useEffect } from "react";
import { Camera } from "lucide-react";
import { useParams } from "react-router-dom";
import EditStudentModal from "./EditStudentModal";

const baseURL = `http://localhost:3000`;

const InputField: React.FC<{
  label: string;
  value: any;
  type?: string;
  rows?: number;
}> = ({ label, value, type = "text", rows }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    {rows ? (
      <textarea
        value={value}
        readOnly
        rows={rows}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
      />
    ) : (
      <input
        type={type}
        value={value}
        readOnly
        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
      />
    )}
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <>
    <h3 className="text-lg font-semibold mt-8 mb-4 first:mt-0">{title}</h3>
    {children}
  </>
);

const StudentProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = useParams();
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, [id]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${baseURL}/students/profile/${id}`);
      if (!response.ok) throw new Error("Failed to fetch student data");
      setStudent(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <button
            onClick={fetchStudentData}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!student) return null;

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "academic", label: "Academic" },
    { id: "family", label: "Family Details" },
    { id: "financial", label: "Financial" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 profile">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h2>

            {activeTab === "profile" && (
              <button
                onClick={() => setIsEditOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Edit Profile
              </button>
            )}
          </div>

          {activeTab === "profile" && (
            <>
              {/* <Section title="Picture"> */}
              {/* <div className="flex items-center space-x-4 mb-8">
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                  {/* <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
                    Update Picture
                  </button> 
                </div> 
              </Section> */}

              <div className="grid grid-cols-2 gap-6 mb-6">
                <InputField label="Full Name" value={student.name} />
                <InputField
                  label="Email Address"
                  value={student.email}
                  type="email"
                />
                <InputField label="Program" value={student.program} />
                <InputField label="Department" value={student.department} />
                <InputField label="Year" value={student.year} />
                <InputField
                  label="Date of Birth"
                  value={new Date(student.dateOfBirth).toLocaleDateString()}
                />
              </div>

              <Section title="Personal Details">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <InputField label="Gender" value={student.gender} />
                  <InputField label="Blood Group" value={student.bloodGroup} />
                  <InputField label="Phone Number" value={student.phone} />
                  <InputField
                    label="Aadhaar Number"
                    value={student.aadhaarNumber}
                  />
                </div>
                <div className="space-y-6">
                  <InputField
                    label="Permanent Address"
                    value={student.permanentAddress}
                    rows={2}
                  />
                  <InputField
                    label="Contact Address"
                    value={student.contactAddress}
                    rows={2}
                  />
                </div>
              </Section>
            </>
          )}

          {activeTab === "academic" && (
            <>
              <Section title="Admission Details">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <InputField
                    label="Admitted Category"
                    value={student.admittedCategory}
                  />
                  <InputField
                    label="Admission Quota"
                    value={student.admissionQuota}
                  />
                </div>
              </Section>

              <Section title="Entrance Exam Scores">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <InputField label="Physics" value={student.physics} />
                  <InputField label="Chemistry" value={student.chemistry} />
                  <InputField label="Maths" value={student.maths} />
                  <InputField
                    label="KEAM Subject Total"
                    value={student.keamTotal}
                  />
                  <InputField
                    label="Entrance Total Score"
                    value={student.entranceTotal}
                  />
                </div>
              </Section>

              <Section title="Previous Education">
                <div className="grid grid-cols-2 gap-6">
                  <InputField
                    label="Previous Percentage/CGPA"
                    value={student.previousPercentage}
                  />
                  <InputField
                    label="Previous Institution"
                    value={student.previousInstitution}
                  />
                </div>
              </Section>
            </>
          )}

          {activeTab === "family" && (
            <>
              <Section title="Father's Information">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <InputField
                    label="Father's Name"
                    value={student.fatherName}
                  />
                  <InputField
                    label="Father's Phone"
                    value={student.fatherPhone}
                  />
                </div>
              </Section>

              <Section title="Mother's Information">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <InputField
                    label="Mother's Name"
                    value={student.motherName}
                  />
                  <InputField
                    label="Mother's Phone"
                    value={student.motherPhone}
                  />
                </div>
                <InputField
                  label="Parent Email"
                  value={student.parentEmail}
                  type="email"
                />
              </Section>

              <Section title="Guardian Information">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <InputField
                    label="Guardian Name"
                    value={student.guardianName}
                  />
                  <InputField
                    label="Guardian Phone"
                    value={student.guardianPhone}
                  />
                </div>
                <InputField
                  label="Guardian Address"
                  value={student.guardianAddress}
                  rows={2}
                />
              </Section>
            </>
          )}

          {activeTab === "financial" && (
            <Section title="Bank Details">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <InputField
                  label="Account Number"
                  value={student.accountNumber}
                />
                <InputField label="Bank Name" value={student.bankName} />
              </div>
              <InputField label="Bank Branch" value={student.bankBranch} />
            </Section>
          )}
        </div>
      </div>
      <EditStudentModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        student={student}
        onSuccess={fetchStudentData}
      />

    </div>
  );
};

export default StudentProfile;
