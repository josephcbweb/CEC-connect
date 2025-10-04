import { useState } from "react";
import { ChevronLeft, LogOut, Menu, BookOpen } from "lucide-react";
import { sidebarItems } from "../../utilities/sidebarItems";
import SidebarItem from "./SideBarItem";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("Dashboard");

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
              active={activeItem === item.text}
              collapsed={collapsed}
              route={`/admin${item.route}`}
              onClick={() => setActiveItem(item.text)}
            />
          ))}
        </ul>

        <div className="px-3">
          <hr className="my-2 border-gray-300" />
          <SidebarItem
            route=""
            icon={LogOut}
            text="Logout"
            collapsed={collapsed}
          />
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
