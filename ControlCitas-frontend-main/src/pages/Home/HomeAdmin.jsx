import React from "react";
import { useNavigate } from "react-router-dom";

const HomeAdmin = () => {
  const navigate = useNavigate();

  // Obtén el usuario del localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const nombreCompleto = user ? `${user.nombres} ${user.apellidos}` : "";

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center"
      style={{
        minHeight: "80vh",
        width: "auto",
        background: "#f5faff",
      }}
    >
      <div className="text-center mb-5" style={{ width: "100%" }}>
        <h2
          className="fw-bold"
          style={{
            color: "#2e5da1",
            letterSpacing: "0.5px",
            fontSize: "2.2rem",
          }}
        >
          Bienvenido Administrador
          {nombreCompleto && (
            <>
              {" "}
              <span style={{ color: "#fad02c" }}>{nombreCompleto}</span>
            </>
          )}
        </h2>
        <p className="text-secondary" style={{ fontSize: "1.15rem" }}>
          Gestiona usuarios, médicos y especialidades desde aquí
        </p>
      </div>
      <div
        className="row g-4 w-100 justify-content-center"
        style={{ maxWidth: "900px" }}
      >
        <div className="col-12 col-md-6 col-lg-3 d-flex justify-content-center">
          <button
            className="btn btn-primary btn-lg d-flex flex-column align-items-center justify-content-center shadow"
            style={{
              borderRadius: "1rem",
              minWidth: "180px",
              minHeight: "140px",
              background: "#2e5da1",
              border: "none",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1.15rem",
              boxShadow: "0 2px 12px 0 rgba(46,93,161,0.10)",
              transition: "background 0.2s",
            }}
            onClick={() => navigate("/admin/dashboard")}
          >
            <i
              className="bi bi-bar-chart-fill mb-3"
              style={{ fontSize: "2.2rem" }}
            ></i>
            <span>Dashboard</span>
          </button>
        </div>
        <div className="col-12 col-md-6 col-lg-3 d-flex justify-content-center">
          <button
            className="btn btn-success btn-lg d-flex flex-column align-items-center justify-content-center shadow"
            style={{
              borderRadius: "1rem",
              minWidth: "180px",
              minHeight: "140px",
              background: "#28a745",
              border: "none",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1.15rem",
              boxShadow: "0 2px 12px 0 rgba(46,93,161,0.10)",
              transition: "background 0.2s",
            }}
            onClick={() => navigate("/admin/usuarios")}
          >
            <i
              className="bi bi-people-fill mb-3"
              style={{ fontSize: "2.2rem" }}
            ></i>
            <span>Gestión de Usuarios</span>
          </button>
        </div>
        <div className="col-12 col-md-6 col-lg-3 d-flex justify-content-center">
          <button
            className="btn btn-warning btn-lg d-flex flex-column align-items-center justify-content-center shadow"
            style={{
              borderRadius: "1rem",
              minWidth: "180px",
              minHeight: "140px",
              background: "#fad02c",
              border: "none",
              color: "#2e5da1",
              fontWeight: "bold",
              fontSize: "1.15rem",
              boxShadow: "0 2px 12px 0 rgba(46,93,161,0.10)",
              transition: "background 0.2s",
            }}
            onClick={() => navigate("/admin/medicos")}
          >
            <i
              className="bi bi-person-badge-fill mb-3"
              style={{ fontSize: "2.2rem" }}
            ></i>
            <span>Gestión de Médicos</span>
          </button>
        </div>
        <div className="col-12 col-md-6 col-lg-3 d-flex justify-content-center">
          <button
            className="btn btn-info btn-lg d-flex flex-column align-items-center justify-content-center shadow"
            style={{
              borderRadius: "1rem",
              minWidth: "180px",
              minHeight: "140px",
              background: "#17a2b8",
              border: "none",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1.15rem",
              boxShadow: "0 2px 12px 0 rgba(46,93,161,0.10)",
              transition: "background 0.2s",
            }}
            onClick={() => navigate("/admin/especialidades")}
          >
            <i
              className="bi bi-clipboard2-pulse-fill mb-3"
              style={{ fontSize: "2.2rem" }}
            ></i>
            <span>Especialidades</span>
          </button>
        </div>
        <div className="col-12 col-md-6 col-lg-3 d-flex justify-content-center">
          <button
            className="btn btn-secondary btn-lg d-flex flex-column align-items-center justify-content-center shadow"
            style={{
              borderRadius: "1rem",
              minWidth: "180px",
              minHeight: "140px",
              background: "#6c757d",
              border: "none",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1.15rem",
              boxShadow: "0 2px 12px 0 rgba(46,93,161,0.10)",
              transition: "background 0.2s",
            }}
            onClick={() => navigate("/admin/contactos-paciente")}
          >
            <i
              className="bi bi-person-lines-fill mb-3"
              style={{ fontSize: "2.2rem" }}
            ></i>
            <span>Contactos Paciente</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeAdmin;