import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary";
import Layout from "@/components/Layout/Layout";
import PrivateRoute from "@/components/PrivateRoute/PrivateRoute";
import Home from "@/pages/Home/Home";
import Catalogo from "@/pages/Catalogo/Catalogo";
import Produto from "@/pages/Produto/Produto";
import Login from "@/pages/Login/Login";
import Favoritos from "@/pages/Favoritos/Favoritos";
import Carrinho from "@/pages/Carrinho/Carrinho";
import Checkout from "@/pages/Checkout/Checkout";
import Perfil from "@/pages/Perfil/Perfil";
import Pedidos from "@/pages/Pedidos/Pedidos";
import Institucional from "@/pages/Institucional/Institucional";
import Privacidade from "@/pages/Privacidade/Privacidade";
import Termos from "@/pages/Termos/Termos";
import Cookies from "@/pages/Cookies/Cookies";

function App() {
  const location = useLocation();

  return (
    <ErrorBoundary resetKey={location.pathname}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/produto/:id" element={<Produto />} />
          <Route path="/institucional" element={<Institucional />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/cookies" element={<Cookies />} />

          <Route element={<PrivateRoute />}>
            <Route path="/favoritos" element={<Favoritos />} />
            <Route path="/carrinho" element={<Carrinho />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/pedidos" element={<Pedidos />} />
          </Route>
        </Route>

        <Route
          path="/checkout"
          element={
            <PrivateRoute>
              <Checkout />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
