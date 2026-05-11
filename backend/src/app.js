const express = require('express');
const cors = require('cors'); // Para permitir peticiones desde el frontend (React)
const db = require('./config/db.config'); // Importa el pool de conexiones para que se ejecute la prueba de conexión al iniciar la app

// Importa el nuevo módulo de rutas de autenticación
const authRoutes = require('./routes/auth.routes');
const clientRoutes = require('./routes/client.routes');
const productRoutes = require('./routes/product.routes');

// Esto va despues de todas las importaciones pq "levanta" la app express
const app = express();

// Middleware
app.use(cors()); // Importante para la comunicación Frontend-Backend
app.use(express.json()); // Para poder recibir datos JSON en las peticiones

// --- RUTAS DE LA APLICACIÓN ---
// Define el prefijo base /api/auth para todas las rutas del módulo
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/products', productRoutes);



// =============================================
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

// =============================================

module.exports = app;