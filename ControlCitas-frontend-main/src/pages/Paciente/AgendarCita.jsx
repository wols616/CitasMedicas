import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2"; // <-- Agrega esta línea

const AgendarCita = () => {
  const [especialidades, setEspecialidades] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [citas, setCitas] = useState([]);
  const [form, setForm] = useState({
    especialidad: "",
    medico: "",
    fecha: "",
    hora: "",
    motivo: "",
  });
  const [mensaje, setMensaje] = useState("");

  // Declara la variable de entorno para la URL
  const apiUrl = import.meta.env.VITE_API_URL;

  // Cargar especialidades al montar
  useEffect(() => {
    axios
      .get(`${apiUrl}/api/pacientes/listarEspecialidades`)
      .then((res) => setEspecialidades(res.data));
  }, []);

  // Cargar médicos al seleccionar especialidad
  useEffect(() => {
    if (form.especialidad) {
      axios
        .get(`${apiUrl}/api/pacientes/listarMedicos/${form.especialidad}`)
        .then((res) => setMedicos(res.data));
    } else {
      setMedicos([]);
    }
    setForm((f) => ({ ...f, medico: "", fecha: "", hora: "" }));
  }, [form.especialidad]);

  // Cargar horarios y citas al seleccionar médico
  useEffect(() => {
    if (form.medico) {
      axios
        .get(`${apiUrl}/api/pacientes/disponibilidadMedico/${form.medico}`)
        .then((res) => {
          setHorarios(res.data.horarios);
          setCitas(res.data.citas);
          console.log(res.data.horarios);
          console.log(res.data.citas);
        });
    } else {
      setHorarios([]);
      setCitas([]);
    }
    setForm((f) => ({ ...f, fecha: "", hora: "" }));
  }, [form.medico]);

  // Mapeo para asegurar coincidencia exacta con la base de datos
  const diasSemanaMap = {
    lunes: "Lunes",
    martes: "Martes",
    miércoles: "Miércoles",
    jueves: "Jueves",
    viernes: "Viernes",
    sábado: "Sábado",
    domingo: "Domingo",
  };

  // Obtener horas disponibles para la fecha seleccionada
  const getHorasDisponibles = () => {
    if (!form.fecha || !horarios.length) return [];
    if (!citas || !Array.isArray(citas)) return [];

    const [year, month, day] = form.fecha.split("-");
    const dateObj = new Date(year, month - 1, day);
    const dia = dateObj
      .toLocaleDateString("es-ES", { weekday: "long" })
      .toLowerCase();
    const diaBD = diasSemanaMap[dia];
    const horariosDia = horarios.filter((h) => h.dia_semana === diaBD);
    if (!horariosDia.length) return [];

    let horas = [];

    horariosDia.forEach((horario) => {
      let start = new Date(`2000-01-01T${horario.hora_inicio}`);
      let end = new Date(`2000-01-01T${horario.hora_fin}`);

      while (start < end) {
        const horaStr = start.toTimeString().slice(0, 5);

        const esHoy = form.fecha === new Date().toISOString().split("T")[0];

        // Validar si es hoy y la hora ya pasó
        if (esHoy) {
          const ahora = new Date();
          const horaActual = new Date(
            `2000-01-01T${ahora.toTimeString().slice(0, 5)}`
          );
          if (start <= horaActual) {
            start.setMinutes(start.getMinutes() + 30);
            continue; // Saltar horas pasadas
          }
        }

        const ocupada = citas.some((c) => {
          const citaFecha = new Date(c.fecha_cita).toISOString().slice(0, 10);
          return (
            citaFecha === form.fecha && c.hora_cita.slice(0, 5) === horaStr
          );
        });

        if (!ocupada) {
          horas.push(horaStr);
        }

        start.setMinutes(start.getMinutes() + 30);
      }
    });

    return horas;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "fecha") {
      setForm({ ...form, fecha: value, hora: "" });
    } else {
      setForm({ ...form, [name]: value });
    }
    setMensaje("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hora) {
      Swal.fire({
        icon: "warning",
        title: "Hora requerida",
        text: "Por favor, selecciona una hora disponible.",
      });
      return;
    }
    try {
      const paciente = JSON.parse(localStorage.getItem("paciente"));
      const id_paciente = paciente?.id_paciente;
      await axios.post(`${apiUrl}/api/pacientes/agendarCita`, {
        id_paciente,
        id_medico: form.medico,
        fecha_cita: form.fecha,
        hora_cita: form.hora,
        motivo: form.motivo,
      });
      Swal.fire({
        icon: "success",
        title: "¡Cita agendada!",
        text: "Tu cita ha sido agendada exitosamente.",
        timer: 2500,
        showConfirmButton: false,
      });
      setForm({
        especialidad: "",
        medico: "",
        fecha: "",
        hora: "",
        motivo: "",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.error || "Error al agendar cita",
      });
    }
  };

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
            Agendar Cita
          </h2>
          <p className="text-secondary" style={{ fontSize: "1.1rem" }}>
            Selecciona la especialidad, médico, fecha y hora para tu cita
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-4 mb-3 shadow-sm bg-white rounded"
          style={{
            maxWidth: "420px",
            width: "100%",
            border: "1px solid #e3eafc",
          }}
        >
          <div className="mb-3">
            <label className="form-label fw-bold" style={{ color: "#2e5da1" }}>
              Especialidad
            </label>
            <select
              name="especialidad"
              value={form.especialidad}
              onChange={handleChange}
              className="form-select"
              required
              style={{ borderRadius: "0.7rem", border: "1px solid #e3eafc" }}
            >
              <option value="">Seleccione especialidad</option>
              {especialidades.map((e) => (
                <option key={e.id_especialidad} value={e.id_especialidad}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold" style={{ color: "#2e5da1" }}>
              Médico
            </label>
            <select
              name="medico"
              value={form.medico}
              onChange={handleChange}
              className="form-select"
              required
              style={{ borderRadius: "0.7rem", border: "1px solid #e3eafc" }}
            >
              <option value="">Seleccione médico</option>
              {medicos.map((m) => (
                <option key={m.id_medico} value={m.id_medico}>
                  {m.nombres} {m.apellidos}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold" style={{ color: "#2e5da1" }}>
              Fecha
            </label>
            <input
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={handleChange}
              className="form-control"
              required
              style={{ borderRadius: "0.7rem", border: "1px solid #e3eafc" }}
              
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold" style={{ color: "#2e5da1" }}>
              Hora
            </label>
            <select
              name="hora"
              className="form-select"
              value={form.hora}
              onChange={handleChange}
              disabled={!form.fecha}
            >
              <option value="">Selecciona una hora</option>
              {getHorasDisponibles().map((hora) => (
                <option key={hora} value={hora + ":00"}>
                  {hora}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold" style={{ color: "#2e5da1" }}>
              Motivo
            </label>
            <input
              type="text"
              name="motivo"
              value={form.motivo}
              onChange={handleChange}
              className="form-control"
              placeholder="Motivo de la cita"
              required
              style={{ borderRadius: "0.7rem", border: "1px solid #e3eafc" }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100 fw-bold"
            style={{
              background: "#2e5da1",
              border: "none",
              borderRadius: "0.7rem",
              fontSize: "1.1rem",
            }}
          >
            Agendar
          </button>
          {mensaje && (
            <div
              className="alert alert-info mt-3 text-center"
              style={{ borderRadius: "0.7rem" }}
            >
              {mensaje}
            </div>
          )}
        </form>
      </div>
    </>
  );
};

export default AgendarCita;
