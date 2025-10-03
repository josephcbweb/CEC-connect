import {
  LayoutDashboard,
  UserPlus,
  Users,
  GraduationCap,
  Building,
  BookCopy,
  UserCog,
  Settings,
} from "lucide-react";
import { FaMoneyBill } from "react-icons/fa";

export const sidebarItems = [
  { icon: LayoutDashboard, text: "Dashboard", route: "/", active: true },
  { icon: UserPlus, text: "Admissions", route: "/admissions", alert: true },
  { icon: Users, text: "Students", route: "/students" },
  { icon: GraduationCap, text: "Faculty", route: "/faculty" },
  { icon: Building, text: "Departments", route: "/departments" },
  { icon: BookCopy, text: "Classes", route: "/classes" },
  { icon: UserCog, text: "Staff & Roles", route: "/staff-roles" },
  { icon: Settings, text: "Settings", route: "/settings" },
  { icon: FaMoneyBill, text: "Fee Management", route: "/fee" },
];
