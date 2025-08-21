const crypto = require("crypto");
const nodemailer = require("nodemailer");
const db = require("../config/db");
const bcrypt = require("bcryptjs");

// Variable global para almacenar códigos pendientes (en memoria)
const pendingConfirmations = new Map();

// Genera un código de 4 dígitos
function generarCodigoConfirmacion() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Enviar código por correo
async function enviarCodigoCorreo(destinatario, nombre, codigo) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Clínica Johnson" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: "Código de confirmación para acción administrativa",
    html: `
            <h3>Hola ${nombre},</h3>
            <p>Tu código de confirmación es:</p>
            <div style="font-size:2rem;font-weight:bold;letter-spacing:1rem;">${codigo}</div>
            <p>Este código es válido por 5 minutos.</p>
        `,
  });
}

/*
// Endpoint para solicitar código de confirmación
exports.solicitarConfirmacion = async (req, res) => {
    const { operacion, datos, adminCorreo } = req.body;
    const id_usuario = req.params.id;

    if (!adminCorreo) return res.status(400).json({ message: "Falta el correo del admin" });

    // Busca el nombre del admin por correo
    db.query("SELECT nombres FROM usuario WHERE correo = ?", [adminCorreo], async (err, rows) => {
        if (err || rows.length === 0) return res.status(400).json({ message: "Admin no encontrado" });

        const codigo = generarCodigoConfirmacion();
        const nombre = rows[0].nombres;
        const confirmacionKey = `${adminCorreo}_${id_usuario}`;

        pendingConfirmations.set(confirmacionKey, {
            codigo,
            expira: Date.now() + 300000,
            operacion,
            datos
        });

        try {
            await enviarCodigoCorreo(adminCorreo, nombre, codigo);
            res.json({ requiereConfirmacion: true });
        } catch (error) {
            pendingConfirmations.delete(confirmacionKey);
            res.status(500).json({ message: "Error al enviar código de confirmación" });
        }
    });
};*/

exports.solicitarConfirmacion = async (req, res) => {
  const { operacion, datos, adminCorreo } = req.body;
  const id_usuario = req.params.id;

  if (!adminCorreo)
    return res.status(400).json({ message: "Falta el correo del admin" });
  if (!id_usuario || id_usuario === "undefined")
    return res.status(400).json({ message: "Falta el id de usuario" });

  const allowed = new Set(["eliminar", "editar", "crear"]);
  if (operacion && !allowed.has(operacion)) {
    return res.status(400).json({ message: "Operación inválida" });
  }

  db.query(
    "SELECT nombres FROM usuario WHERE correo = ?",
    [adminCorreo],
    async (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Error consultando admin" });
      }
      if (!rows || rows.length === 0) {
        return res.status(404).json({ message: "Admin no encontrado" });
      }

      const codigo = generarCodigoConfirmacion();
      const nombre = rows[0].nombres;
      const confirmacionKey = `${adminCorreo}_${id_usuario}`;

      pendingConfirmations.set(confirmacionKey, {
        codigo,
        expira: Date.now() + 300000,
        operacion,
        datos,
      });

      try {
        await enviarCodigoCorreo(adminCorreo, nombre, codigo);
        return res.json({ requiereConfirmacion: true });
      } catch (error) {
        console.error("Error al enviar correo:", error);

        pendingConfirmations.delete(confirmacionKey);
        return res
          .status(502)
          .json({ message: "Error al enviar código de confirmación" });
      }
    }
  );
};

// Middleware para verificar código de confirmación o pregunta de seguridad
exports.verificarConfirmacion = (req, res, next) => {
  const id_usuario = req.params.id || req.params.id_usuario;
  const { codigoConfirmacion, verificationMethod } = req.body;

  // Obtener adminCorreo del localStorage (se debe enviar en el request)
  const adminCorreo = req.body.adminCorreo || req.headers["admin-correo"];

  if (!adminCorreo) {
    return res.status(400).json({
      message: "Falta el correo del administrador",
      requiereConfirmacion: true,
    });
  }

  // Si el método es por pregunta de seguridad, permitir el paso
  if (verificationMethod === 'question') {
    // La verificación ya se realizó en el frontend
    console.log('Usando verificación por pregunta de seguridad');
    return next();
  }

  // Si no se especifica método, asumir que es por código
  if (verificationMethod !== 'code' && verificationMethod !== 'question') {
    return res.status(400).json({
      message: "Método de verificación no válido",
      requiereConfirmacion: true,
    });
  }

  // Para método de código, verificar el código
  const confirmacionKey = `${adminCorreo}_${id_usuario}`;
  const confirmacion = pendingConfirmations.get(confirmacionKey);

  // Solo verificar código si el método es 'code'
  if (verificationMethod === 'code') {
    if (!codigoConfirmacion) {
      return res.status(400).json({
        message: "Debe proporcionar un código de confirmación",
        requiereConfirmacion: true,
      });
    }

    if (!confirmacion || confirmacion.codigo !== codigoConfirmacion) {
      return res.status(400).json({
        message: "Código de confirmación inválido o expirado",
        requiereConfirmacion: true,
      });
    }

    if (Date.now() > confirmacion.expira) {
      pendingConfirmations.delete(confirmacionKey);
      return res.status(400).json({
        message: "Código de confirmación expirado",
        requiereConfirmacion: true,
      });
    }

    pendingConfirmations.delete(confirmacionKey);
  }

  next();
};

