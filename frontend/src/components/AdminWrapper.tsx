import Sidebar from "./sidebar/Sidebar";
import { Outlet } from "react-router-dom";
import SidebarPhone from "./sidebar/SidebarPhone";

function AdminWrapper() {
  return (
    <div className="flex min-h-screen w-screen">
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
