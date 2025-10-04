import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  FaHome,
  FaBookOpen,
  FaCalendarAlt,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaAngleLeft,
  FaMoneyBill,
  FaCross,
  FaCrosshairs,
} from "react-icons/fa";

const navItems = [
  { name: "Dashboard", icon: <FaHome /> },
  { name: "Courses", icon: <FaBookOpen /> },
  { name: "Schedule", icon: <FaCalendarAlt /> },
  { name: "Certificate", icon: <FaBookOpen /> },
  { name: "Fee Management", icon: <FaMoneyBill /> },
];

const variants = {
  closed: { y: "-100%", opacity: 0 },
  open: { y: "0", opacity: 1 },
};

const SidebarPhone = () => {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    handleResize(); // Set initial state
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <div className="absolute top-5 right-8 z-10">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full hover:bg-slate-700"
        >
          {isOpen ? <FaCrosshairs color="white" /> : <FaBars />}
        </button>
      </div>
      <motion.div
        initial={"closed"}
        animate={isOpen ? "open" : "closed"}
        variants={variants}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="h-screen bg-slate-800 text-gray-100 flex flex-col absolute z-5 w-full"
      >
        <div
          className={`flex items-center h-16 px-6 ${
            isOpen ? "justify-between" : "justify-center"
          }`}
        >
          <h1 className="text-xl font-bold whitespace-nowrap">Acads</h1>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <a
              href="#"
              key={item.name}
              className="flex items-center p-3 rounded-lg hover:bg-slate-700 transition-colors h-13"
            >
              <div className="text-xl">{item.icon}</div>
              {isOpen && (
                <span className="ml-4 font-medium whitespace-nowrap">
                  {item.name}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className="px-4 py-4 border-t border-slate-700">
          <a
            href="#"
            className="flex items-center rounded-lg hover:bg-slate-700 transition-colors h-13 justify-center"
          >
            <div className="text-xl">
              <FaCog />
            </div>
            {isOpen && (
              <span className="ml-4 font-medium whitespace-nowrap">
                Settings
              </span>
            )}
          </a>
          <a
            href="#"
            className="flex items-center rounded-lg hover:bg-slate-700 transition-colors h-13 justify-center"
          >
            <div className="text-xl">
              <FaSignOutAlt />
            </div>
            {isOpen && (
              <span className="ml-4 font-medium whitespace-nowrap">Logout</span>
            )}
          </a>
        </div>
      </motion.div>
    </>
  );
};

export default SidebarPhone;
