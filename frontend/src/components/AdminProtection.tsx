import { Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export const ProtectedRoute = () => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    return <Navigate to="/signup" replace />;
  }

  try {
    const tokenData = jwtDecode<{ userId: string; userName: string }>(token);
    if (!tokenData) throw Error("Access Denied");
    return <Outlet />;
  } catch (err) {
    return <Navigate to="/signup" replace />;
  }
};
