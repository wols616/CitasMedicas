import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import Webcam from "react-webcam";

import "./styleRegister.css";
import RegisterForm from "../../components/RegisterForm/RegisterForm";
import FaceRecognition from "../../components/FaceRecognition";

// Componente para capturar foto sin registrarla inmediatamente
const FaceCaptureComponent = ({ onFaceCaptured, isLoading, setIsLoading }) => {
  const webcamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(true);

  const capturePhoto = async () => {
    setIsLoading(true);
    try {
      const screenshot = webcamRef.current.getScreenshot();
      if (!screenshot) {
        throw new Error("No se pudo capturar la imagen");
      }

      const blob = await fetch(screenshot).then((res) => res.blob());
      onFaceCaptured(blob);
    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "Error al capturar la imagen");
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImage = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";

    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      onFaceCaptured(file);
    };

    fileInput.click();
  };

  const toggleCamera = () => {
    setCameraActive(!cameraActive);
  };

  return (
    <div className="face-capture-component">
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

      <div className="d-grid gap-2">
        <button
          className="btn btn-primary"
          onClick={capturePhoto}
          disabled={isLoading || !cameraActive}
        >
          {isLoading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Capturando...
            </>
          ) : (
            <>
              <i className="bi bi-camera me-2"></i>
              Capturar foto
            </>
          )}
        </button>

        <button
          className="btn btn-outline-primary"
          onClick={uploadImage}
          disabled={isLoading}
        >
          <i className="bi bi-upload me-2"></i>
          Subir imagen
        </button>
      </div>
    </div>
  );
};

