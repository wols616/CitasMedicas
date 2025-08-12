import React from "react";
import { Container } from "react-bootstrap";

const Footer = () => (
  <footer
    className="mt-auto py-3 shadow-sm"
    style={{
      background: "linear-gradient(90deg, #f5faff 60%, #e3eafc 100%)",
      borderTop: "1px solid #e3eafc",
    }}
  >
    <Container className="text-center">
      <span style={{ color: "#2e5da1", fontWeight: "bold" }}>
        &copy; {new Date().getFullYear()} Control Citas
      </span>
      <span
        style={{
          color: "#4a4a4a",
          fontWeight: "normal",
          marginLeft: "1rem",
          fontSize: "0.97rem",
        }}
      >
        Clínica Johnson &mdash; Todos los derechos reservados
      </span>
    </Container>
  </footer>
);

export default Footer;