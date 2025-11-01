const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');

// IMPORTANTE: Aquí integrarías un middleware de autenticación (ej. verifyToken)
// para proteger todas estas rutas, pero lo dejaremos para un paso posterior.

// GET /api/clients - Consultar Clientes
router.get('/', clientController.getAllClients);

// POST /api/clients - Crear Cliente
router.post('/', clientController.createClient);

// PUT /api/clients/:id_cliente - Modificar Cliente
router.put('/:id_cliente', clientController.updateClient);

// DELETE /api/clients/:id_cliente - Deshabilitar Cliente
router.delete('/:id_cliente', clientController.disableClient);

// GET /api/clients/:id_cliente - Consultar Cliente por ID (NUEVA RUTA)
router.get('/:id_cliente', clientController.getClientById);

module.exports = router;