function formatearFecha(fechaStr) {
  if (!fechaStr) return "";
  if (typeof fechaStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
    const [anio, mes, dia] = fechaStr.split("-");
    return `${dia}/${mes}/${anio}`;
  }
  const fecha = new Date(fechaStr);
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

// Listar todos los usuarios
exports.getUsuarios = (req, res) => {
  db.query(
    `SELECT u.*, p.id_paciente, m.id_medico
         FROM usuario u
         LEFT JOIN paciente p ON u.id_usuario = p.id_usuario
         LEFT JOIN medico m ON u.id_usuario = m.id_usuario
         ORDER BY u.id_usuario DESC`,
    (err, rows) => {
      if (err) {
        console.error("Error al obtener usuarios:", err);
        return res.status(500).json({ message: "Error al obtener usuarios" });
      }
      res.json(rows);
    }
  );
};

// Crear usuario (admin puede crear cualquier usuario)
exports.crearUsuario = async (req, res) => {
  const {
    nombres,
    apellidos,
    direccion,
    telefono,
    correo,
    contrasena,
    sexo,
    rol,
  } = req.body;

  if (
    !nombres ||
    !apellidos ||
    !direccion ||
    !telefono ||
    !correo ||
    !contrasena ||
    !sexo ||
    !rol
  ) {
    return res
      .status(400)
      .json({ message: "Todos los campos son obligatorios" });
  }

  try {
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    db.query(
      "INSERT INTO usuario (nombres, apellidos, direccion, telefono, correo, contrasena, sexo, rol) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        nombres,
        apellidos,
        direccion,
        telefono,
        correo,
        hashedPassword,
        sexo,
        rol,
      ],
      (err, result) => {
        if (err) {
          console.error("Error al crear usuario:", err);
          return res.status(500).json({ message: "Error al crear usuario" });
        }
        res.status(201).json({ message: "Usuario creado correctamente" });
      }
    );
  } catch (err) {
    console.error("Error al encriptar contraseña:", err);
    return res
      .status(500)
      .json({ message: "Error al encriptar la contraseña" });
  }
};

// Editar usuario con confirmación
exports.editarUsuario = (req, res) => {
  const id_usuario = req.params.id;
  const { 
    codigoConfirmacion, 
    adminCorreo, 
    verificationMethod,
    securityVerified,
    ...userData 
  } = req.body;

  console.log('Datos recibidos para editar:', {
    id_usuario,
    verificationMethod,
    securityVerified,
    adminCorreo,
    userData
  });

  if (!adminCorreo) {
    return res.status(400).json({
      message: "Falta el correo del administrador",
      requiereConfirmacion: true,
    });
  }

  const procederConVerificacion = () => {
    // Para verificación por pregunta de seguridad
    if (verificationMethod === 'question') {
      if (!securityVerified) {
        return res.status(400).json({
          message: "La verificación de seguridad no ha sido completada",
          requiereConfirmacion: true,
        });
      }
      console.log('Verificación por pregunta de seguridad completada');
      return true;
    }
    
    // Para verificación por código
    else if (verificationMethod === 'code') {
      const confirmacionKey = `${adminCorreo}_${id_usuario}`;
      const confirmacion = pendingConfirmations.get(confirmacionKey);

      if (!codigoConfirmacion) {
        return res.status(400).json({
          message: "Código de confirmación requerido",
          requiereConfirmacion: true,
        });
      }

      if (!confirmacion || confirmacion.codigo !== codigoConfirmacion) {
        return res.status(400).json({
          message: "Código de confirmación inválido o expirado",
          requiereConfirmacion: true,
        });
      }

      if (Date.now() > confirmacion.expira) {
        pendingConfirmations.delete(confirmacionKey);
        return res.status(400).json({
          message: "Código de confirmación expirado",
          requiereConfirmacion: true,
        });
      }

      pendingConfirmations.delete(confirmacionKey);
      return true;
    } 
    
    else {
      return res.status(400).json({
        message: "Método de verificación no válido",
        requiereConfirmacion: true,
      });
    }
  };

  // Si la verificación es por pregunta de seguridad y está verificada
  if (securityVerified) {
    console.log("Verificación por pregunta de seguridad completada");
    return procederConActualizacion();
  }

  // Si no es por pregunta de seguridad, verificar código
  const confirmacionKey = `${adminCorreo}_${id_usuario}`;
  const confirmacion = pendingConfirmations.get(confirmacionKey);

  if (!confirmacion || confirmacion.codigo !== codigoConfirmacion) {
    return res.status(400).json({
      message: "Código de confirmación inválido o expirado",
      requiereConfirmacion: true,
    });
  }

  if (Date.now() > confirmacion.expira) {
    pendingConfirmations.delete(confirmacionKey);
    return res.status(400).json({
      message: "Código de confirmación expirado",
      requiereConfirmacion: true,
    });
  }

  // Eliminar el código de confirmación antes de proceder
  pendingConfirmations.delete(confirmacionKey);
  return procederConActualizacion();

  function procederConActualizacion() {
    const { nombres, apellidos, direccion, telefono, sexo, rol } = userData;
    
    const query = `
      UPDATE usuario
      SET nombres = ?, 
          apellidos = ?, 
          direccion = ?, 
          telefono = ?, 
          sexo = ?, 
          rol = ?
      WHERE id_usuario = ?
    `;

    return new Promise((resolve, reject) => {
      db.query(
        query,
        [nombres, apellidos, direccion, telefono, sexo, rol, id_usuario],
        (err, result) => {
          if (err) {
            console.error('Error al actualizar usuario:', err);
            return res.status(500).json({ 
              message: "Error al actualizar usuario",
              error: err.message 
            });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({ 
              message: "Usuario no encontrado" 
            });
          }

          return res.json({ 
            message: "Usuario actualizado correctamente"
          });
        }
      );
    });
  }
};

