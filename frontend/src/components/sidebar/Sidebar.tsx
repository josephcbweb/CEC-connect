import { useEffect, useState } from "react";
import { ChevronLeft, LogOut, Menu } from "lucide-react";
import { sidebarItems } from "../../utilities/sidebarItems";
import SidebarItem from "./SideBarItem";
import { useLocation, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();
  const [activeItem, setActiveItem] = useState(location.pathname);
  const navigate = useNavigate();
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      const user = JSON.parse(userString);
      // user.role and user.permission are arrays of strings based on AuthService
      const roles =
        user.role && Array.isArray(user.role)
          ? user.role.map((r: string) => r.toLowerCase())
          : [user.role?.toLowerCase() || "guest"];

      const permissions = user.permission && Array.isArray(user.permission)
        ? user.permission
        : [];

      setUserPermissions(permissions);

      if (roles.includes("library_staff") || roles.includes("librarian")) {
        setUserRole("Librarian");
      } else if (roles.includes("admin") || roles.includes("super admin")) {
        setUserRole("Admin");
      } else if (roles.includes("staff") || roles.includes("faculty") || roles.includes("accounts_staff")) {
        setUserRole("Staff");
      } else {
        setUserRole(roles[0] || "guest"); // No default to Admin!
      }
    }
  }, []);

  useEffect(() => {
    setActiveItem(location.pathname);
  }, [location.pathname]);

  const filteredItems = sidebarItems.filter((item: any) => {
    // 1. If user is Admin, they see everything
    if (userRole === "Admin") {
      return true;
    }

    // 2. If the item has a permission requirement, check if the user has it
    if (item.permission) {
      return userPermissions.includes(item.permission);
    }

    // 3. For items without a permission field, show them by default 
    // (This includes basic sections like Dashboard, Notifications, etc.)
    return true;
  });

  return (
    <aside className="h-screen sticky top-0">
      <nav
        className={`h-full flex flex-col shadow-lg transition-all duration-300 ease-in-out ${collapsed ? "w-20" : "w-64"
          }`}
      >
        <div
          className={`p-4 pb-2 flex items-center ${collapsed ? "justify-center" : "justify-between"
            }`}
        >
          <span
            className={`overflow-hidden transition-all font-bold text-2xl text-gray-800 ${collapsed ? "w-0" : "w-32"
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
