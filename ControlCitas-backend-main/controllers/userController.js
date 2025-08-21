const db = require("../config/db");
const bcrypt = require("bcryptjs"); //Libreria para encriptar contraseñas
const nodemailer = require("nodemailer");

// Preguntas de seguridad fijas del sistema
const SECURITY_QUESTIONS = {
  1: '¿Como se llamaba tu mascota de infancia?',
  2: '¿Cuál era el nombre de tu maestro de tercer grado?',
  3: '¿Cuál es tu pelicula favorita?'
};

//-----------Authenticator-----------------
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const ENC_KEY = crypto.scryptSync(
  process.env.MFA_ENC_KEY || "fallback_key",
  "salt",
  32
);

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENC_KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString(
    "hex"
  )}`;
}

function decrypt(payload) {
  const parts = payload.split(":");
  if (parts.length !== 3) throw new Error("invalid encrypted string");
  const iv = Buffer.from(parts[0], "hex");
  const tag = Buffer.from(parts[1], "hex");
  const data = Buffer.from(parts[2], "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", ENC_KEY, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}

// Función para actualizar las preguntas de seguridad del usuario
exports.updateSecurityQuestions = async (req, res) => {
  try {
    console.log('Datos recibidos:', req.body);
    const { userId, answers } = req.body;
    
    if (!userId) {
      console.error('userId es undefined o null');
      return res.status(400).json({ error: "El ID de usuario es requerido" });
    }

    if (!Array.isArray(answers)) {
      console.error('answers no es un array:', answers);
      return res.status(400).json({ error: "Las respuestas deben ser un array" });
    }

    if (answers.length !== 3) {
      console.error('Número incorrecto de respuestas:', answers.length);
      return res.status(400).json({ error: "Debe proporcionar las 3 respuestas de seguridad" });
    }

    // Primero verificar si el usuario existe
    const checkUserQuery = 'SELECT id_usuario FROM usuario WHERE id_usuario = ?';
    const [userRows] = await db.promise().query(checkUserQuery, [userId]);
    
    if (!userRows || userRows.length === 0) {
      console.error('Usuario no encontrado:', userId);
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    console.log('Encriptando respuestas...');
    const encryptedAnswers = answers.map(answer => encrypt(answer));
    console.log('Respuestas encriptadas correctamente');

    // Actualizar en la base de datos
    const updateQuery = `
      UPDATE usuario 
      SET 
        security_answer1 = ?,
        security_answer2 = ?,
        security_answer3 = ?
      WHERE id_usuario = ?
    `;

    console.log('Ejecutando query con userId:', userId);
    
    const [result] = await db.promise().query(
      updateQuery,
      [
        encryptedAnswers[0],
        encryptedAnswers[1],
        encryptedAnswers[2],
        userId
      ]
    );

    if (result.affectedRows === 0) {
      console.error('No se actualizó ningún registro');
      return res.status(404).json({ error: "No se pudo actualizar el usuario" });
    }

    console.log('Actualización exitosa:', result);
    res.json({ message: "Preguntas de seguridad actualizadas correctamente" });
    
  } catch (err) {
    console.error("Error al actualizar preguntas de seguridad:", err);
    res.status(500).json({ 
      error: "Error interno del servidor", 
      details: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};

// Función para verificar la respuesta a una pregunta de seguridad
exports.verifySecurityQuestion = (req, res) => {
  const { userId, questionNumber, answer } = req.body;

  const query = `
    SELECT security_answer${questionNumber}
    FROM usuario WHERE id_usuario = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error al verificar pregunta de seguridad:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const storedAnswer = decrypt(results[0][`security_answer${questionNumber}`]);
    
    if (answer.toLowerCase() === storedAnswer.toLowerCase()) {
      res.json({ verified: true });
    } else {
      res.json({ verified: false });
    }
  });
};