// Eliminar usuario con confirmación
exports.eliminarUsuario = (req, res) => {
  // Verificar confirmación primero
  const id_usuario = req.params.id;
  const { codigoConfirmacion, adminCorreo, securityVerified } = req.body;

  if (!adminCorreo) {
    return res.status(400).json({
      message: "Falta el correo del administrador",
      requiereConfirmacion: true,
    });
  }

  // Si la verificación es por pregunta de seguridad y está verificada
  if (securityVerified) {
    // Proceder con la eliminación
    const query = "DELETE FROM usuario WHERE id_usuario = ?";
    db.query(query, [id_usuario], (error, result) => {
      if (error) {
        console.error("Error al eliminar usuario:", error);
        return res.status(500).json({ 
          message: "Error al eliminar usuario" 
        });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          message: "Usuario no encontrado" 
        });
      }
      return res.json({ 
        message: "Usuario eliminado correctamente" 
      });
    });
    return;
  }

  // Si no es por pregunta de seguridad, verificar código
  const confirmacionKey = `${adminCorreo}_${id_usuario}`;
  const confirmacion = pendingConfirmations.get(confirmacionKey);

  if (!confirmacion || confirmacion.codigo !== codigoConfirmacion) {
    return res.status(400).json({
      message: "Código de confirmación inválido o expirado",
      requiereConfirmacion: true,
    });
  }

  if (Date.now() > confirmacion.expira) {
    pendingConfirmations.delete(confirmacionKey);
    return res.status(400).json({
      message: "Código de confirmación expirado",
      requiereConfirmacion: true,
    });
  }

  pendingConfirmations.delete(confirmacionKey);

  // Proceder con la eliminación
  db.query("DELETE FROM usuario WHERE id_usuario = ?", [id_usuario], (err, result) => {
    if (err) {
      console.error("Error al eliminar usuario:", err);
      return res.status(500).json({ message: "Error al eliminar usuario" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json({ message: "Usuario eliminado correctamente" });
  });
};

// Listar médicos
exports.getMedicos = (req, res) => {
  db.query(
    `SELECT m.id_medico, m.licencia_medica, m.num_identificacion, m.activo, 
            u.nombres, u.apellidos, u.correo, u.telefono, 
            e.nombre as especialidad
         FROM medico m
         JOIN usuario u ON m.id_usuario = u.id_usuario
         JOIN especialidad e ON m.id_especialidad = e.id_especialidad`,
    (error, rows) => {
      if (error) {
        console.error("Error al obtener médicos:", error);
        return res.status(500).json({ error: "Error al obtener médicos" });
      }
      res.json(rows);
    }
  );
};

// Crear médico
exports.crearMedico = (req, res) => {
  const {
    id_usuario,
    id_especialidad,
    licencia_medica,
    num_identificacion,
    activo,
  } = req.body;
  db.query(
    "INSERT INTO medico (id_usuario, id_especialidad, licencia_medica, num_identificacion, activo) VALUES (?, ?, ?, ?, ?)",
    [id_usuario, id_especialidad, licencia_medica, num_identificacion, activo],
    (err) => {
      if (err) {
        console.error("Error al crear médico:", err);
        return res.status(500).json({ message: "Error al crear médico" });
      }
      res.status(201).json({ message: "Médico creado correctamente" });
    }
  );
};

// Cambiar estado (activo/inactivo) de un médico
exports.cambiarEstadoMedico = (req, res) => {
  const { id_medico } = req.params;
  const { activo } = req.body;
  db.query(
    "UPDATE medico SET activo = ? WHERE id_medico = ?",
    [activo, id_medico],
    (err, result) => {
      if (err) {
        console.error("Error al cambiar estado médico:", err);
        return res.status(500).json({ error: "Error al actualizar estado" });
      }

      // Si se inactiva el médico, cancelar citas pendientes y notificar
      if (activo == 0) {
        db.query(
          `SELECT c.*, p.id_usuario, u.correo, u.nombres, u.apellidos
                     FROM cita c
                     JOIN paciente p ON c.id_paciente = p.id_paciente
                     JOIN usuario u ON p.id_usuario = u.id_usuario
                     WHERE c.id_medico = ? AND c.estado = 0`,
          [id_medico],
          async (err2, citas) => {
            if (err2) {
              console.error("Error al buscar citas pendientes:", err2);
              return res
                .status(500)
                .json({ error: "Error al buscar citas pendientes" });
            }

            if (citas.length > 0) {
              db.query(
                "UPDATE cita SET estado = 3 WHERE id_medico = ? AND estado = 0",
                [id_medico],
                async (err3) => {
                  if (err3) {
                    console.error("Error al cancelar citas:", err3);
                    return res
                      .status(500)
                      .json({ error: "Error al cancelar citas" });
                  }

                  // Notificar a cada paciente
                  for (const cita of citas) {
                    try {
                      const transporter = nodemailer.createTransport({
                        service: "gmail",
                        auth: {
                          user: process.env.EMAIL_USER,
                          pass: process.env.EMAIL_PASS,
                        },
                      });
                      await transporter.sendMail({
                        from: `"Clínica Johnson" <${process.env.EMAIL_USER}>`,
                        to: cita.correo,
                        subject: "Cita cancelada por médico - Clínica Johnson",
                        html: `
                                                <div style="background:#f5faff;padding:32px 0;min-height:100vh;font-family:'Segoe UI',Arial,sans-serif;">
                                                    <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:18px;box-shadow:0 4px 24px 0 rgba(46,93,161,0.10);padding:32px 28px 28px 28px;">
                                                    <div style="text-align:center;margin-bottom:24px;">
                                                        <img src="https://i.ibb.co/YBwjdG4Y/logo-clinica-blanco.png" alt="Logo Clínica Johnson" style="height:64px;width:64px;object-fit:contain;border-radius:50%;background:#2e5da1;padding:8px;box-shadow:0 2px 8px 0 rgba(46,93,161,0.10);" />
                                                    </div>
                                                    <h2 style="color:#d33;font-weight:bold;letter-spacing:0.5px;font-size:1.5rem;text-align:center;margin-bottom:12px;">
                                                        Cita cancelada por el médico
                                                    </h2>
                                                    <p style="color:#444;font-size:1.08rem;text-align:center;margin-bottom:24px;">
                                                        Estimado/a <span style="color:#fad02c;font-weight:bold;">${
                                                          cita.nombres
                                                        } ${
                          cita.apellidos
                        }</span>,
                                                    </p>
                                                    <p style="color:#444;font-size:1.08rem;margin-bottom:18px;">
                                                        Lamentamos informarle que su cita programada para el <b>${formatearFecha(
                                                          cita.fecha_cita
                                                        )}</b> a las <b>${
                          cita.hora_cita
                        }</b> ha sido <b>cancelada</b> porque el médico con quien tenía la cita ya no se encuentra disponible en la clínica.<br>
                                                        Por favor, reagende su cita con otro médico desde el sistema.
                                                    </p>
                                                    <div style="text-align:center;margin-top:28px;">
                                                        <a href="https://controlcitas-frontend-production.up.railway.app/" style="background:#2e5da1;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;letter-spacing:0.5px;box-shadow:0 2px 8px 0 rgba(46,93,161,0.10);">Ir al sistema</a>
                                                    </div>
                                                    <p style="color:#888;font-size:0.98rem;text-align:center;margin-top:36px;">
                                                        Atentamente,<br>
                                                        <span style="color:#2e5da1;font-weight:bold;">Clínica Johnson</span>
                                                    </p>
                                                    </div>
                                                </div>
                                                `,
                      });
                    } catch (mailErr) {
                      console.error(
                        "Error al enviar correo de cancelación:",
                        mailErr
                      );
                    }
                  }
                  return res.json({
                    message: "Estado actualizado y citas pendientes canceladas",
                  });
                }
              );
            } else {
              return res.json({
                message: "Estado actualizado. No había citas pendientes.",
              });
            }
          }
        );
      } else {
        return res.json({ message: "Estado actualizado" });
      }
    }
  );
};

// Editar médico
exports.editarMedico = (req, res) => {
  const { id_medico } = req.params;
  const { id_especialidad, licencia_medica, num_identificacion, activo } =
    req.body;

  // Validación de campos obligatorios
  if (
    !id_especialidad ||
    !licencia_medica ||
    !num_identificacion ||
    activo === undefined
  ) {
    return res
      .status(400)
      .json({ message: "Todos los campos son obligatorios" });
  }

  // Validar formato de DUI
  const duiRegex = /^\d{8}-\d{1}$/;
  if (!duiRegex.test(num_identificacion)) {
    return res
      .status(400)
      .json({ message: "DUI inválido. Formato: 00000000-1" });
  }

  // Validar formato de licencia médica
  const licenciaRegex = /^J\.V\.P\.M-\d{5}$/;
  if (!licenciaRegex.test(licencia_medica)) {
    return res
      .status(400)
      .json({ message: "Licencia médica inválida. Formato: J.V.P.M-12345" });
  }

  // Validar unicidad de DUI y licencia médica (excluyendo el propio médico)
  db.query(
    "SELECT * FROM medico WHERE (num_identificacion = ? OR licencia_medica = ?) AND id_medico != ?",
    [num_identificacion, licencia_medica, id_medico],
    (err, results) => {
      if (err) {
        console.error("Error al verificar unicidad:", err);
        return res.status(500).json({ message: "Error en la base de datos" });
      }
      if (results.length > 0) {
        if (results.some((m) => m.num_identificacion === num_identificacion)) {
          return res
            .status(400)
            .json({ message: "El DUI ya está registrado por otro médico" });
        }
        if (results.some((m) => m.licencia_medica === licencia_medica)) {
          return res.status(400).json({
            message: "La licencia médica ya está registrada por otro médico",
          });
        }
      }

      // Actualizar médico
      db.query(
        "UPDATE medico SET id_especialidad=?, licencia_medica=?, num_identificacion=?, activo=? WHERE id_medico=?",
        [
          id_especialidad,
          licencia_medica,
          num_identificacion,
          activo,
          id_medico,
        ],
        (err2) => {
          if (err2) {
            console.error("Error al editar médico:", err2);
            return res.status(500).json({ message: "Error al editar médico" });
          }
          res.json({ message: "Médico actualizado correctamente" });
        }
      );
    }
  );
};

// Eliminar médico
exports.eliminarMedico = (req, res) => {
  const { id_medico } = req.params;
  db.query("DELETE FROM medico WHERE id_medico = ?", [id_medico], (err) => {
    if (err) {
      console.error("Error al eliminar médico:", err);
      return res.status(500).json({ message: "Error al eliminar médico" });
    }
    res.json({ message: "Médico eliminado correctamente" });
  });
};

// Listar especialidades
exports.getEspecialidades = (req, res) => {
  db.query("SELECT * FROM especialidad", (error, rows) => {
    if (error) {
      console.error("Error al obtener especialidades:", error);
      return res.status(500).json({ error: "Error al obtener especialidades" });
    }
    res.json(rows);
  });
};

// Crear especialidad
exports.crearEspecialidad = (req, res) => {
  const { nombre, descripcion } = req.body;
  db.query(
    "INSERT INTO especialidad (nombre, descripcion) VALUES (?, ?)",
    [nombre, descripcion],
    (err) => {
      if (err) {
        console.error("Error al crear especialidad:", err);
        return res.status(500).json({ message: "Error al crear especialidad" });
      }
      res.status(201).json({ message: "Especialidad creada correctamente" });
    }
  );
};

// Editar especialidad
exports.editarEspecialidad = (req, res) => {
  const { id_especialidad } = req.params;
  const { nombre, descripcion } = req.body;
  db.query(
    "UPDATE especialidad SET nombre=?, descripcion=? WHERE id_especialidad=?",
    [nombre, descripcion, id_especialidad],
    (err) => {
      if (err) {
        console.error("Error al editar especialidad:", err);
        return res
          .status(500)
          .json({ message: "Error al editar especialidad" });
      }
      res.json({ message: "Especialidad actualizada correctamente" });
    }
  );
};

// Eliminar especialidad
exports.eliminarEspecialidad = (req, res) => {
  const { id_especialidad } = req.params;
  db.query(
    "SELECT COUNT(*) as total FROM medico WHERE id_especialidad = ?",
    [id_especialidad],
    (err, result) => {
      if (err) {
        console.error("Error al verificar especialidad:", err);
        return res
          .status(500)
          .json({ message: "Error al verificar especialidad" });
      }
      if (result[0].total > 0) {
        return res.status(400).json({
          message:
            "No se puede eliminar: la especialidad está en uso por uno o más médicos.",
        });
      }
      db.query(
        "DELETE FROM especialidad WHERE id_especialidad = ?",
        [id_especialidad],
        (err2) => {
          if (err2) {
            console.error("Error al eliminar especialidad:", err2);
            return res
              .status(500)
              .json({ message: "Error al eliminar especialidad" });
          }
          res.json({ message: "Especialidad eliminada correctamente" });
        }
      );
    }
  );
};

// Registrar nuevo médico (HU07 mejorado)
exports.registrarMedico = async (req, res) => {
  const {
    nombres,
    apellidos,
    direccion,
    telefono,
    correo,
    sexo,
    num_identificacion,
    licencia_medica,
    id_especialidad,
  } = req.body;

  // Validación de campos obligatorios
  if (
    !nombres ||
    !apellidos ||
    !direccion ||
    !telefono ||
    !correo ||
    !sexo ||
    !num_identificacion ||
    !licencia_medica ||
    !id_especialidad
  ) {
    return res
      .status(400)
      .json({ message: "Todos los campos son obligatorios" });
  }

  // Validar formato de correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo)) {
    return res.status(400).json({ message: "Correo inválido" });
  }

  // Validar formato DUI
  const duiRegex = /^\d{8}-\d{1}$/;
  if (!duiRegex.test(num_identificacion)) {
    return res
      .status(400)
      .json({ message: "DUI inválido. Formato: 00000000-1" });
  }

  // Validar formato licencia médica
  const licenciaRegex = /^J\.V\.P\.M-\d{5}$/;
  if (!licenciaRegex.test(licencia_medica)) {
    return res
      .status(400)
      .json({ message: "Licencia médica inválida. Formato: J.V.P.M-00000" });
  }

  // Validar correo único
  db.query(
    "SELECT * FROM usuario WHERE correo = ?",
    [correo],
    async (err, results) => {
      if (err) {
        console.error("Error al verificar correo único:", err);
        return res.status(500).json({ message: "Error en la base de datos" });
      }
      if (results.length > 0) {
        return res
          .status(400)
          .json({ message: "El correo ya está registrado" });
      }

      // Validar DUI y licencia médica únicos
      db.query(
        "SELECT * FROM medico WHERE num_identificacion = ? OR licencia_medica = ?",
        [num_identificacion, licencia_medica],
        async (err2, results2) => {
          if (err2) {
            console.error("Error al verificar DUI/licencia:", err2);
            return res
              .status(500)
              .json({ message: "Error en la base de datos" });
          }
          if (results2.length > 0) {
            if (
              results2.some((m) => m.num_identificacion === num_identificacion)
            ) {
              return res
                .status(400)
                .json({ message: "El DUI ya está registrado" });
            }
            if (results2.some((m) => m.licencia_medica === licencia_medica)) {
              return res
                .status(400)
                .json({ message: "La licencia médica ya está registrada" });
            }
          }

          // Generar contraseña aleatoria segura
          const randomPassword = generarPasswordSeguro(15);
          const passwordRegex =
            /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
          if (!passwordRegex.test(randomPassword)) {
            return res
              .status(500)
              .json({ message: "Error generando contraseña segura" });
          }

          // Encriptar contraseña
          const hashedPassword = await bcrypt.hash(randomPassword, 10);

          // Insertar en usuario
          db.query(
            "INSERT INTO usuario (nombres, apellidos, direccion, telefono, correo, contrasena, sexo, rol) VALUES (?, ?, ?, ?, ?, ?, ?, 'medico')",
            [
              nombres,
              apellidos,
              direccion,
              telefono,
              correo,
              hashedPassword,
              sexo,
            ],
            (err, result) => {
              if (err) {
                console.error("Error al crear usuario médico:", err);
                return res
                  .status(500)
                  .json({ message: "Error al crear usuario" });
              }

              const id_usuario = result.insertId;
              // Insertar en medico
              db.query(
                "INSERT INTO medico (id_usuario, id_especialidad, licencia_medica, num_identificacion, activo) VALUES (?, ?, ?, ?, 1)",
                [
                  id_usuario,
                  id_especialidad,
                  licencia_medica,
                  num_identificacion,
                ],
                async (err2) => {
                  if (err2) {
                    console.error("Error al crear médico:", err2);
                    return res
                      .status(500)
                      .json({ message: "Error al crear médico" });
                  }

                  // Enviar correo con credenciales
                  try {
                    const transporter = nodemailer.createTransport({
                      service: "gmail",
                      auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,
                      },
                    });

                    const mailOptions = {
                      from: `"Clínica Johnson" <${process.env.EMAIL_USER}>`,
                      to: correo,
                      subject:
                        "Registro en el sistema de Control de Citas - Clínica Johnson",
                      html: `
                                            <div style="background:linear-gradient(90deg,#f5faff 60%,#e3eafc 100%);padding:32px 0;min-height:100vh;font-family:'Segoe UI',Arial,sans-serif;">
                                            <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:18px;box-shadow:0 4px 24px 0 rgba(46,93,161,0.10);padding:32px 28px 28px 28px;">
                                                <div style="text-align:center;margin-bottom:24px;">
                                                <img src="https://i.ibb.co/YBwjdG4Y/logo-clinica-blanco.png" alt="Logo Clínica Johnson" style="height:64px;width:64px;object-fit:contain;border-radius:50%;background:#2e5da1;padding:8px;box-shadow:0 2px 8px 0 rgba(46,93,161,0.10);" />
                                                </div>
                                                <h2 style="color:#2e5da1;font-weight:bold;letter-spacing:0.5px;font-size:1.7rem;text-align:center;margin-bottom:12px;">
                                                ¡Bienvenido/a al sistema de Control de Citas!
                                                </h2>
                                                <p style="color:#444;font-size:1.08rem;text-align:center;margin-bottom:24px;">
                                                Estimado/a <span style="color:#fad02c;font-weight:bold;">${nombres} ${apellidos}</span>,
                                                </p>
                                                <p style="color:#444;font-size:1.08rem;margin-bottom:18px;">
                                                Su usuario ha sido registrado exitosamente como <b>médico</b> en el sistema de la <b>Clínica Johnson</b>.
                                                </p>
                                                <div style="background:#f5faff;border-radius:12px;padding:18px 16px;margin-bottom:20px;">
                                                <p style="margin:0 0 8px 0;color:#2e5da1;font-weight:500;">Credenciales de acceso:</p>
                                                <ul style="list-style:none;padding:0;margin:0;">
                                                    <li style="margin-bottom:6px;"><b>Correo:</b> <span style="color:#2e5da1;">${correo}</span></li>
                                                    <li><b>Contraseña:</b> <span style="color:#2e5da1;">${randomPassword}</span></li>
                                                </ul>
                                                </div>
                                                <p style="color:#444;font-size:1.05rem;margin-bottom:18px;">
                                                Por favor, inicie sesión en la plataforma y cambie su contraseña lo antes posible para mayor seguridad.
                                                </p>
                                                <div style="text-align:center;margin-top:28px;">
                                                <a href="${process.env.FRONTEND_URL}" style="background:#2e5da1;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;letter-spacing:0.5px;box-shadow:0 2px 8px 0 rgba(46,93,161,0.10);">Ir al sistema</a>
                                                </div>
                                                <p style="color:#888;font-size:0.98rem;text-align:center;margin-top:36px;">
                                                Atentamente,<br>
                                                <span style="color:#2e5da1;font-weight:bold;">Clínica Johnson</span>
                                                </p>
                                            </div>
                                            </div>
                                            `,
                    };

                    await transporter.sendMail(mailOptions);
                  } catch (mailErr) {
                    console.error(
                      "Error al enviar correo de credenciales:",
                      mailErr
                    );
                    return res.status(201).json({
                      message:
                        "Médico registrado, pero no se pudo enviar el correo.",
                      error: mailErr.message,
                    });
                  }

                  res.status(201).json({
                    message: "Médico registrado exitosamente y correo enviado.",
                  });
                }
              );
            }
          );
        }
      );
    }
  );
};

