const PriceService = require('../services/price.service');

/**
 * Retorna la matriz completa de tarifas activas.
 * @route GET /api/prices
 */
exports.getAllPrices = async (req, res) => {
    try {
        const prices = await PriceService.getAllPrices();
        return res.status(200).json(prices);
    } catch (error) {
        console.error("Error en price.controller.getAllPrices:", error);
        return res.status(500).json({ 
            error: "Error interno del servidor al recuperar el catálogo de precios." 
        });
    }
};

/**
 * Busca y retorna la tarifa sugerida para una combinación de modelo y categoría.
 * @route GET /api/prices/suggested?modelo=X&categoria=Y
 */
exports.getSuggestedPrice = async (req, res) => {
    try {
        const { modelo, categoria } = req.query;

        // Validación estructural básica
        if (!modelo || !categoria) {
            return res.status(400).json({ 
                error: "Los parámetros 'modelo' y 'categoria' son obligatorios en la URL." 
            });
        }

        const priceRow = await PriceService.getSuggestedPrice(Number(modelo), Number(categoria));
        return res.status(200).json(priceRow);

    } catch (error) {
        // Manejo semántico de errores de negocio
        if (error.message.includes('No existe una tarifa')) {
            return res.status(404).json({ error: error.message });
        }
        
        console.error("Error en price.controller.getSuggestedPrice:", error);
        return res.status(500).json({ 
            error: "Error interno del servidor al calcular el precio sugerido." 
        });
    }
};

/**
 * Procesa un lote masivo de actualizaciones de precios de forma transaccional.
 * @route POST /api/prices/bulk
 */
exports.updateBulkPrices = async (req, res) => {
    try {
        const { updates } = req.body;

        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({ 
                error: "El cuerpo de la petición debe contener un arreglo 'updates'." 
            });
        }

        const result = await PriceService.updatePriceBatch(updates);
        return res.status(200).json(result);

    } catch (error) {
        // Errores de validación de negocio se mapean a 400
        if (error.message.includes('Datos inválidos') || error.message.includes('payload')) {
             return res.status(400).json({ error: error.message });
        }
        
        console.error("Error en price.controller.updateBulkPrices:", error);
        return res.status(500).json({ 
            error: "Error interno del servidor al procesar el lote de precios." 
        });
    }
};