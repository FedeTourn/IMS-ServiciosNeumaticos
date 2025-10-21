// src/config/db.config.js
require('dotenv').config();
const mysql = require('mysql2');

// Crea el pool de conexiones usando las variables del .env
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Prueba la conexión
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Successfully connected to MySQL as id ' + connection.threadId);
  connection.release(); 
});

module.exports = pool.promise(); // Exporta para usar en los modelos/controladores