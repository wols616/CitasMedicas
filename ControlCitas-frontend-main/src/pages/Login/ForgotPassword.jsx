import React, { useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [correo, setCorreo] = useState("");
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  // Expresión regular básica para validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!correo) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Por favor, ingresa tu correo.",
      });
      return;
    }
    if (!emailRegex.test(correo)) {
      Swal.fire({
        icon: "error",
        title: "Correo inválido",
        text: "Por favor, ingresa un correo electrónico válido.",
      });
      return;
    }
    try {
      await axios.post(`${apiUrl}/api/usuarios/recuperarContrasena`, { correo });
      Swal.fire({
        icon: "success",
        title: "¡Listo!",
        text: "Revisa tu correo para instrucciones de recuperación de contraseña.",
        timer: 3000,
        showConfirmButton: false,
      });
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "No se pudo recuperar la contraseña.",
      });
    }
  };

  return (
    <div className="fondo">
      <div className="login-container">
        <section className="login-section">
          <h2 className="text-center text-dark mb-3">Recuperar contraseña</h2>
          <form onSubmit={handleSubmit}>
            <input
              className="form-control mb-3"
              type="email"
              placeholder="Correo electrónico"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              autoComplete="email"
              required
            />
            <button type="submit" className="btn btn-primary fw-bold px-4 mb-2">
              Recuperar contraseña
            </button>
            <button
              type="button"
              className="btn btn-secondary fw-bold px-4 ms-2 mb-2"
              onClick={() => navigate("/")}
            >
              Volver
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ForgotPassword;