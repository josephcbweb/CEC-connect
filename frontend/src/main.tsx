import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { Landing } from "./components/Landing";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* <BrowserRouter>
      <App />
    </BrowserRouter> */}
    <Landing />
  </StrictMode>
);
