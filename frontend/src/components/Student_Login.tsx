import { useState } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import Logo from "../assets/logo.png";

// Custom Alert/Message Box Component (replaces alert())
type MessageAlertProps = {
  message: string;
  type: "success" | "error" | "";
};

const MessageAlert = ({ message, type }: MessageAlertProps) => {
  if (!message) return null;

  const baseClasses =
    "p-4 mb-6 rounded-xl font-medium text-sm transition-all duration-300 transform shadow-md";
  const successClasses = "bg-green-100 text-green-800 border-green-200";
  const errorClasses = "bg-red-100 text-red-800 border-red-200";

  return (
    <div
      className={`${baseClasses} ${
        type === "success" ? successClasses : errorClasses
      }`}
    >
      {message}
    </div>
  );
};

// Main Student Login Component
const StudentLogin = () => {
  usePageTitle("Student Login");
  // State updated to use 'email' to match backend requirements
  const [inputValue, setInputValue] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // State for displaying success/error messages to the user
  const handleBack = () => {
    navigate("/");
  };

  const [message, setMessage] = useState<{
    text: string;
    type: "" | "success" | "error";
  }>({ text: "", type: "" });

  // NOTE: This URL must be updated to match your running Node.js server address
  const API_URL = "http://localhost:3000/auth/login-student";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputValue((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage({ text: "", type: "" }); // Clear previous messages
    setIsLoading(true);
    console.log("Sending login data:", inputValue);

    try {
      // 1. Send login credentials to the backend
      // We send 'email' and 'password' as required by the AuthController.login
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inputValue),
      });

      const data = await response.json();
      console.log(data);

      if (response.ok) {
        // 2. Login successful: Store JWT token in localStorage
        if (data.token) {
          localStorage.setItem("studentAuthToken", data.token); // Using a distinct key for students
          setMessage({
            text: "Login successful! Welcome to the Student Portal. Token stored in local storage.",
            type: "success",
          });
          console.log("JWT Token Stored:", data.token);
          navigate("/student");
        } else {
          throw new Error("Login failed: Token not received.");
        }
      } else {
        // 3. Login failed: Display error message from the backend
        const errorMessage =
          "Login failed. Please verify your Student ID/Email and Password.";
        setMessage({ text: errorMessage, type: "error" });
      }
    } catch (error) {
      // 4. Handle network or parsing errors
      console.error("Login API call failed:", error);
      setMessage({
        text: "Network error: Could not connect to the server. Please ensure the backend is running.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Load Tailwind CSS for styling
    <>
      <script src="https://cdn.tailwindcss.com"></script>
      <div
        className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-white to-blue-50"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <div className="flex flex-col md:flex-row w-full max-w-6xl shadow-2xl rounded-2xl overflow-hidden bg-white">
          {/* Left Side - Form */}
          <div className="flex flex-col items-center justify-center p-8 md:p-12 w-full md:w-1/2">
            <button
              onClick={handleBack}
              className="self-start mb-6 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#031D44] transition-colors hover:cursor-pointer"
            >
              ← Back
            </button>

            {/* Header - Used a div instead of Link to remove router dependency */}
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
              <div className="text-center mb-12">
                <h1 className="text-4xl font-light text-[#031D44] mb-4">
                  Student Portal
                </h1>
                <p className="text-gray-600 font-light">
                  Access your academic dashboard
                </p>
              </div>

              {/* Message Alert */}
              <MessageAlert message={message.text} type={message.type} />

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Student ID/Email Field - name attribute is 'email' to match backend */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#031D44] block">
                    Student ID or Email
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="email" // Changed from 'studentId' to 'email' to match backend DTO
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3AA9AB] focus:border-transparent transition-all duration-300 bg-white"
                      placeholder="Enter your student ID or email"
                      value={inputValue.email}
                      onChange={handleChange}
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center group cursor-default">
                      <span className="text-gray-400 text-xl transition-all duration-300 transform group-hover:rotate-12 group-hover:scale-110 group-hover:-translate-y-1 block">
                        🎓
                      </span>
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-[#031D44] block">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3AA9AB] focus:border-transparent transition-all duration-300 bg-white"
                      placeholder="Enter your password"
                      value={inputValue.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-[#3AA9AB] transition-colors bg-transparent border-none cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Recovery */}
                <div className="flex justify-end items-center">
                  <a
                    href="#"
                    className="text-sm font-medium text-[#3AA9AB] hover:text-[#031D44] transition-colors duration-300"
                  >
                    Forgot password?
                  </a>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-[#031D44] text-white rounded-xl hover:bg-[#3AA9AB] transition-all duration-500 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#3AA9AB] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    "Sign In to Portal"
                  )}
                </button>
              </form>

              {/* Sign Up Link for New Students - Removed React Router dependency */}
              {/* <div className="mt-8 text-center">
                <p className="text-gray-600">
                  New student?{" "}
                  <a
                    href="#" // Replaced Link with a regular anchor tag
                    className="text-[#3AA9AB] hover:text-[#031D44] font-medium transition-colors duration-300"
                  >
                    Create your account
                  </a>
                </p>
              </div> */}
            </div>
          </div>

          {/* Right Side - Student Showcase */}
          <div className="hidden md:flex flex-col items-center justify-center p-12 w-1/2 bg-gradient-to-br from-[#031D44] to-[#0a2a5a] text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 bg-[#3AA9AB] rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#FFFDD0] rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 text-center max-w-md">
              {/* Student Icon */}
              <div className="w-20 h-20 bg-[#3AA9AB] rounded-2xl flex items-center justify-center mx-auto mb-8">
                <span className="text-3xl">📚</span>
              </div>

              <h2 className="text-4xl font-light mb-6">
                Student <span className="text-[#3AA9AB]">Dashboard</span>
              </h2>

              <p className="text-gray-300 leading-relaxed mb-8 font-light">
                Access your courses, track your progress, submit assignments,
                and connect with your instructors through our comprehensive
                student portal.
              </p>

              {/* Features List */}
              <div className="space-y-4 text-left">
                {[
                  "View your course schedule and grades",
                  "Submit assignments and track deadlines",
                  "Access learning materials and resources",
                  "Communicate with instructors and peers",
                  "Monitor your academic progress",
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-[#3AA9AB] rounded-full"></div>
                    <span className="text-gray-300 font-light">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Need Help Section */}
              <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#3AA9AB]/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">❓</span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-lg">
                      Need Assistance?
                    </h3>
                    <p className="text-gray-300 text-sm font-light">
                      Contact the administrative office for help with your
                      account or portal access.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Brand Section */}
          <div className="md:hidden w-full max-w-md mt-8 p-6 bg-gradient-to-br from-[#031D44] to-[#0a2a5a] text-white rounded-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#3AA9AB] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-2xl font-light mb-2">
                Student <span className="text-[#3AA9AB]">Portal</span>
              </h3>
              <p className="text-gray-300 text-sm">
                Your gateway to academic success and learning management
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentLogin;
