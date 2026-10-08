const PaymentService = require('../services/payment.service');

/**
 * Endpoint encargado de procesar el alta de un nuevo registro de pago.
 * Valida la forma básica del payload y delega la orquestación de negocio al servicio. La
 * obligatoriedad condicional del banco, el comprobante y el vencimiento no se evalúa aquí:
 * depende de la naturaleza del medio de cobro y es una regla de negocio del servicio.
 * @param {Object} req - Objeto de petición Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
exports.handleCreatePayment = async (req, res) => {
    try {
        const { id_cliente, id_medio_pago, monto, fecha_recepcion } = req.body;

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

        if (!fecha_recepcion) {
            return res.status(400).json({
                success: false,
                message: "El campo 'fecha_recepcion' es obligatorio."
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
 * Endpoint encargado de procesar la modificación de un pago existente.
 * Valida la forma del identificador y del payload, y delega la orquestación de negocio al servicio,
 * que resuelve la inmutabilidad del registro según su estado operativo.
 * @param {Object} req - Objeto de petición Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
exports.handleUpdatePayment = async (req, res) => {
    try {
        const idPago = parseInt(req.params.id, 10);

        if (Number.isNaN(idPago) || idPago <= 0) {
            return res.status(400).json({
                success: false,
                message: "El identificador del pago debe ser un número entero y positivo."
            });
        }

        // Campos que la capa de negocio admite mutar sobre un pago en Borrador
        const camposMutables = ['monto', 'id_medio_pago', 'id_banco', 'id_estado_pago', 'fecha_recepcion', 'fecha_vencimiento', 'numero_comprobante', 'observaciones'];
        const payload = req.body || {};

        if (!camposMutables.some(campo => payload[campo] !== undefined)) {
            return res.status(400).json({
                success: false,
                message: "Debe informarse al menos un campo modificable del pago."
            });
        }

        const result = await PaymentService.updatePayment(idPago, payload);

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error(`[PaymentController Error] Falla al despachar endpoint de modificación de pago: ${error.message}`);

        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            message: error.message || 'Ocurrió un error interno en el servidor al modificar el pago.'
        });
    }
};

/**
 * Endpoint encargado de procesar la baja de un pago en estado Borrador.
 * Valida la forma del identificador y delega la guarda de negocio al servicio.
 * @param {Object} req - Objeto de petición Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
exports.handleDeletePayment = async (req, res) => {
    try {
        const idPago = parseInt(req.params.id, 10);

        if (Number.isNaN(idPago) || idPago <= 0) {
            return res.status(400).json({
                success: false,
                message: "El identificador del pago debe ser un número entero y positivo."
            });
        }

        const result = await PaymentService.deletePayment(idPago);

        return res.status(200).json({
            success: true,
            message: `El pago #${result.id_pago} fue eliminado correctamente.`
        });

    } catch (error) {
        console.error(`[PaymentController Error] Falla al despachar endpoint de baja de pago: ${error.message}`);

        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            message: error.message || 'Ocurrió un error interno en el servidor al eliminar el pago.'
        });
    }
};

/**
 * Obtiene el historial de pagos registrados aplicando criterios de filtrado dinámicos y combinables,
 * junto con el ordenamiento solicitado por la grilla de datos.
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
            id_banco,
            monto,
            monto_min,
            monto_max,
            fecha_desde,
            fecha_hasta,
            vencimiento_desde,
            vencimiento_hasta,
            numero_comprobante,
            creacion_desde,
            creacion_hasta,
            actualizacion_desde,
            actualizacion_hasta,
            sort_by,
            sort_order
        } = req.query;

        // Construimos el objeto de filtros para la capa de servicio
        const filters = {
            id_pago: id_pago ? parseInt(id_pago, 10) : null,
            id_cliente: id_cliente ? parseInt(id_cliente, 10) : null,
            id_estado_pago: id_estado_pago ? parseInt(id_estado_pago, 10) : null,
            id_medio_pago: id_medio_pago ? parseInt(id_medio_pago, 10) : null,
            id_banco: id_banco ? parseInt(id_banco, 10) : null,
            monto: monto ? Number(monto) : null,
            monto_min: monto_min ? Number(monto_min) : null,
            monto_max: monto_max ? Number(monto_max) : null,
            fecha_desde: fecha_desde ? String(fecha_desde) : null,
            fecha_hasta: fecha_hasta ? String(fecha_hasta) : null,
            vencimiento_desde: vencimiento_desde ? String(vencimiento_desde) : null,
            vencimiento_hasta: vencimiento_hasta ? String(vencimiento_hasta) : null,
            numero_comprobante: numero_comprobante ? String(numero_comprobante).trim() : null,
            creacion_desde: creacion_desde ? String(creacion_desde) : null,
            creacion_hasta: creacion_hasta ? String(creacion_hasta) : null,
            actualizacion_desde: actualizacion_desde ? String(actualizacion_desde) : null,
            actualizacion_hasta: actualizacion_hasta ? String(actualizacion_hasta) : null,
            sort_by: sort_by ? String(sort_by) : null,
            sort_order: sort_order ? String(sort_order) : null
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

/**
 * Obtiene el catálogo completo de entidades bancarias.
 */
exports.getBanks = async (req, res) => {
    try {
        const banks = await PaymentService.getBanks();
        return res.status(200).json({
            success: true,
            data: banks
        });
    } catch (error) {
        console.error('[PaymentController Error] Falla al recuperar bancos:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al recuperar el catálogo de bancos.'
        });
    }
};

/**
 * Endpoint encargado de procesar el alta de una nueva entidad bancaria desde el formulario de pagos.
 * Valida la presencia del nombre y delega la normalización y el control de duplicados al servicio.
 * @param {Object} req - Objeto de petición Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
exports.handleCreateBank = async (req, res) => {
    try {
        const { nombre } = req.body;

        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: "El campo 'nombre' es obligatorio."
            });
        }

        const result = await PaymentService.createBank(req.body);

        return res.status(201).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error(`[PaymentController Error] Falla al despachar endpoint de alta de banco: ${error.message}`);

        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            message: error.message || 'Ocurrió un error interno en el servidor al registrar el banco.'
        });
    }
};

/**
 * Endpoint encargado de recuperar un pago puntual por su número interno (GET /api/payment/:id).
 * Valida que el identificador sea un entero positivo y delega en el servicio la búsqueda y el
 * control de existencia, cuyo 404 se traslada como estado HTTP de la respuesta.
 * @param {Object} req - Objeto de petición Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
exports.handleGetPaymentById = async (req, res) => {
    try {
        const idPago = parseInt(req.params.id, 10);

        if (Number.isNaN(idPago) || idPago <= 0) {
            return res.status(400).json({
                success: false,
                message: "El identificador del pago debe ser un número entero y positivo."
            });
        }

        const result = await PaymentService.getPaymentById(idPago);

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error(`[PaymentController Error] Falla al despachar endpoint de obtención de pago: ${error.message}`);

        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            message: error.message || 'Ocurrió un error interno en el servidor al obtener el pago.'
        });
    }
};
