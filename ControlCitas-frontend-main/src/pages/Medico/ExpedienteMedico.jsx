import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import CitasPacienteMedico from "./CitasPacienteMedico";

const ExpedienteMedico = () => {
  const [pacientes, setPacientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);

  // Declara la variable de entorno para la URL
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    cargarPacientes();
  }, []);

  const cargarPacientes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/api/admin/buscar-pacientes`, {
        params: { q: "" },
      });
      setPacientes(res.data);
      console.log(res.data);
    } catch {
      setPacientes([]);
      Swal.fire("Error al cargar pacientes", "", "error");
    }
    setLoading(false);
  };

  const buscarPacientes = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPacienteSeleccionado(null); // <-- Limpia el paciente seleccionado al buscar
    try {
      const res = await axios.get(`${apiUrl}/api/admin/buscar-pacientes`, {
        params: { q: busqueda },
      });
      setPacientes(res.data);
      console.log(pacientes);
    } catch {
      setPacientes([]);
      Swal.fire("Error al buscar pacientes", "", "error");
    }
    setLoading(false);
  };

  function formatearFecha(fechaStr) {
    if (!fechaStr) return "";
    // Soporta tanto Date como string tipo "YYYY-MM-DD"
    if (typeof fechaStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
      const [anio, mes, dia] = fechaStr.split("-");
      return `${dia}/${mes}/${anio}`;
    }
    // Si es Date o string con hora
    const fecha = new Date(fechaStr);
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  // Puedes colocar esta función junto a formatearFecha en tu componente

  function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return "";
  let anio, mes, dia;
  if (typeof fechaNacimiento === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) {
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
    // Solo meses si es menor a un año
    return `${meses} mes${meses === 1 ? "" : "es"}`;
  }
  // Solo años si es 1 año o más
  return `${edad} año${edad === 1 ? "" : "s"}`;
}

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-3" style={{ color: "#2e5da1" }}>
        Expediente de Pacientes
      </h2>
      <form className="row g-2 mb-4 align-items-end" onSubmit={buscarPacientes}>
        <div className="col-md-6">
          <label className="form-label">Buscar paciente</label>
          <input
            type="text"
            className="form-control"
            placeholder="Nombre, apellido o correo"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="col-md-2">
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
      ) : (
        <div className="list-group">

          {pacientes.map((p) => (
            <button
              key={p.id_paciente}
              className={`list-group-item list-group-item-action${pacienteSeleccionado?.id_paciente === p.id_paciente
                  ? " active"
                  : ""
                }`}
              onClick={() => setPacienteSeleccionado(p)}
            >
              <div>
                <b>ID de paciente:</b> {p.id_paciente} <br />
                <b>Nombre:</b> {p.nombres} {p.apellidos} <br />
                <b>Edad:</b> {calcularEdad(p.fechaNacimiento)} <br />
                <b>Fecha de Nacimiento:</b> {formatearFecha(p.fechaNacimiento)} <br />
                <b>Correo:</b> {p.correo} <br />
                <b>Teléfono:</b>{" "}
                {p.telefono || (
                  <span className="text-muted">No registrado</span>
                )}{" "}
                <br />
                <b>Dirección:</b>{" "}
                {p.direccion || (
                  <span className="text-muted">No registrada</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      {pacienteSeleccionado && (
        <CitasPacienteMedico paciente={pacienteSeleccionado} />
      )}
    </div>
  );
};

export default ExpedienteMedico;
