import {
  LayoutDashboard,
  UserPlus,
  Users,
  GraduationCap,
  Building,
  BookCopy,
  BookOpen,
  UserCog,
  Settings,
  Settings2Icon,
} from "lucide-react";
import { FaMoneyBill } from "react-icons/fa";

export const sidebarItems = [
  { icon: LayoutDashboard, text: "Dashboard", route: "", active: true },
  { icon: Users, text: "Students", route: "/students" },
  { icon: FaMoneyBill, text: "Fee Management", route: "/fee" },
  { icon: BookOpen, text: "Certificates", route: "/certificate" },
  { icon: Building, text: "Departments", route: "/departments" },
  { icon: UserPlus, text: "Admissions", route: "/admissions", alert: true },
  // { icon: GraduationCap, text: "Faculty", route: "/faculty" },
  // { icon: BookCopy, text: "Classes", route: "/classes" },
  { icon: UserCog, text: "Staff & Roles", route: "/staff-roles" },
  { icon: Settings2Icon, text: "Settings", route: "/settings" },
];
