const PaymentService = require('../services/payment.service');

/**
 * Obtiene el catálogo completo de medios de pago parametrizados.
 */
exports.getPaymentMethods = async (req, res) => {
    try {
        const methods = await PaymentService.getAllPaymentMethods();
        return res.status(200).json({
            success: true,
            data: methods
        });
    } catch (error) {
        console.error('[PaymentController Error] Falla al recuperar medios de pago:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al recuperar el catálogo de medios de pago.'
        });
    }
};

/**
 * Obtiene el catálogo completo de estados de pago parametrizados.
 */
exports.getPaymentStates = async (req, res) => {
    try {
        const states = await PaymentService.getAllPaymentStates();
        return res.status(200).json({
            success: true,
            data: states
        });
    } catch (error) {
        console.error('[PaymentController Error] Falla al recuperar estados de pago:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al recuperar el catálogo de estados de pago.'
        });
    }
};
