const RepairOrderService = require('../services/repairOrder.service');

/**
 * Endpoint encargado de procesar y coordinar el alta de una Orden de reparacion y la modificacion de sus productos.
 * @param {Object} req - Objeto de petición Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
exports.createRepairOrder = async (req, res) => {
    try {
        const { id_cliente, items, es_cerrada } = req.body;

        // Validación de entrada (Input Validation)
        if (!id_cliente) {
            return res.status(400).json({ 
                success: false, 
                message: "El campo 'id_cliente' es obligatorio." 
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "La orden debe contener al menos un producto (items)." 
            });
        }

        const result = await RepairOrderService.createRepairOrder(req.body);

        return res.status(201).json(result);

    } catch (error) {
        console.error(`[RepairOrderController Error] Falla al despachar endpoint: ${error.message}`);
        
        // Manejo y mapeo semántico de excepciones de negocio
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            message: error.message || 'Ocurrió un error interno en el servidor al registrar la orden de reparación.'
        });
    }
};

/**
 * Maneja la petición HTTP para consultar el listado de órdenes de reparación.
 * Actúa como fachada entre el enrutador de Express y la capa de servicios.
 * * @param {Object} req - Objeto de petición de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 */
exports.getRepairOrders = async (req, res) => {
    try {
        const {
            id_orden_reparacion,
            id_cliente,
            estado,
            sort_by,
            sort_order
        } = req.query;

        const filters = {
            id_orden_reparacion,
            id_cliente,
            estado,
            sort_by,
            sort_order
        };

        // 3. Delegación de la ejecución a la Capa de Lógica de Negocio
        const repairOrders = await RepairOrderService.getRepairOrders(filters);

        // 4. Retorno exitoso al cliente frontend
        return res.status(200).json({
            success: true,
            data: repairOrders
        });

    } catch (error) {
        // 5. Manejo centralizado de excepciones
        console.error(`[RepairOrderController Error] Falla al resolver GET /api/repair-orders: ${error.message}`);
        
        return res.status(500).json({
            success: false,
            message: 'Ocurrió un error interno al consultar las órdenes de reparación: ' + error.message
        });
    }
};

exports.getProductPricesByClient = async (req, res) => {
    try {
        const result = await RepairOrderService.getProductPricesByClient(req.params.id_cliente);
        
        res.status(200).json(result);
    } catch (error) {
        console.error(`[RepairOrderController Error] Falla al despachar endpoint: ${error.message}`);
        
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            message: error.message || 'Ocurrió un error interno en el servidor al consultar los productos.'
        });
    }
};