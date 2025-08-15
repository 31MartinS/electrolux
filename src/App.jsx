import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import SpinWheel from "./pages/SpinWheel.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        {/* Ruta principal */}
        <Route path="/spin" element={<SpinWheel/>} />
        {/* Alias para compatibilidad con tu navegación actual */}
        <Route path="/ruleta" element={<SpinWheel/>} />
        {/* (Opcional) catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
