const express = require('express');
const router = express.Router();
const RepairOrderController = require('../controllers/repairOrder.controller');

// Opcional: Aquí podrías importar tu middleware de autenticación/autorización
// const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');


// router.post('/', verifyToken, RepairOrderController.createRepairOrder);
router.post('/', RepairOrderController.createRepairOrder);

// GET /api/repair-orders
router.get('/', RepairOrderController.getRepairOrders);

router.get('/products-by-client/:id_cliente', RepairOrderController.getProductPricesByClient);

// GET /api/repair-orders/:id
router.get('/:id', RepairOrderController.getRepairOrderById);
// router.put('/:id', RepairOrderController.updateRepairOrder);

module.exports = router;