import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const ReloadFacesButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  const reloadFaces = async () => {
    setIsLoading(true);
    try {
      await axios.post(`${apiUrl}/reload-faces`);

      Swal.fire({
        title: "¡Éxito!",
        text: "Los rostros conocidos han sido recargados exitosamente",
        icon: "success",
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text:
          error.response?.data?.message ||
          "Error al recargar rostros conocidos",
        icon: "error",
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className="btn btn-outline-info btn-sm d-none"
      onClick={reloadFaces}
      disabled={isLoading}
      title="Recargar rostros conocidos para reconocimiento facial"
    >
      {isLoading ? (
        <>
          <span
            className="spinner-border spinner-border-sm me-1"
            role="status"
          ></span>
          Recargando...
        </>
      ) : (
        <>
          <i className="bi bi-arrow-clockwise me-1"></i>
          Recargar Rostros
        </>
      )}
    </button>
  );
};

export default ReloadFacesButton;
