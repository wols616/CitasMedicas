const db = require("../config/db");
const bcrypt = require("bcryptjs"); //Libreria para encriptar contraseñas
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function enviarCorreoBienvenida({ destinatario, nombre }) {
  await transporter.sendMail({
    from: `"Clínica Johnson" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: "¡Bienvenido/a a Clínica Johnson!",
    html: `
      <div style="background:#f5faff;padding:32px 0;min-height:100vh;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:18px;box-shadow:0 4px 24px 0 rgba(46,93,161,0.10);padding:32px 28px 28px 28px;">
          <div style="text-align:center;margin-bottom:24px;">
            <img src="https://i.ibb.co/YBwjdG4Y/logo-clinica-blanco.png" alt="Logo Clínica Johnson" style="height:64px;width:64px;object-fit:contain;border-radius:50%;background:#2e5da1;padding:8px;box-shadow:0 2px 8px 0 rgba(46,93,161,0.10);" />
          </div>
          <h2 style="color:#2e5da1;font-weight:bold;letter-spacing:0.5px;font-size:1.5rem;text-align:center;margin-bottom:12px;">
            ¡Bienvenido/a a Clínica Johnson!
          </h2>
          <p style="color:#444;font-size:1.08rem;text-align:center;margin-bottom:24px;">
            Estimado/a <span style="color:#fad02c;font-weight:bold;">${nombre}</span>,
          </p>
          <p style="color:#444;font-size:1.08rem;margin-bottom:18px;">
            Su registro se ha realizado exitosamente. Ya puede acceder a nuestro sistema para gestionar sus citas y servicios médicos.
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
}

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

exports.registerUser = (req, res) => {
  const {
    nombres,
    apellidos,
    direccion,
    telefono,
    correo,
    contrasena,
    sexo,
    rol,
    fechaNacimiento, // <-- puedes agregar este campo si lo pides en el frontend
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

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!passwordRegex.test(contrasena)) {
    return res.status(400).json({
      message:
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número",
    });
  }

  // Verificar si el correo ya existe
  const checkEmailSql = "SELECT * FROM usuario WHERE correo = ?";
  db.query(checkEmailSql, [correo], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error al verificar el correo" });
    }

    if (results.length > 0) {
      return res
        .status(400)
        .json({ message: "El correo ya está registrado. Usa otro email." });
    }

    // Encriptar y registrar
    bcrypt.hash(contrasena, 10, (err, hash) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error al encriptar la contraseña" });
      }

      const insertSql =
        "INSERT INTO usuario (nombres, apellidos, direccion, telefono, correo, contrasena, sexo, rol) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
      db.query(
        insertSql,
        [nombres, apellidos, direccion, telefono, correo, hash, sexo, rol],
        (err, result) => {
          if (err) {
            return res
              .status(500)
              .json({ message: "Error al registrar el usuario" });
          }

          // Insertar en paciente
          const id_usuario = result.insertId;
          const insertPacienteSql =
            "INSERT INTO paciente (id_usuario, fechaNacimiento) VALUES (?, ?)";
          db.query(
            insertPacienteSql,
            [id_usuario, fechaNacimiento || null],
            (err2) => {
              if (err2) {
                return res
                  .status(500)
                  .json({ message: "Error al registrar el paciente" });
              }
              try {
                enviarCorreoBienvenida({
                  destinatario: correo,
                  nombre: `${nombres} ${apellidos}`,
                });
              } catch (mailErr) {
                // No detiene el flujo si falla el correo
              }
              res
                .status(201)
                .json({ message: "Paciente registrado correctamente" });
            }
          );
        }
      );
    });
  });
};

