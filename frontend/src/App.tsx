import { Route, Routes } from "react-router-dom";
import Signup from "./components/Signup";
import AdminWrapper from "./components/AdminWrapper";
import Home from "./components/admin/Home";
import { Landing } from "./components/Landing";
import AdminFeesPage from "./components/fee/AdminFee";
import AdminCertificatPage from "./components/certificate/AdminCertificatePage";

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<AdminWrapper />}>
          <Route index element={<Home />} />
          <Route path="/admin/fee" element={<AdminFeesPage />} />
          <Route path="/admin/certificate" element={<AdminCertificatPage />} />
        </Route>
        <Route path="/" element={<Landing />}></Route>
      </Routes>
    </div>
  );
};

export default App;
