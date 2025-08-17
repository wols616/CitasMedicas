import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const USBKeyManager = () => {
  const [hasUSBKey, setHasUSBKey] = useState(false);
  const [keyCode, setKeyCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    checkUSBKey();
  }, []);

  const checkUSBKey = async () => {
    try {
      const response = await axios.post(`${apiUrl}/api/usb/check-key`, {
        id_usuario: user.id_usuario,
      });
      setHasUSBKey(response.data.hasUSBKey);
      if (response.data.hasUSBKey) {
        setKeyCode(response.data.keyCode);
      }
    } catch (error) {
      console.error("Error verificando clave USB:", error);
    }
  };

  const generateUSBKey = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${apiUrl}/api/usb/generate-key`, {
        id_usuario: user.id_usuario,
      });

      setKeyCode(response.data.keyCode);
      setHasUSBKey(true);

      // Mostrar la clave y ofrecer descarga
      Swal.fire({
        title: "¡Clave USB generada!",
        html: `
          <div style="text-align: left;">
            <p><strong>Tu clave USB es:</strong></p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 1.2rem; text-align: center; letter-spacing: 0.2em;">
              ${response.data.keyCode}
            </div>
            <p style="margin-top: 15px;"><strong>Instrucciones:</strong></p>
            <ol style="margin: 10px 0;">
              <li>Copia este código</li>
              <li>Crea un archivo llamado "<strong>clinic_key.txt</strong>" en tu USB</li>
              <li>Pega este código en el archivo y guárdalo</li>
              <li>Ya podrás usar tu USB para iniciar sesión</li>
            </ol>
            <p style="color: #dc3545; margin-top: 15px;"><strong>¡Importante!</strong> Guarda esta clave en tu USB. No se volverá a mostrar.</p>
          </div>
        `,
        icon: "success",
        confirmButtonText: "Descargar archivo",
        showCancelButton: true,
        cancelButtonText: "Entendido",
        allowOutsideClick: false,
      }).then((result) => {
        if (result.isConfirmed) {
          downloadKeyFile(response.data.keyCode);
        }
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "No se pudo generar la clave USB",
        icon: "error",
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadKeyFile = (code) => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clinic_key.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const disableUSBKey = async () => {
    const result = await Swal.fire({
      title: "¿Desactivar clave USB?",
      text: "Ya no podrás usar tu USB para iniciar sesión",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, desactivar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      setIsLoading(true);
      try {
        await axios.post(`${apiUrl}/api/usb/disable-key`, {
          id_usuario: user.id_usuario,
        });

        setHasUSBKey(false);
        setKeyCode("");

        Swal.fire({
          title: "Clave desactivada",
          text: "Tu clave USB ha sido desactivada",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          title: "Error",
          text: "No se pudo desactivar la clave USB",
          icon: "error",
          timer: 3000,
          showConfirmButton: false,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-6 mx-auto">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-usb-symbol me-2"></i>
                Configuración de USB
              </h5>
            </div>

            <div className="card-body text-center">
              {!hasUSBKey ? (
                <>
                  <i className="bi bi-usb-symbol display-1 text-muted mb-3"></i>
                  <h6>No tienes una clave USB configurada</h6>
                  <p className="text-muted mb-4">
                    Genera una clave para poder iniciar sesión con tu USB
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={generateUSBKey}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>
                        Generando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-plus-circle me-2"></i>
                        Generar clave USB
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <i className="bi bi-usb-symbol display-1 text-success mb-3"></i>
                  <h6 className="text-success">Clave USB configurada</h6>
                  <p className="text-muted mb-3">
                    Ya puedes usar tu USB para iniciar sesión
                  </p>

                  <div className="bg-light p-3 rounded mb-3">
                    <small className="text-muted">Tu clave actual:</small>
                    <div
                      className="fw-bold"
                      style={{ letterSpacing: "0.2em", fontSize: "1.1rem" }}
                    >
                      {keyCode}
                    </div>
                  </div>

                  <div className="d-grid gap-2">
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => downloadKeyFile(keyCode)}
                    >
                      <i className="bi bi-download me-2"></i>
                      Descargar archivo
                    </button>

                    <button
                      className="btn btn-outline-danger"
                      onClick={disableUSBKey}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          ></span>
                          Desactivando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-x-circle me-2"></i>
                          Desactivar clave
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="alert alert-info mt-3">
            <i className="bi bi-info-circle me-2"></i>
            <strong>¿Cómo funciona?</strong>
            <ul className="mb-0 mt-2">
              <li>Se genera un código único de 12 caracteres</li>
              <li>Guardas este código en un archivo .txt en tu USB</li>
              <li>
                En el login, seleccionas este archivo o ingresas el código
              </li>
              <li>Simple, rápido y seguro</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default USBKeyManager;
