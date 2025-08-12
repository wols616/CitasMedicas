const db = require("../config/db");
const nodemailer = require("nodemailer"); // Agrega esto
const frontendUrl = `https://controlcitas-frontend-production.up.railway.app/`; // O tu URL de frontend

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

function formatearFecha(fechaStr) {
  if (!fechaStr) return "";
  // Soporta tanto Date como string tipo "YYYY-MM-DD"
  if (typeof fechaStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
    const [anio, mes, dia] = fechaStr.split("-");
    return `${dia}/${mes}/${anio}`;
  }
  // Si es Date o string con hora
  const fecha = new Date(fechaStr);
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

// HU04 - Agendar Cita

// Listar especialidades
exports.getEspecialidades = (req, res) => {
  db.query("SELECT * FROM especialidad", (error, rows) => {
    if (error) {
      return res.status(500).json({ error: "Error al obtener especialidades" });
    }
    res.json(rows);
  });
};

// Listar médicos por especialidad
exports.getMedicosPorEspecialidad = (req, res) => {
  const { idEspecialidad } = req.params;
  db.query(
    `SELECT m.id_medico, u.nombres, u.apellidos, m.licencia_medica 
     FROM medico m 
     JOIN usuario u ON m.id_usuario = u.id_usuario 
     WHERE m.id_especialidad = ? AND m.activo = 1`,
    [idEspecialidad],
    (error, rows) => {
      if (error) {
        return res.status(500).json({ error: "Error al obtener médicos" });
      }
      res.json(rows);
    }
  );
};

// Fechas y horas disponibles de un médico
exports.getDisponibilidadMedico = (req, res) => {
  const { idMedico } = req.params;
  db.query(
    "SELECT * FROM horario_medico WHERE id_medico = ?",
    [idMedico],
    (error, horarios) => {
      if (error) {
        return res.status(500).json({ error: "Error al obtener disponibilidad" });
      }
      db.query(
        "SELECT fecha_cita, hora_cita FROM cita WHERE id_medico = ? AND estado IN (0,1)",
        [idMedico],
        (error2, citas) => {
          if (error2) {
            return res.status(500).json({ error: "Error al obtener disponibilidad" });
          }
          res.json({ horarios, citas });
        }
      );
    }
  );
};

// 0=pendiente, 1=finalizada, 2=cancelada por paciente, 3=cancelada por médico
// Crear cita validando reglas
exports.agendarCita = (req, res) => {
  const { id_paciente, id_medico, fecha_cita, hora_cita, motivo } = req.body;
  const hora = parseInt(hora_cita.split(":")[0]);

  db.query(
    "SELECT * FROM cita WHERE id_paciente = ? AND fecha_cita = ? AND hora_cita = ? AND estado IN (0,1)",
    [id_paciente, fecha_cita, hora_cita],
    (error, citaPaciente) => {
      if (error) {
        return res.status(500).json({ error: "Error al validar cita" });
      }
      if (citaPaciente.length > 0) {
        return res.status(400).json({ error: "Ya tienes una cita agendada en ese horario" });
      }
      db.query(
        "SELECT * FROM cita WHERE id_medico = ? AND fecha_cita = ? AND hora_cita = ? AND estado IN (0,1)",
        [id_medico, fecha_cita, hora_cita],
        (error2, citaMedico) => {
          if (error2) {
            return res.status(500).json({ error: "Error al validar cita" });
          }
          if (citaMedico.length > 0) {
            return res.status(400).json({ error: "El médico ya tiene una cita en ese horario" });
          }
          db.query(
            "INSERT INTO cita (id_paciente, id_medico, fecha_cita, hora_cita, motivo, estado) VALUES (?, ?, ?, ?, ?, 0)",
            [id_paciente, id_medico, fecha_cita, hora_cita, motivo],
            (error3, result) => {
              if (error3) {
                return res.status(500).json({ error: "Error al agendar cita" });
              }

              // Obtener datos del paciente y médico para el correo
              db.query(
                `SELECT u.correo, u.nombres, u.apellidos 
                 FROM paciente p JOIN usuario u ON p.id_usuario = u.id_usuario 
                 WHERE p.id_paciente = ?`,
                [id_paciente],
                (errP, rowsP) => {
                  if (errP || rowsP.length === 0) return res.json({ mensaje: "Cita agendada, pero no se pudo enviar correo" });
                  const paciente = rowsP[0];

                  db.query(
                    `SELECT u.nombres as medico_nombre, u.apellidos as medico_apellido, u.correo as correo, e.nombre as especialidad
                     FROM medico m
                     JOIN usuario u ON m.id_usuario = u.id_usuario
                     JOIN especialidad e ON m.id_especialidad = e.id_especialidad
                     WHERE m.id_medico = ?`,
                    [id_medico],
                    async (errM, rowsM) => {
                      if (errM || rowsM.length === 0) return res.json({ mensaje: "Cita agendada, pero no se pudo enviar correo" });
                      const medico = rowsM[0];

                      try {
                        // Notifica al paciente
                        await enviarCorreoCita({
                          destinatario: paciente.correo,
                          nombre: `${paciente.nombres} ${paciente.apellidos}`,
                          asunto: "Cita agendada - Clínica Johnson",
                          tipo: "agendada",
                          fecha_cita,
                          hora_cita,
                          medico_nombre: medico.medico_nombre,
                          medico_apellido: medico.medico_apellido,
                          especialidad: medico.especialidad,
                          motivo
                        });
                        // Notifica al médico
                        await enviarCorreoCita({
                          destinatario: medico.correo,
                          nombre: `${medico.medico_nombre} ${medico.medico_apellido}`,
                          asunto: "Nueva cita asignada - Clínica Johnson",
                          tipo: "agendada",
                          fecha_cita,
                          hora_cita,
                          medico_nombre: medico.medico_nombre,
                          medico_apellido: medico.medico_apellido,
                          especialidad: medico.especialidad,
                          motivo,
                          esMedico: true, // <--- IMPORTANTE
                          nombre_paciente: `${paciente.nombres} ${paciente.apellidos}` // <--- IMPORTANTE
                        });
                      } catch (mailErr) {
                        // No detiene el flujo si falla el correo
                      }
                      res.json({ mensaje: "Cita agendada exitosamente" });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
};

// HU05 - Consultar Mis Citas
// pacienteController.js
exports.getCitasPaciente = (req, res) => {
  const { id_paciente, estado } = req.query;
  let query = `
    SELECT c.id_cita, c.fecha_cita, c.hora_cita, c.estado, c.motivo,
           u.nombres as medico_nombre, u.apellidos as medico_apellido, e.nombre as especialidad
    FROM cita c
    JOIN medico m ON c.id_medico = m.id_medico
    JOIN usuario u ON m.id_usuario = u.id_usuario
    JOIN especialidad e ON m.id_especialidad = e.id_especialidad
    WHERE c.id_paciente = ?
  `;
  const params = [id_paciente];
  if (estado) {
    query += " AND c.estado = ?";
    params.push(estado);
  }
  query += " ORDER BY c.fecha_cita ASC, c.hora_cita ASC";
  db.query(query, params, (error, rows) => {
    if (error) {
      return res.status(500).json({ error: "Error al obtener citas" });
    }
    res.json(rows);
  });
};

// HU06 - Cancelar Cita
exports.cancelarCita = (req, res) => {
  const { idCita } = req.params;
  const { id_paciente } = req.body;
  db.query(
    "SELECT * FROM cita WHERE id_cita = ? AND id_paciente = ?",
    [idCita, id_paciente],
    (error, citas) => {
      if (error) {
        return res.status(500).json({ error: "Error al cancelar cita" });
      }
      if (citas.length === 0) {
        return res.status(403).json({ error: "No autorizado o cita no encontrada" });
      }
      const cita = citas[0];
      if (cita.estado === 2 || cita.estado === 3) {
        return res.status(400).json({ error: "La cita ya fue cancelada o finalizada" });
      }
      const now = new Date();
      const citaDate = new Date(`${cita.fecha_cita}T${cita.hora_cita}`);
      if ((citaDate - now) / (1000 * 60 * 60) < 1) {
        return res.status(400).json({ error: "Solo puedes cancelar con al menos 1 hora de anticipación" });
      }
      db.query("UPDATE cita SET estado = 2 WHERE id_cita = ?", [idCita], (error2) => {
        if (error2) {
          return res.status(500).json({ error: "Error al cancelar cita" });
        }

        // Obtener datos del paciente y médico para el correo
        db.query(
          `SELECT u.correo, u.nombres, u.apellidos 
           FROM paciente p JOIN usuario u ON p.id_usuario = u.id_usuario 
           WHERE p.id_paciente = ?`,
          [id_paciente],
          (errP, rowsP) => {
            if (errP || rowsP.length === 0) return res.json({ mensaje: "Cita cancelada, pero no se pudo enviar correo" });
            const paciente = rowsP[0];

            db.query(
              `SELECT u.nombres as medico_nombre, u.apellidos as medico_apellido, u.correo as correo, e.nombre as especialidad
               FROM medico m
               JOIN usuario u ON m.id_usuario = u.id_usuario
               JOIN especialidad e ON m.id_especialidad = e.id_especialidad
               WHERE m.id_medico = ?`,
              [cita.id_medico],
              async (errM, rowsM) => {
                if (errM || rowsM.length === 0) return res.json({ mensaje: "Cita cancelada, pero no se pudo enviar correo" });
                const medico = rowsM[0];

                try {
                  // Notifica al paciente
                  await enviarCorreoCita({
                    destinatario: paciente.correo,
                    nombre: `${paciente.nombres} ${paciente.apellidos}`,
                    asunto: "Cita cancelada - Clínica Johnson",
                    tipo: "cancelada",
                    fecha_cita: cita.fecha_cita,
                    hora_cita: cita.hora_cita,
                    medico_nombre: medico.medico_nombre,
                    medico_apellido: medico.medico_apellido,
                    especialidad: medico.especialidad,
                    motivo: cita.motivo
                  });
                  // Notifica al médico
                  await enviarCorreoCita({
                    destinatario: medico.correo,
                    nombre: `${medico.medico_nombre} ${medico.medico_apellido}`,
                    asunto: "Cita cancelada - Clínica Johnson",
                    tipo: "cancelada",
                    fecha_cita: cita.fecha_cita,
                    hora_cita: cita.hora_cita,
                    medico_nombre: medico.medico_nombre,
                    medico_apellido: medico.medico_apellido,
                    especialidad: medico.especialidad,
                    motivo: cita.motivo,
                    esMedico: true, // <--- IMPORTANTE
                    nombre_paciente: `${paciente.nombres} ${paciente.apellidos}` // <--- IMPORTANTE
                  });
                } catch (mailErr) {
                  // No detiene el flujo si falla el correo
                }
                res.json({ mensaje: "Cita cancelada exitosamente" });
              }
            );
          }
        );
      });
    }
  );
};

// HU16 - Expediente (para paciente y médico)
// Para paciente: solo su propio historial
exports.getExpedientePaciente = (req, res) => {
  const { id_paciente } = req.query;
  db.query(
    `SELECT c.id_cita, c.fecha_cita, c.hora_cita, c.estado, c.motivo,
            u.nombres as medico_nombre, u.apellidos as medico_apellido, e.nombre as especialidad,
            inf.id_informe_consulta, inf.descripcion as informe, inf.fecha_registro
     FROM cita c
     JOIN medico m ON c.id_medico = m.id_medico
     JOIN usuario u ON m.id_usuario = u.id_usuario
     JOIN especialidad e ON m.id_especialidad = e.id_especialidad
     LEFT JOIN informe_consulta inf ON c.id_cita = inf.id_cita
     WHERE c.id_paciente = ? AND c.estado = 1
     ORDER BY c.fecha_cita DESC, c.hora_cita DESC`,
    [id_paciente],
    (error, rows) => {
      if (error) {
        return res.status(500).json({ error: "Error al obtener expediente" });
      }
      res.json(rows);
    }
  );
};

// Para médico: historial de cualquier paciente por id_paciente
exports.getExpedientePorPaciente = (req, res) => {
  const { id_paciente } = req.params;
  db.query(
    `SELECT c.id_cita, c.fecha_cita, c.hora_cita, c.estado, c.motivo,
            u.nombres as medico_nombre, u.apellidos as medico_apellido, e.nombre as especialidad,
            inf.id_informe_consulta, inf.descripcion as informe, inf.fecha_registro
     FROM cita c
     JOIN medico m ON c.id_medico = m.id_medico
     JOIN usuario u ON m.id_usuario = u.id_usuario
     JOIN especialidad e ON m.id_especialidad = e.id_especialidad
     LEFT JOIN informe_consulta inf ON c.id_cita = inf.id_cita
     WHERE c.id_paciente = ? 
     ORDER BY c.fecha_cita DESC, c.hora_cita DESC`,
    [id_paciente],
    (error, rows) => {
      if (error) {
        return res.status(500).json({ error: "Error al obtener expediente" });
      }
      res.json(rows);
    }
  );
};

// Listar contactos de un paciente
exports.getContactosPaciente = (req, res) => {
  const { id_paciente } = req.query;
  db.query(
    "SELECT * FROM contacto WHERE id_paciente = ? ORDER BY id_contacto DESC",
    [id_paciente],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Error al obtener contactos" });
      res.json(rows);
    }
  );
};

// Agregar contacto
exports.agregarContactoPaciente = (req, res) => {
  const { id_paciente, nombre, apellido, parentesco, telefono, direccion, correo } = req.body;
  db.query(
    "INSERT INTO contacto (id_paciente, nombre, apellido, parentesco, telefono, direccion, correo) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id_paciente, nombre, apellido, parentesco, telefono, direccion, correo],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Error al agregar contacto" });
      res.json({ mensaje: "Contacto agregado correctamente" });
    }
  );
};

// Eliminar contacto
exports.eliminarContactoPaciente = (req, res) => {
  const { id_contacto } = req.params;
  db.query(
    "DELETE FROM contacto WHERE id_contacto = ?",
    [id_contacto],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Error al eliminar contacto" });
      res.json({ mensaje: "Contacto eliminado correctamente" });
    }
  );
};

// Obtener datos personales del paciente por id_paciente
exports.getDatosPaciente = (req, res) => {
  const { id_paciente } = req.query;
  db.query(
    `SELECT p.id_paciente, u.nombres, u.apellidos, u.correo, u.telefono, u.direccion, u.sexo, p.fechaNacimiento
     FROM paciente p
     JOIN usuario u ON p.id_usuario = u.id_usuario
     WHERE p.id_paciente = ?`,
    [id_paciente],
    (error, rows) => {
      if (error) {
        return res.status(500).json({ error: "Error al obtener datos del paciente" });
      }
      if (rows.length === 0) {
        return res.status(404).json({ error: "Paciente no encontrado" });
      }
      res.json(rows[0]);
    }
  );
};

async function enviarCorreoCita({
  destinatario,
  nombre,
  asunto,
  tipo, // "agendada" o "cancelada"
  fecha_cita,
  hora_cita,
  medico_nombre,
  medico_apellido,
  especialidad,
  motivo,
  esMedico = false, // Nuevo: indica si el destinatario es médico
  nombre_paciente // Nuevo: nombre completo del paciente
}) {
  let titulo, mensaje;

  if (tipo === "agendada") {
    if (esMedico) {
      titulo = "Nueva cita agendada con usted";
      mensaje = `El paciente <b style="color:#2e5da1;">${nombre_paciente}</b> ha agendado una cita con usted en la Clínica Johnson.`;
    } else {
      titulo = "¡Cita agendada exitosamente!";
      mensaje = "Su cita ha sido agendada con éxito en la Clínica Johnson.";
    }
  } else {
    if (esMedico) {
      titulo = "Cita cancelada por el paciente";
      mensaje = `El paciente <b style="color:#2e5da1;">${nombre_paciente}</b> ha cancelado la cita que tenía agendada con usted en la Clínica Johnson.`;
    } else {
      titulo = "Cita cancelada";
      mensaje = "Su cita ha sido cancelada exitosamente en la Clínica Johnson.";
    }
  }

  await transporter.sendMail({
    from: `"Clínica Johnson" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: asunto,
    html: `
      <div style="background:#f5faff;padding:32px 0;min-height:100vh;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:18px;box-shadow:0 4px 24px 0 rgba(46,93,161,0.10);padding:32px 28px 28px 28px;">
          <div style="text-align:center;margin-bottom:24px;">
            <img src="https://i.ibb.co/YBwjdG4Y/logo-clinica-blanco.png" alt="Logo Clínica Johnson" style="height:64px;width:64px;object-fit:contain;border-radius:50%;background:#2e5da1;padding:8px;box-shadow:0 2px 8px 0 rgba(46,93,161,0.10);" />
          </div>
          <h2 style="color:${tipo === "agendada" ? "#2e5da1" : "#d33"};font-weight:bold;letter-spacing:0.5px;font-size:1.5rem;text-align:center;margin-bottom:12px;">
            ${titulo}
          </h2>
          <p style="color:#444;font-size:1.08rem;text-align:center;margin-bottom:24px;">
            Estimado/a <span style="color:#fad02c;font-weight:bold;">${nombre}</span>,
          </p>
          <p style="color:#444;font-size:1.08rem;margin-bottom:18px;">
            ${mensaje}
          </p>
          <div style="background:#f5faff;border-radius:12px;padding:18px 16px;margin-bottom:20px;">
            <ul style="list-style:none;padding:0;margin:0;">
              <li><b>Fecha:</b> <span style="color:#2e5da1;">${formatearFecha(fecha_cita)}</span></li>
              <li><b>Hora:</b> <span style="color:#2e5da1;">${hora_cita}</span></li>
              <li><b>Médico:</b> <span style="color:#2e5da1;">${medico_nombre} ${medico_apellido}</span></li>
              <li><b>Especialidad:</b> <span style="color:#2e5da1;">${especialidad}</span></li>
              <li><b>Motivo:</b> <span style="color:#2e5da1;">${motivo}</span></li>
            </ul>
          </div>
          <div style="text-align:center;margin-top:28px;">
            <a href="${frontendUrl}" style="background:#2e5da1;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;letter-spacing:0.5px;box-shadow:0 2px 8px 0 rgba(46,93,161,0.10);">Ir al sistema</a>
          </div>
          <p style="color:#888;font-size:0.98rem;text-align:center;margin-top:36px;">
            Atentamente,<br>
            <span style="color:#2e5da1;font-weight:bold;">Clínica Johnson</span>
          </p>
        </div>
      </div>
    `
  });
}