import Sidebar from "./sidebar/Sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import SidebarPhone from "./sidebar/SidebarPhone";
import { jwtDecode } from "jwt-decode";
import { useEffect } from "react";

function AdminWrapper() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!token) {
      navigate("/signup");
      return;
    }
  }, []);
  const token = localStorage.getItem("authToken");
  if (!token) return;
  const tokenData = jwtDecode<{ userId: string; userName: string }>(token);

  const adminId = tokenData.userId;
  return (
    <div className="flex min-h-screen w-screen ">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="md:hidden block">
        <SidebarPhone />
      </div>
      <main className="flex-1 transition-all duration-300 ">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminWrapper;
