import Sidebar from "./sidebar/Sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import SidebarPhone from "./sidebar/SidebarPhone";
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
