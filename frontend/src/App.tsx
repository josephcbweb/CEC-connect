import { Route, Routes } from "react-router-dom";
import Signup from "./components/Signup";
import AdminWrapper from "./components/AdminWrapper";
import Home from "./components/admin/Home";
import { Landing } from "./components/Landing";

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<AdminWrapper />}>
          <Route index element={<Home />} />
        </Route>
        <Route path="/" element={<Landing />}></Route>
      </Routes>
    </div>
  );
};

export default App;