// Obtener médico por ID
exports.getMedicoById = (req, res) => {
  const { id_medico } = req.params;
  db.query(
    `SELECT m.*, u.nombres, u.apellidos, u.correo, u.telefono, u.direccion, e.nombre as especialidad
         FROM medico m
         JOIN usuario u ON m.id_usuario = u.id_usuario
         JOIN especialidad e ON m.id_especialidad = e.id_especialidad
         WHERE m.id_medico = ?`,
    [id_medico],
    (error, rows) => {
      if (error) {
        console.error("Error al obtener médico por ID:", error);
        return res.status(500).json({ error: "Error al obtener médico" });
      }
      if (rows.length === 0) {
        return res.status(404).json({ message: "Médico no encontrado" });
      }
      res.json(rows[0]);
    }
  );
};

// Reporte de citas por fecha (HU12)
exports.reporteCitasPorFecha = (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  db.query(
    `SELECT 
            CONCAT(u_pac.nombres, ' ', u_pac.apellidos) AS paciente,
            CONCAT(u_med.nombres, ' ', u_med.apellidos) AS medico,
            e.nombre AS especialidad,
            c.fecha_cita, c.hora_cita, c.estado
        FROM cita c
        JOIN paciente p ON c.id_paciente = p.id_paciente
        JOIN usuario u_pac ON p.id_usuario = u_pac.id_usuario
        JOIN medico m ON c.id_medico = m.id_medico
        JOIN usuario u_med ON m.id_usuario = u_med.id_usuario
        JOIN especialidad e ON m.id_especialidad = e.id_especialidad
        WHERE c.fecha_cita BETWEEN ? AND ?
        ORDER BY c.fecha_cita, c.hora_cita`,
    [fechaInicio, fechaFin],
    (err, rows) => {
      if (err) {
        console.error("Error al generar reporte por fecha:", err);
        return res.status(500).json({ message: "Error al generar reporte" });
      }
      res.json(rows);
    }
  );
};

