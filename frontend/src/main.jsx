import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContextProvider";
import "./styles/tokens.css";
import "./styles/reset.css";
import "./styles/global.css";
import App from "./App.jsx";

// O tema Horizonte (Decisão D-24) é inicializado no inline script do <head> do index.html para evitar FOUC.

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
