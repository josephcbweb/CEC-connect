import { Route, Routes } from "react-router-dom";
import Signup from "./components/Signup";
import AdminWrapper from "./components/AdminWrapper";
import Home from "./components/admin/Home";
import AnalyticsDashboard from "./components/Landing";
import AdminFeesDashboard from "./components/fee/AdminFeeDashboard";
import AdminCertificatPage from "./components/certificate/AdminCertificatePage";

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<AdminWrapper />}>
          <Route index element={<Home />} />
          <Route path="/admin/fee" element={<AdminFeesDashboard />} />
        </Route>
        <Route path="/" element={<AnalyticsDashboard />}></Route>
      </Routes>
    </div>
  );
};

export default App;
