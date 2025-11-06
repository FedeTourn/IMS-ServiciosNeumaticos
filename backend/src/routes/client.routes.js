const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');
//const { verifyToken } = require('../middlewares/auth.middleware');

// IMPORTANTE: Aquí integrarías un middleware de autenticación (ej. verifyToken)
// para proteger todas estas rutas, pero lo dejaremos para un paso posterior.

// --- RUTA PARA CATEGORÍA ---
// Nota: Esta ruta es para datos de referencia, puede ser pública o protegida por verifyToken.
// router.get('/categories', verifyToken, clientController.getAllClientCategories);
router.get('/categories', clientController.getAllClientCategories);

// GET /api/clients - Consultar Clientes
router.get('/', clientController.getAllClients);

// POST /api/clients - Crear Cliente
router.post('/', clientController.createClient);


// Rutas de edicion
router.get('/:id', clientController.getClientById);
router.put('/:id', clientController.updateClient);

// PUT /api/clients/:id/reactivate - Habilitar Cliente (NUEVA RUTA)
router.put('/:id/reactivate', clientController.reactivateClient);

// DELETE /api/clients/:id_cliente - Deshabilitar Cliente
router.delete('/:id', clientController.disableClient);
/* 
// PUT /api/clients/:id_cliente - Modificar Cliente
router.put('/:id_cliente', clientController.updateClient);

// GET /api/clients/:id_cliente - Consultar Cliente por ID
router.get('/:id_cliente', clientController.getClientById); */

module.exports = router;