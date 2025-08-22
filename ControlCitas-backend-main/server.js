require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");

const db = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const pacienteRoutes = require("./routes/pacienteRoutes");
const adminRoutes = require("./routes/adminRoutes");
const medicoRoutes = require("./routes/medicoRoutes");
const usbRoutes = require("./routes/usbRoutes");

const app = express();
const upload = multer();

// URL del servidor de reconocimiento facial Flask
const FACE_API_URL = process.env.FACE_API_URL || "http://localhost:5001";

// No es necesario poner límites para las imágenes, multer se encarga
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Montar las rutas
app.use("/api", userRoutes);
app.use("/api/paciente", pacienteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/medico", medicoRoutes);
app.use("/api/usb", usbRoutes);

// Conexión a la base de datos
db.connect((err) => {
  if (err) {
    console.error("Error conectando a la base de datos:", err);
    process.exit(1);
  }
  console.log("Conectado a la base de datos MySQL");
});

// ===== RUTAS DE RECONOCIMIENTO FACIAL =====
app.post("/api/recognize", upload.single("image"), async (req, res) => {
  try {
    const formData = new FormData();
    formData.append("image", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const response = await axios.post(
      "http://localhost:5001/recognize",
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error en reconocimiento" });
  }
});

app.post("/api/face/register", upload.single("image"), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Nombre no proporcionado" });
    }

    const formData = new FormData();
    formData.append("image", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    formData.append("name", name);

    const response = await axios.post(`${FACE_API_URL}/register`, formData, {
      headers: formData.getHeaders(),
    });

    res.json(response.data);
  } catch (err) {
    console.error("Error al registrar rostro:", err.message);
    res.status(500).json({ error: "Error al registrar rostro" });
  }
});

// Nueva ruta para recargar rostros conocidos
app.post("/api/reload-faces", async (req, res) => {
  try {
    await axios.post(`${FACE_API_URL}/load-known-faces`);
    res.json({
      status: "success",
      message: "Rostros conocidos recargados exitosamente",
    });
  } catch (err) {
    console.error("Error al recargar rostros:", err.message);
    res.status(500).json({
      status: "error",
      message: "Error al recargar rostros conocidos",
    });
  }
});

// Nueva ruta para eliminar foto facial de usuario
app.post("/api/face/delete", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Nombre no proporcionado" });
    }

    const formData = new FormData();
    formData.append("name", name);

    const response = await axios.post(`${FACE_API_URL}/delete`, formData, {
      headers: formData.getHeaders(),
    });

    res.json(response.data);
  } catch (err) {
    console.error("Error al eliminar rostro:", err.message);
    res.status(500).json({ error: "Error al eliminar rostro" });
  }
});

// Nueva ruta para renombrar foto facial de usuario
app.post("/api/face/rename", async (req, res) => {
  try {
    const { old_name, new_name } = req.body;
    if (!old_name || !new_name) {
      return res
        .status(400)
        .json({ message: "Debe proporcionar old_name y new_name" });
    }

    const formData = new FormData();
    formData.append("old_name", old_name);
    formData.append("new_name", new_name);

    const response = await axios.post(`${FACE_API_URL}/rename`, formData, {
      headers: formData.getHeaders(),
    });

    res.json(response.data);
  } catch (err) {
    console.error("Error al renombrar rostro:", err.message);
    res.status(500).json({
      error: "Error al renombrar rostro",
      details: err.response?.data?.message || err.message,
    });
  }
});

// Nueva ruta para verificar si existe foto facial de usuario
app.post("/api/face/check", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Nombre no proporcionado" });
    }

    const formData = new FormData();
    formData.append("name", name);

    const response = await axios.post(
      `${FACE_API_URL}/photo-exists`,
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("Error al verificar existencia de rostro:", err.message);
    res.status(500).json({
      error: "Error al verificar rostro",
      exists: false,
    });
  }
});

app.get("/api/face/status", async (req, res) => {
  try {
    await axios.get(`${FACE_API_URL}/status`);
    res.json({
      status: "connected",
      message: "Servidor de reconocimiento facial disponible",
    });
  } catch (err) {
    res.status(503).json({
      status: "disconnected",
      message: "Servidor de reconocimiento facial no disponible",
    });
  }
});

// ===== RUTAS PRINCIPALES =====
app.use("/api/usuarios", userRoutes);
app.use("/api/pacientes", pacienteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/medico", medicoRoutes);
app.use("/api/usb", usbRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Algo salió mal en el servidor" });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en el puerto ${PORT}`);
  console.log(`Conectado al servidor Flask en: ${FACE_API_URL}`);
});
