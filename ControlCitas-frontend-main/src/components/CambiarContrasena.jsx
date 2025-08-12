import React, { useState } from "react";
import {
  Form,
  Button,
  Card,
  Alert,
  Container,
  Row,
  Col,
  InputGroup,
} from "react-bootstrap";
import axios from "axios";
// Ya tienes bootstrap-icons/font/bootstrap-icons.css importado globalmente

const CambiarContrasena = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Agrega la variable de entorno para la URL
  const apiUrl = import.meta.env.VITE_API_URL;

  // Toggles para mostrar/ocultar contraseñas
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!contrasenaActual || !nuevaContrasena || !confirmarContrasena) {
      setError("Todos los campos son obligatorios");
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setError("La nueva contraseña y la confirmación no coinciden");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${apiUrl}/api/usuarios/cambiar-contrasena`, // Usa la variable aquí
        {
          id_usuario: user.id_usuario,
          contrasenaActual,
          nuevaContrasena,
        }
      );
      setMensaje("¡Contraseña actualizada correctamente!");
      setContrasenaActual("");
      setNuevaContrasena("");
      setConfirmarContrasena("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Ocurrió un error al cambiar la contraseña"
      );
    }
    setLoading(false);
  };

  // Estilos personalizados para mantener la coherencia visual
  const cardStyle = {
    border: "none",
    borderRadius: "18px",
    boxShadow: "0 2px 18px 0 rgba(46,93,161,0.10)",
    background: "linear-gradient(90deg, #f5faff 60%, #e3eafc 100%)",
  };

  const titleStyle = {
    color: "#2e5da1",
    fontWeight: "bold",
    fontSize: "1.5rem",
    marginBottom: "1.5rem",
    textAlign: "center",
    letterSpacing: "0.5px",
  };

  const labelStyle = {
    color: "#2e5da1",
    fontWeight: "500",
    marginBottom: "0.3rem",
  };

  const iconBtnStyle = {
    background: "none",
    border: "none",
    color: "#2e5da1",
    fontSize: "1.3rem",
    padding: "0 0.75rem",
    display: "flex",
    alignItems: "center",
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col xs={12} md={7} lg={5}>
          <Card style={cardStyle}>
            <Card.Body>
              <Card.Title style={titleStyle}>Cambiar Contraseña</Card.Title>
              {mensaje && <Alert variant="success">{mensaje}</Alert>}
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit} autoComplete="off">
                <Form.Group className="mb-3" controlId="contrasenaActual">
                  <Form.Label style={labelStyle}>Contraseña Actual</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showActual ? "text" : "password"}
                      value={contrasenaActual}
                      onChange={(e) => setContrasenaActual(e.target.value)}
                      required
                      autoFocus
                    />
                    <Button
                      variant="outline-secondary"
                      tabIndex={-1}
                      onClick={() => setShowActual((v) => !v)}
                      style={iconBtnStyle}
                    >
                      <i
                        className={`bi ${
                          showActual ? "bi-eye-slash-fill" : "bi-eye-fill"
                        }`}
                      ></i>
                    </Button>
                  </InputGroup>
                </Form.Group>
                <Form.Group className="mb-3" controlId="nuevaContrasena">
                  <Form.Label style={labelStyle}>Nueva Contraseña</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showNueva ? "text" : "password"}
                      value={nuevaContrasena}
                      onChange={(e) => setNuevaContrasena(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Mínimo 8 caracteres, una mayúscula, una minúscula y un número"
                    />
                    <Button
                      variant="outline-secondary"
                      tabIndex={-1}
                      onClick={() => setShowNueva((v) => !v)}
                      style={iconBtnStyle}
                    >
                      <i
                        className={`bi ${
                          showNueva ? "bi-eye-slash-fill" : "bi-eye-fill"
                        }`}
                      ></i>
                    </Button>
                  </InputGroup>
                </Form.Group>
                <Form.Group className="mb-4" controlId="confirmarContrasena">
                  <Form.Label style={labelStyle}>
                    Confirmar Nueva Contraseña
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showConfirmar ? "text" : "password"}
                      value={confirmarContrasena}
                      onChange={(e) => setConfirmarContrasena(e.target.value)}
                      required
                    />
                    <Button
                      variant="outline-secondary"
                      tabIndex={-1}
                      onClick={() => setShowConfirmar((v) => !v)}
                      style={iconBtnStyle}
                    >
                      <i
                        className={`bi ${
                          showConfirmar ? "bi-eye-slash-fill" : "bi-eye-fill"
                        }`}
                      ></i>
                    </Button>
                  </InputGroup>
                </Form.Group>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    background: "#2e5da1",
                    border: "none",
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    borderRadius: "8px",
                  }}
                >
                  {loading ? "Guardando..." : "Cambiar Contraseña"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CambiarContrasena;