exports.loginUser = (req, res) => {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res
      .status(400)
      .json({ message: "Todos los campos son obligatorios" });
  }

  // Verificar si el correo existe
  const checkEmailSql = "SELECT * FROM usuario WHERE correo = ?";
  db.query(checkEmailSql, [correo], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error al verificar el correo" });
    }

    if (results.length === 0) {
      return res
        .status(400)
        .json({ message: "Correo o contraseña incorrectos" });
    }

    // Comparar la contraseña
    const user = results[0];
    bcrypt.compare(contrasena, user.contrasena, (err, isMatch) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error al comparar la contraseña" });
      }

      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Correo o contraseña incorrectos" });
      }

      // Dependiendo del rol, obtener datos adicionales
      if (user.rol === "medico") {
        db.query(
          "SELECT * FROM medico WHERE id_usuario = ?",
          [user.id_usuario],
          (err2, medicoResults) => {
            if (err2) {
              return res
                .status(500)
                .json({ message: "Error al obtener datos de médico" });
            }
            const medico = medicoResults[0] || null;
            // Validar si el médico está inactivo
            if (!medico || medico.activo === 0) {
              return res.status(403).json({
                message:
                  "Tu cuenta de médico está inactiva. Contacta al administrador.",
              });
            }
            res.json({
              message: "Inicio de sesión exitoso",
              user,
              medico,
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
                .json({ message: "Error al obtener datos de paciente" });
            }
            res.json({
              message: "Inicio de sesión exitoso",
              user,
              paciente: pacienteResults[0] || null,
            });
          }
        );
      } else {
        // Otros roles
        res.json({ message: "Inicio de sesión exitoso", user });
      }
    });
  });
};

exports.loginPorRostro = (req, res) => {
  const { nombreCompleto } = req.body;
  if (!nombreCompleto) {
    return res.status(400).json({ message: "Nombre completo es obligatorio" });
  }

  const nombreBuscado = nombreCompleto.trim().toLowerCase();

  // Buscar usuario por nombre completo concatenado
  const sql = `
  SELECT * FROM usuario 
  WHERE LOWER(CONCAT(TRIM(nombres), ' ', TRIM(apellidos))) = ?
`;

  console.log("Nombre recibido de Flask (original):", nombreCompleto);
  console.log("Nombre normalizado para búsqueda:", nombreBuscado);
  db.query(sql, [nombreBuscado], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error al verificar el usuario" });
    }

    if (results.length === 0) {
      return res
        .status(400)
        .json({ message: "Usuario no encontrado con reconocimiento facial" });
    }

    const user = results[0];

    // Dependiendo del rol, obtener datos adicionales
    if (user.rol === "medico") {
      db.query(
        "SELECT * FROM medico WHERE id_usuario = ?",
        [user.id_usuario],
        (err2, medicoResults) => {
          if (err2) {
            return res
              .status(500)
              .json({ message: "Error al obtener datos de médico" });
          }
          const medico = medicoResults[0] || null;
          // Validar si el médico está inactivo
          if (!medico || medico.activo === 0) {
            return res.status(403).json({
              message:
                "Tu cuenta de médico está inactiva. Contacta al administrador.",
            });
          }
          res.json({
            message: "Inicio de sesión exitoso con reconocimiento facial",
            user,
            medico,
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
              .json({ message: "Error al obtener datos de paciente" });
          }
          res.json({
            message: "Inicio de sesión exitoso con reconocimiento facial",
            user,
            paciente: pacienteResults[0] || null,
          });
        }
      );
    } else {
      // Otros roles (admin)
      res.json({
        message: "Inicio de sesión exitoso con reconocimiento facial",
        user,
      });
    }
  });
};

