import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ rolesPermitidos, children }) => {
  const [isValid, setIsValid] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "user" && !localStorage.getItem("user")) {
        setIsValid(false);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  if (!user || !isValid) {
    // No autenticado o sesión cerrada en otra pestaña
    return <Navigate to="/" replace />;
  }

  if (!rolesPermitidos.includes(user.rol)) {
    // No tiene el rol requerido
    return <Navigate to="/" replace />;
  }

  // Autenticado y con rol permitido
  return children;
};

export default ProtectedRoute;