// Función para obtener una pregunta de seguridad aleatoria del usuario
exports.getRandomSecurityQuestion = (req, res) => {
  const { userId } = req.params;

  const query = `
    SELECT 
      security_answer1,
      security_answer2,
      security_answer3
    FROM usuario WHERE id_usuario = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error al obtener respuestas de seguridad:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verificar si el usuario tiene respuestas configuradas
    const answers = [
      results[0].security_answer1,
      results[0].security_answer2,
      results[0].security_answer3
    ];

    if (!answers[0] || !answers[1] || !answers[2]) {
      return res.status(400).json({ 
        error: "Preguntas de seguridad no configuradas",
        configured: false 
      });
    }

    // Seleccionar una pregunta aleatoria
    const randomIndex = Math.floor(Math.random() * 3);
    
    res.json({
      questionNumber: randomIndex + 1,
      question: SECURITY_QUESTIONS[randomIndex + 1],
      configured: true
    });
  });
};

function generarRecoveryCodes(n = 8) {
  const codes = [];
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin ambiguedad
  for (let i = 0; i < n; i++) {
    let c = "";
    for (let j = 0; j < 10; j++)
      c += chars[Math.floor(Math.random() * chars.length)];
    codes.push(c);
  }
  return codes;
}

//------------------------------------------------------------------------------------------------------------------------------------------

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

//-----------------------------------------------Authenticator
exports.mfaSetup = (req, res) => {
  const { id_usuario } = req.body;
  if (!id_usuario)
    return res.status(400).json({ message: "id_usuario requerido" });

  // 1) obtener correo para nombre en la app (opcional)
  db.query(
    "SELECT correo FROM usuario WHERE id_usuario = ?",
    [id_usuario],
    async (err, results) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (results.length === 0)
        return res.status(404).json({ message: "Usuario no encontrado" });

      const correo = results[0].correo;
      const secret = speakeasy.generateSecret({
        length: 20,
        name: `Clínica Johnson (${correo})`,
      });

      try {
        const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);
        const encTemp = encrypt(secret.base32);

        db.query(
          "UPDATE usuario SET mfa_temp_secret = ? WHERE id_usuario = ?",
          [encTemp, id_usuario],
          (err2) => {
            if (err2)
              return res
                .status(500)
                .json({ message: "Error guardando temp secret" });
            // Devuelve QR + secret (manual) para que el usuario lo copie si quiere
            res.json({ qr: qrDataUrl, manualCode: secret.base32 });
          }
        );
      } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Error generando QR" });
      }
    }
  );
};

exports.checkMFAStatus = (req, res) => {
  const { id_usuario } = req.body;

  if (!id_usuario) {
    return res.status(400).json({ message: "id_usuario requerido" });
  }

  db.query(
    "SELECT mfa_enabled FROM usuario WHERE id_usuario = ?",
    [id_usuario],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Error en base de datos" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      res.json({
        mfaEnabled: results[0].mfa_enabled === 1,
      });
    }
  );
};

exports.mfaVerifySetup = async (req, res) => {
  const { id_usuario, token } = req.body;
  if (!id_usuario || !token)
    return res
      .status(400)
      .json({ message: "id_usuario y token son obligatorios" });

  db.query(
    "SELECT mfa_temp_secret FROM usuario WHERE id_usuario = ?",
    [id_usuario],
    async (err, results) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (results.length === 0 || !results[0].mfa_temp_secret) {
        return res
          .status(400)
          .json({ message: "No hay un enrolamiento iniciado" });
      }
      try {
        const base32 = decrypt(results[0].mfa_temp_secret);
        const verified = speakeasy.totp.verify({
          secret: base32,
          encoding: "base32",
          token,
          window: 1,
        });
        if (!verified)
          return res.status(400).json({ message: "Código inválido" });

        // Generar códigos de recuperación y hashearlos
        const recoveryPlain = generarRecoveryCodes(8);
        const hashedArr = await Promise.all(
          recoveryPlain.map((rc) => bcrypt.hash(rc, 10))
        );
        const hashedJson = JSON.stringify(hashedArr);

        // Promover temp -> permanent y guardar recovery codes (hasheados)
        db.query(
          "UPDATE usuario SET mfa_secret = ?, mfa_temp_secret = NULL, mfa_enabled = 1, mfa_recovery_codes = ? WHERE id_usuario = ?",
          [results[0].mfa_temp_secret, hashedJson, id_usuario],
          (err2) => {
            if (err2)
              return res.status(500).json({ message: "Error activando MFA" });
            // Devuelve los códigos de recuperación *en texto plano una vez*.
            res.json({ message: "MFA activado", recoveryCodes: recoveryPlain });
          }
        );
      } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Error verificando token" });
      }
    }
  );
};

// ...existing code...

exports.mfaVerifyLogin = (req, res) => {
  const { mfaToken, token } = req.body;
  if (!mfaToken || !token)
    return res
      .status(400)
      .json({ message: "mfaToken y token son obligatorios" });

  try {
    const decoded = jwt.verify(mfaToken, process.env.JWT_SECRET);
    const userId = decoded.sub;

    db.query(
      "SELECT mfa_secret, mfa_recovery_codes, mfa_used_recovery_codes FROM usuario WHERE id_usuario = ?",
      [userId],
      async (err, results) => {
        if (err) return res.status(500).json({ message: "DB error" });
        if (results.length === 0)
          return res.status(404).json({ message: "Usuario no encontrado" });

        const encSecret = results[0].mfa_secret;
        if (!encSecret)
          return res
            .status(400)
            .json({ message: "MFA no configurado para este usuario" });

        const base32 = decrypt(encSecret);
        let isOtpOk = speakeasy.totp.verify({
          secret: base32,
          encoding: "base32",
          token,
          window: 1,
        });

        let usedRecoveryIndex = -1;

        // Si falla el OTP, intentar como recovery code
        if (!isOtpOk && results[0].mfa_recovery_codes) {
          try {
            const recoveryCodes = JSON.parse(results[0].mfa_recovery_codes);
            const usedCodes = results[0].mfa_used_recovery_codes ? 
              JSON.parse(results[0].mfa_used_recovery_codes) : [];
            
            // Comprobar si 'token' coincide con alguno (hashes)
            for (let i = 0; i < recoveryCodes.length; i++) {
              if (usedCodes.includes(i)) continue; // Saltar códigos ya usados
              
              const match = await bcrypt.compare(token, recoveryCodes[i]);
              if (match) {
                // Marcar este código como usado
                usedCodes.push(i);
                const newUsedJson = JSON.stringify(usedCodes);
                
                db.query(
                  "UPDATE usuario SET mfa_used_recovery_codes = ? WHERE id_usuario = ?",
                  [newUsedJson, userId],
                  () => {}
                );
                
                isOtpOk = true;
                usedRecoveryIndex = i;
                break;
              }
            }
          } catch (e) {
            /* ignore parse errors */
          }
        }

        if (!isOtpOk)
          return res.status(401).json({ message: "Código MFA inválido" });

        // Generar token de sesión / acceso final
        const accessToken = jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
          expiresIn: "8h",
        });

        // Devolver user y token
        db.query(
          "SELECT id_usuario, nombres, apellidos, correo, rol FROM usuario WHERE id_usuario = ?",
          [userId],
          (err2, userRes) => {
            if (err2) return res.status(500).json({ message: "DB error" });
            const user = userRes[0];
            
            let message = "Inicio de sesión completo";
            if (usedRecoveryIndex >= 0) {
              message += ` (usado código de recuperación #${usedRecoveryIndex + 1})`;
            }
            
            res.json({
              message,
              user,
              accessToken,
            });
          }
        );
      }
    );
  } catch (e) {
    return res.status(401).json({ message: "mfaToken inválido o expirado" });
  }
};


