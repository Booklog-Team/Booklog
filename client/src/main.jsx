import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { ShelfProvider } from "./contexts/ShelfContext";
import { PointProvider } from "./contexts/PointContext";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <ShelfProvider>
        <PointProvider>
          <App />
        </PointProvider>
      </ShelfProvider>
    </AuthProvider>
  </BrowserRouter>
);
