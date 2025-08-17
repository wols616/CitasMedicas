import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const USBLogin = ({ onUSBLogin }) => {
  const [keyCode, setKeyCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Verificar que sea un archivo .txt
    if (!file.name.toLowerCase().endsWith(".txt")) {
      Swal.fire({
        title: "Archivo inválido",
        text: "Por favor selecciona un archivo .txt",
        icon: "error",
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result.trim().toUpperCase();

      // Verificar que el contenido tenga 12 caracteres
      if (content.length === 12 && /^[A-Z0-9]+$/.test(content)) {
        setKeyCode(content);
        handleUSBSubmit(content);
      } else {
        Swal.fire({
          title: "Archivo inválido",
          text: "El archivo no contiene una clave válida",
          icon: "error",
          timer: 3000,
          showConfirmButton: false,
        });
      }
    };

    reader.readAsText(file);
  };

  const handleUSBSubmit = async (code = keyCode) => {
    if (!code || code.length !== 12) {
      Swal.fire({
        title: "Clave inválida",
        text: "La clave debe tener exactamente 12 caracteres",
        icon: "error",
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${apiUrl}/api/usb/login`, {
        keyCode: code,
      });

      // La autenticación USB es exitosa, pasar toda la respuesta
      if (onUSBLogin) {
        onUSBLogin(response.data);
      }
    } catch (error) {
      console.error("Error en login USB:", error);
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "Error al procesar la clave USB",
        icon: "error",
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = () => {
    document.getElementById("usbFileInput").click();
  };

  return (
    <div className="usb-login-component">
      <div className="text-center mb-3">
        <i className="bi bi-usb-symbol display-4 text-success"></i>
        <h6 className="mt-2 text-dark">Iniciar sesión con USB</h6>
        <p className="text-muted small">
          Selecciona el archivo clinic_key.txt de tu USB
        </p>
      </div>

      {/* Input oculto para archivos */}
      <input
        type="file"
        id="usbFileInput"
        accept=".txt"
        onChange={handleFileUpload}
        style={{ display: "none" }}
      />

      {/* Área para mostrar la clave si se ingresa manualmente */}
      <div className="mb-3">
        <label className="form-label text-dark">
          O ingresa la clave manualmente:
        </label>
        <input
          type="text"
          className="form-control text-center"
          style={{
            fontSize: "1.2rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
          value={keyCode}
          onChange={(e) => setKeyCode(e.target.value.toUpperCase())}
          maxLength="12"
          placeholder="ABCD1234EFGH"
          disabled={isLoading}
        />
      </div>

      <div className="d-grid gap-2">
        {/* Botón para seleccionar archivo */}
        <button
          className="btn btn-success"
          onClick={triggerFileInput}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
              ></span>
              Verificando...
            </>
          ) : (
            <>
              <i className="bi bi-folder-open me-2"></i>
              Seleccionar archivo USB
            </>
          )}
        </button>

        {/* Botón para login manual */}
        <button
          className="btn btn-outline-success"
          onClick={() => handleUSBSubmit()}
          disabled={isLoading || keyCode.length !== 12}
        >
          <i className="bi bi-key me-2"></i>
          Acceder con clave
        </button>
      </div>

      <div className="alert alert-info mt-3">
        <small>
          <i className="bi bi-info-circle me-2"></i>
          <strong>Instrucciones:</strong>
          <ul className="mb-0 mt-1">
            <li>Conecta tu USB con el archivo clinic_key.txt</li>
            <li>Haz clic en "Seleccionar archivo USB" y busca el archivo</li>
            <li>O ingresa manualmente el código de 12 caracteres</li>
          </ul>
        </small>
      </div>
    </div>
  );
};

export default USBLogin;
