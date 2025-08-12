import React from "react";
import { useNavigate } from "react-router-dom";

const Home_paciente = () => {
  const navigate = useNavigate();

  // Obtén el usuario del localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const nombreCompleto = user ? `${user.nombres} ${user.apellidos}` : "";

  return (
    <>
      <div
        className="d-flex flex-column align-items-center justify-content-center"
        style={{
          minHeight: "80vh",
          width: "auto",
          background: "#f5faff"
        }}
      >
        <div className="text-center mb-5" style={{ width: "100%" }}>
          <h2
            className="fw-bold"
            style={{
              color: "#2e5da1",
              letterSpacing: "0.5px",
              fontSize: "2.2rem"
            }}
          >
            Bienvenido
            {nombreCompleto && (
              <>
                {" "}
                <span style={{ color: "#fad02c" }}>{nombreCompleto}</span>
              </>
            )}
          </h2>
          <p className="text-secondary" style={{ fontSize: "1.15rem" }}>
            Gestiona tus citas médicas de forma fácil y rápida
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
              onClick={() => navigate("/agendar-cita")}
            >
              <i
                className="bi bi-calendar-plus mb-3"
                style={{ fontSize: "2.2rem" }}
              ></i>
              <span className="fs-5">Agendar Cita</span>
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
              onClick={() => navigate("/mis-citas")}
            >
              <i
                className="bi bi-list-ul mb-3"
                style={{ fontSize: "2.2rem" }}
              ></i>
              <span className="fs-5">Mis Citas</span>
            </button>
          </div>
          <div className="col-12 col-md-4 d-flex justify-content-center">
            <button
              className="btn btn-info btn-lg d-flex flex-column align-items-center justify-content-center shadow"
              style={{
                borderRadius: "1rem",
                minWidth: "200px",
                minHeight: "140px",
                background: "#e3eafc",
                border: "none",
                color: "#2e5da1",
                fontWeight: "bold",
                fontSize: "1.15rem",
                boxShadow: "0 2px 12px 0 rgba(46,93,161,0.10)",
                transition: "background 0.2s",
              }}
              onClick={() => navigate("/expediente")}
            >
              <i
                className="bi bi-file-earmark-text mb-3"
                style={{ fontSize: "2.2rem" }}
              ></i>
              <span className="fs-5">Expediente</span>
            </button>
          </div>
          <div className="col-12 col-md-4 d-flex justify-content-center">
            <button
              className="btn btn-secondary btn-lg d-flex flex-column align-items-center justify-content-center shadow"
              style={{
                borderRadius: "1rem",
                minWidth: "200px",
                minHeight: "140px",
                background: "#e3eafc",
                border: "none",
                color: "#2e5da1",
                fontWeight: "bold",
                fontSize: "1.15rem",
                boxShadow: "0 2px 12px 0 rgba(46,93,161,0.10)",
                transition: "background 0.2s",
              }}
              onClick={() => navigate("/mis-contactos")}
            >
              <i className="bi bi-person-lines-fill mb-3" style={{ fontSize: "2.2rem" }}></i>
              <span className="fs-5">Mis Contactos</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home_paciente;
