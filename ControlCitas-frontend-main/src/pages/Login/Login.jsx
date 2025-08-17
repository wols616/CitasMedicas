import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

import RegisterForm from "../../components/RegisterForm/RegisterForm";
import FaceRecognition from "../../components/FaceRecognition";
import USBLogin from "../../components/USBLogin";
import "../Register/styleRegister.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showFaceLogin, setShowFaceLogin] = useState(false);
  const [showUSBLogin, setShowUSBLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  //-----------------------------------------------------------------
  const [mfaToken, setMfaToken] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [showMfaForm, setShowMfaForm] = useState(false);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  const handleFaceRecognition = async (faceData) => {
    if (faceData.name === "Desconocido") {
      Swal.fire({
        title: "Usuario no reconocido",
        text: "No se pudo reconocer tu rostro. Intenta con el login tradicional.",
        icon: "warning",
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    // Buscar usuario por nombre completo en el sistema
    try {
      const response = await axios.post(
        `${apiUrl}/api/usuarios/loginPorRostro`,
        {
          nombreCompleto: faceData.name,
        }
      );

      Swal.fire({
        title: "Bienvenido",
        text: `Inicio de sesión exitoso con reconocimiento facial`,
        icon: "success",
        showConfirmButton: false,
        timer: 2000,
      });

      // Guarda el usuario en localStorage
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Guarda datos de medico o paciente si existen
      if (response.data.medico) {
        localStorage.setItem("medico", JSON.stringify(response.data.medico));
      } else {
        localStorage.removeItem("medico");
      }
      if (response.data.paciente) {
        localStorage.setItem(
          "paciente",
          JSON.stringify(response.data.paciente)
        );
      } else {
        localStorage.removeItem("paciente");
      }

      // Redirige según el rol
      const rol = response.data.user.rol;
      if (rol === "admin") {
        navigate("/home_admin");
      } else if (rol === "paciente") {
        navigate("/home_paciente");
      } else if (rol === "medico") {
        navigate("/home_medico");
      } else {
        navigate("/");
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text:
          error.response?.data?.message ||
          "No se pudo autenticar con reconocimiento facial",
        icon: "error",
        showConfirmButton: false,
        timer: 3000,
      });
    }
  };

  const handleUSBLogin = async (usbData) => {
    try {
      // La autenticación USB no requiere MFA adicional
      // ya que la USB física es considerada suficiente autenticación de doble factor
      completeLogin(usbData);
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "Error al autenticar con USB",
        icon: "error",
        showConfirmButton: false,
        timer: 3000,
      });
    }
  };

  const handleLogin = (e) => {
    if (e) e.preventDefault(); // Evita recargar la página si viene de un submit
    if (!email || !password) {
      Swal.fire({
        title: "Error",
        text: "Por favor, completa todos los campos.",
        icon: "error",
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    axios
      .post(`${apiUrl}/api/usuarios/iniciarSesion`, {
        correo: email,
        contrasena: password,
      })
      .then((response) => {
        if (response.data.mfa_required) {
          setMfaToken(response.data.mfaToken);
          setShowMfaForm(true);
          return;
        }

        completeLogin(response.data);

        // Swal.fire({
        //   title: "Bienvenido",
        //   text: "Inicio de sesión exitoso",
        //   icon: "success",
        //   showConfirmButton: false,
        //   timer: 2000,
        // });

        // // Guarda el usuario en localStorage
        // localStorage.setItem("user", JSON.stringify(response.data.user));

        // // Guarda datos de medico o paciente si existen
        // if (response.data.medico) {
        //   localStorage.setItem("medico", JSON.stringify(response.data.medico));
        // } else {
        //   localStorage.removeItem("medico");
        // }
        // if (response.data.paciente) {
        //   localStorage.setItem(
        //     "paciente",
        //     JSON.stringify(response.data.paciente)
        //   );
        // } else {
        //   localStorage.removeItem("paciente");
        // }

        // // Redirige según el rol
        // const rol = response.data.user.rol;
        // if (rol === "admin") {
        //   navigate("/home_admin");
        // } else if (rol === "paciente") {
        //   navigate("/home_paciente");
        // } else if (rol === "medico") {
        //   navigate("/home_medico");
        // } else {
        //   navigate("/");
        // }
      })
      .catch((error) => {
        Swal.fire({
          title: "Error",
          text: error.response?.data?.message || "Error al iniciar sesión",
          icon: "error",
          showConfirmButton: false,
          timer: 3000,
        });
      });
  };

  const verifyMfaCode = () => {
    setIsLoading(true);
    axios
      .post(`${apiUrl}/api/usuarios/mfa-verify-login`, {
        mfaToken,
        token: mfaCode,
      })
      .then((response) => {
        completeLogin(response.data);
      })
      .catch((error) => {
        Swal.fire({
          title: "Error",
          text: error.response?.data?.message || "Código 2FA inválido",
          icon: "error",
          showConfirmButton: false,
          timer: 3000,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const completeLogin = (data) => {
    Swal.fire({
      title: "Bienvenido",
      text: "Inicio de sesión exitoso",
      icon: "success",
      showConfirmButton: false,
      timer: 2000,
    });

    localStorage.setItem("user", JSON.stringify(data.user));

    // Guarda datos de medico o paciente si existen
    if (data.medico) {
      localStorage.setItem("medico", JSON.stringify(data.medico));
    } else {
      localStorage.removeItem("medico");
    }
    if (data.paciente) {
      localStorage.setItem("paciente", JSON.stringify(data.paciente));
    } else {
      localStorage.removeItem("paciente");
    }

    // Redirige según el rol
    const rol = data.user.rol;
    if (rol === "admin") {
      navigate("/home_admin");
    } else if (rol === "paciente") {
      navigate("/home_paciente");
    } else if (rol === "medico") {
      navigate("/home_medico");
    } else {
      navigate("/");
    }
  };

  const cambiarARecuperacion = () => {
    setUseRecoveryCode(!useRecoveryCode);
    setMfaCode(""); // Limpiar el código actual
  };

  return (
    <div className="fondo">
      <div className="login-container">
        <section className="login-section">
          <h2 className="text-center text-dark mb-3">
            Iniciar sesión VersionUSB
          </h2>

          {/* Botones para alternar entre métodos de login */}
          <div className="d-flex justify-content-center mb-3">
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn ${
                  !showFaceLogin && !showUSBLogin
                    ? "btn-primary"
                    : "btn-outline-primary"
                }`}
                onClick={() => {
                  setShowFaceLogin(false);
                  setShowUSBLogin(false);
                }}
              >
                <i className="bi bi-envelope me-1"></i>
                Email
              </button>
              <button
                type="button"
                className={`btn ${
                  showFaceLogin ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => {
                  setShowFaceLogin(true);
                  setShowUSBLogin(false);
                }}
              >
                <i className="bi bi-camera me-1"></i>
                Facial
              </button>
              <button
                type="button"
                className={`btn ${
                  showUSBLogin ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => {
                  setShowFaceLogin(false);
                  setShowUSBLogin(true);
                }}
              >
                <i className="bi bi-usb-symbol me-1"></i>
                USB
              </button>
            </div>
          </div>

          <div
            className="text-light border-b-3"
            style={{ textAlign: "center" }}
          >
            {showUSBLogin ? (
              /* INICIO: Login con USB */
              <div className="usb-login-section">
                <USBLogin onUSBLogin={handleUSBLogin} />
              </div>
            ) : /* FIN: Login con USB */
            showFaceLogin ? (
              /* INICIO: Login con reconocimiento facial */
              <div className="face-login-section">
                <FaceRecognition
                  onFaceRecognized={handleFaceRecognition}
                  enableRecognize={true}
                  enableRegister={false}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />
              </div>
            ) : (
              /* FIN: Login con reconocimiento facial */
              /* INICIO: Login tradicional */
              <>
                {!showMfaForm ? (
                  /* Formulario normal de email/contraseña */
                  <form onSubmit={handleLogin}>
                    <input
                      className="form-control mb-3"
                      style={{ height: "43px" }}
                      type="text"
                      placeholder="Correo electrónico"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <div className="input-group mb-4">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <span
                        className="input-group-text"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ cursor: "pointer" }}
                      >
                        {showPassword ? (
                          <i className="bi bi-eye-slash-fill fs-5 text-primary"></i>
                        ) : (
                          <i className="bi bi-eye-fill fs-5 text-primary"></i>
                        )}
                      </span>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary fw-bold px-4 mb-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          ></span>
                          Accediendo...
                        </>
                      ) : (
                        "Acceder"
                      )}
                    </button>
                  </form>
                ) : (
                  /* Formulario de verificación 2FA */
                  <div className="mfa-verification">
                    <h5 className="text-dark mb-3">
                      Verificación en Dos Pasos
                    </h5>
                    <p className="text-muted mb-4">
                      {useRecoveryCode
                        ? "Ingresa un código de recuperación de 10 caracteres"
                        : "Ingresa el código de 6 dígitos de tu aplicación de autenticación"}
                    </p>

                    <div className="mfa-code-input mb-4">
                      <input
                        type="text"
                        id="mfaCode"
                        className="form-control text-center"
                        style={{
                          fontSize: "1.5rem",
                          letterSpacing: "0.5em",
                          paddingRight: "0.5em",
                        }}
                        value={mfaCode}
                        onChange={(e) =>
                          setMfaCode(e.target.value.toUpperCase())
                        }
                        maxLength={useRecoveryCode ? "10" : "6"}
                        placeholder={useRecoveryCode ? "----------" : "------"}
                      />
                    </div>

                    <button
                      onClick={verifyMfaCode}
                      className="btn btn-primary w-100 mb-3"
                      disabled={
                        isLoading ||
                        (useRecoveryCode
                          ? mfaCode.length !== 10
                          : mfaCode.length !== 6)
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

                    <button
                      className="btn btn-outline-primary"
                      onClick={cambiarARecuperacion}
                    >
                      {useRecoveryCode
                        ? "Usar código de autenticación"
                        : "Usar código de recuperación"}
                    </button>
                  </div>
                )}
              </>
              /* FIN: Login tradicional */
            )}

            {/* Enlace para recuperar contraseña (solo en login tradicional y no en 2FA) */}
            {!showFaceLogin && !showUSBLogin && !showMfaForm && (
              <Link to="/forgot-password" className="d-block mt-2">
                ¿Olvidaste tu contraseña?
              </Link>
            )}
          </div>
        </section>

        {/* Sección de registro (solo visible cuando no está en 2FA) */}
        {!showMfaForm && (
          <section className="register-section text-center">
            <h4 className="text-dark">¿No tienes cuenta?</h4>
            <Link to="/registerUser">
              <button className="btn btn-primary fw-bold px-4 mt-4">
                Registrarse
              </button>
            </Link>
          </section>
        )}
      </div>
    </div>
  );
};

export default Login;