// Reporte de citas por médico (HU13)
exports.reporteCitasPorMedico = (req, res) => {
  const { id_medico, fechaInicio, fechaFin, desglose } = req.query;
  db.query(
    `SELECT c.fecha_cita, c.hora_cita, CONCAT(u_pac.nombres, ' ', u_pac.apellidos) AS paciente, c.estado
         FROM cita c
         JOIN paciente p ON c.id_paciente = p.id_paciente
         JOIN usuario u_pac ON p.id_usuario = u_pac.id_usuario
         WHERE c.id_medico = ? AND c.fecha_cita BETWEEN ? AND ?
         ORDER BY c.fecha_cita, c.hora_cita`,
    [id_medico, fechaInicio, fechaFin],
    (err, rows) => {
      if (err) {
        console.error("Error al generar reporte por médico:", err);
        return res.status(500).json({ message: "Error al generar reporte" });
      }
      const resumen = { atendidas: 0, canceladas: 0, pendientes: 0 };
      rows.forEach((r) => {
        if (r.estado === 1) resumen.atendidas++;
        else if (r.estado === 2 || r.estado === 3) resumen.canceladas++;
        else resumen.pendientes++;
      });
      res.json({
        resumen,
        citas: desglose == 1 ? rows : [],
      });
    }
  );
};

