import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const ContactosPacienteAdmin = () => {
  const [idPaciente, setIdPaciente] = useState("");
  const [contactos, setContactos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    parentesco: "",
    telefono: "",
    direccion: "",
    correo: "",
  });
  const [datosPaciente, setDatosPaciente] = useState(null);

  // Declarar la variable de entorno para la URL
  const apiUrl = import.meta.env.VITE_API_URL;

  const buscarContactos = async (e) => {
    e.preventDefault();
    if (!idPaciente) {
      Swal.fire("Ingrese el ID del paciente", "", "warning");
      return;
    }
    setLoading(true);
    setEditId(null);
    setDatosPaciente(null);
    try {
      // Obtener datos del paciente por ID
      const resPaciente = await axios.get(
        `${apiUrl}/api/admin/paciente/${idPaciente}`
      );
      if (resPaciente.data.length > 0) {
        setDatosPaciente(resPaciente.data[0]);
      } else {
        setDatosPaciente(null);
        Swal.fire("No encontrado", "No existe un paciente con ese ID", "info");
      }
      // Obtener contactos
      const res = await axios.get(`${apiUrl}/api/admin/contactos-paciente`, {
        params: { id_paciente: idPaciente },
      });
      setContactos(res.data);
      if (res.data.length === 0) {
        Swal.fire(
          "Sin contactos",
          "Este paciente no tiene contactos registrados.",
          "info"
        );
      }
    } catch {
      setContactos([]);
      setDatosPaciente(null);
      Swal.fire("Error", "No se pudieron obtener los datos", "error");
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${apiUrl}/api/admin/contactos-paciente`, {
        ...form,
        id_paciente: idPaciente,
      });
      Swal.fire("Contacto agregado", "", "success");
      setForm({
        nombre: "",
        apellido: "",
        parentesco: "",
        telefono: "",
        direccion: "",
        correo: "",
      });
      buscarContactos({ preventDefault: () => {} });
    } catch {
      Swal.fire("Error", "No se pudo agregar el contacto", "error");
    }
  };

  const handleEdit = (contacto) => {
    setEditId(contacto.id_contacto);
    setForm({
      nombre: contacto.nombre,
      apellido: contacto.apellido,
      parentesco: contacto.parentesco,
      telefono: contacto.telefono,
      direccion: contacto.direccion,
      correo: contacto.correo,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${apiUrl}/api/admin/contactos-paciente/${editId}`, form);
      Swal.fire("Contacto actualizado", "", "success");
      setEditId(null);
      setForm({
        nombre: "",
        apellido: "",
        parentesco: "",
        telefono: "",
        direccion: "",
        correo: "",
      });
      buscarContactos({ preventDefault: () => {} });
    } catch {
      Swal.fire("Error", "No se pudo actualizar el contacto", "error");
    }
  };

  const handleDelete = async (id_contacto) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar contacto?",
      text: "¿Seguro que deseas eliminar este contacto?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "No",
    });
    if (confirm.isConfirmed) {
      try {
        await axios.delete(
          `${apiUrl}/api/admin/contactos-paciente/${id_contacto}`
        );
        Swal.fire("Contacto eliminado", "", "success");
        buscarContactos({ preventDefault: () => {} });
      } catch {
        Swal.fire("Error", "No se pudo eliminar el contacto", "error");
      }
    }
  };

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4" style={{ color: "#2e5da1" }}>
        Contactos de Paciente
      </h2>
      <form className="row g-2 mb-4 align-items-end" onSubmit={buscarContactos}>
        <div className="col-md-4">
          <label className="form-label">ID Paciente</label>
          <input
            type="number"
            className="form-control"
            value={idPaciente}
            onChange={(e) => setIdPaciente(e.target.value)}
            placeholder="Ingrese el ID del paciente"
            required
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
      <div className="alert alert-warning" style={{ fontSize: "1rem" }}>
        <b>Nota:</b> Aquí puede <b>agregar, editar o eliminar</b> los contactos
        de emergencia de cualquier paciente.
      </div>
      {datosPaciente && (
        <div className="alert alert-info mb-3">
          <b>ID:</b> {datosPaciente.id_paciente} <br />
          <b>Nombre:</b> {datosPaciente.nombres} {datosPaciente.apellidos}{" "}
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
      )}
      {/* Formulario agregar/editar */}
      <form
        className="row g-2 mb-4"
        onSubmit={editId ? handleUpdate : handleAdd}
      >
        <div className="col-md-2">
          <input
            type="text"
            name="nombre"
            className="form-control"
            placeholder="Nombre"
            value={form.nombre}
            onChange={handleChange}
            required
            disabled={!idPaciente || (contactos.length === 0 && !editId)}
          />
        </div>
        <div className="col-md-2">
          <input
            type="text"
            name="apellido"
            className="form-control"
            placeholder="Apellido"
            value={form.apellido}
            onChange={handleChange}
            required
            disabled={!idPaciente || (contactos.length === 0 && !editId)}
          />
        </div>
        <div className="col-md-2">
          <input
            type="text"
            name="parentesco"
            className="form-control"
            placeholder="Parentesco"
            value={form.parentesco}
            onChange={handleChange}
            required
            disabled={!idPaciente || (contactos.length === 0 && !editId)}
          />
        </div>
        <div className="col-md-2">
          <input
            type="text"
            name="telefono"
            className="form-control"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={handleChange}
            required
            disabled={!idPaciente || (contactos.length === 0 && !editId)}
          />
        </div>
        <div className="col-md-2">
          <input
            type="text"
            name="direccion"
            className="form-control"
            placeholder="Dirección"
            value={form.direccion}
            onChange={handleChange}
            disabled={!idPaciente || (contactos.length === 0 && !editId)}
          />
        </div>
        <div className="col-md-2">
          <input
            type="email"
            name="correo"
            className="form-control"
            placeholder="Correo"
            value={form.correo}
            onChange={handleChange}
            disabled={!idPaciente || (contactos.length === 0 && !editId)}
          />
        </div>
        <div className="col-12">
          <button
            className="btn btn-success me-2"
            type="submit"
            disabled={!idPaciente || (contactos.length === 0 && !editId)}
          >
            {editId ? "Actualizar contacto" : "Agregar contacto"}
          </button>
          {editId && (
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                setEditId(null);
                setForm({
                  nombre: "",
                  apellido: "",
                  parentesco: "",
                  telefono: "",
                  direccion: "",
                  correo: "",
                });
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
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
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center">
                  Cargando...
                </td>
              </tr>
            ) : contactos.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center">
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
                  <td>
                    <button
                      className="btn btn-outline-primary btn-sm me-2"
                      onClick={() => handleEdit(c)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDelete(c.id_contacto)}
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
  );
};

export default ContactosPacienteAdmin;