const RegisterUser = () => {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [hoverDisabled, setHoverDisabled] = useState(false);
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [registerFace, setRegisterFace] = useState(true);
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [capturedFaceImage, setCapturedFaceImage] = useState(null); // Nueva state para la imagen capturada
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleFaceCaptured = (imageBlob) => {
    setCapturedFaceImage(imageBlob);
    setFaceRegistered(true);
    Swal.fire({
      title: "Foto capturada",
      text: "Tu foto ha sido capturada. Ahora completa el registro para guardar todo.",
      icon: "success",
      showConfirmButton: false,
      timer: 2000,
    });
  };

  const handleFaceRegistered = (data) => {
    setFaceRegistered(true);
    Swal.fire({
      title: "Rostro registrado",
      text: "Tu rostro ha sido registrado exitosamente. Ahora puedes completar el registro.",
      icon: "success",
      showConfirmButton: false,
      timer: 2000,
    });
  };

  //Para ingresar el usuario
  const handleRegister = async () => {
    // Validar el formato del correo electrónico
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

    // Validar que la fecha de nacimiento no sea futura
    if (fechaNacimiento) {
      const hoy = new Date();
      const fechaNac = new Date(fechaNacimiento);
      hoy.setHours(0, 0, 0, 0);
      if (fechaNac > hoy) {
        Swal.fire({
          title: "Error",
          text: "La fecha de nacimiento no puede ser una fecha futura.",
          icon: "error",
          showConfirmButton: false,
          timer: 3000,
        });
        return;
      }
    }

    // Validar si quiere registrar rostro pero no lo ha capturado
    if (registerFace && !capturedFaceImage) {
      Swal.fire({
        title: "Foto no capturada",
        text: "Has marcado que quieres registrar tu rostro, pero aún no has capturado tu foto. Por favor captura tu foto o desmarca la opción.",
        icon: "warning",
        showConfirmButton: false,
        timer: 4000,
      });
      return;
    }

    if (name && lastName && address && phone && email && password && gender) {
      // Verificar si el correo tiene un formato válido
      if (!emailRegex.test(email)) {
        Swal.fire({
          title: "Error",
          text: "Por favor, ingresa un correo electrónico válido.",
          icon: "error",
          showConfirmButton: false,
          timer: 3000,
        });
        return; // Detener el registro si el correo no es válido
      }

      setIsLoading(true);

      // Hacer la solicitud al backend para registrar el usuario
      try {
        await axios.post(`${apiUrl}/api/usuarios/registrarUsuario`, {
          nombres: name,
          apellidos: lastName,
          direccion: address,
          telefono: phone,
          correo: email,
          contrasena: password,
          sexo: gender,
          rol: "paciente",
          fechaNacimiento,
        });

        // Si el usuario se registró exitosamente Y tiene foto capturada, registrar el rostro
        if (registerFace && capturedFaceImage) {
          try {
            const formData = new FormData();
            formData.append(
              "image",
              capturedFaceImage,
              `${name}_${lastName}.jpg`
            );
            formData.append("name", `${name} ${lastName}`);

            await fetch(`${apiUrl}/api/face/register`, {
              method: "POST",
              body: formData,
            });

            Swal.fire({
              title: "Registro completo",
              text: "Usuario y rostro registrados exitosamente.",
              icon: "success",
              showConfirmButton: false,
              timer: 3000,
            });
          } catch (faceError) {
            console.error("Error al registrar rostro:", faceError);
            Swal.fire({
              title: "Registro parcial",
              text: "Usuario registrado, pero hubo un problema al registrar el rostro.",
              icon: "warning",
              showConfirmButton: false,
              timer: 3000,
            });
          }
        } else {
          Swal.fire({
            title: "Registro exitoso",
            text: "Usuario registrado correctamente.",
            icon: "success",
            showConfirmButton: false,
            timer: 3000,
          });
        }

        navigate("/");
      } catch (error) {
        if (error.response && error.response.status === 400) {
          if (error.response.data.message.includes("La contraseña")) {
            Swal.fire({
              title: "Contraseña",
              text: "La contraseña debe tener al menos 8 caracteres, incluir una letra mayúscula y un número.",
              icon: "error",
              showConfirmButton: false,
              timer: 3000,
            });
          } else {
            Swal.fire({
              title: "Error",
              text: "El correo ya está registrado. Usa otro email.",
              icon: "error",
              showConfirmButton: false,
              timer: 3000,
            });
          }
        } else {
          console.error("Error registrando usuario:", error);
          Swal.fire({
            title: "Registro",
            text: "Hubo un problema al registrar el usuario.",
            icon: "error",
            showConfirmButton: false,
            timer: 3000,
          });
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      Swal.fire({
        title: "Error",
        text: "Por favor, completa todos los campos.",
        icon: "error",
        showConfirmButton: false,
        timer: 3000,
      });
    }
  };

  return (
    <div className="fondo">
      <div className="register-user-container mx-auto ">
        <h2 className="text-dark text-center fw-bold pb-2">
          Registro de Paciente
        </h2>
        <RegisterForm
          text={<span className="text-dark">Nombres:</span>}
          type="text"
          placeholder="Nombres"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <RegisterForm
          text={<span className="text-dark">Apellidos:</span>}
          type="text"
          placeholder="Apellidos"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <RegisterForm
          text={<span className="text-dark">Dirección:</span>}
          type="text"
          placeholder="Dirección"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <RegisterForm
          text={<span className="text-dark">Teléfono:</span>}
          type="text"
          placeholder="Teléfono"
          value={phone}
          maxLength="9"
          onChange={(e) => {
            let value = e.target.value.replace(/\D/g, ""); // Elimina todo lo que no sea dígito
            if (value.length > 4) {
              value = value.slice(0, 4) + "-" + value.slice(4, 8);
            }
            setPhone(value);
          }}
        />
        <div className="form-group-email">
          <RegisterForm
            text={<span className="text-dark">Correo:</span>}
            type="text"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="d-flex justify-content-start align-items-center mb-3 form-group-gender">
          <p className="text-dark fw-bold mb-0 me-3">Género:</p>
          <select
            className="form-select text-dark"
            aria-label="Default select example"
            onChange={(e) => setGender(e.target.value)}
          >
            <option className="text-dark" defaultValue>
              Genero
            </option>
            <option className="text-dark" value="M">
              Masculino
            </option>
            <option className="text-dark" value="F">
              Femenino
            </option>
          </select>
        </div>
        <RegisterForm
          text={<span className="text-dark">Fecha de nacimiento:</span>}
          type="date"
          value={fechaNacimiento}
          onChange={(e) => setFechaNacimiento(e.target.value)}
          max={new Date().toISOString().split("T")[0]} // <-- No permite fechas futuras
        />
        <div className="form-group-password mb-3 d-flex align-items-center justify-content-between">
          <label className="fw-bold text-dark mb-1" htmlFor="passwordInput">
            Contraseña:
          </label>
          <div className="input-group w-75">
            <input
              id="passwordInput"
              className="form-control "
              type={showPassword ? "text" : "password"}
              placeholder="contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ borderRight: "none" }}
            />
            <span
              className="input-group-text bg-white"
              style={{ cursor: "pointer", borderLeft: "none" }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <i className="bi bi-eye-slash-fill fs-5 text-dark"></i>
              ) : (
                <i className="bi bi-eye-fill fs-5 text-dark"></i>
              )}
            </span>
          </div>
        </div>

        {/* Sección de reconocimiento facial */}
        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="registerFaceCheck"
            checked={registerFace}
            onChange={(e) => {
              setRegisterFace(e.target.checked);
              if (!e.target.checked) {
                setFaceRegistered(false);
                setCapturedFaceImage(null);
              }
            }}
          />
          <label
            className="form-check-label text-dark fw-bold"
            htmlFor="registerFaceCheck"
          >
            Registrar mi rostro para login facial
          </label>
        </div>

        {registerFace && (
          <div className="card mb-3 p-3">
            <div className="card-body">
              <h6 className="card-title text-dark mb-3">
                <i className="bi bi-camera-fill me-2"></i>
                Registro de reconocimiento facial
              </h6>
              {faceRegistered ? (
                <div className="alert alert-success">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  ¡Foto capturada exitosamente! Ahora completa el registro para
                  guardar todo.
                </div>
              ) : (
                <>
                  <p className="text-muted small mb-3">
                    Tu rostro se registrará como:{" "}
                    <strong>
                      {name} {lastName}
                    </strong>
                  </p>
                  <FaceCaptureComponent
                    userName={`${name} ${lastName}`}
                    onFaceCaptured={handleFaceCaptured}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                  />
                </>
              )}
            </div>
          </div>
        )}
        <section className="d-flex justify-content-center mt-3 flex-wrap gap-2">
          <div
            className="position-relative d-inline-block"
            onMouseEnter={() => setHoverDisabled(true)}
            onMouseLeave={() => setHoverDisabled(false)}
          >
            <button
              type="button"
              className="btn btn-primary fw-bold px-4 me-3"
              disabled={
                !name ||
                !lastName ||
                !address ||
                !phone ||
                !email ||
                !password ||
                !gender ||
                isLoading
              }
              onClick={handleRegister}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                  Registrando...
                </>
              ) : (
                "Registrarme"
              )}
            </button>
            {(!name || !lastName || !email || !password) && hoverDisabled && (
              <div
                className="position-absolute top-50 start-50 translate-middle"
                style={{ pointerEvents: "none" }}
              >
                <i className="bi bi-ban text-danger fw-bold fs-4"></i>
              </div>
            )}
          </div>
          <Link to="/">
            <button className="btn btn-primary fw-bold px-4 mt-2 mt-md-0">
              Regresar
            </button>
          </Link>
        </section>
      </div>
    </div>
  );
};

export default RegisterUser;
