// Este es el punto de inicio de la aplicación
const app = require('./src/app');
require('dotenv').config(); // Carga las variables del .env
const port = process.env.PORT || 3001;

// Escucha en el puerto definido
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Access at: http://localhost:${port}`);
});





/* const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');


const app = express();
app.use(cors());
app.use(express.json());

// Configuración de conexión
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'tallerdb'
});

// Ruta para el path raíz
app.get('/', (req, res) => {
    res.send('Servidor TallerDB funcionando correctamente.');
});

// Ruta de prueba
app.get('/ping', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS fecha');
    res.json({ status: 'OK', fecha: rows[0].fecha });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log('Backend corriendo en http://localhost:3001')); */
