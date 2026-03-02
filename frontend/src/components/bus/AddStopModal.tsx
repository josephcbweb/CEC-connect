import React, { useState } from "react";
import axios from "axios";
import { X } from "lucide-react";

interface AddStopModalProps {
  busId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const AddStopModal: React.FC<AddStopModalProps> = ({
  busId,
  onClose,
  onSuccess,
}) => {
  const [stopName, setStopName] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!stopName || !feeAmount) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      await axios.post("http://localhost:3000/bus/addStop", {
        busId,
        stops: [
          {
            stopName,
            feeAmount: Number(feeAmount),
          },
        ],
      });

      onSuccess(); // refresh list
      onClose(); // close modal
    } catch (error) {
      console.error("Error adding stop:", error);
      alert("Failed to add stop");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "440px",
          boxShadow:
            "0 24px 60px rgba(15, 23, 42, 0.18), 0 4px 16px rgba(15, 23, 42, 0.08)",
          overflow: "hidden",
          fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            height: "4px",
            background: "linear-gradient(90deg, #2563eb 0%, #7c3aed 100%)",
          }}
        />

        <div style={{ padding: "28px 32px 32px" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "28px",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#2563eb",
                  marginBottom: "4px",
                }}
              >
                Bus Route Management
              </p>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Add Bus Stop & Fee
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                cursor: "pointer",
                color: "#64748b",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9";
                (e.currentTarget as HTMLButtonElement).style.color = "#0f172a";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc";
                (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Divider */}
          <div
            style={{
              height: "1px",
              background: "#f1f5f9",
              marginBottom: "24px",
            }}
          />

          {/* Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: "8px",
                  letterSpacing: "0.01em",
                }}
              >
                Stop Name
              </label>
              <input
                type="text"
                value={stopName}
                onChange={(e) => setStopName(e.target.value)}
                placeholder="Eg: Central Station"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: "14px",
                  color: "#0f172a",
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "10px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#2563eb";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)";
                  e.currentTarget.style.background = "#fff";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = "#f8fafc";
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: "8px",
                  letterSpacing: "0.01em",
                }}
              >
                Fee Amount (₹)
              </label>
              <input
                type="number"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                placeholder="Eg: 1500"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: "14px",
                  color: "#0f172a",
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "10px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#2563eb";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)";
                  e.currentTarget.style.background = "#fff";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = "#f8fafc";
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "28px",
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#475569",
                background: "#f1f5f9",
                border: "1.5px solid #e2e8f0",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#e2e8f0";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9";
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: "10px 22px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#ffffff",
                background: loading
                  ? "#93c5fd"
                  : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                border: "none",
                borderRadius: "10px",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 2px 8px rgba(37,99,235,0.35)",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 4px 12px rgba(37,99,235,0.45)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 2px 8px rgba(37,99,235,0.35)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                }
              }}
            >
              {loading ? (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{ animation: "spin 0.8s linear infinite" }}
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Saving...
                </>
              ) : (
                "Add Stop"
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
};

export default AddStopModal;