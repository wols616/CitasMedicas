import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const MFASetup = () => {
  const [qrCode, setQrCode] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [step, setStep] = useState(0);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  // Nuevos estados para códigos de recuperación
  const [existingRecoveryCodes, setExistingRecoveryCodes] = useState([]);
  const [recoveryStats, setRecoveryStats] = useState({});
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      const response = await axios.post(
        `${apiUrl}/api/usuarios/check-mfa-status`,
        {
          id_usuario: user.id_usuario,
        }
      );

      setMfaEnabled(response.data.mfaEnabled);
      if (response.data.mfaEnabled) {
        setStep(4);
        loadRecoveryCodes();
      } else {
        setStep(1);
      }
    } catch (error) {
      Swal.fire("Error", "No se pudo verificar el estado de 2FA", "error");
    }
  };

  const loadRecoveryCodes = async () => {
    try {
      const response = await axios.post(
        `${apiUrl}/api/usuarios/get-mfa-recovery-codes`,
        {
          id_usuario: user.id_usuario,
        }
      );

      setExistingRecoveryCodes(response.data.codes);
      setRecoveryStats(response.data);
    } catch (error) {
      console.error("Error cargando códigos de recuperación:", error);
    }
  };

  const startSetup = async () => {
    try {
      const response = await axios.post(`${apiUrl}/api/usuarios/mfa-setup`, {
        id_usuario: user.id_usuario,
      });
      setQrCode(response.data.qr);
      setManualCode(response.data.manualCode);
      setStep(2);
    } catch (error) {
      Swal.fire("Error", "No se pudo iniciar la configuración de 2FA", "error");
    }
  };

  const verifyCode = async () => {
    try {
      const response = await axios.post(
        `${apiUrl}/api/usuarios/mfa-verify-setup`,
        {
          id_usuario: user.id_usuario,
          token: verificationCode,
        }
      );
      setRecoveryCodes(response.data.recoveryCodes);
      setStep(3);
    } catch (error) {
      Swal.fire("Error", "Código inválido. Intenta nuevamente.", "error");
    }
  };

  const regenerateRecoveryCodes = async () => {
    const result = await Swal.fire({
      title: "¿Regenerar códigos?",
      text: "Esto invalidará todos los códigos de recuperación anteriores. ¿Estás seguro?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, regenerar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      setIsRegenerating(true);
      try {
        const response = await axios.post(
          `${apiUrl}/api/usuarios/regenerate-mfa-recovery-codes`,
          {
            id_usuario: user.id_usuario,
          }
        );

        setRecoveryCodes(response.data.newRecoveryCodes);

        // Mostrar códigos nuevos en un modal
        Swal.fire({
          title: "¡Códigos regenerados!",
          html: `
            <div style="text-align: left;">
              <p><strong>Guarda estos nuevos códigos de recuperación:</strong></p>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; font-family: monospace;">
                ${response.data.newRecoveryCodes
                  .map(
                    (code, index) =>
                      `<div style="margin: 5px 0;">${index + 1}. ${code}</div>`
                  )
                  .join("")}
              </div>
              <p style="color: #dc3545; margin-top: 15px;"><strong>¡Importante!</strong> Los códigos anteriores ya no funcionan.</p>
            </div>
          `,
          icon: "success",
          confirmButtonText: "Entendido",
          allowOutsideClick: false,
        });

        // Recargar la lista de códigos
        loadRecoveryCodes();
      } catch (error) {
        Swal.fire("Error", "No se pudieron regenerar los códigos", "error");
      } finally {
        setIsRegenerating(false);
      }
    }
  };

  return (
    <div className="container mt-5">
      <h2>Configurar Autenticación de Dos Factores</h2>

      {step === 0 && (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p>Verificando estado de autenticación...</p>
        </div>
      )}

      {step === 4 && (
        <div>
          <div className="alert alert-success">
            <h4 className="alert-heading">
              <i className="bi bi-shield-check me-2"></i>
              2FA Ya está configurado
            </h4>
            <p>
              Ya tienes la autenticación en dos pasos activada para esta cuenta.
            </p>
          </div>

          {/* Sección de códigos de recuperación */}
          <div className="card mt-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-key me-2"></i>
                Códigos de Recuperación
              </h5>
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => setShowRecoveryCodes(!showRecoveryCodes)}
              >
                {showRecoveryCodes ? "Ocultar" : "Ver códigos"}
              </button>
            </div>
            <div className="card-body">
              {recoveryStats.totalCodes && (
                <div className="row mb-3">
                  <div className="col-md-4">
                    <div className="text-center">
                      <div className="h4 text-primary">
                        {recoveryStats.totalCodes}
                      </div>
                      <small className="text-muted">Total de códigos</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center">
                      <div className="h4 text-success">
                        {recoveryStats.availableCodes}
                      </div>
                      <small className="text-muted">Disponibles</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center">
                      <div className="h4 text-danger">
                        {recoveryStats.usedCodes}
                      </div>
                      <small className="text-muted">Usados</small>
                    </div>
                  </div>
                </div>
              )}

              {showRecoveryCodes && existingRecoveryCodes.length > 0 && (
                <div className="mb-3">
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Código</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {existingRecoveryCodes.map((codeInfo) => (
                          <tr key={codeInfo.index}>
                            <td>{codeInfo.index}</td>
                            <td>
                              <code
                                className={codeInfo.isUsed ? "text-muted" : ""}
                              >
                                {codeInfo.code}
                              </code>
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  codeInfo.isUsed ? "bg-danger" : "bg-success"
                                }`}
                              >
                                {codeInfo.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                <button
                  className="btn btn-warning"
                  onClick={regenerateRecoveryCodes}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Regenerando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Regenerar códigos
                    </>
                  )}
                </button>
              </div>

              <div className="alert alert-info mt-3">
                <small>
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Consejo:</strong> Guarda estos códigos en un lugar
                  seguro. Te permitirán acceder a tu cuenta si pierdes tu
                  dispositivo de autenticación.
                </small>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <button onClick={startSetup} className="btn btn-primary">
          Activar 2FA
        </button>
      )}

      {step === 2 && (
        <div>
          <p>Escanea este código QR con tu aplicación de autenticación:</p>
          <img src={qrCode} alt="QR Code" />
          <p className="mt-3">O ingresa este código manualmente:</p>
          <code>{manualCode}</code>

          <div className="mt-4">
            <label>Ingresa el código de tu aplicación:</label>
            <input
              type="text"
              className="form-control"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
            <button onClick={verifyCode} className="btn btn-primary mt-2">
              Verificar
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h4>¡2FA Activado Correctamente!</h4>
          <p className="text-danger">
            Guarda estos códigos de recuperación en un lugar seguro. Cada código
            solo se puede usar una vez.
          </p>
          <ul className="list-group">
            {recoveryCodes.map((code, index) => (
              <li key={index} className="list-group-item">
                <code>{code}</code>
              </li>
            ))}
          </ul>
          <button
            className="btn btn-success mt-3 me-2"
            onClick={() => window.print()}
          >
            <i className="bi bi-printer me-2"></i>
            Imprimir códigos
          </button>
          <button
            className="btn btn-primary mt-3"
            onClick={() => {
              setStep(4);
              loadRecoveryCodes();
            }}
          >
            Continuar
          </button>
        </div>
      )}
    </div>
  );
};

export default MFASetup;
