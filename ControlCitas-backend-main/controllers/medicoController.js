const db = require("../config/db");
const nodemailer = require("nodemailer");
const frontendUrl = `https://controlcitas-frontend-production.up.railway.app/`;

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

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function enviarCorreoCancelacionMedico({
  destinatario,
  nombre,
  asunto,
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

  if (esMedico) {
    titulo = "Cita cancelada por usted";
    mensaje = `Usted ha cancelado la cita con el paciente <b style="color:#2e5da1;">${nombre_paciente}</b> en la Clínica Johnson.`;
  } else {
    titulo = "Cita cancelada por el médico";
    mensaje = `Le informamos que su cita ha sido <b>cancelada por el médico</b> en la Clínica Johnson.`;
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
          <h2 style="color:#d33;font-weight:bold;letter-spacing:0.5px;font-size:1.5rem;text-align:center;margin-bottom:12px;">
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

// HU08 - Definir Disponibilidad de Horario
exports.getHorarios = (req, res) => {
  const { id_medico } = req.query;
  db.query(
    "SELECT * FROM horario_medico WHERE id_medico = ? ORDER BY FIELD(dia_semana, 'Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'), hora_inicio",
    [id_medico],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Error al obtener horarios" });
      res.json(rows);
    }
  );
};

exports.agregarHorario = (req, res) => {
  const { id_medico, dia_semana, hora_inicio, hora_fin } = req.body;
  if (!id_medico || !dia_semana || !hora_inicio || !hora_fin) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }
  db.query(
    "INSERT INTO horario_medico (id_medico, dia_semana, hora_inicio, hora_fin) VALUES (?, ?, ?, ?)",
    [id_medico, dia_semana, hora_inicio, hora_fin],
    (err) => {
      if (err) {
        // Devuelve el error real para depuración
        return res.status(500).json({ error: "Error al agregar horario", detalle: err.sqlMessage || err.message });
      }
      res.json({ mensaje: "Horario agregado correctamente" });
    }
  );
};

exports.eliminarHorario = (req, res) => {
  const { id_horario_medico } = req.params;
  db.query(
    "DELETE FROM horario_medico WHERE id_horario_medico = ?",
    [id_horario_medico],
    (err) => {
      if (err) return res.status(500).json({ error: "Error al eliminar horario" });
      res.json({ mensaje: "Horario eliminado correctamente" });
    }
  );
};

// HU09 - Ver Citas Asignadas como Médico
exports.getCitasMedico = (req, res) => {
  const { id_medico, estado, q, fecha } = req.query;
  let sql = `
    SELECT c.id_cita, c.fecha_cita, c.hora_cita, c.estado, c.motivo,
           p.id_paciente, u.nombres as paciente_nombre, u.apellidos as paciente_apellido
    FROM cita c
    JOIN paciente p ON c.id_paciente = p.id_paciente
    JOIN usuario u ON p.id_usuario = u.id_usuario
    WHERE c.id_medico = ?
  `;
  const params = [id_medico];
  if (estado) {
    sql += " AND c.estado = ?";
    params.push(estado);
  }
  if (q) {
    sql += " AND (u.nombres LIKE ? OR u.apellidos LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  if (fecha) {
    sql += " AND c.fecha_cita = ?";
    params.push(fecha);
  }
  sql += " ORDER BY c.fecha_cita ASC, c.hora_cita ASC";
  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: "Error al obtener citas" });
    res.json(rows);
  });
};

// HU10 - Cancelar Cita como Médico
exports.cancelarCitaMedico = (req, res) => {
  const { idCita } = req.params;
  const { id_medico } = req.body;
  db.query(
    "SELECT * FROM cita WHERE id_cita = ? AND id_medico = ?",
    [idCita, id_medico],
    (err, citas) => {
      if (err) return res.status(500).json({ error: "Error al cancelar cita" });
      if (citas.length === 0) return res.status(403).json({ error: "No autorizado o cita no encontrada" });
      const cita = citas[0];
      if (cita.estado === 1 || cita.estado === 2 || cita.estado === 3) {
        return res.status(400).json({ error: "La cita ya fue finalizada o cancelada" });
      }
      db.query(
        "UPDATE cita SET estado = 3 WHERE id_cita = ?",
        [idCita],
        (err2) => {
          if (err2) return res.status(500).json({ error: "Error al cancelar cita" });

          // Obtener datos del paciente y médico para el correo
          db.query(
            `SELECT u.correo, u.nombres, u.apellidos 
             FROM paciente p JOIN usuario u ON p.id_usuario = u.id_usuario 
             WHERE p.id_paciente = ?`,
            [cita.id_paciente],
            (errP, rowsP) => {
              if (errP || rowsP.length === 0) return res.json({ mensaje: "Cita cancelada, pero no se pudo enviar correo" });
              const paciente = rowsP[0];

              db.query(
                `SELECT u.nombres as medico_nombre, u.apellidos as medico_apellido, u.correo as correo, e.nombre as especialidad
                 FROM medico m
                 JOIN usuario u ON m.id_usuario = u.id_usuario
                 JOIN especialidad e ON m.id_especialidad = e.id_especialidad
                 WHERE m.id_medico = ?`,
                [id_medico],
                async (errM, rowsM) => {
                  if (errM || rowsM.length === 0) return res.json({ mensaje: "Cita cancelada, pero no se pudo enviar correo" });
                  const medico = rowsM[0];

                  try {
                    // Notifica al paciente
                    await enviarCorreoCancelacionMedico({
                      destinatario: paciente.correo,
                      nombre: `${paciente.nombres} ${paciente.apellidos}`,
                      asunto: "Cita cancelada por el médico - Clínica Johnson",
                      fecha_cita: cita.fecha_cita,
                      hora_cita: cita.hora_cita,
                      medico_nombre: medico.medico_nombre,
                      medico_apellido: medico.medico_apellido,
                      especialidad: medico.especialidad,
                      motivo: cita.motivo,
                      esMedico: false
                    });
                    // Notifica al médico
                    await enviarCorreoCancelacionMedico({
                      destinatario: medico.correo,
                      nombre: `${medico.medico_nombre} ${medico.medico_apellido}`,
                      asunto: "Cita cancelada por usted - Clínica Johnson",
                      fecha_cita: cita.fecha_cita,
                      hora_cita: cita.hora_cita,
                      medico_nombre: medico.medico_nombre,
                      medico_apellido: medico.medico_apellido,
                      especialidad: medico.especialidad,
                      motivo: cita.motivo,
                      esMedico: true,
                      nombre_paciente: `${paciente.nombres} ${paciente.apellidos}`
                    });
                  } catch (mailErr) {
                    // No detiene el flujo si falla el correo
                  }
                  res.json({ mensaje: "Cita cancelada exitosamente" });
                }
              );
            }
          );
        }
      );
    }
  );
};

