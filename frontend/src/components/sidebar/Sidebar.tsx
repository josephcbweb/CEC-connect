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
} from "react-icons/fa";

const navItems = [
  { name: "Dashboard", icon: <FaHome /> },
  { name: "Courses", icon: <FaBookOpen /> },
  { name: "Schedule", icon: <FaCalendarAlt /> },
  { name: "Fee Management", icon: <FaMoneyBill /> },
];

const variants = {
  open: { width: "16rem" },
  closed: { width: "5rem" },
};

const Sidebar = () => {
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
    <motion.div
      animate={isOpen ? "open" : "closed"}
      variants={variants}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-screen bg-slate-800 text-gray-100 flex flex-col absolute md:relative z-10"
    >
      <div
        className={`flex items-center h-16 px-6 ${
          isOpen ? "justify-between" : "justify-center"
        }`}
      >
        {isOpen && (
          <h1 className="text-xl font-bold whitespace-nowrap">CECConnect</h1>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full hover:bg-slate-700"
        >
          {isOpen ? <FaAngleLeft /> : <FaBars />}
        </button>
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
            <span className="ml-4 font-medium whitespace-nowrap">Settings</span>
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
  );
};

export default Sidebar;
