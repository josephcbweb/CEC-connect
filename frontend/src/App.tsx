import { Route, Routes } from "react-router-dom";
import MobileGuard from "./components/MobileGuard";
import Admin_Login from "./components/Admin_Login";
import Student_Login from "./components/Student_Login";
import AdminWrapper from "./components/AdminWrapper";
import Home from "./components/admin/Home";
import { Landing } from "./components/Landing";
import StudentsPage from "./components/admin/StudentsPage";
import AdminFeesDashboard from "./components/fee/AdminFeeDashboard";
import AdminFeesPage from "./components/fee/AdminFeeDashboard";
import StaffCertificatePage from "./components/certificate/StaffCertificatePage";
import StudentDetails from "./components/admin/StudentDetails";
import StudentCertificatePage from "./components/certificate/StudentCertificatePage";
import StudentLayout from "./components/StudentWrapper";
import StudentDashboardPage from "./components/student/StudentDashboardPage";
import StudentFeePage from "./components/student/StudentFeePage";
import StaffRolesPage from "./components/staff-roles/StaffRolesPage";
import AdmissionsPage from "./components/admin/admissions/AdmissionsPage";
import DepartmentDashboard from "./components/department/DepartmentDashboard";
import StudentProfile from "./components/student/StudentProfile";
import SemesterRegister from "./components/student/SemesterRegister";
import BusManagement from "./components/bus/BusManagement";
import ForgotPassword from "./components/ForgotPassword";
import BusDetailsDashboard from "./components/bus/BusDetails";
import BusRequest from "./components/student/BusRequestPage";
import CourseManager from "./components/admin/courses/CourseManager";
import DueManager from "./components/noDue/DueManager";
import BatchRegistry from "./components/admin/batches/BatchRegistry";
import BatchDetail from "./components/admin/batches/BatchDetail";
import NotificationManager from "./components/admin/notifications/NotificationManager";
import HostelPage from "./components/hostel/HostelPage";
import AnalyticsPage from "./components/analytics/AnalyticsPage";
import AuditLogPage from "./components/audit/AuditLogPage";

const App = () => {
  return (
    <MobileGuard>
      <Routes>
        <Route path="/" element={<Landing />}></Route>
        <Route path="/signup" element={<Admin_Login />} />
        <Route path="/studentlogin" element={<Student_Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin" element={<AdminWrapper />}>
          <Route index element={<Home />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="studentDetails/:id" element={<StudentDetails />} />
          <Route path="/admin/fee" element={<AdminFeesDashboard />} />
          <Route path="/admin/fee" element={<AdminFeesPage />} />
          <Route path="/admin/certificate" element={<StaffCertificatePage />} />
          <Route path="/admin/staff-roles" element={<StaffRolesPage />} />
          <Route path="admissions" element={<AdmissionsPage />} />
          <Route path="/admin/departments" element={<DepartmentDashboard />} />
          <Route path="/admin/bus" element={<BusManagement />} />
          <Route path="/admin/bus/:id" element={<BusDetailsDashboard />} />{" "}
          <Route path="/admin/courses" element={<CourseManager />} />{" "}
          <Route path="/admin/dues" element={<DueManager />} />{" "}
          <Route path="/admin/batches" element={<BatchRegistry />} />
          <Route path="/admin/batches/:id" element={<BatchDetail />} />
          <Route
            path="/admin/notifications"
            element={<NotificationManager />}
          />
          <Route path="/admin/hostel" element={<HostelPage />} />
          <Route path="/admin/analytics" element={<AnalyticsPage />} />
          <Route path="/admin/audit-logs" element={<AuditLogPage />} />
        </Route>
        <Route path="/" element={<Landing />}></Route>
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<StudentDashboardPage />} />
          <Route path="register" element={<SemesterRegister />} />
          <Route path="fees" element={<StudentFeePage />} />
          <Route path="certificates" element={<StudentCertificatePage />} />
          <Route path="busApplication" element={<BusRequest />} />
          <Route path="profile/:id" element={<StudentProfile />} />
        </Route>
      </Routes>
    </MobileGuard>
  );
};

export default App;
