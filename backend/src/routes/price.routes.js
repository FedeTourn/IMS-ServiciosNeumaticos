const express = require('express');
const router = express.Router();
const priceController = require('../controllers/price.controller');

// GET /api/prices -> Lista todos los precios activos
router.get('/', priceController.getAllPrices);

// GET /api/prices/suggested -> Obtiene un precio específico (Autocompletado)
router.get('/suggested', priceController.getSuggestedPrice);

// POST /api/prices/bulk -> Actualiza masivamente un lote de precios
router.post('/bulk', priceController.updateBulkPrices);

module.exports = router;
