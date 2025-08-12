import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo_clinica_blanco.png";

const Home_medico = () => {
  const navigate = useNavigate();
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
        <img
          src={logo}
          alt="Logo"
          style={{
            width: 70,
            height: 70,
            borderRadius: "50%",
            background: "#2e5da1",
            padding: 8,
            objectFit: "cover",
            marginBottom: 16,
          }}
        />
        <h2
          className="fw-bold"
          style={{
            color: "#2e5da1",
            letterSpacing: "0.5px",
            fontSize: "2.2rem",
          }}
        >
          Bienvenido Dr(a).
          {nombreCompleto && (
            <>
              {" "}
              <span style={{ color: "#fad02c" }}>{nombreCompleto}</span>
            </>
          )}
        </h2>
        <p className="text-secondary" style={{ fontSize: "1.15rem" }}>
          Panel de gestión para médicos
        </p>
      </div>
      <div
        className="row g-4 w-100 justify-content-center"
        style={{ maxWidth: "700px" }}
      >
        <div className="col-12 col-md-4 d-flex justify-content-center">
          <button
            className="btn btn-primary btn-lg d-flex flex-column align-items-center justify-content-center shadow"
            style={{
              borderRadius: "1rem",
              minWidth: "200px",
              minHeight: "140px",
              background: "#2e5da1",
              border: "none",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1.15rem",
              boxShadow: "0 2px 12px 0 rgba(46,93,161,0.10)",
              transition: "background 0.2s",
            }}
            onClick={() => navigate("/medico/horario")}
          >
            <i
              className="bi bi-clock-history mb-3"
              style={{ fontSize: "2.2rem" }}
            ></i>
            <span className="fs-5">Definir Horario</span>
          </button>
        </div>
        <div className="col-12 col-md-4 d-flex justify-content-center">
          <button
            className="btn btn-warning btn-lg d-flex flex-column align-items-center justify-content-center shadow"
            style={{
              borderRadius: "1rem",
              minWidth: "200px",
              minHeight: "140px",
              background: "#fad02c",
              border: "none",
              color: "#2e5da1",
              fontWeight: "bold",
              fontSize: "1.15rem",
              boxShadow: "0 2px 12px 0 rgba(46,93,161,0.10)",
              transition: "background 0.2s",
            }}
            onClick={() => navigate("/medico/citas")}
          >
            <i
              className="bi bi-calendar-check mb-3"
              style={{ fontSize: "2.2rem" }}
            ></i>
            <span className="fs-5">Mis Citas</span>
          </button>
        </div>
        <div className="col-12 col-md-4 d-flex justify-content-center">
          <button
            className="btn btn-outline-primary btn-lg d-flex flex-column align-items-center justify-content-center shadow"
            style={{
              borderRadius: "1rem",
              minWidth: "200px",
              minHeight: "140px",
              background: "#fff",
              border: "2px solid #2e5da1",
              color: "#2e5da1",
              fontWeight: "bold",
              fontSize: "1.15rem",
              boxShadow: "0 2px 12px 0 rgba(46,93,161,0.10)",
              transition: "background 0.2s",
            }}
            onClick={() => navigate("/medico/expediente")}
          >
            <i
              className="bi bi-folder2-open mb-3"
              style={{ fontSize: "2.2rem" }}
            ></i>
            <span className="fs-5">Expedientes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home_medico;