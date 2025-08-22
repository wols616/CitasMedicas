import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import FaceRecognition from "../../components/FaceRecognition";
import ReloadFacesButton from "../../components/ReloadFacesButton";
import RenamePhotoButton from "../../components/RenamePhotoButton";

const UsuariosAdmin = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosConFotos, setUsuariosConFotos] = useState(new Set());
  const [registerFace, setRegisterFace] = useState(true);
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    direccion: "",
    telefono: "",
    correo: "",
    sexo: "",
    rol: "",
    contrasena: "",
  });
  const [editId, setEditId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingActionType, setPendingActionType] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300);
  const [verificationMethod, setVerificationMethod] = useState("code");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [securityQuestionsConfigured, setSecurityQuestionsConfigured] =
    useState(false);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaId, setBusquedaId] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/admin/usuarios`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const usuariosData = response.data;
      setUsuarios(usuariosData);

      // Verificar qué usuarios tienen fotos de reconocimiento facial
      const usuariosConFotosSet = new Set();

      for (const usuario of usuariosData) {
        try {
          const nombreCompleto = `${usuario.nombres} ${usuario.apellidos}`;
          const checkResponse = await axios.post(`${apiUrl}/api/face/check`, {
            name: nombreCompleto,
          });

          if (checkResponse.data.exists) {
            usuariosConFotosSet.add(usuario.id_usuario);
          }
        } catch (error) {
          // Si hay error al verificar, asumir que no tiene foto
          console.warn(
            `No se pudo verificar foto para ${usuario.nombres} ${usuario.apellidos}`
          );
        }
      }

      setUsuariosConFotos(usuariosConFotosSet);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      setUsuarios([]);
    }
  };

  useEffect(() => {
    if (!showConfirmationModal || timeLeft <= 0) return;

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showConfirmationModal, timeLeft]);

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const coincideBusqueda =
      busqueda.trim() === "" ||
      usuario.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.apellidos.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.correo.toLowerCase().includes(busqueda.toLowerCase());
    const coincideId =
      busquedaId.trim() === "" ||
      usuario.id_usuario.toString() === busquedaId.trim();
    const coincideRol = filtroRol === "todos" || usuario.rol === filtroRol;
    return coincideBusqueda && coincideId && coincideRol;
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFaceRegistered = (data) => {
    setFaceRegistered(true);
    Swal.fire({
      title: "Rostro registrado",
      text: "El rostro del administrador ha sido registrado exitosamente.",
      icon: "success",
      showConfirmButton: false,
      timer: 2000,
    });
  };

  const requestConfirmation = async (actionType, data) => {
    try {
      setIsLoading(true);

      // Para editar usamos editId, para eliminar usamos data.id_usuario
      const userId = actionType === "editar" ? editId : data.id_usuario;

      // Obtener correo del admin desde localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      const adminCorreo = user?.correo;

      if (!adminCorreo) {
        Swal.fire(
          "Error",
          "No se pudo obtener el correo del administrador",
          "error"
        );
        return;
      }

      const response = await axios.post(
        `${apiUrl}/api/admin/usuarios/${userId}/solicitarConfirmacion`,
        {
          operacion: actionType,
          datos: { ...data, id_usuario: userId },
          adminCorreo: adminCorreo,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.requiereConfirmacion) {
        if (actionType === "eliminar") {
          setPendingDeleteId(userId);
          setPendingActionType("eliminar");
        } else {
          setPendingActionType("editar");
        }
        setShowConfirmationModal(true);
        setTimeLeft(300);
      }
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message ||
          "No se pudo enviar el código de confirmación",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditConfirm = async () => {
    try {
      setIsLoading(true);
      const { contrasena, ...editData } = form;

      // Obtener correo del admin desde localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      const adminCorreo = user?.correo;

      // Crear el objeto de datos base
      const requestData = {
        ...editData,
        verificationMethod: verificationMethod,
        adminCorreo: adminCorreo,
      };

      // Agregar el código de confirmación solo si es necesario
      if (verificationMethod === "code") {
        requestData.codigoConfirmacion = confirmationCode;
      }

      // Agregar bandera de verificación de pregunta si es ese método
      if (verificationMethod === "question") {
        requestData.securityVerified = true;
      }

      const response = await axios.put(
        `${apiUrl}/api/admin/usuarios/${editId}`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Verificar si se renombró la foto automáticamente
      if (response.data.photoRenamed) {
        Swal.fire({
          title: "¡Usuario actualizado!",
          html: `
            <p>Usuario actualizado correctamente.</p>
            <div class="alert alert-info mt-2">
              <i class="bi bi-info-circle me-2"></i>
              ${response.data.photoRenamed}
            </div>
          `,
          icon: "success",
          confirmButtonText: "Entendido",
        });
      } else {
        Swal.fire("¡Actualizado!", "Usuario actualizado.", "success");
      }

      setForm({
        nombres: "",
        apellidos: "",
        direccion: "",
        telefono: "",
        correo: "",
        sexo: "",
        rol: "",
        contrasena: "",
      });
      setEditId(null);
      fetchUsuarios();
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "No se pudo actualizar",
        "error"
      );
    } finally {
      setIsLoading(false);
      setShowConfirmationModal(false);
      setConfirmationCode("");
      setPendingActionType(null);
    }
  };

  // Manejar el clic en el botón de pregunta de seguridad
  const handleSecurityQuestionClick = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/security-question/${
          user.id_usuario
        }`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.configured) {
        setSecurityQuestionsConfigured(true);
        setSecurityQuestion(response.data.question);
        setCurrentQuestionNumber(response.data.questionNumber);
        setVerificationMethod("question");
      } else {
        setSecurityQuestionsConfigured(false);
        Swal.fire({
          icon: "error",
          title: "No configurado",
          text: "Debes configurar tus preguntas de seguridad en la sección de Configuración de Seguridad antes de poder usar este método.",
          confirmButtonText: "Entendido",
        });
        setVerificationMethod("code");
      }
    } catch (error) {
      console.error("Error al obtener la pregunta de seguridad:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo obtener la pregunta de seguridad. Por favor, intenta más tarde.",
      });
      setVerificationMethod("code");
    }
  };

  // Verificar respuesta a pregunta de seguridad
  const verifySecurityQuestionAnswer = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/verify-security-question`,
        {
          userId: user.id_usuario,
          questionNumber: currentQuestionNumber, // Necesitamos esta variable
          answer: securityAnswer,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.verified) {
        return true;
      } else {
        Swal.fire({
          icon: "error",
          title: "Respuesta incorrecta",
          text: "La respuesta proporcionada no es correcta.",
        });
        return false;
      }
    } catch (error) {
      console.error("Error al verificar la respuesta:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo verificar la respuesta. Por favor, intenta más tarde.",
      });
      return false;
    }
  };

  const handleDeleteConfirm = async (id) => {
    try {
      setIsLoading(true);

      // Obtener correo del admin desde localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      const adminCorreo = user?.correo;

      // Si se usa pregunta de seguridad, verificar primero
      if (verificationMethod === "question") {
        const isVerified = await verifySecurityQuestionAnswer();
        if (!isVerified) {
          setIsLoading(false);
          return;
        }
      }

      await axios.delete(`${apiUrl}/api/admin/usuarios/${id}`, {
        data: {
          codigoConfirmacion:
            verificationMethod === "code" ? confirmationCode : undefined,
          securityVerified: verificationMethod === "question",
          adminCorreo: adminCorreo,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      Swal.fire("Eliminado", "Usuario eliminado.", "success");
      fetchUsuarios();
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "No se pudo eliminar",
        "error"
      );
    } finally {
      setIsLoading(false);
      setShowConfirmationModal(false);
      setConfirmationCode("");
      setPendingDeleteId(null);
      setPendingActionType(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.nombres.trim() ||
      !form.apellidos.trim() ||
      !form.correo.trim() ||
      !form.rol.trim() ||
      (!editId && !form.contrasena.trim())
    ) {
      Swal.fire(
        "Error",
        "Por favor completa los campos obligatorios.",
        "error"
      );
      return;
    }

    if (!editId && registerFace && !faceRegistered) {
      Swal.fire({
        title: "Rostro no registrado",
        text: "Has marcado que quieres registrar el rostro, pero aún no lo has hecho.",
        icon: "warning",
        showConfirmButton: false,
        timer: 4000,
      });
      return;
    }

    if (editId) {
      requestConfirmation("editar", form);
    } else {
      try {
        setIsLoading(true);
        await axios.post(`${apiUrl}/api/admin/usuarios`, form, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const mensaje =
          registerFace && faceRegistered
            ? `Usuario ${form.rol} registrado con reconocimiento facial.`
            : `Usuario ${form.rol} registrado.`;
        Swal.fire("¡Agregado!", mensaje, "success");
        setForm({
          nombres: "",
          apellidos: "",
          direccion: "",
          telefono: "",
          correo: "",
          sexo: "",
          rol: "",
          contrasena: "",
        });
        setRegisterFace(true);
        setFaceRegistered(false);
        fetchUsuarios();
      } catch (err) {
        Swal.fire(
          "Error",
          err.response?.data?.message || "No se pudo guardar",
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEdit = (usuario) => {
    setForm({
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      direccion: usuario.direccion,
      telefono: usuario.telefono,
      correo: usuario.correo,
      sexo: usuario.sexo,
      rol: usuario.rol,
      contrasena: "",
    });
    setEditId(usuario.id_usuario);
  };

  const handleDelete = async (id, rol) => {
    Swal.fire({
      title: `¿Eliminar usuario ${rol}?`,
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        requestConfirmation("eliminar", { id_usuario: id });
      }
    });
  };

  const handleCancelEdit = () => {
    setForm({
      nombres: "",
      apellidos: "",
      direccion: "",
      telefono: "",
      correo: "",
      sexo: "",
      rol: "",
      contrasena: "",
    });
    setEditId(null);
  };

  const handleResendCode = async () => {
    if (!editId && !pendingDeleteId) return;

    await requestConfirmation(pendingDeleteId ? "eliminar" : "editar", {
      id_usuario: pendingDeleteId || editId,
    });
  };

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center"
      style={{
        minHeight: "80vh",
        width: "100%",
        background: "#f5faff",
      }}
    >
      {showConfirmationModal && (
        <div className="modal-backdrop fade show"></div>
      )}
      {showConfirmationModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmación Requerida</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowConfirmationModal(false);
                    setConfirmationCode("");
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {/* Opciones de verificación */}
                <div className="mb-3">
                  <label className="form-label">Método de verificación</label>
                  <div className="d-flex gap-2 mb-3">
                    <button
                      type="button"
                      className={`btn ${
                        verificationMethod === "code"
                          ? "btn-primary"
                          : "btn-outline-primary"
                      }`}
                      onClick={() => setVerificationMethod("code")}
                    >
                      <i className="bi bi-envelope me-2"></i>
                      Código por correo
                    </button>
                    <button
                      type="button"
                      className={`btn ${
                        verificationMethod === "question"
                          ? "btn-primary"
                          : "btn-outline-primary"
                      }`}
                      onClick={handleSecurityQuestionClick}
                    >
                      <i className="bi bi-question-circle me-2"></i>
                      Pregunta clave
                    </button>
                  </div>

                  {verificationMethod === "code" && (
                    <>
                      <p className="text-muted mb-3">
                        Se ha enviado un código de confirmación a tu correo
                        electrónico. Por favor ingrésalo a continuación.
                      </p>
                      <label className="form-label">Código de 4 dígitos</label>
                      <input
                        type="text"
                        className="form-control text-center"
                        value={confirmationCode}
                        onChange={(e) => setConfirmationCode(e.target.value)}
                        maxLength={4}
                        style={{ letterSpacing: "0.5rem", fontSize: "1.5rem" }}
                      />
                    </>
                  )}

                  {verificationMethod === "question" && (
                    <>
                      <p className="text-muted mb-3">
                        Por favor, responde a la siguiente pregunta de seguridad
                        para confirmar tu identidad.
                      </p>
                      <label className="form-label">{securityQuestion}</label>
                      <input
                        type="text"
                        className="form-control"
                        value={securityAnswer}
                        onChange={(e) => setSecurityAnswer(e.target.value)}
                        placeholder="Ingresa tu respuesta"
                        minLength={1}
                      />
                    </>
                  )}
                </div>
                <div className="text-center mb-3">
                  <small className="text-muted">
                    Tiempo restante: {Math.floor(timeLeft / 60)}:
                    {String(timeLeft % 60).padStart(2, "0")}
                  </small>
                </div>
                <div className="text-center">
                  {timeLeft <= 0 && (
                    <button
                      className="btn btn-link p-0"
                      onClick={handleResendCode}
                    >
                      Reenviar código
                    </button>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowConfirmationModal(false);
                    setConfirmationCode("");
                    setPendingActionType(null);
                    setPendingDeleteId(null);
                    setVerificationMethod("code");
                    setSecurityQuestion("");
                    setSecurityAnswer("");
                    setSecurityQuestionsConfigured(false);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      if (verificationMethod === "code") {
                        if (confirmationCode.length !== 4) {
                          Swal.fire(
                            "Error",
                            "El código debe tener 4 dígitos",
                            "error"
                          );
                          return;
                        }
                        // Continuar con la acción usando el código
                        if (pendingActionType === "editar") {
                          handleEditConfirm();
                        } else if (pendingActionType === "eliminar") {
                          handleDeleteConfirm(pendingDeleteId);
                        }
                      } else if (verificationMethod === "question") {
                        if (!securityAnswer.trim()) {
                          Swal.fire(
                            "Error",
                            "Debes proporcionar una respuesta",
                            "error"
                          );
                          return;
                        }

                        // Verificar la respuesta a la pregunta de seguridad primero
                        const isVerified = await verifySecurityQuestionAnswer();
                        if (isVerified) {
                          // Solo si la respuesta es correcta, continuar con la acción
                          if (pendingActionType === "editar") {
                            handleEditConfirm();
                          } else if (pendingActionType === "eliminar") {
                            handleDeleteConfirm(pendingDeleteId);
                          }
                        }
                      }
                    } catch (error) {
                      console.error("Error en la verificación:", error);
                      Swal.fire(
                        "Error",
                        "Ocurrió un error durante la verificación",
                        "error"
                      );
                    }
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : null}
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="shadow p-4 rounded my-5"
        style={{
          background: "#fff",
          maxWidth: "1200px",
          width: "100%",
          borderRadius: "18px",
          boxShadow: "0 4px 24px 0 rgba(46,93,161,0.10)",
        }}
      >
        <h3
          className="fw-bold text-center mb-4"
          style={{ color: "#2e5da1", letterSpacing: "0.5px" }}
        >
          Gestión de Usuarios Admin
        </h3>

        <div className="d-flex justify-content-end mb-3">
          <ReloadFacesButton />
        </div>

        <form className="row g-3 mb-4">
          <div className="col-md-4">
            <label className="form-label">
              Buscar por nombre/apellido/correo
            </label>
            <input
              type="text"
              className="form-control"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Escriba para buscar..."
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Buscar por ID</label>
            <input
              type="number"
              className="form-control"
              value={busquedaId}
              onChange={(e) => setBusquedaId(e.target.value)}
              placeholder="ID del usuario"
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Filtrar por rol</label>
            <select
              className="form-select"
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="admin">Admin</option>
              <option value="paciente">Paciente</option>
              <option value="medico">Médico</option>
            </select>
          </div>
        </form>

        <form onSubmit={handleSubmit} className="row g-3 mb-4">
          <div className="col-md-4">
            <label className="form-label">Nombres*</label>
            <input
              type="text"
              className="form-control"
              name="nombres"
              value={form.nombres}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Apellidos*</label>
            <input
              type="text"
              className="form-control"
              name="apellidos"
              value={form.apellidos}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Correo*</label>
            <input
              type="email"
              className="form-control"
              name="correo"
              value={form.correo}
              onChange={handleChange}
              required
              disabled={!!editId}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Dirección</label>
            <input
              type="text"
              className="form-control"
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Teléfono</label>
            <input
              type="text"
              className="form-control"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Sexo</label>
            <select
              className="form-select"
              name="sexo"
              value={form.sexo}
              onChange={handleChange}
            >
              <option value="">Seleccione...</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Rol*</label>
            <select
              className="form-select"
              name="rol"
              value={form.rol}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona un rol</option>
              <option value="admin">Admin</option>
              <option value="paciente">Paciente</option>
              <option value="medico">Médico</option>
            </select>
          </div>
          {!editId && (
            <div className="col-md-4">
              <label className="form-label">Contraseña*</label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  name="contrasena"
                  value={form.contrasena}
                  onChange={handleChange}
                  required
                />
                <span
                  className="input-group-text bg-white"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <i className="bi bi-eye-slash-fill"></i>
                  ) : (
                    <i className="bi bi-eye-fill"></i>
                  )}
                </span>
              </div>
            </div>
          )}

          {!editId && (
            <div className="col-12">
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
                    }
                  }}
                />
                <label
                  className="form-check-label fw-bold"
                  htmlFor="registerFaceCheck"
                >
                  Registrar rostro para login facial
                </label>
              </div>

              {registerFace && (
                <div className="card mb-3">
                  <div className="card-body">
                    <h6 className="card-title mb-3">
                      <i className="bi bi-camera-fill me-2"></i>
                      Registro de reconocimiento facial
                    </h6>
                    {faceRegistered ? (
                      <div className="alert alert-success">
                        <i className="bi bi-check-circle-fill me-2"></i>
                        ¡Rostro registrado exitosamente! Ahora puedes completar
                        el registro del administrador.
                      </div>
                    ) : (
                      <>
                        <FaceRecognition
                          enableRegister={true}
                          enableRecognize={false}
                          userName={form.nombres + " " + form.apellidos}
                          onFaceRegistered={handleFaceRegistered}
                          isLoading={isLoading}
                          setIsLoading={setIsLoading}
                        />
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="col-12 d-flex justify-content-center gap-2">
            <button
              type="submit"
              className="btn btn-primary fw-bold"
              style={{
                background: "#2e5da1",
                border: "none",
                borderRadius: "8px",
                fontSize: "1.1rem",
                letterSpacing: "0.5px",
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                  {editId ? "Actualizando..." : "Agregando..."}
                </>
              ) : editId ? (
                "Actualizar"
              ) : (
                "Agregar"
              )}
            </button>
            {editId && (
              <button
                type="button"
                className="btn btn-outline-secondary fw-bold"
                style={{
                  borderRadius: "8px",
                  fontSize: "1.1rem",
                  letterSpacing: "0.5px",
                }}
                onClick={handleCancelEdit}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Nombres</th>
                <th>Apellidos</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Reconocimiento Facial</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted">
                    No hay usuarios que coincidan con los criterios
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id_usuario}>
                    <td className="fw-bold">{usuario.id_usuario}</td>
                    <td>{usuario.nombres}</td>
                    <td>{usuario.apellidos}</td>
                    <td>{usuario.correo}</td>
                    <td>
                      <span
                        className={`badge ${
                          usuario.rol === "admin"
                            ? "bg-danger"
                            : usuario.rol === "medico"
                            ? "bg-primary"
                            : "bg-success"
                        }`}
                      >
                        {usuario.rol}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {usuariosConFotos.has(usuario.id_usuario) ? (
                          <>
                            <span className="badge bg-success">
                              <i className="bi bi-camera-fill me-1"></i>
                              Activo
                            </span>
                            <RenamePhotoButton
                              oldName={`${usuario.nombres} ${usuario.apellidos}`}
                              newName={`${usuario.nombres} ${usuario.apellidos}`}
                              onRenameSuccess={() => {
                                Swal.fire({
                                  title: "Éxito",
                                  text: "Foto renombrada correctamente",
                                  icon: "success",
                                  timer: 2000,
                                  showConfirmButton: false,
                                });
                              }}
                              size="sm"
                            />
                          </>
                        ) : (
                          <span className="badge bg-secondary">
                            <i className="bi bi-camera-slash me-1"></i>
                            Sin foto
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleEdit(usuario)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() =>
                          handleDelete(usuario.id_usuario, usuario.rol)
                        }
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsuariosAdmin;