// Reporte de citas por especialidad (HU14)
exports.reporteCitasPorEspecialidad = (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  db.query(
    `SELECT e.nombre AS especialidad, COUNT(*) AS total
         FROM cita c
         JOIN medico m ON c.id_medico = m.id_medico
         JOIN especialidad e ON m.id_especialidad = e.id_especialidad
         WHERE c.fecha_cita BETWEEN ? AND ?
         GROUP BY e.nombre`,
    [fechaInicio, fechaFin],
    (err, rows) => {
      if (err) {
        console.error("Error al generar reporte por especialidad:", err);
        return res.status(500).json({ message: "Error al generar reporte" });
      }
      const totalCitas = rows.reduce((acc, r) => acc + r.total, 0);
      const tabla = rows.map((r) => ({
        especialidad: r.especialidad,
        total: r.total,
        porcentaje: totalCitas
          ? ((r.total / totalCitas) * 100).toFixed(1)
          : "0.0",
      }));
      res.json({ tabla, grafico: tabla });
    }
  );
};

// Buscar pacientes (HU15)
exports.buscarPacientes = (req, res) => {
  const { q } = req.query;
  db.query(
    `SELECT p.id_paciente, u.nombres, u.apellidos, p.fechaNacimiento, u.correo, u.telefono, u.direccion
        FROM paciente p
        JOIN usuario u ON p.id_usuario = u.id_usuario
        WHERE u.nombres LIKE ? OR u.apellidos LIKE ? OR u.correo LIKE ?
        GROUP BY p.id_paciente
        LIMIT 20`,
    [`%${q}%`, `%${q}%`, `%${q}%`],
    (err, rows) => {
      if (err) {
        console.error("Error al buscar pacientes:", err);
        return res.status(500).json({ message: "Error al buscar pacientes" });
      }
      res.json(rows);
    }
  );
};

