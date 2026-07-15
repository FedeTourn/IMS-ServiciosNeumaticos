const express = require('express');
const router = express.Router();
const RepairOrderController = require('../controllers/repairOrder.controller');

// Opcional: Aquí podrías importar tu middleware de autenticación/autorización
// const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

/**
 * Rutas para la gestión de Órdenes de Reparación
 * Base URL esperada: /api/repair-orders
 */

// POST: Crear nueva orden de reparación
// router.post('/', verifyToken, RepairOrderController.createRepairOrder); // Versión con seguridad
router.post('/', RepairOrderController.createRepairOrder);

router.get('/products-by-client/:id_cliente', RepairOrderController.getProductPricesByClient);

// Futuras rutas irán aquí (Req. 26, 27, 28)
// router.get('/', RepairOrderController.getAllRepairOrders);
// router.get('/:id', RepairOrderController.getRepairOrderById);
// router.put('/:id', RepairOrderController.updateRepairOrder);

module.exports = router;