import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import USBKeyManager from "../components/USBKeyManager";
import MFASetup from "../components/MFASetup";
import SecurityQuestions from "../components/SecurityQuestions";
import FacePhotoManager from "../components/FacePhotoManager";

const ConfiguracionSeguridad = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("mfa");

  const user = JSON.parse(localStorage.getItem("user"));
  const nombreCompleto = user ? `${user.nombres} ${user.apellidos}` : "";

  return (
    <div
      className="container-fluid"
      style={{
        minHeight: "100vh",
        background: "#f8f9fa",
        paddingTop: "2rem",
        paddingBottom: "2rem",
      }}
    >
      <div className="container">
        <div className="row">
          <div className="col-12">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="fw-bold text-primary mb-1">
                  <i className="bi bi-shield-lock me-2"></i>
                  Configuración de Seguridad
                </h2>
                <p className="text-muted mb-0">
                  Gestiona tus métodos de autenticación, {nombreCompleto}
                </p>
              </div>
              <button
                className="btn btn-outline-secondary"
                onClick={() => navigate(-1)}
              >
                <i className="bi bi-arrow-left me-1"></i>
                Volver
              </button>
            </div>

            {/* Tabs Navigation */}
            <ul className="nav nav-pills mb-4" id="securityTabs" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === "mfa" ? "active" : ""}`}
                  onClick={() => setActiveTab("mfa")}
                >
                  <i className="bi bi-shield-check me-1"></i>
                  Autenticación de dos pasos
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${
                    activeTab === "face-photo" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("face-photo")}
                  type="button"
                >
                  <i className="bi bi-camera me-2"></i>
                  Fotografía Facial
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === "usb" ? "active" : ""}`}
                  onClick={() => setActiveTab("usb")}
                  type="button"
                >
                  <i className="bi bi-usb-symbol me-2"></i>
                  Clave USB
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${
                    activeTab === "password" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("password")}
                  type="button"
                >
                  <i className="bi bi-key me-2"></i>
                  Contraseña
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${
                    activeTab === "security-questions" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("security-questions")}
                >
                  <i className="bi bi-question-circle me-1"></i>
                  Preguntas de Seguridad
                </button>
              </li>
            </ul>

            {/* Tab Content */}
            <div className="tab-content" id="securityTabsContent">
              {/* MFA Tab */}
              {activeTab === "mfa" && (
                <div className="tab-pane fade show active">
                  <div className="row">
                    <div className="col-12 col-lg-8">
                      <MFASetup />
                    </div>
                    <div className="col-12 col-lg-4">
                      <div className="card bg-light border-0">
                        <div className="card-body">
                          <h6 className="card-title">
                            <i className="bi bi-info-circle text-primary me-2"></i>
                            Sobre la Autenticación 2FA
                          </h6>
                          <p className="card-text small text-muted">
                            La autenticación de dos factores (2FA) añade una
                            capa extra de seguridad a tu cuenta, requiriendo un
                            código adicional además de tu contraseña.
                          </p>
                          <ul className="small text-muted">
                            <li>Usa una app como Google Authenticator</li>
                            <li>Genera códigos únicos cada 30 segundos</li>
                            <li>
                              Protege tu cuenta aunque alguien conozca tu
                              contraseña
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Questions Tab */}
              {activeTab === "security-questions" && (
                <div className="tab-pane fade show active">
                  <div className="row">
                    <div className="col-12 col-lg-8">
                      <SecurityQuestions />
                    </div>
                    <div className="col-12 col-lg-4">
                      <div className="card bg-light border-0">
                        <div className="card-body">
                          <h6 className="card-title">
                            <i className="bi bi-info-circle text-primary me-2"></i>
                            Sobre las Preguntas de Seguridad
                          </h6>
                          <p className="card-text small text-muted">
                            Las preguntas de seguridad proporcionan un método
                            alternativo para verificar tu identidad al realizar
                            acciones importantes en la gestión de usuarios.
                          </p>
                          <ul className="small text-muted">
                            <li>
                              Configura 3 preguntas de seguridad diferentes
                            </li>
                            <li>
                              Usa respuestas que puedas recordar fácilmente
                            </li>
                            <li>No compartas las respuestas con nadie</li>
                            <li>
                              Las respuestas se almacenan de forma segura y
                              cifrada
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Face Photo Tab */}
              {activeTab === "face-photo" && (
                <div className="tab-pane fade show active">
                  <div className="row">
                    <div className="col-12 col-lg-8">
                      <FacePhotoManager />
                    </div>
                    <div className="col-12 col-lg-4">
                      <div className="card bg-light border-0">
                        <div className="card-body">
                          <h6 className="card-title">
                            <i className="bi bi-info-circle text-primary me-2"></i>
                            Sobre el Reconocimiento Facial
                          </h6>
                          <p className="card-text small text-muted">
                            El reconocimiento facial te permite iniciar sesión
                            usando solo tu rostro, sin necesidad de recordar
                            contraseñas.
                          </p>
                          <ul className="small text-muted">
                            <li>Toma o sube una foto clara de tu rostro</li>
                            <li>
                              Evita usar lentes oscuros o accesorios que cubran
                              tu cara
                            </li>
                            <li>
                              La foto se guarda de forma segura y encriptada
                            </li>
                            <li>Puedes actualizarla cuando quieras</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* USB Tab */}
              {activeTab === "usb" && (
                <div className="tab-pane fade show active">
                  <div className="row">
                    <div className="col-12 col-lg-8">
                      <USBKeyManager />
                    </div>
                    <div className="col-12 col-lg-4">
                      <div className="card bg-light border-0">
                        <div className="card-body">
                          <h6 className="card-title">
                            <i className="bi bi-info-circle text-primary me-2"></i>
                            Sobre la Autenticación USB
                          </h6>
                          <p className="card-text small text-muted">
                            La autenticación USB te permite iniciar sesión de
                            forma rápida usando un archivo especial guardado en
                            tu dispositivo USB.
                          </p>
                          <ul className="small text-muted">
                            <li>Genera una clave única de 12 caracteres</li>
                            <li>Guárdala en un archivo "clinic_key.txt"</li>
                            <li>
                              Inicia sesión cargando el archivo o escribiendo la
                              clave
                            </li>
                            <li>Ideal para acceso rápido y conveniente</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === "password" && (
                <div className="tab-pane fade show active">
                  <div className="row">
                    <div className="col-12 col-lg-8">
                      <div className="card">
                        <div className="card-header">
                          <h5 className="card-title mb-0">
                            <i className="bi bi-key me-2"></i>
                            Cambiar Contraseña
                          </h5>
                        </div>
                        <div className="card-body">
                          <p className="text-muted mb-4">
                            Para cambiar tu contraseña, utiliza la opción
                            disponible en tu perfil.
                          </p>

                          <div className="alert alert-info" role="alert">
                            <i className="bi bi-lightbulb me-2"></i>
                            <strong>Consejo de seguridad:</strong>
                            Usa una contraseña fuerte que combine letras
                            mayúsculas, minúsculas, números y símbolos.
                          </div>

                          <button
                            className="btn btn-primary"
                            onClick={() => navigate("/cambiar-contrasena")}
                          >
                            <i className="bi bi-pencil me-1"></i>
                            Cambiar Contraseña
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-lg-4">
                      <div className="card bg-light border-0">
                        <div className="card-body">
                          <h6 className="card-title">
                            <i className="bi bi-shield-exclamation text-warning me-2"></i>
                            Recomendaciones de Seguridad
                          </h6>
                          <ul className="small text-muted">
                            <li>Usa al menos 8 caracteres</li>
                            <li>Combina mayúsculas y minúsculas</li>
                            <li>Incluye números y símbolos</li>
                            <li>No uses información personal</li>
                            <li>Cambia tu contraseña regularmente</li>
                            <li>No reutilices contraseñas</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionSeguridad;
