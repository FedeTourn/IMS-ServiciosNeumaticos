// Este es el punto de inicio de la aplicación
// Se encarga de inicializar la escucha de peticiones en el puerto configurado.

const app = require('./src/app');
require('dotenv').config(); // Carga las variables del .env

const port = process.env.PORT || 3001;
const host = process.env.HOST || 'localhost';

// Escucha en el puerto definido
//El método app.listen sin un host específico permite conexiones desde cualquier interfaz de red (0.0.0.0)
app.listen(port, () => {
  console.log(`Server is running`);
  console.log(`Local environment: http://localhost:${port}`);
  console.log(`Network environment: http://${host}:${port} (Check IP on backend/server.js)`);
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
