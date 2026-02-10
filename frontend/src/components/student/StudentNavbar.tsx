import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import type { FeeStructure, Invoice, Student } from "../../types";
import { Bell, X } from "lucide-react";
import {
  type Notification,
  notificationService,
} from "../../services/notificationService";

// --- Type Definition ---
interface StudentWithFees extends Student {
  invoices: (Invoice & { feeStructure: FeeStructure | null })[];
}
interface StudentNavbarProps {
  studentData: StudentWithFees | null;
  isRegistrationOpen: boolean;
}

const PriorityIndicator = ({ priority }: { priority: string }) => {
  let bgClass = "bg-blue-500";
  if (priority === "URGENT") bgClass = "bg-red-500 animate-pulse";
  else if (priority === "IMPORTANT") bgClass = "bg-orange-500 animate-pulse";

  return (
    <span
      className={`block h-2.5 w-2.5 rounded-full mt-1 ${bgClass}`}
      title={priority}
    />
  );
};

const NotificationDropdown = ({ onClose }: { onClose: () => void }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await notificationService.getMyNotifications();
        setNotifications(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
      <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        <button onClick={onClose}>
          <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
        </button>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No new notifications
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                  {n.title}
                </h4>
                <PriorityIndicator priority={n.priority} />
              </div>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {n.description}
              </p>
              <span className="text-xs text-gray-400 mt-2 block">
                {new Date(n.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const StudentNavbar: React.FC<StudentNavbarProps> = ({
  studentData,
  isRegistrationOpen,
}) => {
  const navigate = useNavigate();
  const handleProfileClick = () => {
    if (studentData?.id) {
      navigate(`/student/profile/${studentData.id}`);
    }
  };

  const [isMobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();

  const [pathname, setPathName] = useState(location.pathname);

  useEffect(() => {
    setPathName(location.pathname);
    console.log(pathname);
  }, [location.pathname]);
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <span className="text-2xl font-bold text-teal-600">ACADS</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <NavLink
              to="/student"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname == "/student"
                  ? "border-b-teal-600 text-teal-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Dashboard
            </NavLink>
            {isRegistrationOpen && (
              <NavLink
                to="/student/register"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname == "/student/register"
                    ? "border-b-teal-600 text-teal-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Registration
              </NavLink>
            )}
            <NavLink
              to="/student/fees"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname == "/student/fees"
                  ? "border-b-teal-600 text-teal-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Fees
            </NavLink>
            {/* ADD CERTIFICATE LINK */}
            <NavLink
              to="/student/certificates"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname == "/student/certificates"
                  ? "border-b-teal-600 text-teal-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Certificates
            </NavLink>

            {/* Link to Bus application Form */}
            <NavLink
              to="/student/busApplication"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname == "/student/certificates"
                  ? "border-b-teal-600 text-teal-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Bus Application
            </NavLink>

            <span className="text-gray-500">|</span>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {/* Add dot if needed */}
              </button>
              {showNotifications && (
                <NotificationDropdown
                  onClose={() => setShowNotifications(false)}
                />
              )}
            </div>

            <div
              onClick={handleProfileClick}
              className="flex items-center space-x-2 cursor-pointer group"
            >
              {/* Profile Icon */}
              <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-semibold group-hover:bg-teal-700 transition">
                {studentData?.name?.charAt(0).toUpperCase() || "S"}
              </div>

              {/* Student Name */}
              <span className="text-gray-700 font-medium group-hover:text-teal-700 transition">
                {studentData?.name || "Loading..."}
              </span>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("studentAuthToken");
                navigate("/studentlogin");
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-teal-600"
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLink
              to="/student"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname == "/student"
                  ? "bg-teal-50 text-teal-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/student/fees"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname == "/student/fees"
                  ? "bg-teal-50 text-teal-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Fees
            </NavLink>
            {/* ADD CERTIFICATE LINK FOR MOBILE */}
            <NavLink
              to="/student/certificates"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname == "/student/certificates"
                  ? "bg-teal-50 text-teal-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Certificates
            </NavLink>
            <div className="border-t border-gray-200 my-2"></div>
            <div className="px-3 py-2">
              <p className="text-sm text-gray-500">Welcome,</p>
              <p className="font-medium text-gray-800">
                {studentData?.name || "Student"}
              </p>
            </div>
            <button className="w-full text-left bg-gray-100 hover:bg-gray-200 text-gray-700 block px-3 py-2 rounded-md text-base font-medium transition-colors">
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