// Historial de citas de paciente (HU15)
exports.historialCitasPaciente = (req, res) => {
  const { id_paciente, orden, estado } = req.query;
  let sql = `
        SELECT c.fecha_cita, c.hora_cita, CONCAT(u_med.nombres, ' ', u_med.apellidos) AS medico, 
               e.nombre AS especialidad, c.estado, c.motivo
        FROM cita c
        JOIN medico m ON c.id_medico = m.id_medico
        JOIN usuario u_med ON m.id_usuario = u_med.id_usuario
        JOIN especialidad e ON m.id_especialidad = e.id_especialidad
        WHERE c.id_paciente = ?
    `;
  const params = [id_paciente];

  // Traduce el estado string a número
  let estadoNum = null;
  if (estado) {
    if (estado === "pendiente") estadoNum = 0;
    else if (estado === "finalizada") estadoNum = 1;
    else if (estado === "cancelada_paciente") estadoNum = 2;
    else if (estado === "cancelada_medico") estadoNum = 3;
  }
  if (estado && estadoNum !== null) {
    sql += " AND c.estado = ?";
    params.push(estadoNum);
  }

  sql += ` ORDER BY c.fecha_cita ${
    orden === "asc" ? "ASC" : "DESC"
  }, c.hora_cita ${orden === "asc" ? "ASC" : "DESC"}`;

  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error("Error al obtener historial de citas:", err);
      return res.status(500).json({ message: "Error al obtener historial" });
    }
    res.json(rows);
  });
};

