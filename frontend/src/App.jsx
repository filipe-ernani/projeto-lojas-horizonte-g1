import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Teste from "@/pages/_Teste/Teste";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/_teste" element={<Teste />} />
        <Route path="*" element={<Navigate to="/_teste" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