exports.cambiarContrasena = (req, res) => {
  const { id_usuario, contrasenaActual, nuevaContrasena } = req.body;

  if (!id_usuario || !contrasenaActual || !nuevaContrasena) {
    return res
      .status(400)
      .json({ message: "Todos los campos son obligatorios" });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  if (!passwordRegex.test(nuevaContrasena)) {
    return res.status(400).json({
      message:
        "La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número",
    });
  }

  // Obtener la contraseña actual del usuario
  db.query(
    "SELECT contrasena FROM usuario WHERE id_usuario = ?",
    [id_usuario],
    (err, results) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error al verificar el usuario" });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const hashActual = results[0].contrasena;
      // Comparar la contraseña actual
      bcrypt.compare(contrasenaActual, hashActual, (err, isMatch) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Error al comparar la contraseña" });
        }
        if (!isMatch) {
          return res
            .status(400)
            .json({ message: "La contraseña actual es incorrecta" });
        }

        // Encriptar la nueva contraseña
        bcrypt.hash(nuevaContrasena, 10, (err, hashNueva) => {
          if (err) {
            return res
              .status(500)
              .json({ message: "Error al encriptar la nueva contraseña" });
          }

          // Actualizar la contraseña en la base de datos
          db.query(
            "UPDATE usuario SET contrasena = ? WHERE id_usuario = ?",
            [hashNueva, id_usuario],
            (err2) => {
              if (err2) {
                return res
                  .status(500)
                  .json({ message: "Error al actualizar la contraseña" });
              }
              res.json({ message: "Contraseña actualizada correctamente" });
            }
          );
        });
      });
    }
  );
};

exports.recuperarContrasena = (req, res) => {
  const { correo } = req.body;
  if (!correo) {
    return res.status(400).json({ message: "El correo es obligatorio" });
  }

  // Verifica si existe el usuario
  db.query(
    "SELECT * FROM usuario WHERE correo = ?",
    [correo],
    async (err, results) => {
      if (err)
        return res.status(500).json({ message: "Error en la base de datos" });
      if (results.length === 0) {
        return res
          .status(404)
          .json({ message: "No existe una cuenta con ese correo" });
      }

      const usuario = results[0];
      const nuevaContrasena = generarPasswordSeguro(15);
      const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

      // Actualiza la contraseña
      db.query(
        "UPDATE usuario SET contrasena = ? WHERE correo = ?",
        [hashedPassword, correo],
        async (err2) => {
          if (err2)
            return res
              .status(500)
              .json({ message: "Error al actualizar la contraseña" });

          // Envía el correo
          try {
            await transporter.sendMail({
              from: `"Clínica Johnson" <${process.env.EMAIL_USER}>`,
              to: correo,
              subject: "Recuperación de contraseña - Clínica Johnson",
              html: `
              <div style="background:#f5faff;padding:32px 0;min-height:100vh;font-family:'Segoe UI',Arial,sans-serif;">
                <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:18px;box-shadow:0 4px 24px 0 rgba(46,93,161,0.10);padding:32px 28px 28px 28px;">
                  <div style="text-align:center;margin-bottom:24px;">
                    <img src="https://i.ibb.co/YBwjdG4Y/logo-clinica-blanco.png" alt="Logo Clínica Johnson" style="height:64px;width:64px;object-fit:contain;border-radius:50%;background:#2e5da1;padding:8px;box-shadow:0 2px 8px 0 rgba(46,93,161,0.10);" />
                  </div>
                  <h2 style="color:#2e5da1;font-weight:bold;letter-spacing:0.5px;font-size:1.5rem;text-align:center;margin-bottom:12px;">
                    Recuperación de contraseña
                  </h2>
                  <p style="color:#444;font-size:1.08rem;text-align:center;margin-bottom:24px;">
                    Estimado/a <span style="color:#fad02c;font-weight:bold;">${usuario.nombres} ${usuario.apellidos}</span>,
                  </p>
                  <p style="color:#444;font-size:1.08rem;margin-bottom:18px;">
                    Se ha generado una nueva contraseña para su cuenta. Por favor, utilícela para iniciar sesión y cámbiela lo antes posible.
                  </p>
                  <div style="background:#f5faff;border-radius:12px;padding:18px 16px;margin-bottom:20px;">
                    <ul style="list-style:none;padding:0;margin:0;">
                      <li><b>Correo:</b> <span style="color:#2e5da1;">${correo}</span></li>
                      <li><b>Nueva contraseña:</b> <span style="color:#2e5da1;">${nuevaContrasena}</span></li>
                    </ul>
                  </div>
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
            return res.status(200).json({
              message:
                "Contraseña actualizada, pero no se pudo enviar el correo.",
            });
          }

          res.status(200).json({
            message:
              "Se ha enviado una nueva contraseña a su correo electrónico.",
          });
        }
      );
    }
  );
};
