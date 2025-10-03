import React from "react";
import { Link } from "react-router-dom";

// Define the structure for a sidebar item
interface SidebarItemProps {
  icon: React.ElementType;
  text: string;
  active?: boolean;
  alert?: boolean;
  route: string;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps & { collapsed: boolean }> = ({
  icon: Icon,
  text,
  active,
  collapsed,
  route,
  onClick,
}) => {
  return (
    <Link to={route}>
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
          className={`overflow-hidden transition-all text-ellipsis whitespace-nowrap ${
            collapsed ? "w-0" : "w-52 ml-3"
          }`}
        >
          {text}
        </span>
      </li>
    </Link>
  );
};

export default SidebarItem;
