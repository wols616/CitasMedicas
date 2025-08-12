import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

const FaceRecognition = ({
  onFaceRecognized,
  onFaceRegistered,
  enableRegister = false,
  enableRecognize = true,
  userName = "",
  showNameInput = false,
  onNameChange = () => {},
  isLoading = false,
  setIsLoading = () => {},
}) => {
  const webcamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [faceServerStatus, setFaceServerStatus] = useState("checking");

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Verificar estado del servidor de reconocimiento facial
  useEffect(() => {
    checkFaceServerStatus();
  }, []);

  const checkFaceServerStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/face/status`);
      if (response.ok) {
        setFaceServerStatus("connected");
      } else {
        setFaceServerStatus("disconnected");
      }
    } catch (error) {
      setFaceServerStatus("disconnected");
    }
  };

  const captureAndRecognize = async () => {
    if (faceServerStatus !== "connected") {
      alert("El servidor de reconocimiento facial no está disponible");
      return;
    }

    setIsLoading(true);
    try {
      const screenshot = webcamRef.current.getScreenshot();
      if (!screenshot) {
        throw new Error("No se pudo capturar la imagen");
      }

      const blob = await fetch(screenshot).then((res) => res.blob());
      const formData = new FormData();
      formData.append("image", blob, "capture.jpg");

      const response = await fetch(`${API_BASE_URL}/api/recognize`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error en el servidor");
      }

      const data = await response.json();
      if (onFaceRecognized) {
        onFaceRecognized(data);
      }
    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "Error al procesar la imagen");
    } finally {
      setIsLoading(false);
    }
  };

  const captureAndRegister = async () => {
    if (!userName.trim()) {
      alert("Por favor proporciona un nombre para registrar");
      return;
    }

    if (faceServerStatus !== "connected") {
      alert("El servidor de reconocimiento facial no está disponible");
      return;
    }

    setIsLoading(true);
    try {
      const screenshot = webcamRef.current.getScreenshot();
      if (!screenshot) {
        throw new Error("No se pudo capturar la imagen");
      }

      const blob = await fetch(screenshot).then((res) => res.blob());
      const formData = new FormData();
      formData.append("image", blob, `${userName}.jpg`);
      formData.append("name", userName);

      const response = await fetch(`${API_BASE_URL}/api/face/register`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al registrar el rostro");
      }

      const data = await response.json();
      if (onFaceRegistered) {
        onFaceRegistered(data);
      }
    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "Error al registrar el rostro");
      throw error; // Re-lanzar para que el componente padre pueda manejarlo
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImage = () => {
    if (!userName.trim()) {
      alert("Por favor proporciona un nombre para registrar");
      return;
    }

    if (faceServerStatus !== "connected") {
      alert("El servidor de reconocimiento facial no está disponible");
      return;
    }

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";

    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append("image", file, `${userName}.jpg`);
        formData.append("name", userName);

        const response = await fetch(`${API_BASE_URL}/api/face/register`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al subir la imagen");
        }

        const data = await response.json();
        if (onFaceRegistered) {
          onFaceRegistered(data);
        }
      } catch (error) {
        console.error("Error:", error);
        alert(error.message || "Error al subir la imagen");
        throw error;
      } finally {
        setIsLoading(false);
      }
    };

    fileInput.click();
  };

  const toggleCamera = () => {
    setCameraActive(!cameraActive);
  };

  if (faceServerStatus === "checking") {
    return (
      <div className="text-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Verificando servidor...</span>
        </div>
        <p className="mt-2">Verificando servidor de reconocimiento facial...</p>
      </div>
    );
  }

  if (faceServerStatus === "disconnected") {
    return (
      <div className="alert alert-warning text-center">
        <i className="bi bi-exclamation-triangle fs-3 mb-2"></i>
        <h5>Servidor de reconocimiento facial no disponible</h5>
        <p className="mb-3">
          El sistema de reconocimiento facial no está disponible en este
          momento. Puede continuar con el registro tradicional.
        </p>
        <button
          className="btn btn-outline-warning btn-sm"
          onClick={checkFaceServerStatus}
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          Reintentar conexión
        </button>
      </div>
    );
  }

  return (
    <div className="face-recognition-component">
      <div className="text-center mb-3">
        <div className="position-relative d-inline-block">
          {cameraActive ? (
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width={280}
              height={210}
              className="rounded border border-primary"
              videoConstraints={{ facingMode: "user" }}
            />
          ) : (
            <div
              className="d-flex align-items-center justify-content-center bg-dark rounded border border-primary"
              style={{ width: 280, height: 210 }}
            >
              <span className="text-white">Cámara desactivada</span>
            </div>
          )}
          <button
            onClick={toggleCamera}
            className="btn btn-sm btn-outline-secondary position-absolute top-0 end-0 m-1"
            style={{ fontSize: "12px" }}
          >
            {cameraActive ? (
              <i className="bi bi-camera-video-off"></i>
            ) : (
              <i className="bi bi-camera-video"></i>
            )}
          </button>
        </div>
      </div>

      {showNameInput && (
        <div className="mb-3">
          <label htmlFor="faceUserName" className="form-label">
            Nombre para registrar rostro
          </label>
          <input
            type="text"
            id="faceUserName"
            className="form-control"
            placeholder="Nombres y apellidos"
            value={userName}
            onChange={(e) => onNameChange(e.target.value)}
            disabled={isLoading}
          />
        </div>
      )}

      <div className="d-grid gap-2">
        {enableRecognize && (
          <button
            className="btn btn-success"
            onClick={captureAndRecognize}
            disabled={isLoading || !cameraActive}
          >
            {isLoading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Reconociendo...
              </>
            ) : (
              <>
                <i className="bi bi-person-check me-2"></i>
                Reconocer rostro
              </>
            )}
          </button>
        )}

        {enableRegister && (
          <>
            <button
              className="btn btn-primary"
              onClick={captureAndRegister}
              disabled={isLoading || !cameraActive || !userName.trim()}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Registrando...
                </>
              ) : (
                <>
                  <i className="bi bi-camera me-2"></i>
                  Registrar con cámara
                </>
              )}
            </button>

            <button
              className="btn btn-outline-primary"
              onClick={uploadImage}
              disabled={isLoading || !userName.trim()}
            >
              <i className="bi bi-upload me-2"></i>
              Subir imagen
            </button>
          </>
        )}
      </div>

      <div className="text-center mt-2">
        <small className="text-muted">
          Estado del servidor:
          <span className="badge bg-success ms-1">Conectado</span>
        </small>
      </div>
    </div>
  );
};

export default FaceRecognition;
