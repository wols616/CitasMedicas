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

const MisCitas = () => {
  const [tipo, setTipo] = useState("futuras");
  const [estado, setEstado] = useState("");
  const [citas, setCitas] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const paciente = JSON.parse(localStorage.getItem("paciente"));

  // Declara la variable de entorno para la URL
  const apiUrl = import.meta.env.VITE_API_URL;

  const cargarCitas = async () => {
    try {
      const id_paciente = paciente.id_paciente;
      const params = { id_paciente, tipo };
      if (estado) params.estado = estado;
      const res = await axios.get(`${apiUrl}/api/pacientes/consultarCitas`, {
        params,
      });
      setCitas(res.data);
      console.log(res.data);
      if (res.data.length === 0) setMensaje("No hay citas registradas.");
      else setMensaje("");
    } catch {
      setMensaje("Error al cargar citas");
    }
  };

  useEffect(() => {
    cargarCitas();
    // eslint-disable-next-line
  }, [tipo, estado]);

  const cancelarCita = async (id_cita) => {
    const result = await Swal.fire({
      title: "¿Seguro que deseas cancelar esta cita?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
    });

    if (!result.isConfirmed) return;

    try {
      const id_paciente = paciente.id_paciente;
      await axios.put(`${apiUrl}/api/pacientes/cancelarCita/${id_cita}`, {
        id_paciente,
      });
      cargarCitas();
      Swal.fire({
        icon: "success",
        title: "Cita cancelada exitosamente.",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error al cancelar cita",
        text: err.response?.data?.error || "Error al cancelar cita",
      });
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "";
    const fecha = new Date(fechaStr);
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  const ahora = new Date();
  const citasFiltradas = citas.filter((c) => {
    const fecha = c.fecha_cita.split("T")[0];
    const fechaHoraCita = new Date(
      `${fecha}T${c.hora_cita.length === 5 ? c.hora_cita + ":00" : c.hora_cita}`
    );
    if (tipo === "pasadas") {
      return c.estado !== 0 || fechaHoraCita < ahora;
    } else if (tipo === "futuras") {
      return c.estado === 0 && fechaHoraCita >= ahora;
    }
    return true;
  });

  return (
    <>
      <div
        className="d-flex flex-column align-items-center justify-content-center"
        style={{
          minHeight: "80vh",
          width: "100vw",
          background: "#f5faff",
          padding: "0",
        }}
      >
        <div className="text-center mb-4" style={{ width: "100%" }}>
          <h2
            className="fw-bold"
            style={{
              color: "#2e5da1",
              letterSpacing: "0.5px",
              fontSize: "2.2rem",
              marginTop: "2rem",
            }}
          >
            Mis Citas
          </h2>
          <p className="text-secondary" style={{ fontSize: "1.1rem" }}>
            Consulta y gestiona tus citas médicas fácilmente
          </p>
        </div>
        <div
          className="d-flex flex-wrap align-items-center justify-content-center gap-3 mb-4"
          style={{ width: "100%", maxWidth: "700px" }}
        >
          <button
            className="btn btn-primary fw-bold px-4"
            style={{
              background: "#2e5da1",
              border: "none",
              borderRadius: "0.7rem",
              minWidth: "150px",
              opacity: tipo === "futuras" ? 1 : 0.6, // Cambia opacidad aquí
            }}
            onClick={() => setTipo("futuras")}
            disabled={tipo === "futuras"}
          >
            Citas Futuras
          </button>
          <button
            className="btn btn-warning fw-bold px-4"
            style={{
              background: "#fad02c",
              color: "#2e5da1",
              border: "none",
              borderRadius: "0.7rem",
              minWidth: "150px",
              opacity: tipo === "pasadas" ? 1 : 0.6, // Cambia opacidad aquí
            }}
            onClick={() => setTipo("pasadas")}
            disabled={tipo === "pasadas"}
          >
            Citas Pasadas
          </button>
          <select
            className="form-select"
            style={{
              maxWidth: "200px",
              borderRadius: "0.7rem",
              border: "1px solid #e3eafc",
              color: "#2e5da1",
              fontWeight: "bold",
            }}
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            {estados.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
        {mensaje && (
          <div
            className="alert alert-info text-center"
            style={{ maxWidth: "700px", width: "100%" }}
          >
            {mensaje}
          </div>
        )}
        {citas.length > 0 && (
          <div
            className="table-responsive"
            style={{ maxWidth: "900px", width: "100%" }}
          >
            <table className="table table-bordered table-hover align-middle shadow-sm">
              <thead style={{ background: "#e3eafc" }}>
                <tr>
                  <th>Médico</th>
                  <th>Especialidad</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Estado</th>
                  <th>Motivo</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {citasFiltradas.map((c) => (
                  <tr key={c.id_cita}>
                    <td>
                      {c.medico_nombre} {c.medico_apellido}
                    </td>
                    <td>{c.especialidad}</td>
                    <td>{formatearFecha(c.fecha_cita)}</td>
                    <td>{c.hora_cita.slice(0, 5)}</td>
                    <td>
                      <span
                        className={
                          c.estado === 0
                            ? "badge bg-primary"
                            : c.estado === 1
                            ? "badge bg-success"
                            : c.estado === 2
                            ? "badge bg-warning text-dark"
                            : "badge bg-danger"
                        }
                      >
                        {
                          [
                            "Pendiente",
                            "Finalizada",
                            "Cancelada por paciente",
                            "Cancelada por médico",
                          ][c.estado]
                        }
                      </span>
                    </td>
                    <td>{c.motivo}</td>
                    <td>
                      {/* {tipo === "futuras" && c.estado === 0 ? (
                        <button
                          className="btn btn-outline-danger btn-sm"
                          style={{ borderRadius: "0.5rem", fontWeight: "bold" }}
                          onClick={() => cancelarCita(c.id_cita)}
                        >
                          Cancelar
                        </button>
                      ) : (
                        "-"
                      )} */}
                      {tipo === "futuras" && c.estado === 0
                        ? (() => {
                            const fecha = c.fecha_cita.split("T")[0];
                            const hora =
                              c.hora_cita.length === 5
                                ? c.hora_cita + ":00"
                                : c.hora_cita;
                            const fechaHoraCita = new Date(`${fecha}T${hora}`);
                            const ahora = new Date();
                            const diferenciaEnMs = fechaHoraCita - ahora;
                            const diferenciaEnMin =
                              diferenciaEnMs / (1000 * 60);

                            return diferenciaEnMin >= 60 ? (
                              <button
                                className="btn btn-outline-danger btn-sm"
                                style={{
                                  borderRadius: "0.5rem",
                                  fontWeight: "bold",
                                }}
                                onClick={() => cancelarCita(c.id_cita)}
                              >
                                Cancelar
                              </button>
                            ) : (
                              <span
                                className="text-muted"
                                style={{ fontSize: "0.9rem" }}
                              >
                                No disponible
                              </span>
                            );
                          })()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default MisCitas;
