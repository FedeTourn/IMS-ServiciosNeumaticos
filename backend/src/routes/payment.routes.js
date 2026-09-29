const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// GET /api/payment/methods
router.get('/methods', paymentController.getPaymentMethods);

// GET /api/payment/states
router.get('/states', paymentController.getPaymentStates);

// GET /api/payment/banks
router.get('/banks', paymentController.getBanks);

// POST /api/payment/banks
router.post('/banks', paymentController.handleCreateBank);

// GET /api/payment (consulta multicriterio por query params)
router.get('/', paymentController.handleGetPayments);

// POST /api/payment
router.post('/', paymentController.handleCreatePayment);

// PUT /api/payment/:id
router.put('/:id', paymentController.handleUpdatePayment);

// DELETE /api/payment/:id
router.delete('/:id', paymentController.handleDeletePayment);

module.exports = router;
