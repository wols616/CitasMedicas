import React, { useEffect, useState } from "react";
import axios from "axios";

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return "";
  const fecha = new Date(fechaStr);
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
};

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return "";
  let anio, mes, dia;
  if (
    typeof fechaNacimiento === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)
  ) {
    [anio, mes, dia] = fechaNacimiento.split("-");
  } else {
    const fecha = new Date(fechaNacimiento);
    anio = fecha.getFullYear();
    mes = String(fecha.getMonth() + 1).padStart(2, "0");
    dia = String(fecha.getDate()).padStart(2, "0");
  }
  const hoy = new Date();
  const fechaNac = new Date(`${anio}-${mes}-${dia}`);
  let edad = hoy.getFullYear() - anio;
  let meses = hoy.getMonth() - (parseInt(mes) - 1);

  if (hoy.getDate() < parseInt(dia)) {
    meses--;
  }
  if (meses < 0) {
    edad--;
    meses += 12;
  }

  if (edad < 1) {
    return `${meses} mes${meses === 1 ? "" : "es"}`;
  }
  return `${edad} año${edad === 1 ? "" : "s"}`;
}

const ExpedientePaciente = () => {
  const [expediente, setExpediente] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [detalle, setDetalle] = useState(null);
  const [datosPaciente, setDatosPaciente] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const paciente = JSON.parse(localStorage.getItem("paciente"));
    if (!paciente) return;
    setLoading(true);

    // Obtener datos personales del paciente
    axios
      .get(`${apiUrl}/api/pacientes/datos`, {
        params: { id_paciente: paciente.id_paciente },
      })
      .then((res) => setDatosPaciente(res.data))
      .catch(() => setDatosPaciente(null));

    // Obtener expediente
    axios
      .get(`${apiUrl}/api/pacientes/expediente`, {
        params: { id_paciente: paciente.id_paciente },
      })
      .then((res) => {
        setExpediente(res.data);
        setMensaje(res.data.length === 0 ? "No hay citas finalizadas." : "");
      })
      .catch(() => setMensaje("Error al cargar el expediente"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4" style={{ color: "#2e5da1" }}>
        Mi Expediente
      </h2>

      {/* Datos personales del paciente */}
      {datosPaciente && (
        <div
          className="mb-4 p-3 rounded shadow-sm"
          style={{ background: "#f8fafc" }}
        >
          <h5 className="fw-bold mb-3" style={{ color: "#2e5da1" }}>
            Datos personales
          </h5>
          <div>
            <b>ID de paciente:</b> {datosPaciente.id_paciente} <br />
            <b>Nombre:</b> {datosPaciente.nombres} {datosPaciente.apellidos}{" "}
            <br />
            <b>Edad:</b> {calcularEdad(datosPaciente.fechaNacimiento)} <br />
            <b>Fecha de Nacimiento:</b> {formatearFecha(datosPaciente.fechaNacimiento)}{" "}
            <br />
            <b>Correo:</b> {datosPaciente.correo} <br />
            <b>Teléfono:</b>{" "}
            {datosPaciente.telefono || (
              <span className="text-muted">No registrado</span>
            )}{" "}
            <br />
            <b>Dirección:</b>{" "}
            {datosPaciente.direccion || (
              <span className="text-muted">No registrada</span>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">Cargando...</div>
      ) : mensaje ? (
        <div className="alert alert-info">{mensaje}</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ background: "#e3eafc" }}>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Médico</th>
                <th>Especialidad</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th>Informe</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {expediente.map((cita) => (
                <tr key={cita.id_cita}>
                  <td>{formatearFecha(cita.fecha_cita)}</td>
                  <td>{cita.hora_cita ? cita.hora_cita.slice(0, 5) : ""}</td>
                  <td>
                    {cita.medico_nombre} {cita.medico_apellido}
                  </td>
                  <td>{cita.especialidad}</td>
                  <td>{cita.motivo}</td>
                  <td>
                    <span
                      className={
                        cita.estado === 1
                          ? "badge bg-success"
                          : cita.estado === 2
                          ? "badge bg-secondary"
                          : cita.estado === 3
                          ? "badge bg-secondary"
                          : "badge bg-warning text-dark"
                      }
                    >
                      {cita.estado === 1
                        ? "Finalizada"
                        : cita.estado === 2
                        ? "Cancelada por paciente"
                        : cita.estado === 3
                        ? "Cancelada por médico"
                        : "Pendiente"}
                    </span>
                  </td>
                  <td>
                    {cita.informe ? (
                      <span className="text-success">Disponible</span>
                    ) : (
                      <span className="text-secondary">Sin informe</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => setDetalle(cita)}
                    >
                      Ver detalle
                    </button>
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
              onClick={() => setDetalle(null)}
            ></button>
            <h5 className="fw-bold mb-2" style={{ color: "#2e5da1" }}>
              Detalle de la Cita
            </h5>
            <div>
              <b>Fecha:</b> {formatearFecha(detalle.fecha_cita)}
              <br />
              <b>Hora:</b>{" "}
              {detalle.hora_cita ? detalle.hora_cita.slice(0, 5) : ""}
              <br />
              <b>Médico:</b> {detalle.medico_nombre} {detalle.medico_apellido}
              <br />
              <b>Especialidad:</b> {detalle.especialidad}
              <br />
              <b>Motivo:</b> {detalle.motivo}
              <br />
              <b>Estado:</b>{" "}
              {detalle.estado === 1
                ? "Finalizada"
                : detalle.estado === 2
                ? "Cancelada por paciente"
                : detalle.estado === 3
                ? "Cancelada por médico"
                : "Pendiente"}
              <br />
              <b>Informe:</b>
              <div
                className="border rounded p-2 mt-1 mb-2"
                style={{ minHeight: 40 }}
              >
                {detalle.informe ? (
                  <span>{detalle.informe}</span>
                ) : (
                  <span className="text-secondary">Sin informe disponible</span>
                )}
              </div>
              {detalle.informe && (
                <div>
                  <b>Fecha informe:</b> {formatearFecha(detalle.fecha_registro)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpedientePaciente;