// exports.mfaVerifyLogin = (req, res) => {
//   const { mfaToken, token } = req.body;
//   if (!mfaToken || !token)
//     return res
//       .status(400)
//       .json({ message: "mfaToken y token son obligatorios" });

//   try {
//     const decoded = jwt.verify(mfaToken, process.env.JWT_SECRET);
//     const userId = decoded.sub;

//     db.query(
//       "SELECT mfa_secret, mfa_recovery_codes FROM usuario WHERE id_usuario = ?",
//       [userId],
//       async (err, results) => {
//         if (err) return res.status(500).json({ message: "DB error" });
//         if (results.length === 0)
//           return res.status(404).json({ message: "Usuario no encontrado" });

//         const encSecret = results[0].mfa_secret;
//         if (!encSecret)
//           return res
//             .status(400)
//             .json({ message: "MFA no configurado para este usuario" });

//         const base32 = decrypt(encSecret);
//         const isOtpOk = speakeasy.totp.verify({
//           secret: base32,
//           encoding: "base32",
//           token,
//           window: 1,
//         });

//         // Si falla el OTP, intentar como recovery code
//         let recoveryCodes = [];
//         if (!isOtpOk && results[0].mfa_recovery_codes) {
//           try {
//             recoveryCodes = JSON.parse(results[0].mfa_recovery_codes);
//             // comprobar si 'token' coincide con alguno (hashes)
//             for (let i = 0; i < recoveryCodes.length; i++) {
//               const match = await bcrypt.compare(token, recoveryCodes[i]);
//               if (match) {
//                 // aceptar este recovery code y eliminarlo de la lista
//                 recoveryCodes.splice(i, 1);
//                 const newJson = JSON.stringify(recoveryCodes);
//                 db.query(
//                   "UPDATE usuario SET mfa_recovery_codes = ? WHERE id_usuario = ?",
//                   [newJson, userId],
//                   () => {}
//                 );
//                 // marcar como válido y salir del bucle
//                 // (no break necesario si retornamos luego)
//                 isOtpOk = true;
//                 break;
//               }
//             }
//           } catch (e) {
//             /* ignore parse errors */
//           }
//         }

