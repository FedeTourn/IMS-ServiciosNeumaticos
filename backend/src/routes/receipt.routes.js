const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receipt.controller');
const { validateCreateReceipt } = require('../middlewares/receipt.validation');

// Ruta protegida por validación estructural sintáctica
router.post('/', validateCreateReceipt, receiptController.createReceipt);

router.get('/', receiptController.getAllReceipts);

// Consulta de detalle
router.get('/:id', receiptController.getReceiptById);

// Modificación restringida (solo metadatos)
router.put('/:id', receiptController.updateReceipt);

module.exports = router;