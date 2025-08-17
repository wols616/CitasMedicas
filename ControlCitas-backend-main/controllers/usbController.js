const db = require("../config/db");
const jwt = require("jsonwebtoken");

// Generar código de llave USB para un usuario
exports.generateUSBKey = (req, res) => {
  const { id_usuario } = req.body;

  if (!id_usuario) {
    return res.status(400).json({ message: "id_usuario es obligatorio" });
  }

  // Generar un código único de 12 caracteres
  const generateKeyCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const keyCode = generateKeyCode();

  // Guardar el código en la base de datos
  db.query(
    "UPDATE usuario SET usb_key_code = ? WHERE id_usuario = ?",
    [keyCode, id_usuario],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error generando clave USB" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      res.json({
        message: "Clave USB generada exitosamente",
        keyCode: keyCode,
        fileName: "clinic_key.txt",
      });
    }
  );
};

// Login con archivo USB
exports.loginWithUSBFile = (req, res) => {
  const { keyCode } = req.body;

  if (!keyCode) {
    return res.status(400).json({ message: "Código de llave es obligatorio" });
  }

  // Buscar usuario por el código de llave
  db.query(
    "SELECT * FROM usuario WHERE usb_key_code = ? AND usb_key_code IS NOT NULL",
    [keyCode.trim().toUpperCase()],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Error en base de datos" });
      }

      if (results.length === 0) {
        return res
          .status(401)
          .json({ message: "Clave USB inválida o no registrada" });
      }

      const user = results[0];

      // Para autenticación USB, saltamos completamente el 2FA
      // ya que la USB es considerada autenticación física suficiente
      const accessToken = jwt.sign(
        { sub: user.id_usuario },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      // Obtener datos adicionales según el rol
      if (user.rol === "medico") {
        db.query(
          "SELECT * FROM medico WHERE id_usuario = ?",
          [user.id_usuario],
          (err2, medicoResults) => {
            if (err2) {
              return res
                .status(500)
                .json({ message: "Error obteniendo datos de médico" });
            }
            const medico = medicoResults[0] || null;
            if (!medico || medico.activo === 0) {
              return res.status(403).json({
                message:
                  "Tu cuenta de médico está inactiva. Contacta al administrador.",
              });
            }
            res.json({
              message: "Inicio de sesión exitoso con USB",
              user: {
                id_usuario: user.id_usuario,
                nombres: user.nombres,
                apellidos: user.apellidos,
                correo: user.correo,
                rol: user.rol,
              },
              medico,
              accessToken,
            });
          }
        );
      } else if (user.rol === "paciente") {
        db.query(
          "SELECT * FROM paciente WHERE id_usuario = ?",
          [user.id_usuario],
          (err2, pacienteResults) => {
            if (err2) {
              return res
                .status(500)
                .json({ message: "Error obteniendo datos de paciente" });
            }
            res.json({
              message: "Inicio de sesión exitoso con USB",
              user: {
                id_usuario: user.id_usuario,
                nombres: user.nombres,
                apellidos: user.apellidos,
                correo: user.correo,
                rol: user.rol,
              },
              paciente: pacienteResults[0] || null,
              accessToken,
            });
          }
        );
      } else {
        res.json({
          message: "Inicio de sesión exitoso con USB",
          user: {
            id_usuario: user.id_usuario,
            nombres: user.nombres,
            apellidos: user.apellidos,
            correo: user.correo,
            rol: user.rol,
          },
          accessToken,
        });
      }
    }
  );
};

// Verificar si el usuario tiene clave USB configurada
exports.checkUSBKey = (req, res) => {
  const { id_usuario } = req.body;

  if (!id_usuario) {
    return res.status(400).json({ message: "id_usuario es obligatorio" });
  }

  db.query(
    "SELECT usb_key_code FROM usuario WHERE id_usuario = ?",
    [id_usuario],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Error verificando clave USB" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const hasUSBKey = results[0].usb_key_code !== null;

      res.json({
        hasUSBKey: hasUSBKey,
        keyCode: hasUSBKey ? results[0].usb_key_code : null,
      });
    }
  );
};

// Desactivar clave USB
exports.disableUSBKey = (req, res) => {
  const { id_usuario } = req.body;

  if (!id_usuario) {
    return res.status(400).json({ message: "id_usuario es obligatorio" });
  }

  db.query(
    "UPDATE usuario SET usb_key_code = NULL WHERE id_usuario = ?",
    [id_usuario],
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error desactivando clave USB" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      res.json({
        message: "Clave USB desactivada exitosamente",
      });
    }
  );
};
