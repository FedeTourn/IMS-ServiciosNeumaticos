const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// GET /api/payments/methods
router.get('/methods', paymentController.getPaymentMethods);

// GET /api/payments/states
router.get('/states', paymentController.getPaymentStates);

// GET /api/payments/banks
router.get('/banks', paymentController.getBanks);

// POST /api/payments/banks
router.post('/banks', paymentController.handleCreateBank);

// GET /api/payments/:id
router.get('/:id', paymentController.handleGetPaymentById);

// GET /api/payments (consulta multicriterio por query params)
router.get('/', paymentController.handleGetPayments);

// POST /api/payments
router.post('/', paymentController.handleCreatePayment);

// PUT /api/payments/:id
router.put('/:id', paymentController.handleUpdatePayment);

// DELETE /api/payments/:id
router.delete('/:id', paymentController.handleDeletePayment);

module.exports = router;
