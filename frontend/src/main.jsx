import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContextProvider";
import "./styles/tokens.css";
import "./styles/reset.css";
import "./styles/global.css";
import App from "./App.jsx";

// Inicializa o tema Horizonte (Decisão D-24) antes do primeiro render
try {
  const temaSalvo = localStorage.getItem("horizonte-theme");
  const prefereEscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const temaInicial = temaSalvo || (prefereEscuro ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", temaInicial);
} catch {
  // Ignora se localStorage ou matchMedia falharem
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
