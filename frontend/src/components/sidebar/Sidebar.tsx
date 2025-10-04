import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building,
  BookCopy,
  UserCog,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Menu,
} from "lucide-react";

// Define the structure for a sidebar item
interface SidebarItemProps {
  icon: React.ElementType;
  text: string;
  active?: boolean;
  alert?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps & { collapsed: boolean }> = ({
  icon: Icon,
  text,
  active,
  collapsed,
  onClick,
}) => {
  return (
    <li
      onClick={onClick}
      className={`
        relative flex items-center py-3 px-4 my-1 h-12
        font-medium rounded-lg cursor-pointer
        transition-colors group
        ${
          active
            ? "bg-gradient-to-tr from-indigo-200 to-indigo-100 text-indigo-800"
            : "hover:bg-gray-300 text-gray-600"
        }
    `}
    >
      <div className="w-6 h-6 flex items-center justify-center">
        <Icon size={20} />
      </div>
      <span
        className={`overflow-hidden transition-all ${
          collapsed ? "w-0" : "w-52 ml-3"
        }`}
      >
        {text}
      </span>
    </li>
  );
};

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const sidebarItems = [
    { icon: LayoutDashboard, text: "Dashboard", active: true, path: "/admin" },
    {
      icon: UserPlus,
      text: "Admissions",
      alert: true,
      path: "/admin/admissions",
    },
    { icon: Users, text: "Students", path: "/admin/students" },
    { icon: GraduationCap, text: "Faculty", path: "/admin/faculty" },
    { icon: Building, text: "Departments", path: "/admin/departments" },
    { icon: BookCopy, text: "Classes", path: "/admin/classes" },
    { icon: UserCog, text: "Staff & Roles", path: "/admin/staffs" },
    { icon: Settings, text: "Settings", path: "/admin/settings" },
  ];

  const handleItemClick = (item: { text: string; path: string }) => {
    navigate(item.path);
  };

  return (
    <aside className="h-screen sticky top-0">
      <nav
        className={`h-full flex flex-col shadow-lg transition-all duration-300 ease-in-out ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div
          className={`p-4 pb-2 flex items-center ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          <span
            className={`overflow-hidden transition-all font-bold text-2xl text-gray-800 ${
              collapsed ? "w-0" : "w-32"
            }`}
          >
            ACADS
          </span>
          <button
            onClick={() => setCollapsed((curr) => !curr)}
            className="p-1 rounded-[.7rem] cursor-pointer "
          >
            {collapsed ? <Menu /> : <ChevronLeft color="black" />}
          </button>
        </div>
        <div className="px-4">
          <hr className="my-2 border-gray-300" />
        </div>

        <ul className="flex-1 px-3 mt-5">
          {sidebarItems.map((item, index) => (
            <SidebarItem
              key={index}
              icon={item.icon}
              text={item.text}
              active={location.pathname === item.path}
              collapsed={collapsed}
              onClick={() => handleItemClick(item)}
            />
          ))}
        </ul>

        <div className="px-3">
          <hr className="my-2 border-gray-300" />
          <SidebarItem icon={LogOut} text="Logout" collapsed={collapsed} />
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
