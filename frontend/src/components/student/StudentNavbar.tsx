import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { FeeStructure, Invoice, Student } from "../../types";

// --- Type Definition ---
interface StudentWithFees extends Student {
  invoices: (Invoice & { feeStructure: FeeStructure | null })[];
}
interface StudentNavbarProps {
  studentData: StudentWithFees | null;
}
export const StudentNavbar: React.FC<StudentNavbarProps> = ({
  studentData,
}) => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const location = useLocation();

  const [pathname, setPathName] = useState(location.pathname);
  //   const getInitials = (name: string | undefined) => {
  //     if (!name) return "..";
  //     return name
  //       .split(" ")
  //       .map((n) => n[0])
  //       .join("")
  //       .toUpperCase();
  //   };
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
            <span className="text-gray-500">|</span>
            <div className="flex items-center space-x-3">
              {/* <div className="flex-shrink-0 h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center">
                <span className="text-teal-800 font-medium">
                  {getInitials(studentData?.name)}
                </span>
              </div> */}
              <span className="text-gray-700 font-medium">
                {studentData?.name || "Loading..."}
              </span>
            </div>
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
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
