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
 * Obtiene el historial de pagos registrados aplicando criterios de filtrado dinámicos y combinables.
 * Mapea los parámetros de consulta provenientes de la URL (Query Params).
 */
exports.handleGetPayments = async (req, res) => {
    try {
        // Extraer los criterios de filtrado del query string
        const {
            id_pago,
            id_cliente,
            id_estado_pago,
            id_medio_pago,
            monto,
            monto_min,
            monto_max,
            fecha_desde,
            fecha_hasta,
            numero_comprobante,
            creacion_desde,
            creacion_hasta,
            actualizacion_desde,
            actualizacion_hasta
        } = req.query;

        // Construimos el objeto de filtros para la capa de servicio
        const filters = {
            id_pago: id_pago ? parseInt(id_pago, 10) : null,
            id_cliente: id_cliente ? parseInt(id_cliente, 10) : null,
            id_estado_pago: id_estado_pago ? parseInt(id_estado_pago, 10) : null,
            id_medio_pago: id_medio_pago ? parseInt(id_medio_pago, 10) : null,
            monto: monto ? Number(monto) : null,
            monto_min: monto_min ? Number(monto_min) : null,
            monto_max: monto_max ? Number(monto_max) : null,
            fecha_desde: fecha_desde ? String(fecha_desde) : null,
            fecha_hasta: fecha_hasta ? String(fecha_hasta) : null,
            numero_comprobante: numero_comprobante ? String(numero_comprobante).trim() : null,
            creacion_desde: creacion_desde ? String(creacion_desde) : null,
            creacion_hasta: creacion_hasta ? String(creacion_hasta) : null,
            actualizacion_desde: actualizacion_desde ? String(actualizacion_desde) : null,
            actualizacion_hasta: actualizacion_hasta ? String(actualizacion_hasta) : null
        };

        const result = await PaymentService.getPayments(filters);

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error(`[PaymentController Error] Falla al resolver GET /api/payment: ${error.message}`);

        // Mapeo semántico de excepciones de validación (400) y errores técnicos (500)
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            message: error.message || 'Error interno en el servidor al recuperar el listado de pagos.'
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
