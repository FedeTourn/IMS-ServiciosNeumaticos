const express = require('express');
const router = express.Router(); // Utiliza el Router de Express para definir rutas
const authController = require('../controllers/auth.controller');

// Ruta POST para registrar un nuevo usuario
// Endpoint: /api/auth/register
router.post('/register', authController.register);

// Ruta POST para el inicio de sesión
// Endpoint: /api/auth/login
router.post('/login', authController.login);


// --- Rutas de Gestión de Usuarios (ABM) ---
// Nota: En un entorno real, estas rutas estarían protegidas por un middleware "solo para Admin"
// 0. Consulta de ROLES (LISTA DE REFERENCIA - DEBE IR PRIMERO)
router.get('/roles', authController.getAllRoles);
router.post('/roles', authController.createRole);

router.get('/users', authController.getAllUsers); // Consulta de usuarios

router.get('/users/:id_user', authController.getUserById); // Obtener detalle para modificar
router.put('/users/:id_user', authController.updateUser); // Modificación de usuarios

module.exports = router;