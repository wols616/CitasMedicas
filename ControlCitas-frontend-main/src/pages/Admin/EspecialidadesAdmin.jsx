import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const EspecialidadesAdmin = () => {
  const [especialidades, setEspecialidades] = useState([]);
  const [form, setForm] = useState({ nombre: "", descripcion: "" });
  const [editId, setEditId] = useState(null);

  // Filtros de búsqueda
  const [busqueda, setBusqueda] = useState("");
  const [busquedaId, setBusquedaId] = useState("");

  // Declara la variable de entorno para la URL
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchEspecialidades();
  }, []);

  const fetchEspecialidades = () => {
    axios
      .get(`${apiUrl}/api/admin/especialidades`)
      .then((res) => setEspecialidades(res.data))
      .catch(() => setEspecialidades([]));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      Swal.fire("Error", "El nombre es obligatorio", "error");
      return;
    }
    try {
      if (editId) {
        await axios.put(`${apiUrl}/api/admin/especialidades/${editId}`, form);
        Swal.fire("¡Actualizado!", "Especialidad actualizada.", "success");
      } else {
        await axios.post(`${apiUrl}/api/admin/especialidades`, form);
        Swal.fire("¡Agregado!", "Especialidad registrada.", "success");
      }
      setForm({ nombre: "", descripcion: "" });
      setEditId(null);
      fetchEspecialidades();
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "No se pudo guardar",
        "error"
      );
    }
  };

  const handleEdit = (esp) => {
    setForm({ nombre: esp.nombre, descripcion: esp.descripcion || "" });
    setEditId(esp.id_especialidad);
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "¿Eliminar especialidad?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${apiUrl}/api/admin/especialidades/${id}`);
          Swal.fire("Eliminado", "Especialidad eliminada.", "success");
          fetchEspecialidades();
        } catch (err) {
          Swal.fire(
            "Error",
            err.response?.data?.message ||
              "No se pudo eliminar la especialidad.",
            "error"
          );
        }
      }
    });
  };

  const handleCancelEdit = () => {
    setForm({ nombre: "", descripcion: "" });
    setEditId(null);
  };

  // Filtrado en frontend
  const especialidadesFiltradas = especialidades.filter((esp) => {
    const coincideBusqueda =
      busqueda.trim() === "" ||
      esp.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (esp.descripcion || "").toLowerCase().includes(busqueda.toLowerCase());
    const coincideId =
      busquedaId.trim() === "" ||
      esp.id_especialidad.toString() === busquedaId.trim();
    return coincideBusqueda && coincideId;
  });

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
          maxWidth: "700px",
          width: "100%",
          borderRadius: "18px",
          boxShadow: "0 4px 24px 0 rgba(46,93,161,0.10)",
        }}
      >
        <h3 className="fw-bold text-center mb-3" style={{ color: "#2e5da1" }}>
          Gestión de Especialidades
        </h3>

        {/* Buscador y filtro */}
        <form className="row g-2 mb-4 align-items-end">
          <div className="col-md-6">
            <label className="form-label">
              Buscar por nombre o descripción
            </label>
            <input
              type="text"
              className="form-control"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ej: Cardiología, cirugía..."
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Filtrar por ID</label>
            <input
              type="number"
              className="form-control"
              value={busquedaId}
              onChange={(e) => setBusquedaId(e.target.value)}
              placeholder="ID especialidad"
            />
          </div>
        </form>

        <form onSubmit={handleSubmit} className="row g-3 mb-4">
          <div className="col-md-6">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              className="form-control"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Descripción</label>
            <input
              type="text"
              className="form-control"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
            />
          </div>
          <div className="col-12 d-flex gap-2">
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
            >
              {editId ? "Actualizar" : "Agregar"}
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
            <thead style={{ background: "#e3eafc" }}>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th style={{ width: "160px" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {especialidadesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center text-secondary py-4">
                    No hay especialidades registradas.
                  </td>
                </tr>
              ) : (
                especialidadesFiltradas.map((esp) => (
                  <tr key={esp.id_especialidad}>
                    <td>{esp.id_especialidad}</td>
                    <td>{esp.nombre}</td>
                    <td>{esp.descripcion}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleEdit(esp)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(esp.id_especialidad)}
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
    </div>
  );
};

export default EspecialidadesAdmin;