// HU09/HU16 - Detalle de cita e informe
exports.getDetalleCita = (req, res) => {
  const { id_cita } = req.params;
  db.query(
    `SELECT c.*, u.nombres as paciente_nombre, u.apellidos as paciente_apellido, 
            e.nombre as especialidad, inf.descripcion as informe, inf.fecha_registro
     FROM cita c
     JOIN paciente p ON c.id_paciente = p.id_paciente
     JOIN usuario u ON p.id_usuario = u.id_usuario
     JOIN medico m ON c.id_medico = m.id_medico
     JOIN especialidad e ON m.id_especialidad = e.id_especialidad
     LEFT JOIN informe_consulta inf ON c.id_cita = inf.id_cita
     WHERE c.id_cita = ?`,
    [id_cita],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Error al obtener detalle" });
      if (rows.length === 0) return res.status(404).json({ error: "Cita no encontrada" });
      res.json(rows[0]);
    }
  );
};

// HU09 - Agregar informe a cita finalizada
exports.agregarInforme = (req, res) => {
  const { id_cita } = req.params;
  const { descripcion } = req.body;
  // Inserta informe y actualiza estado
  db.query(
    "INSERT INTO informe_consulta (id_cita, descripcion, fecha_registro) VALUES (?, ?, NOW())",
    [id_cita, descripcion],
    (err) => {
      if (err) return res.status(500).json({ error: "Error al guardar informe" });
      db.query(
        "UPDATE cita SET estado = 1 WHERE id_cita = ?",
        [id_cita],
        (err2) => {
          if (err2) return res.status(500).json({ error: "Error al actualizar estado" });
          res.json({ mensaje: "Informe agregado y cita finalizada" });
        }
      );
    }
  );
};

exports.editarInforme = (req, res) => {
  const { id_cita } = req.params;
  const { descripcion } = req.body;

  if (!id_cita || !descripcion || descripcion.trim() === "") {
    return res.status(400).json({ error: "El id de la cita y la descripción son obligatorios" });
  }

  // Verifica que exista el informe para esa cita
  db.query(
    "SELECT * FROM informe_consulta WHERE id_cita = ?",
    [id_cita],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Error al buscar informe" });
      if (rows.length === 0) {
        return res.status(404).json({ error: "No existe informe para esta cita" });
      }

      // Actualiza la descripción y la fecha de edición
      db.query(
        "UPDATE informe_consulta SET descripcion = ?, fecha_registro = NOW() WHERE id_cita = ?",
        [descripcion, id_cita],
        (err2) => {
          if (err2) return res.status(500).json({ error: "Error al actualizar informe" });
          res.json({ mensaje: "Informe actualizado correctamente" });
        }
      );
    }
  );
};

// HU16 - Expediente de paciente (para médico)
exports.getExpedientePaciente = (req, res) => {
  const { id_paciente } = req.query;
  db.query(
    `SELECT c.id_cita, c.fecha_cita, c.hora_cita, c.estado, inf.descripcion as informe, inf.fecha_registro
     FROM cita c
     LEFT JOIN informe_consulta inf ON c.id_cita = inf.id_cita
     WHERE c.id_paciente = ?
     ORDER BY c.fecha_cita DESC, c.hora_cita DESC`,
    [id_paciente],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Error al obtener expediente" });
      res.json(rows);
    }
  );
};

exports.getExpedientePorPaciente = (req, res) => {
    const { id_paciente } = req.params;
    db.query(
        `SELECT c.id_medico, c.id_cita, c.fecha_cita, c.hora_cita, c.estado, c.motivo,
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