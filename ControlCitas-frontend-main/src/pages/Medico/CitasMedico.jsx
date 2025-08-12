import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const estados = [
  { value: "", label: "Todos" },
  { value: "0", label: "Pendiente" },
  { value: "1", label: "Finalizada" },
  { value: "2", label: "Cancelada por paciente" },
  { value: "3", label: "Cancelada por médico" },
];

const estadoTexto = (estado) => {
  switch (estado) {
    case 0:
      return "Pendiente";
    case 1:
      return "Finalizada";
    case 2:
      return "Cancelada por paciente";
    case 3:
      return "Cancelada por médico";
    default:
      return "Desconocido";
  }
};

const CitasMedico = () => {
  const medico = JSON.parse(localStorage.getItem("medico"));
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [detalle, setDetalle] = useState(null);

  // Declara la variable de entorno para la URL
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchCitas = async () => {
    setLoading(true);
    try {
      const params = {
        id_medico: medico.id_medico,
        estado: estadoFiltro,
        q: busqueda,
        fecha: fechaFiltro,
      };
      // Elimina params vacíos
      Object.keys(params).forEach((k) => {
        if (!params[k]) delete params[k];
      });
      const res = await axios.get(`${apiUrl}/api/medico/citas`, { params });
      setCitas(res.data);
    } catch {
      setCitas([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCitas();
    // eslint-disable-next-line
  }, [estadoFiltro, fechaFiltro]);

  const handleBuscar = (e) => {
    e.preventDefault();
    fetchCitas();
  };

  const verDetalle = async (id_cita) => {
    try {
      const res = await axios.get(
        `${apiUrl}/api/medico/detalleCita/${id_cita}`
      );
      setDetalle(res.data);
    } catch {
      Swal.fire("Error", "No se pudo cargar el detalle de la cita", "error");
    }
  };

  const cerrarDetalle = () => {
    setDetalle(null);
  };

  // HU10 - Cancelar cita como médico
  const cancelarCita = async (id_cita) => {
    const confirm = await Swal.fire({
      title: "¿Cancelar cita?",
      text: "¿Estás seguro de cancelar esta cita?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
    });
    if (confirm.isConfirmed) {
      try {
        await axios.put(`${apiUrl}/api/medico/cancelarCita/${id_cita}`, {
          id_medico: medico.id_medico,
        });
        Swal.fire(
          "Cita cancelada",
          "La cita fue cancelada correctamente.",
          "success"
        );
        cerrarDetalle();
        fetchCitas();
      } catch (err) {
        Swal.fire(
          "Error",
          err.response?.data?.error || "No se pudo cancelar la cita.",
          "error"
        );
      }
    }
  };

  // Función para formatear fecha a dd/mm/yyyy
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "";
    const fecha = new Date(fechaStr);
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-3" style={{ color: "#2e5da1" }}>
        Mis Citas
      </h2>
      <form className="row g-2 mb-3 align-items-end" onSubmit={handleBuscar}>
        <div className="col-md-3">
          <label className="form-label">Estado</label>
          <select
            className="form-select"
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
          >
            {estados.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Buscar por paciente</label>
          <input
            type="text"
            className="form-control"
            placeholder="Nombre o apellido"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Fecha específica</label>
          <input
            type="date"
            className="form-control"
            value={fechaFiltro}
            onChange={(e) => setFechaFiltro(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <button
            className="btn btn-primary fw-bold"
            style={{ background: "#2e5da1" }}
          >
            Buscar
          </button>
        </div>
      </form>
      {loading ? (
        <div className="text-center text-secondary py-4">Cargando...</div>
      ) : citas.length === 0 ? (
        <div className="alert alert-info text-center mt-4">
          No hay citas registradas con los filtros seleccionados.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ background: "#e3eafc" }}>
              <tr>
                <th>Paciente</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {citas.map((cita) => (
                <tr key={cita.id_cita}>
                  <td>
                    {cita.paciente_nombre} {cita.paciente_apellido}
                  </td>
                  <td>{formatearFecha(cita.fecha_cita)}</td>
                  <td>{cita.hora_cita}</td>
                  <td>
                    <span
                      className={
                        cita.estado === 0
                          ? "badge bg-warning text-dark"
                          : cita.estado === 1
                          ? "badge bg-success"
                          : cita.estado === 2
                          ? "badge bg-secondary"
                          : cita.estado === 3
                          ? "badge bg-secondary"
                          : "badge bg-light text-dark"
                      }
                    >
                      {estadoTexto(cita.estado)}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-outline-primary btn-sm me-2"
                      onClick={() => verDetalle(cita.id_cita)}
                    >
                      Ver detalle
                    </button>
                    {/* HU10: Botón cancelar solo si pendiente */}
                    {cita.estado === 0 && (
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => cancelarCita(cita.id_cita)}
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detalle */}
      {detalle && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="bg-white p-4 rounded shadow"
            style={{ minWidth: 340, maxWidth: 400, position: "relative" }}
          >
            <button
              className="btn-close position-absolute"
              style={{ top: 10, right: 10 }}
              onClick={cerrarDetalle}
            ></button>
            <h5 className="fw-bold mb-2" style={{ color: "#2e5da1" }}>
              Detalle de la Cita
            </h5>
            <div>
              <b>Paciente:</b> {detalle.paciente_nombre}{" "}
              {detalle.paciente_apellido}
              <br />
              <b>Fecha:</b> {formatearFecha(detalle.fecha_cita)}
              <br />
              <b>Hora:</b> {detalle.hora_cita}
              <br />
              <b>Especialidad:</b> {detalle.especialidad}
              <br />
              <b>Estado:</b> {estadoTexto(detalle.estado)}
              <br />
              <b>Motivo:</b> {detalle.motivo || "No especificado"}
              <br />
              {detalle.estado === 1 && (
                <>
                  <b>Informe:</b>
                  <div
                    className="border rounded p-2 mt-1 mb-2"
                    style={{ minHeight: 40 }}
                  >
                    {detalle.informe ? (
                      <span>{detalle.informe}</span>
                    ) : (
                      <span className="text-secondary">
                        Sin informe disponible
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitasMedico;
