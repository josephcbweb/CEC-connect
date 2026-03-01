import React, { useState, useEffect } from "react";
import { Monitor, Smartphone } from "lucide-react";

const MOBILE_BREAKPOINT = 768; // px — below this is considered mobile/tablet

const MobileGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          {/* Icon */}
          <div className="relative mx-auto w-24 h-24">
            <Smartphone className="w-24 h-24 text-red-400 opacity-30 absolute inset-0" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-0.5 bg-red-500 rotate-45 rounded-full" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-white">Desktop Only</h1>
            <p className="text-slate-300 leading-relaxed">
              The CEC College Management System is designed for desktop and
              laptop computers. Please switch to a device with a larger screen
              to access this application.
            </p>
          </div>

          {/* Suggested action */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-center gap-2 text-teal-400">
              <Monitor className="w-5 h-5" />
              <span className="text-sm font-medium">Recommended</span>
            </div>
            <p className="text-slate-400 text-sm">
              Open{" "}
              <span className="text-white font-medium">
                {window.location.origin}
              </span>{" "}
              on a desktop or laptop browser.
            </p>
          </div>

          {/* College branding */}
          <p className="text-slate-500 text-xs pt-4">
            College of Engineering Cherthala
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default MobileGuard;
