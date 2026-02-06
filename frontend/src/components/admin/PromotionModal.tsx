import React, { useState, useEffect } from "react";
import axios from "axios";

interface SemesterInfo {
  currentSemesterType: "ODD" | "EVEN";
  oddSemesters: number[];
  evenSemesters: number[];
}

interface PromotionPreview {
  s1ToS2Count: number;
  s3ToS4Count: number;
  s5ToS6Count: number;
  s7ToS8Count: number;
  s2ToS3Count: number;
  s4ToS5Count: number;
  s6ToS7Count: number;
  s8ToArchiveCount: number;
  totalToPromote: number;
}

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [semesterInfo, setSemesterInfo] = useState<SemesterInfo | null>(null);
  const [preview, setPreview] = useState<PromotionPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Promotion config state
  const [config, setConfig] = useState({
    s1ToS2: false,
    s3ToS4: true,
    s5ToS6: true,
    s7ToS8: true,
    s2ToS3: true,
    s4ToS5: true,
    s6ToS7: true,
    s8ToArchive: true,
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      
      const [infoRes, previewRes] = await Promise.all([
        axios.get("http://localhost:3000/api/promotion/semester-info", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:3000/api/promotion/promotion-preview", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setSemesterInfo(infoRes.data);
      setPreview(previewRes.data);
    } catch (error) {
      console.error("Error fetching promotion data:", error);
      alert("Failed to load promotion data");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (key: keyof typeof config) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePromote = () => {
    setShowConfirmation(true);
  };

  const confirmPromotion = async () => {
    try {
      setPromoting(true);
      const token = localStorage.getItem("authToken");

      await axios.post(
        "http://localhost:3000/api/promotion/promote",
        config,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Students promoted successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error promoting students:", error);
      alert(error.response?.data?.error || "Failed to promote students");
    } finally {
      setPromoting(false);
      setShowConfirmation(false);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-gray-100/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="text-gray-700">Loading promotion data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (showConfirmation && preview) {
    const totalToPromote = Object.entries(config).reduce((sum, [key, value]) => {
      if (!value) return sum;
      const countKey = `${key}Count` as keyof PromotionPreview;
      return sum + (preview[countKey] || 0);
    }, 0);

    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-gray-100/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Confirm Promotion
          </h3>

          <div className="mb-6 space-y-2">
            <p className="text-gray-700 font-medium">
              You are about to promote:
            </p>
            
            {semesterInfo?.currentSemesterType === "ODD" && (
              <>
                {config.s1ToS2 && preview.s1ToS2Count > 0 && (
                  <p className="text-sm text-gray-600">
                    • S1 → S2: {preview.s1ToS2Count} students
                  </p>
                )}
                {config.s3ToS4 && preview.s3ToS4Count > 0 && (
                  <p className="text-sm text-gray-600">
                    • S3 → S4: {preview.s3ToS4Count} students
                  </p>
                )}
                {config.s5ToS6 && preview.s5ToS6Count > 0 && (
                  <p className="text-sm text-gray-600">
                    • S5 → S6: {preview.s5ToS6Count} students
                  </p>
                )}
                {config.s7ToS8 && preview.s7ToS8Count > 0 && (
                  <p className="text-sm text-gray-600">
                    • S7 → S8: {preview.s7ToS8Count} students
                  </p>
                )}
              </>
            )}

            {semesterInfo?.currentSemesterType === "EVEN" && (
              <>
                {config.s2ToS3 && preview.s2ToS3Count > 0 && (
                  <p className="text-sm text-gray-600">
                    • S2 → S3: {preview.s2ToS3Count} students
                  </p>
                )}
                {config.s4ToS5 && preview.s4ToS5Count > 0 && (
                  <p className="text-sm text-gray-600">
                    • S4 → S5: {preview.s4ToS5Count} students
                  </p>
                )}
                {config.s6ToS7 && preview.s6ToS7Count > 0 && (
                  <p className="text-sm text-gray-600">
                    • S6 → S7: {preview.s6ToS7Count} students
                  </p>
                )}
                {config.s8ToArchive && preview.s8ToArchiveCount > 0 && (
                  <p className="text-sm text-gray-600">
                    • S8 → Archive: {preview.s8ToArchiveCount} students
                  </p>
                )}
              </>
            )}

            <p className="text-sm font-semibold text-gray-800 mt-3 pt-3 border-t">
              Total: {totalToPromote} students
            </p>
          </div>

          <p className="text-sm text-orange-600 mb-4">
            ⚠️ This action cannot be easily reversed. Please confirm.
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowConfirmation(false)}
              disabled={promoting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmPromotion}
              disabled={promoting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {promoting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {promoting ? "Promoting..." : "Confirm Promotion"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-gray-100/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Promote Students
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {semesterInfo && preview && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900">
                Current Semester Type:{" "}
                <span className="font-bold text-blue-700">
                  {semesterInfo.currentSemesterType}
                </span>
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {semesterInfo.currentSemesterType === "ODD"
                  ? "Odd Semesters: S1, S3, S5, S7"
                  : "Even Semesters: S2, S4, S6, S8"}
              </p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Select which semester promotions to execute:
              </p>

              <div className="space-y-3">
                {semesterInfo.currentSemesterType === "ODD" ? (
                  <>
                    <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={config.s1ToS2}
                          onChange={() => handleCheckboxChange("s1ToS2")}
                          className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <div>
                          <span className="font-medium text-gray-900">
                            S1 → S2
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            (Optional - First year promotion)
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600">
                        {preview.s1ToS2Count} students
                      </span>
                    </label>

                    <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={config.s3ToS4}
                          onChange={() => handleCheckboxChange("s3ToS4")}
                          className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="font-medium text-gray-900">
                          S3 → S4
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600">
                        {preview.s3ToS4Count} students
                      </span>
                    </label>

                    <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={config.s5ToS6}
                          onChange={() => handleCheckboxChange("s5ToS6")}
                          className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="font-medium text-gray-900">
                          S5 → S6
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600">
                        {preview.s5ToS6Count} students
                      </span>
                    </label>

                    <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={config.s7ToS8}
                          onChange={() => handleCheckboxChange("s7ToS8")}
                          className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="font-medium text-gray-900">
                          S7 → S8
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600">
                        {preview.s7ToS8Count} students
                      </span>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={config.s2ToS3}
                          onChange={() => handleCheckboxChange("s2ToS3")}
                          className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="font-medium text-gray-900">
                          S2 → S3
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600">
                        {preview.s2ToS3Count} students
                      </span>
                    </label>

                    <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={config.s4ToS5}
                          onChange={() => handleCheckboxChange("s4ToS5")}
                          className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="font-medium text-gray-900">
                          S4 → S5
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600">
                        {preview.s4ToS5Count} students
                      </span>
                    </label>

                    <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={config.s6ToS7}
                          onChange={() => handleCheckboxChange("s6ToS7")}
                          className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="font-medium text-gray-900">
                          S6 → S7
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600">
                        {preview.s6ToS7Count} students
                      </span>
                    </label>

                    <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={config.s8ToArchive}
                          onChange={() => handleCheckboxChange("s8ToArchive")}
                          className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <div>
                          <span className="font-medium text-gray-900">
                            S8 → Archive
                          </span>
                          <span className="text-xs text-orange-600 ml-2">
                            (Move to Graduated Students)
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600">
                        {preview.s8ToArchiveCount} students
                      </span>
                    </label>
                  </>
                )}
              </div>
            </div>

            <div className="border-t pt-4 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePromote}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
                Promote Students
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionModal;
