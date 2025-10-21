// src/app.js
const express = require('express');
const cors = require('cors'); // Para permitir peticiones desde el frontend (React)
const db = require('./config/db.config'); // Importa el pool de conexiones para que se ejecute la prueba de conexión al iniciar la app

const app = express();

// Middleware
app.use(cors()); // Importante para la comunicación Frontend-Backend
app.use(express.json()); // Para poder recibir datos JSON en las peticiones

// Rutas de prueba inicial
app.get('/', (req, res) => {
  res.send('Welcome to the Taller Backend API');
});

// Ejemplo de ruta que devuelve un JSON
app.get('/api/test', (req, res) => {
  res.status(200).json({ 
    message: 'API is working!',
    date: new Date() 
  });
});

module.exports = app;