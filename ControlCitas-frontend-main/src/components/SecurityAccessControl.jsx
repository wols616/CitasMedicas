import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const SecurityAccessControl = ({ children, sectionName, onAccessGranted }) => {
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState("code");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [securityQuestionsConfigured, setSecurityQuestionsConfigured] =
    useState(false);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const apiUrl = import.meta.env.VITE_API_URL;

  // Timer para el código de confirmación
  useEffect(() => {
    let timer;
    if (
      showVerificationModal &&
      timeLeft > 0 &&
      verificationMethod === "code"
    ) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleCloseModal();
    }
    return () => clearInterval(timer);
  }, [showVerificationModal, timeLeft, verificationMethod]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRequestAccess = () => {
    setShowVerificationModal(true);
    setTimeLeft(300);
    setConfirmationCode("");
    setSecurityAnswer("");
  };

  const handleCloseModal = () => {
    setShowVerificationModal(false);
    setConfirmationCode("");
    setSecurityAnswer("");
    setTimeLeft(300);
  };

  const requestConfirmation = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${apiUrl}/api/admin/solicitar-confirmacion/${user.id_usuario}`,
        {
          operacion: "acceso_configuracion",
          datos: { seccion: sectionName },
          adminCorreo: user.correo,
        }
      );

      if (response.data.requiereConfirmacion) {
        Swal.fire({
          title: "Código enviado",
          text: "Se ha enviado un código de confirmación a tu correo electrónico",
          icon: "info",
          timer: 3000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error al solicitar confirmación:", error);
      Swal.fire({
        title: "Error",
        text: "Error al enviar el código de confirmación",
        icon: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityQuestionClick = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${apiUrl}/api/security-question/${user.id_usuario}`
      );

      if (response.data.configured) {
        setSecurityQuestion(response.data.question);
        setCurrentQuestionNumber(response.data.questionNumber);
        setSecurityQuestionsConfigured(true);
        setVerificationMethod("question");
      } else {
        setSecurityQuestionsConfigured(false);
        Swal.fire({
          title: "Preguntas no configuradas",
          text: "Debes configurar las preguntas de seguridad primero en la sección correspondiente.",
          icon: "warning",
        });
      }
    } catch (error) {
      console.error("Error al obtener pregunta de seguridad:", error);
      Swal.fire({
        title: "Error",
        text: "Error al obtener la pregunta de seguridad",
        icon: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifySecurityQuestionAnswer = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${apiUrl}/api/verify-security-question`,
        {
          userId: user.id_usuario,
          questionNumber: currentQuestionNumber,
          answer: securityAnswer,
        }
      );

      if (response.data.verified) {
        setIsAccessGranted(true);
        setShowVerificationModal(false);
        if (onAccessGranted) onAccessGranted();

        Swal.fire({
          title: "Acceso concedido",
          text: `Acceso autorizado a ${sectionName}`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          title: "Respuesta incorrecta",
          text: "La respuesta a la pregunta de seguridad es incorrecta",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Error al verificar respuesta:", error);
      Swal.fire({
        title: "Error",
        text: "Error al verificar la respuesta de seguridad",
        icon: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmVerification = async () => {
    if (verificationMethod === "question") {
      await verifySecurityQuestionAnswer();
      return;
    }

    // Verificación por código
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${apiUrl}/api/admin/verificar-confirmacion/${user.id_usuario}`,
        {
          codigoConfirmacion: confirmationCode,
          verificationMethod: "code",
          adminCorreo: user.correo,
        }
      );

      if (response.data.verificado) {
        setIsAccessGranted(true);
        setShowVerificationModal(false);
        if (onAccessGranted) onAccessGranted();

        Swal.fire({
          title: "Acceso concedido",
          text: `Acceso autorizado a ${sectionName}`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error en verificación:", error);
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "Código incorrecto o expirado",
        icon: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    await requestConfirmation();
    setTimeLeft(300);
  };

  if (isAccessGranted) {
    return children;
  }

  return (
    <>
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="mb-4">
            <i className="bi bi-shield-lock display-1 text-warning"></i>
          </div>
          <h4 className="card-title mb-3">Acceso Restringido</h4>
          <p className="card-text text-muted mb-4">
            Para acceder a <strong>{sectionName}</strong>, necesitas verificar
            tu identidad. Esto garantiza la seguridad de tu configuración
            personal.
          </p>
          <button
            className="btn btn-primary"
            onClick={handleRequestAccess}
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
                <i className="bi bi-unlock me-2"></i>
                Verificar Identidad
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal de Verificación */}
      {showVerificationModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-shield-check me-2"></i>
                  Verificación de Seguridad
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-muted mb-4">
                  Selecciona un método de verificación para acceder a{" "}
                  {sectionName}:
                </p>

                {/* Métodos de verificación */}
                <div className="d-flex gap-2 mb-4">
                  <button
                    className={`btn ${
                      verificationMethod === "code"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    } flex-fill`}
                    onClick={() => {
                      setVerificationMethod("code");
                      requestConfirmation();
                    }}
                    disabled={isLoading}
                  >
                    <i className="bi bi-envelope me-1"></i>
                    Código por correo
                  </button>
                  <button
                    className={`btn ${
                      verificationMethod === "question"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    } flex-fill`}
                    onClick={handleSecurityQuestionClick}
                    disabled={isLoading}
                  >
                    <i className="bi bi-question-circle me-1"></i>
                    Pregunta de seguridad
                  </button>
                </div>

                {/* Verificación por código */}
                {verificationMethod === "code" && (
                  <div>
                    <div className="mb-3">
                      <label className="form-label">
                        Código de verificación
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ingresa el código de 4 dígitos"
                        value={confirmationCode}
                        onChange={(e) => setConfirmationCode(e.target.value)}
                        maxLength="4"
                      />
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        Tiempo restante:{" "}
                        <span className="fw-bold">{formatTime(timeLeft)}</span>
                      </small>
                      <button
                        className="btn btn-link btn-sm p-0"
                        onClick={handleResendCode}
                        disabled={isLoading}
                      >
                        Reenviar código
                      </button>
                    </div>
                  </div>
                )}

                {/* Verificación por pregunta de seguridad */}
                {verificationMethod === "question" && securityQuestion && (
                  <div>
                    <div className="mb-3">
                      <label className="form-label">
                        Pregunta de seguridad
                      </label>
                      <div className="card bg-light">
                        <div className="card-body py-2">
                          <small className="text-muted">
                            {securityQuestion}
                          </small>
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Tu respuesta</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ingresa tu respuesta"
                        value={securityAnswer}
                        onChange={(e) => setSecurityAnswer(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {verificationMethod === "question" &&
                  !securityQuestionsConfigured && (
                    <div className="alert alert-warning">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Las preguntas de seguridad no han sido configuradas. Usa
                      la verificación por código de correo.
                    </div>
                  )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmVerification}
                  disabled={
                    isLoading ||
                    (verificationMethod === "code" &&
                      confirmationCode.length !== 4) ||
                    (verificationMethod === "question" &&
                      !securityAnswer.trim())
                  }
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
                    "Verificar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SecurityAccessControl;
