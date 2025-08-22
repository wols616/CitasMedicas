import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const RenamePhotoButton = ({
  oldName,
  newName,
  onRenameSuccess,
  size = "sm",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleRenamePhoto = async () => {
    if (!oldName || !newName) {
      Swal.fire({
        title: "Error",
        text: "Faltan datos para renombrar la foto",
        icon: "error",
      });
      return;
    }

    if (oldName === newName) {
      Swal.fire({
        title: "Sin cambios",
        text: "El nombre actual y el nuevo son iguales",
        icon: "info",
      });
      return;
    }

    const result = await Swal.fire({
      title: "¿Renombrar foto facial?",
      text: `¿Deseas cambiar el nombre de la foto de "${oldName}" a "${newName}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, renombrar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    setIsLoading(true);
    try {
      const response = await axios.post(`${apiUrl}/api/face/rename`, {
        old_name: oldName,
        new_name: newName,
      });

      Swal.fire({
        title: "Éxito",
        text: response.data.message || "Foto renombrada exitosamente",
        icon: "success",
        timer: 3000,
        showConfirmButton: false,
      });

      if (onRenameSuccess) {
        onRenameSuccess(oldName, newName);
      }
    } catch (error) {
      console.error("Error al renombrar foto:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.details ||
        "Error al renombrar la foto";

      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`btn btn-outline-warning btn-${size}`}
      onClick={handleRenamePhoto}
      disabled={isLoading || !oldName || !newName || oldName === newName}
      title={`Renombrar foto de "${oldName}" a "${newName}"`}
    >
      {isLoading ? (
        <>
          <span
            className="spinner-border spinner-border-sm me-1"
            role="status"
          ></span>
          Renombrando...
        </>
      ) : (
        <>
          <i className="bi bi-arrow-repeat me-1"></i>
          {size === "sm" ? "Renombrar foto" : "Renombrar fotografía facial"}
        </>
      )}
    </button>
  );
};

export default RenamePhotoButton;
