/**
 * Forgot Password Component for Students
 * Implements 3-step password reset flow:
 * 1. Enter email -> Send OTP
 * 2. Enter OTP -> Verify
 * 3. Enter new password -> Reset
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import Logo from "../assets/logo.png";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

type Step = "email" | "otp" | "password" | "success";

type ForgotPasswordProps = {
  userType?: "student" | "admin";
};

// Custom Alert/Message Box Component (replaces alert())
type MessageAlertProps = {
  message: string;
  type: string;
};

const MessageAlert = ({ message, type }: MessageAlertProps) => {
  if (!message) return null;

  const baseClasses =
    "p-4 mb-6 rounded-xl font-medium text-sm transition-all duration-300 transform shadow-md";
  const successClasses = "bg-green-100 text-green-800 border-green-200 flex items-center gap-2";
  const errorClasses = "bg-red-100 text-red-800 border-red-200 flex items-center gap-2";

  return (
    <div
      className={`${baseClasses} ${
        type === "success" ? successClasses : errorClasses
      }`}
    >
      {type === "success" ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
      {message}
    </div>
  );
};

const ForgotPassword: React.FC<ForgotPasswordProps> = ({
  userType = "student",
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // Replaced individual error and success states with unified message
  const [message, setMessage] = useState({ text: "", type: "" });

  // Step 1: Send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setLoading(true);

    try {
      const endpoint =
        userType === "admin"
          ? "/api/password-reset/admin/send-otp"
          : "/api/password-reset/send-otp";

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
        email: email.trim(),
      });

      if (response.data.success) {
        setMessage({ text: response.data.message, type: "success" });
        setStep("otp");
      }
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || "Failed to send OTP. Please try again.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setLoading(true);

    try {
      const endpoint =
        userType === "admin"
          ? "/api/password-reset/admin/verify-otp"
          : "/api/password-reset/verify-otp";

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
        email: email.trim(),
        otp: otp.trim(),
      });

      if (response.data.success) {
        setMessage({ text: response.data.message, type: "success" });
        setStep("password");
      }
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || "Invalid or expired OTP. Please try again.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    // Client-side validation
    if (newPassword !== confirmPassword) {
      setMessage({ text: "Passwords do not match", type: "error" });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ text: "Password must be at least 8 characters long", type: "error" });
      return;
    }

    setLoading(true);

    try {
      const endpoint =
        userType === "admin"
          ? "/api/password-reset/admin/reset-password"
          : "/api/password-reset/reset-password";

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
        confirmPassword,
      });

      if (response.data.success) {
        setMessage({ text: response.data.message, type: "success" });
        setStep("success");
      }
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || "Failed to reset password. Please try again.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate(userType === "admin" ? "/" : "/studentlogin");
  };

  return (
    <>
      <script src="https://cdn.tailwindcss.com"></script>
      <div 
        className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-white to-gray-50"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <div className="flex flex-col md:flex-row w-full max-w-6xl shadow-2xl rounded-2xl overflow-hidden bg-white">
          {/* Left Side - Form */}
          <div className="flex flex-col items-center justify-center p-8 md:p-12 w-full md:w-1/2">
            <button
              onClick={handleBackToLogin}
              className="self-start mb-6 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#031D44] transition-colors hover:cursor-pointer"
            >
              ← Back to Login
            </button>

            {/* Header */}
            <div className="w-full text-left mb-8">
              <div
                role="link"
                className="flex items-center space-x-3 group justify-center cursor-pointer"
              >
                <div className="relative">
                  <img
                    src={Logo}
                    alt="Acads Logo"
                    className="h-10 w-10 transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-colors duration-300"></div>
                </div>
                <span className="text-2xl font-light text-gray-900 group-hover:text-blue-600 transition-colors duration-300 text-center">
                  Acads
                </span>
              </div>
            </div>

            {/* Form Container */}
            <div className="w-full max-w-md">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#031D44] to-[#3AA9AB] mb-2">
                  Reset Password
                </h2>
                <p className="text-gray-500 font-medium">
                  {step === "email" && "Enter your registered email address"}
                  {step === "otp" && "Enter the OTP sent to your email"}
                  {step === "password" && "Create a new password"}
                  {step === "success" && "Password reset successful!"}
                </p>
              </div>

              {/* Alert Message */}
              {(message.text && step !== "success") && (
                <MessageAlert message={message.text} type={message.type} />
              )}

              {/* Step 1: Email Input */}
              {step === "email" && (
                <form onSubmit={handleSendOTP} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#031D44]">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3AA9AB] focus:border-transparent transition-all duration-300 bg-white pl-10"
                        placeholder="Enter your email"
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-[#031D44] text-white rounded-xl hover:bg-[#3AA9AB] transition-all duration-500 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#3AA9AB] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending OTP...</span>
                      </div>
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                </form>
              )}

              {/* Step 2: OTP Verification */}
              {step === "otp" && (
                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#031D44]">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      required
                      maxLength={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3AA9AB] focus:border-transparent transition-all duration-300 bg-white text-center text-2xl tracking-widest font-semibold"
                      placeholder="000000"
                    />
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      OTP expires in 5 minutes
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full py-4 bg-[#031D44] text-white rounded-xl hover:bg-[#3AA9AB] transition-all duration-500 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#3AA9AB] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      "Verify OTP"
                    )}
                  </button>

                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => setStep("email")}
                      className="text-sm font-medium text-[#3AA9AB] hover:text-[#031D44] transition-colors duration-300"
                    >
                      Wrong email? Resend OTP
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: New Password */}
              {step === "password" && (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#031D44]">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full px-4 py-3 pl-10 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3AA9AB] focus:border-transparent transition-all duration-300 bg-white"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-[#3AA9AB] transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#031D44]">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full px-4 py-3 pl-10 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3AA9AB] focus:border-transparent transition-all duration-300 bg-white"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-[#3AA9AB] transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Password must be at least 8 characters long
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-[#031D44] text-white rounded-xl hover:bg-[#3AA9AB] transition-all duration-500 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#3AA9AB] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Resetting Password...</span>
                      </div>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </form>
              )}

              {/* Step 4: Success Message (replaces alerts on success page so no form is rendered) */}
              {step === "success" && (
                <div className="text-center space-y-6 bg-white p-8 rounded-2xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)]">
                  <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center shadow-inner">
                    <CheckCircle className="w-14 h-14 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Password Reset!
                  </h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    Your password has been changed successfully. You can now use your new password to log in to your account.
                  </p>
                  <button
                    onClick={handleBackToLogin}
                    className="w-full py-4 mt-4 bg-[#031D44] text-white rounded-xl hover:bg-[#3AA9AB] transition-all duration-500 transform hover:scale-[1.02] focus:outline-none font-medium shadow-md hover:shadow-lg"
                  >
                    Go to Login
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Brand Showcase */}
          <div className="hidden md:flex flex-col items-center justify-center p-12 w-1/2 bg-gradient-to-br from-[#031D44] to-[#0a2a5a] text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 bg-[#3AA9AB] rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#FFFDD0] rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 text-center max-w-md">
              <div className="w-20 h-20 bg-[#3AA9AB] rounded-2xl flex items-center justify-center mx-auto mb-8">
                <Lock className="text-white w-10 h-10" />
              </div>

              <h2 className="text-4xl font-light mb-6">
                Secure <span className="text-[#3AA9AB]">Access</span>
              </h2>

              <p className="text-gray-300 leading-relaxed mb-8 font-light">
                {userType === "admin" 
                  ? "Regain access to your academic dashboard and administrative tools securely."
                  : "Regain access to your student dashboard and learning management tools securely."
                }
              </p>

              {/* Security Insights */}
              <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#3AA9AB]/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-white font-medium text-lg">
                      Security First
                    </h3>
                    <p className="text-gray-300 text-sm font-light italic">
                      "We ensure your data and account remain protected at all times with industry-standard encryption."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Brand Section */}
          <div className="md:hidden w-full max-w-md mt-0 bg-gradient-to-br from-[#031D44] to-[#0a2a5a] text-white rounded-b-2xl p-8 rounded-t-none">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#3AA9AB] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="text-white w-8 h-8" />
              </div>
              <h3 className="text-2xl font-light mb-2">
                Secure <span className="text-[#3AA9AB]">Access</span>
              </h3>
              <p className="text-gray-300 text-sm">
                Safe and reliable account recovery
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
