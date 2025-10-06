import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Certificate, CertificateRequest, CertificateType } from '../../types/certificate';
import { certificateService } from '../../services/certificateService';

interface OutletContextType {
  studentData: {
    id: number;
    name: string;
    // other student properties
  };
}

const StudentCertificatePage: React.FC = () => {
  const { studentData } = useOutletContext<OutletContextType>();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState<number | null>(null); // ADD THIS
  const [formData, setFormData] = useState<CertificateRequest>({
    studentId: studentData.id,
    type: 'BONAFIDE',
    reason: ''
  });

  useEffect(() => {
    loadCertificates();
  }, [studentData.id]);

  const loadCertificates = async () => {
    try {
      const data = await certificateService.getStudentCertificates(studentData.id);
      setCertificates(data);
    } catch (error) {
      console.error('Error loading certificates:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await certificateService.submitRequest(formData);
      setShowModal(false);
      setFormData({ studentId: studentData.id, type: 'BONAFIDE', reason: '' });
      loadCertificates();
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request. Please try again.'); // ADD ERROR FEEDBACK
    } finally {
      setLoading(false);
    }
  };

// In StudentCertificatePage.tsx - replace the handleDownload function
const handleDownload = async (certificateId: number) => {
  setDownloadLoading(certificateId);
  try {
    // Use the backend URL directly
    const downloadUrl = `http://localhost:3000/api/certificates/${certificateId}/download`;
    window.open(downloadUrl, '_blank');
  } catch (error) {
    console.error('Error downloading certificate:', error);
    alert('Failed to download certificate. Please try again.');
  } finally {
    setDownloadLoading(null);
  }
};
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'GENERATED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const certificateTypeOptions: { value: CertificateType; label: string }[] = [
    { value: 'BONAFIDE', label: 'Bonafide Certificate' },
    { value: 'COURSE_COMPLETION', label: 'Course Completion Certificate' },
    { value: 'TRANSFER', label: 'Transfer Certificate' },
    { value: 'CHARACTER', label: 'Character Certificate' },
    { value: 'OTHER', label: 'Other Certificate' }
  ];
  

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Certificate Requests</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 font-medium"
        >
          New Request
        </button>
      </div>

      {/* Certificate Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">New Certificate Request</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Certificate Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as CertificateType })}
                  className="w-full p-2 border rounded-lg"
                  required
                >
                  {certificateTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  rows={4}
                  required
                  placeholder="Please specify the purpose for this certificate..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificates Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {certificates.map(certificate => (
                <tr key={certificate.id}>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {certificateTypeOptions.find(opt => opt.value === certificate.type)?.label || certificate.type}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{certificate.reason}</td>
                  <td className="px-6 py-4 text-sm text-gray-800"> {/* FIXED: removed extra hyphen */}
                    {new Date(certificate.requestedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(certificate.status)}`}>
                      {certificate.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {certificate.status === 'GENERATED' && (
                      <button
                        onClick={() => handleDownload(certificate.id)}
                        disabled={downloadLoading === certificate.id}
                        className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50 font-medium"
                      >
                        {downloadLoading === certificate.id ? 'Downloading...' : 'Download PDF'}
                      </button>
                    )}
                    {certificate.status === 'REJECTED' && certificate.rejectionReason && (
                      <div className="text-xs text-red-600 max-w-xs">
                        Reason: {certificate.rejectionReason}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {certificates.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">
                    You have no certificate requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentCertificatePage;