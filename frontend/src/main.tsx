import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="bg-amber-400 h-screen w-full flex text-3xl justify-center items-center">
      Hlooo
    </div>
  </StrictMode>
);
