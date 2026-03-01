import React, { useState, useEffect } from "react";
import { Clock, Sun, Sunset, Moon, ShieldCheck } from "lucide-react";
import { usePageTitle } from "../../hooks/usePageTitle";
import cecLogo from "../../assets/cec png.png";

// --- Helpers ---
const getGreeting = (hour: number) => {
  if (hour < 12) return { text: "Good Morning", Icon: Sun };
  if (hour < 17) return { text: "Good Afternoon", Icon: Sunset };
  return { text: "Good Evening", Icon: Moon };
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

// --- Component ---
const Home: React.FC = () => {
  usePageTitle("Dashboard");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState("");

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get user info from localStorage
  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const user = JSON.parse(userString);
        if (user.name) setUserName(user.name);
        if (user.role && Array.isArray(user.role)) {
          setUserRole(
            user.role
              .map((r: string) => r.charAt(0).toUpperCase() + r.slice(1))
              .join(", "),
          );
        }
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const { text: greeting, Icon: GreetingIcon } = getGreeting(
    currentTime.getHours(),
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-2rem)] w-full bg-white p-6">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Logo */}
        <img
          src={cecLogo}
          alt="CEC Logo"
          className="w-20 h-20 mx-auto object-contain opacity-80"
        />

        {/* College Name */}
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-slate-400">
          College of Engineering Cherthala
        </p>

        {/* Greeting */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-slate-700">
            <GreetingIcon className="w-5 h-5 text-teal-500" />
            <h1 className="text-2xl font-semibold">{greeting},</h1>
          </div>
          <p className="text-xl font-medium text-slate-900">{userName}</p>
          {userRole && (
            <span className="inline-block px-3 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">
              {userRole}
            </span>
          )}
        </div>

        {/* Clock */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2 text-slate-600">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-lg font-mono font-semibold tracking-wider">
              {formatTime(currentTime)}
            </span>
          </div>
          <p className="text-slate-400 text-sm">{formatDate(currentTime)}</p>
        </div>

        {/* Monitoring Notice */}
        <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs pt-6">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>All activities are monitored and logged.</span>
        </div>
      </div>
    </div>
  );
};

export default Home;
