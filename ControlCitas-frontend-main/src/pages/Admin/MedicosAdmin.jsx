import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

const MedicosAdmin = () => {
  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [medicoEdit, setMedicoEdit] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaId, setBusquedaId] = useState("");
  const [filtroEspecialidad, setFiltroEspecialidad] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const navigate = useNavigate();

  // Declara la variable de entorno para la URL
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchMedicos();
    axios
      .get(`${apiUrl}/api/admin/especialidades`)
      .then((res) => setEspecialidades(res.data))
      .catch(() => setEspecialidades([]));
  }, []);

  const fetchMedicos = () => {
    axios
      .get(`${apiUrl}/api/admin/medicos`)
      .then((res) => setMedicos(res.data))
      .catch(() => setMedicos([]));
  };

  const cambiarEstado = (id_medico, estadoActual) => {
    const nuevoEstado = estadoActual === 1 ? 0 : 1;
    axios
      .put(`${apiUrl}/api/admin/medicos/${id_medico}/estado`, {
        activo: nuevoEstado,
      })
      .then(() => {
        Swal.fire(
          "Actualizado",
          `El médico ha sido ${
            nuevoEstado === 1 ? "activado" : "desactivado"
          } correctamente.`,
          "success"
        );
        fetchMedicos();
      })
      .catch(() => {
        Swal.fire(
          "Error",
          "No se pudo actualizar el estado del médico.",
          "error"
        );
      });
  };

  const handleEditClick = (medico) => {
    // Buscar el id_especialidad a partir del nombre
    const especialidadObj = especialidades.find(
      (esp) => esp.nombre === medico.especialidad
    );
    // Quitar el prefijo de la licencia médica si existe
    let licenciaSoloNumeros = medico.licencia_medica;
    if (licenciaSoloNumeros.startsWith("J.V.P.M-")) {
      licenciaSoloNumeros = licenciaSoloNumeros.replace("J.V.P.M-", "");
    }
    setMedicoEdit({
      ...medico,
      id_especialidad: especialidadObj ? especialidadObj.id_especialidad : "",
      licencia_medica: licenciaSoloNumeros,
    });
    setShowModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    // DUI: solo permite 8 dígitos, guion, 1 dígito
    if (name === "num_identificacion") {
      let val = value.replace(/[^\d-]/g, "");
      if (/^\d{9}$/.test(val)) {
        val = val.slice(0, 8) + "-" + val.slice(8);
      }
      if (val.length > 10) val = val.slice(0, 10);
      setMedicoEdit({ ...medicoEdit, [name]: val });
      return;
    }
    // Licencia Médica: solo permite 5 dígitos (sin prefijo)
    if (name === "licencia_medica") {
      let val = value.replace(/\D/g, "");
      if (val.length > 5) val = val.slice(0, 5);
      setMedicoEdit({ ...medicoEdit, [name]: val });
      return;
    }
    setMedicoEdit({ ...medicoEdit, [name]: value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    // Validación de DUI
    if (!/^\d{8}-\d$/.test(medicoEdit.num_identificacion)) {
      Swal.fire("Error", "El DUI debe tener el formato 06584869-1", "error");
      return;
    }
    // Validación de Licencia Médica
    if (!/^\d{5}$/.test(medicoEdit.licencia_medica)) {
      Swal.fire(
        "Error",
        "La Licencia Médica debe tener el formato J.V.P.M-12345",
        "error"
      );
      return;
    }
    try {
      await axios.put(`${apiUrl}/api/admin/medicos/${medicoEdit.id_medico}`, {
        id_especialidad: medicoEdit.id_especialidad,
        licencia_medica: `J.V.P.M-${medicoEdit.licencia_medica}`,
        num_identificacion: medicoEdit.num_identificacion,
        activo: medicoEdit.activo,
      });
      Swal.fire("¡Actualizado!", "Datos del médico actualizados.", "success");
      setShowModal(false);
      fetchMedicos();
    } catch {
      Swal.fire("Error", "No se pudo actualizar el médico.", "error");
    }
  };

  // Filtrado de médicos
  const medicosFiltrados = medicos.filter((medico) => {
    const coincideNombre =
      busqueda.trim() === "" ||
      medico.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
      medico.apellidos.toLowerCase().includes(busqueda.toLowerCase());
    const coincideId =
      busquedaId.trim() === "" ||
      medico.id_medico.toString() === busquedaId.trim();
    const coincideEspecialidad =
      filtroEspecialidad === "" || medico.especialidad === filtroEspecialidad;
    const coincideEstado =
      filtroEstado === "" || medico.activo.toString() === filtroEstado;
    return (
      coincideNombre && coincideId && coincideEspecialidad && coincideEstado
    );
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "#f5faff",
        padding: "0",
        margin: "0",
      }}
    >
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold" style={{ color: "#2e5da1" }}>
            Gestión de Médicos
          </h2>
          <button
            className="btn btn-primary fw-bold"
            style={{
              background: "#2e5da1",
              border: "none",
              borderRadius: "8px",
              letterSpacing: "0.5px",
            }}
            onClick={() => navigate("/admin/registrar-medico")}
          >
            <i className="bi bi-person-plus-fill me-2"></i>
            Registrar Médico
          </button>
        </div>

        {/* Filtros de búsqueda */}
        <div className="row g-2 mb-3">
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre o apellido"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <input
              type="number"
              className="form-control"
              placeholder="ID Médico"
              value={busquedaId}
              onChange={(e) => setBusquedaId(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={filtroEspecialidad}
              onChange={(e) => setFiltroEspecialidad(e.target.value)}
            >
              <option value="">Todas las especialidades</option>
              {especialidades.map((esp) => (
                <option key={esp.id_especialidad} value={esp.nombre}>
                  {esp.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="1">Activo</option>
              <option value="0">Inactivo</option>
            </select>
          </div>
        </div>

        <div
          className="table-responsive shadow rounded"
          style={{ background: "#fff" }}
        >
          <table className="table table-hover align-middle mb-0">
            <thead style={{ background: "#e3eafc" }}>
              <tr>
                <th>ID Médico</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Especialidad</th>
                <th>Licencia</th>
                <th>DUI</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {medicosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center text-secondary py-4">
                    No hay médicos registrados.
                  </td>
                </tr>
              ) : (
                medicosFiltrados.map((medico) => (
                  <tr key={medico.id_medico}>
                    <td>{medico.id_medico}</td>
                    <td>
                      {medico.nombres} {medico.apellidos}
                    </td>
                    <td>{medico.correo}</td>
                    <td>{medico.especialidad}</td>
                    <td>{medico.licencia_medica}</td>
                    <td>{medico.num_identificacion}</td>
                    <td>{medico.telefono}</td>
                    <td>
                      {medico.activo === 1 ? (
                        <span className="badge bg-success">Activo</span>
                      ) : (
                        <span className="badge bg-secondary">Inactivo</span>
                      )}
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${
                          medico.activo === 1
                            ? "btn-outline-danger"
                            : "btn-outline-success"
                        }`}
                        onClick={async () => {
                          if (medico.activo === 1) {
                            // Si va a desactivar, mostrar confirmación
                            const result = await Swal.fire({
                              title: "¿Está seguro?",
                              html: "Si desactiva al médico, <b>todas sus citas pendientes serán canceladas</b> y los pacientes serán notificados.<br>¿Desea continuar?",
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonText: "Sí, desactivar",
                              cancelButtonText: "Cancelar",
                              reverseButtons: true,
                            });
                            if (!result.isConfirmed) return;
                          }
                          cambiarEstado(medico.id_medico, medico.activo);
                        }}
                        style={{ minWidth: "90px", marginRight: "6px" }}
                      >
                        {medico.activo === 1 ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleEditClick(medico)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de edición */}
      {showModal && medicoEdit && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            background: "rgba(0,0,0,0.3)",
            zIndex: 1050,
          }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleEditSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">Editar Médico</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Especialidad</label>
                    <select
                      className="form-select"
                      name="id_especialidad"
                      value={medicoEdit.id_especialidad}
                      onChange={handleEditChange}
                      required
                    >
                      <option value="">Seleccione...</option>
                      {especialidades.map((esp) => (
                        <option
                          key={esp.id_especialidad}
                          value={esp.id_especialidad}
                        >
                          {esp.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Licencia Médica</label>
                    <div className="input-group">
                      <span className="input-group-text">J.V.P.M-</span>
                      <input
                        type="text"
                        className="form-control"
                        name="licencia_medica"
                        value={medicoEdit.licencia_medica}
                        onChange={handleEditChange}
                        required
                        placeholder="12345"
                        maxLength={5}
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">DUI</label>
                    <input
                      type="text"
                      className="form-control"
                      name="num_identificacion"
                      value={medicoEdit.num_identificacion}
                      onChange={handleEditChange}
                      required
                      placeholder="00000000-0"
                      maxLength={10}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Estado</label>
                    <select
                      className="form-select"
                      name="activo"
                      value={medicoEdit.activo}
                      onChange={handleEditChange}
                    >
                      <option value={1}>Activo</option>
                      <option value={0}>Inactivo</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicosAdmin;
