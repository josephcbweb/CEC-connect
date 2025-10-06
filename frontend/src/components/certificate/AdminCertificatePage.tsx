import React, { useState, useEffect } from "react";
import type { Certificate } from "../../types/certificate";
import { certificateService } from "../../services/certificateService";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const AdminCertificatePage: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  if (!token) {
    navigate("/signup");
    return;
  }
  const tokenData = jwtDecode<{ userId: string; userName: string }>(token);

  const adminId = tokenData.userId;
  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const data = await certificateService.getAllCertificates();
      setCertificates(data);
    } catch (error) {
      console.error("Error loading certificates:", error);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      // Remove adminId from the call - handle it in the backend via authentication
      await certificateService.updateCertificateStatus(id, "APPROVED");
      loadCertificates();
    } catch (error) {
      console.error("Error approving certificate:", error);
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt("Please enter rejection reason:");
    if (reason) {
      try {
        // Remove adminId from the call
        await certificateService.updateCertificateStatus(
          id,
          "REJECTED",
          reason
        );
        loadCertificates();
      } catch (error) {
        console.error("Error rejecting certificate:", error);
      }
    }
  };

  const handleGenerate = async (id: number) => {
    try {
      await certificateService.generateCertificate(id);
      loadCertificates();
    } catch (error) {
      console.error("Error generating certificate:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "GENERATED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Certificate Requests</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Requested
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {certificates.map((certificate) => (
              <tr key={certificate.id}>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium">
                      {certificate.student?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {certificate.student?.admission_number}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {certificate.type.replace("_", " ")}
                </td>
                <td className="px-6 py-4">{certificate.reason}</td>
                <td className="px-6 py-4">
                  {new Date(certificate.requestedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      certificate.status
                    )}`}
                  >
                    {certificate.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {certificate.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleApprove(certificate.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(certificate.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {certificate.status === "APPROVED" && (
                      <button
                        onClick={() => handleGenerate(certificate.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Generate
                      </button>
                    )}
                    {certificate.status === "GENERATED" &&
                      certificate.certificateUrl && (
                        <a
                          href={`http://localhost:3000/api/certificates/${certificate.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                        >
                          Download
                        </a>
                      )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCertificatePage;
