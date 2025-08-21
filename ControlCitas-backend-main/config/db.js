const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Manejar errores de conexión
db.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    return;
  }
  console.log('Conectado a la base de datos MySQL');
});

// Manejar errores después de la conexión
db.on('error', (err) => {
  console.error('Error en la base de datos:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Se perdió la conexión con la base de datos');
  } else {
    throw err;
  }
});

module.exports = db;

