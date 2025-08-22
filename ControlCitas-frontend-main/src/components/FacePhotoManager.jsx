import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Webcam from "react-webcam";

const FacePhotoManager = () => {
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);

  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  const apiUrl = import.meta.env.VITE_API_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const nombreCompleto = user ? `${user.nombres} ${user.apellidos}` : "";

  useEffect(() => {
    checkIfPhotoExists();
  }, []);

  const checkIfPhotoExists = async () => {
    try {
      // Verificar si existe la foto en el servidor Flask
      const response = await axios.get(
        `http://localhost:5001/photo-exists/${nombreCompleto}`
      );
      setHasPhoto(response.data.exists);
      if (response.data.exists) {
        setCurrentPhoto(`http://localhost:5001/get-photo/${nombreCompleto}`);
      }
    } catch (error) {
      console.log("No se pudo verificar la foto existente");
      setHasPhoto(false);
    }
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      updateFacePhoto(imageSrc, "camera");
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateFacePhoto(e.target.result, "file", file);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateFacePhoto = async (imageData, source, file = null) => {
    setIsLoading(true);
    try {
      const formData = new FormData();

      if (source === "camera") {
        // Convertir base64 a blob
        const response = await fetch(imageData);
        const blob = await response.blob();
        formData.append("image", blob, "webcam-photo.jpg");
      } else {
        formData.append("image", file);
      }

      formData.append("name", nombreCompleto);

      let endpoint = hasPhoto ? "/update" : "/register";
      const response = await axios.post(
        `http://localhost:5001${endpoint}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (
        response.data.message.includes("exitosamente") ||
        response.data.message.includes("correctamente")
      ) {
        Swal.fire({
          title: "¡Éxito!",
          text: hasPhoto
            ? "Fotografía actualizada correctamente"
            : "Fotografía registrada exitosamente",
          icon: "success",
          timer: 3000,
          showConfirmButton: false,
        });

        setCurrentPhoto(imageData);
        setHasPhoto(true);
        setShowCamera(false);

        // Recargar los rostros conocidos
        await reloadKnownFaces();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text:
          error.response?.data?.message || "Error al procesar la fotografía",
        icon: "error",
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFacePhoto = async () => {
    const result = await Swal.fire({
      title: "¿Eliminar fotografía?",
      text: "Ya no podrás usar el reconocimiento facial para iniciar sesión",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append("name", nombreCompleto);

        await axios.post("http://localhost:5001/delete", formData);

        Swal.fire({
          title: "Eliminada",
          text: "Tu fotografía ha sido eliminada correctamente",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        setCurrentPhoto(null);
        setHasPhoto(false);

        // Recargar los rostros conocidos
        await reloadKnownFaces();
      } catch (error) {
        Swal.fire({
          title: "Error",
          text:
            error.response?.data?.message || "Error al eliminar la fotografía",
          icon: "error",
          timer: 3000,
          showConfirmButton: false,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const reloadKnownFaces = async () => {
    try {
      await axios.post(`${apiUrl}/reload-faces`);
    } catch (error) {
      console.log("Error recargando rostros conocidos");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">
          <i className="bi bi-camera me-2"></i>
          Gestión de Fotografía Facial
        </h5>
      </div>
      <div className="card-body">
        {user ? (
          <>
            <p className="text-muted mb-3">
              Gestiona tu fotografía para el reconocimiento facial
            </p>

            {/* Foto actual */}
            {hasPhoto && currentPhoto && (
              <div className="text-center mb-4">
                <h6 className="text-dark mb-3">Fotografía actual:</h6>
                <img
                  src={currentPhoto}
                  alt="Foto actual"
                  className="rounded border"
                  style={{
                    maxWidth: "200px",
                    maxHeight: "200px",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}

            {/* Estado sin foto */}
            {!hasPhoto && (
              <div className="text-center mb-4">
                <i className="bi bi-camera-slash display-1 text-muted mb-3"></i>
                <h6 className="text-muted">No tienes fotografía registrada</h6>
                <p className="text-muted small">
                  Registra una fotografía para poder usar el reconocimiento
                  facial
                </p>
              </div>
            )}

            {/* Input oculto para archivos */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />

            {/* Cámara web */}
            {showCamera && (
              <div className="text-center mb-4">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  width={300}
                  height={225}
                  className="rounded border"
                />
                <div className="mt-3">
                  <button
                    className="btn btn-success me-2"
                    onClick={capturePhoto}
                    disabled={isLoading}
                  >
                    <i className="bi bi-camera me-1"></i>
                    Capturar
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowCamera(false)}
                  >
                    <i className="bi bi-x me-1"></i>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="d-grid gap-2">
              <button
                className="btn btn-primary"
                onClick={() => setShowCamera(true)}
                disabled={isLoading || showCamera}
              >
                {isLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-camera-video me-1"></i>
                    {hasPhoto ? "Tomar nueva foto" : "Tomar foto con cámara"}
                  </>
                )}
              </button>

              <button
                className="btn btn-outline-primary"
                onClick={triggerFileInput}
                disabled={isLoading || showCamera}
              >
                <i className="bi bi-upload me-1"></i>
                {hasPhoto ? "Subir nueva foto" : "Subir foto desde archivo"}
              </button>

              {hasPhoto && (
                <button
                  className="btn btn-danger"
                  onClick={deleteFacePhoto}
                  disabled={isLoading}
                >
                  <i className="bi bi-trash me-1"></i>
                  Eliminar fotografía
                </button>
              )}
            </div>

            <hr />
            <div className="text-muted small">
              <p className="mb-1">
                <strong>Recomendaciones:</strong>
              </p>
              <ul className="mb-0">
                <li>Usa una foto clara y bien iluminada</li>
                <li>Mira directamente a la cámara</li>
                <li>Evita usar lentes oscuros o gorros</li>
                <li>Solo debe aparecer tu rostro en la imagen</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="alert alert-warning" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            No se pudo obtener la información del usuario
          </div>
        )}
      </div>
    </div>
  );
};

export default FacePhotoManager;
