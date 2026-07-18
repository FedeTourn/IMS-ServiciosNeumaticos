/**
 * @fileoverview Middleware de validación para las peticiones de Comprobantes de Recepción.
 */

/**
 * Valida la estructura sintáctica del payload para el registro de un comprobante y sus productos.
 * @param {Object} req - Objeto de petición Express.
 * @param {Object} res - Objeto de respuesta Express.
 * @param {Function} next - Siguiente middleware en la cadena.
 */
exports.validateCreateReceipt = async (req, res, next) => {
    const { receiptData, productsList } = req.body;

    if (!receiptData || !receiptData.id_cliente) {
        return res.status(400).json({
            success: false,
            message: 'Parámetro estructurado invalido: receiptData debe contener obligatoriamente el id_cliente.'
        });
    }

    if (!productsList || !Array.isArray(productsList) || productsList.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Parámetro masivo inválido: productsList debe ser un arreglo no vacío de válvulas.'
        });
    }

    // Validación interna de los atributos mínimos de cada producto
    for (const [index, product] of productsList.entries()) {
        if (!product.modelo || product.modelo.trim() === '') {
            return res.status(400).json({
                success: false,
                message: `Error en elemento [${index}]: El campo 'modelo' de la válvula es obligatorio.`
            });
        }
    }

    next();
}