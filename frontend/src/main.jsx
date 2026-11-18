import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContextProvider";
import { FavoritosProvider } from "@/context/FavoritosContextProvider";
import { CarrinhoProvider } from "@/context/CarrinhoContextProvider";
import "./styles/tokens.css";
import "./styles/reset.css";
import "./styles/global.css";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary";
import App from "./App.jsx";

// O tema Horizonte (Decisão D-24) é inicializado no inline script do <head> do index.html para evitar FOUC.

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <FavoritosProvider>
            <CarrinhoProvider>
              <App />
            </CarrinhoProvider>
          </FavoritosProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
