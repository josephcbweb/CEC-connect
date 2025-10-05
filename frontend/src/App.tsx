import { Route, Routes } from "react-router-dom";
import Signup from "./components/Signup";
import AdminWrapper from "./components/AdminWrapper";
import Home from "./components/admin/Home";
import { Landing } from "./components/Landing";
import StudentsPage from "./components/admin/StudentsPage";
import AdminFeesDashboard from "./components/fee/AdminFeeDashboard";
import AdminFeesPage from "./components/fee/AdminFeeDashboard";
import AdminCertificatPage from "./components/certificate/AdminCertificatePage";
import StudentDetails from "./components/admin/StudentDetails";

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Landing />}></Route>
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<AdminWrapper />}>
          <Route index element={<Home />} />
          <Route path="students" element={<StudentsPage />} />
            <Route path="studentDetails/:id" element={<StudentDetails/>} />
          <Route path="/admin/fee" element={<AdminFeesDashboard />} />
          <Route path="/admin/fee" element={<AdminFeesPage />} />
          <Route path="/admin/certificate" element={<AdminCertificatPage />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