// Listar contactos de un paciente (admin)
exports.getContactosPacienteAdmin = (req, res) => {
  const { id_paciente } = req.query;
  if (!id_paciente) return res.status(400).json({ error: "Falta id_paciente" });
  db.query(
    "SELECT * FROM contacto WHERE id_paciente = ? ORDER BY id_contacto DESC",
    [id_paciente],
    (err, rows) => {
      if (err) {
        console.error("Error al obtener contactos:", err);
        return res.status(500).json({ error: "Error al obtener contactos" });
      }
      res.json(rows);
    }
  );
};

// Agregar contacto (admin)
exports.agregarContactoPacienteAdmin = (req, res) => {
  const {
    id_paciente,
    nombre,
    apellido,
    parentesco,
    telefono,
    direccion,
    correo,
  } = req.body;
  if (!id_paciente || !nombre || !apellido || !parentesco || !telefono) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  db.query(
    "INSERT INTO contacto (id_paciente, nombre, apellido, parentesco, telefono, direccion, correo) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id_paciente, nombre, apellido, parentesco, telefono, direccion, correo],
    (err, result) => {
      if (err) {
        console.error("Error al agregar contacto:", err);
        return res.status(500).json({ error: "Error al agregar contacto" });
      }
      res.json({ mensaje: "Contacto agregado correctamente" });
    }
  );
};

// Editar contacto (admin)
exports.editarContactoPacienteAdmin = (req, res) => {
  const { id_contacto } = req.params;
  const { nombre, apellido, parentesco, telefono, direccion, correo } =
    req.body;
  db.query(
    "UPDATE contacto SET nombre=?, apellido=?, parentesco=?, telefono=?, direccion=?, correo=? WHERE id_contacto=?",
    [nombre, apellido, parentesco, telefono, direccion, correo, id_contacto],
    (err, result) => {
      if (err) {
        console.error("Error al editar contacto:", err);
        return res.status(500).json({ error: "Error al editar contacto" });
      }
      res.json({ mensaje: "Contacto actualizado correctamente" });
    }
  );
};

// Eliminar contacto (admin)
exports.eliminarContactoPacienteAdmin = (req, res) => {
  const { id_contacto } = req.params;
  db.query(
    "DELETE FROM contacto WHERE id_contacto = ?",
    [id_contacto],
    (err, result) => {
      if (err) {
        console.error("Error al eliminar contacto:", err);
        return res.status(500).json({ error: "Error al eliminar contacto" });
      }
      res.json({ mensaje: "Contacto eliminado correctamente" });
    }
  );
};

// Generador seguro de contraseña
function generarPasswordSeguro(length = 15) {
  const mayus = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const minus = "abcdefghijklmnopqrstuvwxyz";
  const nums = "0123456789";
  const special = "!@#$%^&*()_+-=[]{},.<>/?";
  let password = [
    mayus[Math.floor(Math.random() * mayus.length)],
    minus[Math.floor(Math.random() * minus.length)],
    nums[Math.floor(Math.random() * nums.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  const all = mayus + minus + nums + special;
  for (let i = password.length; i < length; i++) {
    password.push(all[Math.floor(Math.random() * all.length)]);
  }
  return password.sort(() => Math.random() - 0.5).join("");
}

// Obtener paciente por ID
exports.getPacientePorId = (req, res) => {
  const { id_paciente } = req.params;
  db.query(
    `SELECT p.id_paciente, u.nombres, u.apellidos, u.correo, u.telefono, u.direccion
         FROM paciente p
         JOIN usuario u ON p.id_usuario = u.id_usuario
         WHERE p.id_paciente = ?`,
    [id_paciente],
    (err, rows) => {
      if (err) {
        console.error("Error al obtener paciente:", err);
        return res.status(500).json({ error: "Error al obtener paciente" });
      }
      res.json(rows);
    }
  );
};

// GRAFICAS
// Obtener total de citas agrupadas por estado
exports.getCitasPorEstado = (req, res) => {
  const query = `
        SELECT estado, COUNT(*) AS total
        FROM cita
        GROUP BY estado
    `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener las citas por estado:", err);
      return res.status(500).json({ message: "Error interno del servidor" });
    }

    res.json(results);
  });
};

exports.getCitasPorMedico = (req, res) => {
  const query = `
        SELECT 
            CONCAT(u.nombres, ' ', u.apellidos) AS medico,
            COUNT(*) AS total
        FROM cita c
        INNER JOIN medico m ON c.id_medico = m.id_medico
        INNER JOIN usuario u ON m.id_usuario = u.id_usuario
        GROUP BY c.id_medico
        ORDER BY total DESC
    `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener citas por médico:", err);
      return res.status(500).json({ message: "Error interno del servidor" });
    }

    res.json(results);
  });
};

exports.getCitasPorDia = (req, res) => {
  const query = `
        SELECT 
            fecha_cita AS fecha,
            COUNT(*) AS total
        FROM cita
        GROUP BY fecha_cita
        ORDER BY fecha_cita ASC
    `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener citas por día:", err);
      return res.status(500).json({ message: "Error interno del servidor" });
    }

    res.json(results);
  });
};
