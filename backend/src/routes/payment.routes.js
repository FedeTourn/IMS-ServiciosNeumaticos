const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// GET /api/payment/methods
router.get('/methods', paymentController.getPaymentMethods);

// GET /api/payment/states
router.get('/states', paymentController.getPaymentStates);

module.exports = router;
