import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const CitasPacienteMedico = ({ paciente }) => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const medico = JSON.parse(localStorage.getItem("medico"));

  // Declara la variable de entorno para la URL
  const apiUrl = import.meta.env.VITE_API_URL;

  // Contactos del paciente
  const [contactos, setContactos] = useState([]);
  useEffect(() => {
    if (paciente?.id_paciente) {
      axios
        .get(`${apiUrl}/api/pacientes/contactos`, {
          params: { id_paciente: paciente.id_paciente },
        })
        .then((res) => setContactos(res.data))
        .catch(() => setContactos([]));
    }
    // eslint-disable-next-line
  }, [paciente]);

  useEffect(() => {
    if (paciente) cargarCitas();
    // eslint-disable-next-line
  }, [paciente]);

  const cargarCitas = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${apiUrl}/api/medico/expediente/${paciente.id_paciente}`
      );
      setCitas(res.data);
      console.log(res.data);
    } catch {
      setCitas([]);
      Swal.fire("Error al cargar expediente", "", "error");
    }
    setLoading(false);
  };

  const abrirModalInforme = async (id_cita) => {
    const { value: descripcion } = await Swal.fire({
      title: "Agregar informe",
      input: "textarea",
      inputLabel: "Descripción del informe",
      inputPlaceholder: "Escribe el informe aquí...",
      showCancelButton: true,
    });
    if (descripcion) {
      try {
        await axios.post(`${apiUrl}/api/medico/agregar-informe/${id_cita}`, {
          descripcion,
        });
        Swal.fire("Informe guardado", "", "success");
        cargarCitas();
      } catch (err) {
        Swal.fire(
          "Error",
          err.response?.data?.error || "No se pudo guardar el informe",
          "error"
        );
      }
    }
  };

  const abrirEditarInforme = async (detalleCita) => {
    setDetalle(null); // Cierra el modal de detalle antes de abrir el Swal
    setTimeout(async () => {
      const { value: descripcion } = await Swal.fire({
        title: "Editar informe",
        input: "textarea",
        inputLabel: "Descripción del informe",
        inputPlaceholder: "Escribe el informe aquí...",
        inputValue: detalleCita.informe,
        showCancelButton: true,
        preConfirm: (value) => {
          if (!value || value.trim() === "") {
            Swal.showValidationMessage("La descripción no puede estar vacía");
          }
          return value;
        },
      });
      if (descripcion !== undefined && descripcion.trim() !== "") {
        try {
          await axios.put(
            `${apiUrl}/api/medico/editar-informe/${detalleCita.id_cita}`,
            { descripcion }
          );
          Swal.fire("Informe actualizado", "", "success");
          await cargarCitas();
        } catch (err) {
          Swal.fire(
            "Error",
            err.response?.data?.error || "No se pudo actualizar el informe",
            "error"
          );
        }
      }
    }, 200); // Espera 200ms para que el modal de detalle se cierre antes de abrir el Swal
  };

  const verDetalle = (cita) => setDetalle(cita);
  const cerrarDetalle = () => setDetalle(null);

  function citaYaPaso(fechaISO, hora) {
    // fechaISO: "2025-05-30T06:00:00.000Z", hora: "10:00:00"
    const citaFecha = new Date(fechaISO);
    const [h, m, s] = hora.split(":");
    citaFecha.setHours(Number(h), Number(m), Number(s || 0), 0);
    const now = new Date();
    return now.getTime() > citaFecha.getTime();
  }

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "";
    const fecha = new Date(fechaStr);
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  return (
    <div className="mt-4">
      <h5 className="fw-bold">
        Citas de {paciente.nombres} {paciente.apellidos}
      </h5>
      {loading ? (
        <div className="text-center text-secondary py-4">Cargando...</div>
      ) : citas.length === 0 ? (
        <div className="alert alert-info text-center">
          No hay citas para este paciente.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ background: "#e3eafc" }}>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Estado</th>
                <th>Informe</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {citas.map((cita, i) => (
                <tr key={i}>
                  <td>{formatearFecha(cita.fecha_cita)}</td>
                  <td>{cita.hora_cita}</td>
                  <td>
                    <span
                      className={
                        cita.estado === 1
                          ? "badge bg-success"
                          : cita.estado === 2 || cita.estado === 3
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
                      onClick={() => verDetalle(cita)}
                    >
                      Ver detalle
                    </button>
                    {/* Mostrar botón solo si es el médico, la cita ya pasó, no tiene informe y está pendiente */}
                    {cita.estado === 0 &&
                      citaYaPaso(cita.fecha_cita, cita.hora_cita) &&
                      !cita.informe &&
                      cita.id_medico === medico.id_medico && (
                        <button
                          className="btn btn-outline-success btn-sm ms-2"
                          onClick={() => abrirModalInforme(cita.id_cita)}
                        >
                          Agregar informe
                        </button>
                      )}

                    {/* Mostrar mensaje si la cita ya pasó, no tiene informe, está pendiente, pero NO es el médico */}
                    {cita.estado === 0 &&
                      citaYaPaso(cita.fecha_cita, cita.hora_cita) &&
                      !cita.informe &&
                      cita.id_medico !== medico.id_medico && (
                        <span className="text-muted ms-2">
                          Solo el médico de esta cita puede agregar informe
                        </span>
                      )}

                    {/* Mostrar mensaje si la cita aún no ha pasado */}
                    {cita.estado === 0 &&
                      !citaYaPaso(cita.fecha_cita, cita.hora_cita) && (
                        <span className="text-muted ms-2">
                          Aún no puedes agregar informe
                        </span>
                      )}
                    {cita.informe && <span className="ms-2"></span>}
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
              <b>Fecha:</b> {formatearFecha(detalle.fecha_cita)}
              <br />
              <b>Hora:</b> {detalle.hora_cita}
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
              {/* Botón para editar informe solo si es el médico de la cita */}
              {detalle.informe && detalle.id_medico === medico.id_medico && (
                <button
                  className="btn btn-outline-warning btn-sm mt-3"
                  onClick={() => abrirEditarInforme(detalle)}
                >
                  Editar informe
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contactos del paciente */}
      <div className="mt-5">
        <h5 className="fw-bold mb-3" style={{ color: "#2e5da1" }}>
          Contactos de emergencia del paciente
        </h5>
        <div className="alert alert-warning" style={{ fontSize: "1rem" }}>
          <b>Nota:</b> Estos son los <b>contactos de emergencia</b> que el
          personal médico puede contactar en caso de cualquier emergencia.
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead style={{ background: "#e3eafc" }}>
              <tr>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Parentesco</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Correo</th>
              </tr>
            </thead>
            <tbody>
              {contactos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center">
                    No hay contactos registrados.
                  </td>
                </tr>
              ) : (
                contactos.map((c) => (
                  <tr key={c.id_contacto}>
                    <td>{c.nombre}</td>
                    <td>{c.apellido}</td>
                    <td>{c.parentesco}</td>
                    <td>{c.telefono}</td>
                    <td>{c.direccion}</td>
                    <td>{c.correo}</td>
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

export default CitasPacienteMedico;
