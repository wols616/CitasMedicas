import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import FaceRecognition from "../../components/FaceRecognition";

const UsuariosAdmin = () => {
  const [usuarios, setUsuarios] = useState([]);
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
    rol: "admin",
    contrasena: "",
  });
  const [editId, setEditId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Filtros de búsqueda
  const [busqueda, setBusqueda] = useState("");
  const [busquedaId, setBusquedaId] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");

  // Declara la variable de entorno para la URL
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = () => {
    axios
      .get(`${apiUrl}/api/admin/usuarios`)
      .then((res) => setUsuarios(res.data))
      .catch(() => setUsuarios([]));
  };

  // Filtrado en frontend
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

    // Validar si quiere registrar rostro pero no lo ha hecho (solo para nuevos usuarios)
    if (!editId && registerFace && !faceRegistered) {
      Swal.fire({
        title: "Rostro no registrado",
        text: "Has marcado que quieres registrar el rostro, pero aún no lo has hecho. Por favor registra el rostro o desmarca la opción.",
        icon: "warning",
        showConfirmButton: false,
        timer: 4000,
      });
      return;
    }

    try {
      setIsLoading(true);
      if (editId) {
        // Editar usuario (sin contraseña ni rol)
        const { contrasena, rol, ...editData } = form;
        await axios.put(`${apiUrl}/api/admin/usuarios/${editId}`, editData);
        Swal.fire("¡Actualizado!", "Usuario actualizado.", "success");
      } else {
        // Crear solo usuario admin
        if (form.rol !== "admin") {
          Swal.fire(
            "Error",
            "Solo puedes crear usuarios con rol admin.",
            "error"
          );
          return;
        }
        await axios.post(`${apiUrl}/api/admin/usuarios`, form);
        const mensaje =
          registerFace && faceRegistered
            ? "Usuario admin registrado con reconocimiento facial."
            : "Usuario admin registrado.";
        Swal.fire("¡Agregado!", mensaje, "success");
      }
      setForm({
        nombres: "",
        apellidos: "",
        direccion: "",
        telefono: "",
        correo: "",
        sexo: "",
        rol: "admin",
        contrasena: "",
      });
      setEditId(null);
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
    if (rol !== "admin") {
      Swal.fire(
        "Acción no permitida",
        "Solo puedes eliminar usuarios admin.",
        "warning"
      );
      return;
    }
    Swal.fire({
      title: "¿Eliminar usuario admin?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${apiUrl}/api/admin/usuarios/${id}`);
          Swal.fire("Eliminado", "Usuario eliminado.", "success");
          fetchUsuarios();
        } catch (err) {
          Swal.fire(
            "Error",
            err.response?.data?.message || "No se pudo eliminar",
            "error"
          );
        }
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
      rol: "admin",
      contrasena: "",
    });
    setEditId(null);
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

        {/* Filtros de búsqueda */}
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
              disabled
            >
              <option value="admin">Admin</option>
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

          {/* Sección de reconocimiento facial - solo para nuevos usuarios */}
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
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted">
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
                      {usuario.rol === "admin" && (
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEdit(usuario)}
                        >
                          Editar
                        </button>
                      )}
                      {usuario.rol === "admin" && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() =>
                            handleDelete(usuario.id_usuario, usuario.rol)
                          }
                        >
                          Eliminar
                        </button>
                      )}
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
