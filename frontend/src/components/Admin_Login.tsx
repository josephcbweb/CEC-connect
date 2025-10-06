import { useState } from "react";
// Removed: import { Link } from "react-router-dom"; and import Logo from "../assets/logo.png";

// Custom Alert/Message Box Component (replaces alert())
type MessageAlertProps = {
  message: string;
  type: string;
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

// Main Login Component
const Login = () => {
  // State updated to reflect backend requirement (email instead of name)
  const [inputValue, setInputValue] = useState({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  // State for displaying success/error messages to the user
  const [message, setMessage] = useState({ text: "", type: "" });

  // NOTE: This URL must be updated to match your running Node.js server address
  const API_URL = "http://localhost:3000/auth/login";

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

    try {
      // 1. Send login credentials to the backend
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inputValue),
      });

      const data = await response.json();

      if (response.ok) {
        // 2. Login successful: Store JWT token in localStorage
        if (data.token) {
          localStorage.setItem("authToken", data.token);
          setMessage({
            text: "Login successful! Your session token has been stored in local storage.",
            type: "success",
          });
          // You would typically redirect the user to the dashboard here
          console.log("JWT Token Stored:", data.token);
        } else {
          // Should not happen if backend is correct, but good for safety
          throw new Error("Login failed: Token not received.");
        }
      } else {
        // 3. Login failed: Display error message from the backend
        const errorMessage =
          data.message ||
          "Authentication failed. Please check your credentials.";
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
        className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-white to-gray-50"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <div className="flex flex-col md:flex-row w-full max-w-6xl shadow-2xl rounded-2xl overflow-hidden bg-white">
          {/* Left Side - Form */}
          <div className="flex flex-col items-center justify-center p-8 md:p-12 w-full md:w-1/2">
            {/* Header - Use a div instead of Link to remove router dependency */}
            <div className="w-full text-left mb-8">
              <div
                role="link"
                className="flex items-center space-x-3 group justify-center cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#031D44]">
                  {/* Replaced image import with a strong text placeholder */}
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <span className="text-2xl font-light text-[#031D44] group-hover:text-[#3AA9AB] transition-colors duration-300 text-center">
                  Acads
                </span>
              </div>
            </div>

            {/* Form Container */}
            <div className="w-full max-w-md">
              <div className="text-center mb-12">
                <h1 className="text-4xl font-light text-[#031D44] mb-4">
                  Admin Portal
                </h1>
                <p className="text-gray-600 font-light">
                  Sign in to your academic dashboard
                </p>
              </div>

              {/* Message Alert */}
              <MessageAlert message={message.text} type={message.type} />

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field - Updated name attribute to 'email' */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#031D44] block">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email" // Updated from 'name' to 'email'
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3AA9AB] focus:border-transparent transition-all duration-300 bg-white"
                      placeholder="Enter your email address"
                      value={inputValue.email}
                      onChange={handleChange}
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center">
                      <span className="text-gray-400">📧</span>
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-[#031D44] block">
                      Password
                    </label>
                    <a
                      href="#"
                      className="text-sm text-[#3AA9AB] hover:text-[#031D44] transition-colors duration-300"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      name="password"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3AA9AB] focus:border-transparent transition-all duration-300 bg-white"
                      placeholder="Enter your password"
                      value={inputValue.password}
                      onChange={handleChange}
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center">
                      <span className="text-gray-400">🔒</span>
                    </div>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 text-[#3AA9AB] border-gray-300 rounded focus:ring-[#3AA9AB]"
                  />
                  <label htmlFor="remember" className="text-sm text-gray-600">
                    Remember me
                  </label>
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
                    "Sign In"
                  )}
                </button>
              </form>
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
              {/* Academic Icon */}
              <div className="w-20 h-20 bg-[#3AA9AB] rounded-2xl flex items-center justify-center mx-auto mb-8">
                <span className="text-3xl">🎓</span>
              </div>

              <h2 className="text-4xl font-light mb-6">
                Welcome to <span className="text-[#3AA9AB]">Acads</span>
              </h2>

              <p className="text-gray-300 leading-relaxed mb-8 font-light">
                Access your academic dashboard, connect with peers, and manage
                your educational journey with our comprehensive platform.
              </p>

              {/* Features List */}
              <div className="space-y-4 text-left">
                {[
                  "Personalized academic dashboard",
                  "Real-time collaboration tools",
                  "Advanced research resources",
                  "Seamless course management",
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-[#3AA9AB] rounded-full"></div>
                    <span className="text-gray-300 font-light">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Testimonial */}
              <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <p className="text-gray-300 italic mb-4 font-light">
                  "Acads transformed how our institution manages academic
                  operations. The platform is intuitive and powerful."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#3AA9AB] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">JCB</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Dr. Joseph C B</p>
                    <p className="text-gray-400 text-sm">
                      Head of Computer Science
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
                <span className="text-2xl">🎓</span>
              </div>
              <h3 className="text-2xl font-light mb-2">
                Welcome to <span className="text-[#3AA9AB]">Acads</span>
              </h3>
              <p className="text-gray-300 text-sm">
                Your gateway to academic excellence and collaboration
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
