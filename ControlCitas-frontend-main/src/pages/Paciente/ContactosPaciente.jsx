import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const ContactosPaciente = () => {
  const [contactos, setContactos] = useState([]);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    parentesco: "",
    telefono: "",
    direccion: "",
    correo: "",
  });
  const [loading, setLoading] = useState(false);

  const paciente = JSON.parse(localStorage.getItem("paciente"));

  // Declara la variable de entorno para la URL
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    cargarContactos();
    // eslint-disable-next-line
  }, []);

  const cargarContactos = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/api/pacientes/contactos`, {
        params: { id_paciente: paciente.id_paciente },
      });
      setContactos(res.data);
    } catch {
      setContactos([]);
      Swal.fire("Error", "Error al cargar contactos", "error");
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${apiUrl}/api/pacientes/contactos`, {
        ...form,
        id_paciente: paciente.id_paciente,
      });
      Swal.fire(
        "Contacto agregado",
        "El contacto fue agregado correctamente",
        "success"
      );
      setForm({
        nombre: "",
        apellido: "",
        parentesco: "",
        telefono: "",
        direccion: "",
        correo: "",
      });
      cargarContactos();
    } catch {
      Swal.fire("Error", "Error al agregar contacto", "error");
    }
  };

  const eliminarContacto = async (id_contacto) => {
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
        await axios.delete(`${apiUrl}/api/pacientes/contactos/${id_contacto}`);
        Swal.fire("Contacto eliminado", "", "success");
        cargarContactos();
      } catch {
        Swal.fire("Error", "Error al eliminar contacto", "error");
      }
    }
  };

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4" style={{ color: "#2e5da1" }}>
        Mis Contactos
      </h2>
      <div className="alert alert-warning" style={{ fontSize: "1rem" }}>
        <b>Nota:</b> Estos son tus <b>contactos de emergencia</b>. El médico o
        el personal de la clínica podrá comunicarse con ellos en caso de
        cualquier emergencia relacionada con tu salud.
      </div>
      <form className="row g-2 mb-4" onSubmit={handleSubmit}>
        <div className="col-md-4">
          <input
            type="text"
            name="nombre"
            className="form-control"
            placeholder="Nombre"
            value={form.nombre}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-4">
          <input
            type="text"
            name="apellido"
            className="form-control"
            placeholder="Apellido"
            value={form.apellido}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-4">
          <input
            type="text"
            name="parentesco"
            className="form-control"
            placeholder="Parentesco"
            value={form.parentesco}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-4">
          <input
            type="text"
            name="telefono"
            className="form-control"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-4">
          <input
            type="text"
            name="direccion"
            className="form-control"
            placeholder="Dirección"
            value={form.direccion}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-4">
          <input
            type="email"
            name="correo"
            className="form-control"
            placeholder="Correo"
            value={form.correo}
            onChange={handleChange}
          />
        </div>
        <div className="col-12">
          <button className="btn btn-primary" style={{ background: "#2e5da1" }}>
            Agregar contacto
          </button>
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
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => eliminarContacto(c.id_contacto)}
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

export default ContactosPaciente;
