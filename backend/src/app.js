/**
 * Configuración de la aplicación Express.
 * Define middlewares globales, rutas y manejo de errores base.
 */
const express = require('express');
const cors = require('cors'); // Para permitir peticiones desde el frontend (React)
//const db = require('./config/db.config'); // Importa el pool de conexiones para que se ejecute la prueba de conexión al iniciar la app

// Importacion de rutas por modulo
const authRoutes = require('./routes/auth.routes');
const clientRoutes = require('./routes/client.routes');
const productRoutes = require('./routes/product.routes');
const priceRoutes = require('./routes/price.routes');
const receiptRoutes = require('./routes/receipt.routes');
const repairOrderRoutes = require('./routes/repairOrder.routes');

// Esto va despues de todas las importaciones porque "levanta" la app express
const app = express();

// --- MIDDLEWARES GLOBALES ---
// Habilitación de CORS para permitir peticiones desde el frontend (React)
app.use(cors()); // Importante para la comunicación Frontend-Backend

// Middleware para parsear el cuerpo de las peticiones en formato JSON
app.use(express.json()); // Para poder recibir datos JSON en las peticiones

// --- RUTAS DE LA APLICACIÓN ---
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/products', productRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/repair-orders', repairOrderRoutes);

// --- RUTAS DE DIAGNÓSTICO ---
app.get('/', (req, res) => {
  res.send('Servicios Neumáticos IMS - Backend API Running');
});

/**
 * Endpoint de prueba de salud de la API.
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP',
    timestamp: new Date() 
  });
});

module.exports = app;