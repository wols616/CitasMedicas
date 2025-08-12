import React, { useState } from "react";
import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logoClinica from "../assets/logo_clinica.png";
import Swal from "sweetalert2";

const NavbarApp = () => {
  const navigate = useNavigate();
  const [dropdownShow, setDropdownShow] = useState(false);

  // Obtener usuario desde localStorage
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "¿Cerrar sesión?",
      text: "¿Estás seguro de que deseas cerrar sesión?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2e5da1",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });
    if (result.isConfirmed) {
      localStorage.removeItem("user");
      navigate("/");
    }
  };

  const handleMouseEnter = () => setDropdownShow(true);
  const handleMouseLeave = () => setDropdownShow(false);

  if (!user) return null;

  // Dropdown de usuario
  const userDropdown = (
    <NavDropdown
      title={
        <span style={{ color: "#2e5da1" }}>
          Bienvenido/a, {user.nombres} {user.apellidos}
        </span>
      }
      id="userDropdown"
      show={dropdownShow}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      align="end"
      style={{ fontWeight: "bold" }}
    >
      <NavDropdown.Item as={Link} to="/cambiar-contrasena">
        Cambiar Contraseña
      </NavDropdown.Item>
      <NavDropdown.Item onClick={handleLogout}>Cerrar Sesión</NavDropdown.Item>
    </NavDropdown>
  );

  // Colores de la paleta
  const navBg = {
    background:
      "linear-gradient(90deg, #f5faff 60%, #e3eafc 100%)",
  };
  const navLinkStyle = ({ isActive }) => ({
    color: isActive ? "#2e5da1" : "#4a4a4a",
    fontWeight: isActive ? "bold" : "normal",
    background: isActive ? "#e3eafc" : "transparent",
    borderRadius: "8px",
    marginRight: "0.5rem",
    padding: "0.4rem 1rem",
    transition: "background 0.2s, color 0.2s",
  });

  // Navbar para admin
  if (user.rol === "admin") {
    return (
      <Navbar expand="md" className=" shadow-sm" style={navBg}>
        <Container fluid>
          <Navbar.Brand as={Link} to="/home_admin">
            <img
              src={logoClinica}
              alt="Logo Clínica"
              style={{
                height: "48px",
                width: "48px",
                objectFit: "contain",
              }}
              className="me-2"
            />
            <span
              style={{ color: "#2e5da1", fontWeight: "bold" }}
            >
              Control Citas
            </span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link
                as={NavLink}
                to="/admin/dashboard"
                style={navLinkStyle}
              >
                Dashboard
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/admin/usuarios"
                style={navLinkStyle}
              >
                Gestión de Usuarios
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/admin/medicos"
                style={navLinkStyle}
              >
                Gestión de Médicos
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/admin/especialidades"
                style={navLinkStyle}
              >
                Especialidades
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/admin/contactos-paciente"
                style={navLinkStyle}
              >
                Contactos Paciente
              </Nav.Link>
            </Nav>
            <Nav className="ms-auto">{userDropdown}</Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    );
  }

  // Navbar para paciente
  if (user.rol === "paciente") {
    return (
      <Navbar expand="md" className=" shadow-sm" style={navBg}>
        <Container fluid>
          <Navbar.Brand as={Link} to="/home_paciente">
            <img
              src={logoClinica}
              alt="Logo Clínica"
              style={{
                height: "48px",
                width: "48px",
                objectFit: "contain",
              }}
              className="me-2"
            />
            <span
              style={{ color: "#2e5da1", fontWeight: "bold" }}
            >
              Control Citas
            </span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link
                as={NavLink}
                to="/home_paciente"
                style={navLinkStyle}
              >
                Inicio
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/agendar-cita"
                style={navLinkStyle}
              >
                Agendar Cita
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/mis-citas"
                style={navLinkStyle}
              >
                Mis Citas
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/expediente"
                style={navLinkStyle}
              >
                Expediente
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/mis-contactos"
                style={navLinkStyle}
              >
                Mis Contactos
              </Nav.Link>
            </Nav>
            <Nav className="ms-auto">{userDropdown}</Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    );
  }

  // Navbar para médico
  if (user.rol === "medico") {
    return (
      <Navbar expand="md" className=" shadow-sm" style={navBg}>
        <Container fluid>
          <Navbar.Brand as={Link} to="/home_medico">
            <img
              src={logoClinica}
              alt="Logo Clínica"
              style={{
                height: "48px",
                width: "48px",
                objectFit: "contain",
              }}
              className="me-2"
            />
            <span style={{ color: "#2e5da1", fontWeight: "bold" }}>
              Control Citas
            </span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link
                as={NavLink}
                to="/home_medico"
                style={navLinkStyle}
              >
                Inicio
              </Nav.Link>
              <Nav.Link as={NavLink} to="/medico/citas" style={navLinkStyle}>
                Mis Citas
              </Nav.Link>
              <Nav.Link as={NavLink} to="/medico/horario" style={navLinkStyle}>
                Mi Horario
              </Nav.Link>
              <Nav.Link as={NavLink} to="/medico/expediente" style={navLinkStyle}>
                Expedientes
              </Nav.Link>
            </Nav>
            <Nav className="ms-auto">{userDropdown}</Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    );
  }

  // Si el rol no es reconocido
  return null;
};

export default NavbarApp;