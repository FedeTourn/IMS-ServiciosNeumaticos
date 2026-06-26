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
}
