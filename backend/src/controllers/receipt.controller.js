const ReceiptService = require('../services/receipt.service');

/**
 * Endpoint encargado de procesar y coordinar el alta unificada de un comprobante y sus productos.
 * @param {Object} req - Objeto de petición Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
exports.createReceipt = async (req, res) => {
    try {
        // Desestructuración defensiva para mitigar Mass Assignment
        const { id_cliente, descripcion, fecha_recepcion, ruta_imagen } = req.body.receiptData;
        const productsList = req.body.productsList;

        const receiptPayload = { id_cliente, descripcion, fecha_recepcion, ruta_imagen };

        // Invocación a la capa de Lógica de Negocio
        const result = await ReceiptService.registerReceiptWithProducts(receiptPayload, productsList);

        // Respuesta unificada exitosa conforme al estándar REST
        return res.status(201).json(result);

    } catch (error) {
        console.error(`[ReceiptController Error] Falla al despachar endpoint: ${error.message}`);
        
        // Manejo y mapeo semántico de excepciones de negocio
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            message: error.message || 'Ocurrió un error interno en el servidor al registrar el ingreso.'
        });
    }
};

/**
 * Obtiene el listado de comprobantes de recepción registrados aplicando criterios de filtrado dinámicos.
 * Mapea los parámetros de consulta provenientes de la URL (Query Params).
 * @param {Object} req - Objeto de petición Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
exports.getAllReceipts = async (req, res) => {

    try {
        // Extraer los parámetros de ordenamiento y filtro del query string
        const { search, id_cliente, fecha_desde, fecha_hasta, sort_by, sort_order } = req.query;

        // Construimos el objeto de filtros para la capa de servicio
        const filters = {
            search: search ? String(search).trim() : null,
            id_cliente: id_cliente ? parseInt(id_cliente, 10) : null,
            fecha_desde: fecha_desde ? String(fecha_desde) : null,
            fecha_hasta: fecha_hasta ? String(fecha_hasta) : null,
            sort_by: sort_by,
            sort_order: sort_order
        };

        const result = await ReceiptService.getAllReceipts(filters);

        res.status(200).json({
            success: true,
            data: result
        })
    } catch (error) {
        console.error(`[ReceiptController Error] Falla al resolver GET /api/receipts: ${error.message}`);
        
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            message: error.message || 'Error interno en el servidor al recuperar el listado de comprobantes.'
        });        
    }
    

}
