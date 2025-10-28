const express = require('express');
const router = express.Router(); // Utiliza el Router de Express para definir rutas
const authController = require('../controllers/auth.controller');

// Ruta POST para registrar un nuevo usuario
// Endpoint: /api/auth/register
router.post('/register', authController.register);

// Ruta POST para el inicio de sesión
// Endpoint: /api/auth/login
router.post('/login', authController.login);

module.exports = router;