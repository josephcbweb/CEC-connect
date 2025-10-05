import { Route, Routes } from "react-router-dom";
import Admin_Login from "./components/Admin_Login";
import Student_Login from "./components/Student_Login";
import AdminWrapper from "./components/AdminWrapper";
import Home from "./components/admin/Home";
import { Landing } from "./components/Landing";
import AdminFeesDashboard from "./components/fee/AdminFeeDashboard";
import AdminFeesPage from "./components/fee/AdminFeeDashboard";
import AdminCertificatPage from "./components/certificate/AdminCertificatePage";
import StudentLayout from "./components/StudentWrapper";
import StudentDashboardPage from "./components/student/StudentDashboardPage";
import StudentFeePage from "./components/student/StudentFeePage";

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/signup" element={<Admin_Login />} />
        <Route path="/studentlogin" element={<Student_Login />} />
        <Route path="/admin" element={<AdminWrapper />}>
          <Route index element={<Home />} />
          <Route path="/admin/fee" element={<AdminFeesDashboard />} />
          <Route path="/admin/fee" element={<AdminFeesPage />} />
          <Route path="/admin/certificate" element={<AdminCertificatPage />} />
        </Route>
        <Route path="/" element={<Landing />}></Route>
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<StudentDashboardPage />} />
          <Route path="fees" element={<StudentFeePage />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
