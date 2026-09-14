const PaymentService = require('../services/payment.service');

/**
 * Endpoint encargado de procesar el alta de un nuevo registro de pago.
 * Valida la forma básica del payload y delega la orquestación de negocio al servicio.
 * @param {Object} req - Objeto de petición Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
exports.handleCreatePayment = async (req, res) => {
    try {
        const { id_cliente, id_medio_pago, monto, fecha_pago } = req.body;

        if (!id_cliente) {
            return res.status(400).json({
                success: false,
                message: "El campo 'id_cliente' es obligatorio."
            });
        }

        if (!id_medio_pago) {
            return res.status(400).json({
                success: false,
                message: "El campo 'id_medio_pago' es obligatorio."
            });
        }

        if (monto === undefined || monto === null || monto === '') {
            return res.status(400).json({
                success: false,
                message: "El campo 'monto' es obligatorio."
            });
        }

        if (!fecha_pago) {
            return res.status(400).json({
                success: false,
                message: "El campo 'fecha_pago' es obligatorio."
            });
        }

        const result = await PaymentService.createPayment(req.body);

        return res.status(201).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error(`[PaymentController Error] Falla al despachar endpoint de creación de pago: ${error.message}`);

        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            message: error.message || 'Ocurrió un error interno en el servidor al registrar el pago.'
        });
    }
};

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
