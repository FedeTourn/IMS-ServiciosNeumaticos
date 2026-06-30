const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receipt.controller');
const { validateCreateReceipt } = require('../middlewares/receipt.validation');

// Ruta protegida por validación estructural sintáctica
router.post('/', validateCreateReceipt, receiptController.createReceipt);

router.get('/', receiptController.getAllReceipts);

module.exports = router;