import { useEffect, useState } from "react";
import { ChevronLeft, LogOut, Menu, BookOpen } from "lucide-react";
import { sidebarItems } from "../../utilities/sidebarItems";
import SidebarItem from "./SideBarItem";
import { useLocation, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();
  const [activeItem, setActiveItem] = useState(location.pathname);
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      const user = JSON.parse(userString);
      // user.role is an array of strings based on AuthService
      const roles =
        user.role && Array.isArray(user.role)
          ? user.role
          : [user.role || "Admin"];

      if (roles.includes("Librarian")) {
        setUserRole("Librarian");
      } else if (roles.includes("Admin") || roles.includes("Super Admin")) {
        setUserRole("Admin");
      } else if (roles.includes("Staff") || roles.includes("Faculty")) {
        setUserRole("Staff");
      } else {
        setUserRole("Admin"); // Default fallback
      }
    }
  }, []);

  useEffect(() => {
    setActiveItem(location.pathname);
  }, [location.pathname]);

  const filteredItems = sidebarItems.filter((item) => {
    if (userRole === "Librarian") {
      return item.text === "Due Management";
    }
    if (userRole === "Staff") {
      // Staff assigned to subjects can see Due Management.
      // They might need Dashboard or others, but definitely not Settings.
      // Based on request "won't have access to settings", implying maybe others are OK?
      // But "clear dues for... subject assigned... won't have access to settings" suggest a limited role.
      // Let's allow Due Management and Dashboard.
      const allowed = ["Dashboard", "Due Management"];
      return allowed.includes(item.text);
    }
    return true;
  });

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
          {filteredItems.map((item, index) => (
            <SidebarItem
              key={index}
              icon={item.icon}
              text={item.text}
              active={activeItem === `/admin${item.route}`}
              collapsed={collapsed}
              route={`/admin${item.route}`}
              onClick={() => setActiveItem(item.text)}
            />
          ))}
        </ul>

        <div className="px-3">
          <hr className="my-2 border-gray-300" />
          <SidebarItem
            route="/signup"
            icon={LogOut}
            text="Logout"
            collapsed={collapsed}
            onClick={() => {
              localStorage.removeItem("authToken");
              localStorage.removeItem("user");
              navigate("/signup");
            }}
          />
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