//         if (!isOtpOk)
//           return res.status(401).json({ message: "Código MFA inválido" });

//         // Generar token de sesión / acceso final
//         const accessToken = jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
//           expiresIn: "8h",
//         });

//         // Devolver user y token (puedes adaptar datos que devuelves)
//         db.query(
//           "SELECT id_usuario, nombres, apellidos, correo, rol FROM usuario WHERE id_usuario = ?",
//           [userId],
//           (err2, userRes) => {
//             if (err2) return res.status(500).json({ message: "DB error" });
//             const user = userRes[0];
//             res.json({
//               message: "Inicio de sesión completo",
//               user,
//               accessToken,
//             });
//           }
//         );
//       }
//     );
//   } catch (e) {
//     return res.status(401).json({ message: "mfaToken inválido o expirado" });
//   }
// };


exports.getMFARecoveryCodes = (req, res) => {
  const { id_usuario } = req.body;

  if (!id_usuario) {
    return res.status(400).json({ message: "id_usuario requerido" });
  }

  db.query(
    "SELECT mfa_recovery_codes, mfa_used_recovery_codes FROM usuario WHERE id_usuario = ?",
    [id_usuario],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Error en base de datos" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const user = results[0];
      
      if (!user.mfa_recovery_codes) {
        return res.status(400).json({ message: "No hay códigos de recuperación configurados" });
      }

      try {
        const recoveryCodes = JSON.parse(user.mfa_recovery_codes);
        const usedCodes = user.mfa_used_recovery_codes ? 
          JSON.parse(user.mfa_used_recovery_codes) : [];

        // Enmascarar los códigos por seguridad (mostrar solo primeros y últimos caracteres)
        const maskedCodes = recoveryCodes.map((code, index) => {
          // Para códigos hasheados, solo mostramos el índice y si está usado
          const isUsed = usedCodes.includes(index);
          return {
            index: index + 1,
            code: `****-****-${String(index + 1).padStart(2, '0')}`, // Código enmascarado
            isUsed: isUsed,
            status: isUsed ? 'Usado' : 'Disponible'
          };
        });

        res.json({
          totalCodes: recoveryCodes.length,
          availableCodes: recoveryCodes.length - usedCodes.length,
          usedCodes: usedCodes.length,
          codes: maskedCodes
        });

      } catch (parseError) {
        res.status(500).json({ message: "Error procesando códigos de recuperación" });
      }
    }
  );
};

exports.regenerateMFARecoveryCodes = async (req, res) => {
  const { id_usuario } = req.body;

  if (!id_usuario) {
    return res.status(400).json({ message: "id_usuario requerido" });
  }

  // Verificar que el usuario existe y tiene MFA habilitado
  db.query(
    "SELECT mfa_enabled FROM usuario WHERE id_usuario = ?",
    [id_usuario],
    async (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Error en base de datos" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      if (results[0].mfa_enabled !== 1) {
        return res.status(400).json({ message: "MFA no está habilitado para este usuario" });
      }

      try {
        // Generar nuevos códigos de recuperación
        const newRecoveryPlain = generarRecoveryCodes(6); // 6 nuevos códigos
        const hashedArr = await Promise.all(
          newRecoveryPlain.map((rc) => bcrypt.hash(rc, 10))
        );
        const hashedJson = JSON.stringify(hashedArr);

        // Actualizar en la base de datos y limpiar códigos usados
        db.query(
          "UPDATE usuario SET mfa_recovery_codes = ?, mfa_used_recovery_codes = NULL WHERE id_usuario = ?",
          [hashedJson, id_usuario],
          (err2) => {
            if (err2) {
              return res.status(500).json({ message: "Error regenerando códigos" });
            }

            res.json({
              message: "Códigos de recuperación regenerados exitosamente",
              newRecoveryCodes: newRecoveryPlain,
              totalCodes: newRecoveryPlain.length
            });
          }
        );

      } catch (error) {
        console.error("Error regenerando códigos:", error);
        res.status(500).json({ message: "Error regenerando códigos de recuperación" });
      }
    }
  );
};

//-----------------------------------------------

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

      //-------------------------------------------------------------------------
      if (user.mfa_enabled === 1) {
        // crea token corto que indica "login pendiente MFA"
        const mfaToken = jwt.sign(
          { sub: user.id_usuario, mfa: true },
          process.env.JWT_SECRET,
          { expiresIn: "5m" }
        );
        return res.json({
          message: "MFA required",
          mfa_required: true,
          mfaToken,
          user,
        });
      }
      //---------------------------------------------------------------------------

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

// No necesitamos un module.exports al final ya que estamos usando exports.nombreFuncion
