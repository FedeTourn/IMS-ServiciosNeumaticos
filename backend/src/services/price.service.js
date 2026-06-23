const PriceCategory = require('../models/PriceCategory');
const { pool: db } = require('../config/db.config');

class PriceService {

    /**
     * Obtiene la matriz completa de precios vigentes mapeada con descripciones.
     * Resuelve el Requerimiento 1 de administración.
     * @function getAllPrices
     * @returns {Promise<Array<Object>>} Listado de relaciones comerciales con tarifas activas.
     */
    static async getAllPrices(){
        const prices = await PriceCategory.findAllActive();
        return prices;
    }

    
    /**
     * Busca y valida la existencia de una tarifa sugerida activa para un producto en un turno.
     * Resuelve la inyección automática en órdenes de reparación.
     * @function getSuggestedPrice
     * @param {number} idModelo - Identificador del modelo de la pieza/válvula.
     * @param {number} idCategoria - Identificador de la categoría asignada al cliente.
     * @returns {Promise<Object>} Objeto con el escalar de precio correspondiente.
     * @throws {Error} Si no se encuentra una tarifa parametrizada para la combinación dada.
     */
    static async getSuggestedPrice(idModelo, idCategoria){
        if (!idModelo || !idCategoria) {
            throw new Error("Parámetros inválidos: idModelo e idCategoria son obligatorios.");
        }

        const priceRow = await PriceCategory.findSuggestedPrice(idModelo, idCategoria);
        
        if (!priceRow) {
            throw new Error("No existe una tarifa activa parametrizada para este modelo y categoría de cliente.");
        }

        return priceRow;
    };


    /**
     * Registra una nueva tarifa inmutable controlando la consistencia mediante una transacción ACID.
     * Ejecuta la invalidación cronológica del precio precedente e inserta el nuevo escalar activo.
     * @function updatePriceList
     * @param {number} idModelo - Identificador del modelo de producto.
     * @param {number} idCategoria - Identificador de la categoría del cliente.
     * @param {number} nuevoPrecio - Valor numérico de la nueva tarifa a asignar.
     * @returns {Promise<Object>} Objeto indicando el éxito de la transacción relacional.
     * @throws {Error} Excepción de negocio si falla la consistencia o las validaciones comerciales.
     */
    static async updatePriceList(idModelo, idCategoria, nuevoPrecio){
        // Validación inicial de lógica de negocio
        if (!idModelo || !idCategoria || nuevoPrecio === undefined || nuevoPrecio === null) {
            throw new Error("Datos de payload incompletos para actualizar la lista de precios.");
        }

        const precioParsed = parseFloat(nuevoPrecio);
        if (isNaN(precioParsed) || precioParsed < 0) {
            throw new Error("El precio suministrado debe ser un valor numérico positivo válido.");
        }

        // Obtención de una conexión dedicada del pool para aislamiento transaccional
        const connection = await db.getConnection();

        try {
            // Inicializar bloque transaccional
            await connection.beginTransaction();

            // 1. Invalidar la vigencia del precio precedente (pasa vigente = NULL y setea vigencia_hasta)
            await PriceCategory.invalidatePrice(idModelo, idCategoria, connection);

            // 2. Consolidar el nuevo registro inmutable en el histórico (vigente = 1 por defecto)
            const newInsertId = await PriceCategory.insertPrice(idModelo, idCategoria, precioParsed, connection);

            // Confirmar los cambios si ambas operaciones fueron exitosas
            await connection.commit();

            return {
                success: true,
                message: "Lista de precios actualizada correctamente con trazabilidad histórica.",
                id_precio: newInsertId
            };

        } catch (error) {
            // Ante cualquier anomalía técnica o de negocio, revertimos los estados
            await connection.rollback();
            console.error("Transacción abortada en price.service.updatePriceList:", error);
            throw new Error(`Fallo transaccional al actualizar la tarifa: ${error.message}`);
        } finally {
            // Liberar obligatoriamente la conexión para no agotar el pool
            connection.release();
        }
    };

    /**
     * Actualiza masivamente un lote de precios, garantizando consistencia ACID.
     * Si una sola actualización falla, se revierte el lote completo.
     * @async
     * @function updatePriceBatch
     * @param {Array<Object>} priceUpdates - Array de objetos { idModelo, idCategoria, nuevoPrecio }.
     * @returns {Promise<Object>} Resumen de la operación.
     */
    static async updatePriceBatch(priceUpdates){
        if (!Array.isArray(priceUpdates) || priceUpdates.length === 0) {
            throw new Error("El payload debe ser un array válido con al menos una actualización.");
        }

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            let procesados = 0;

            // Iteramos secuencialmente para respetar el pool de la conexión
            for (const update of priceUpdates) {
                const { idModelo, idCategoria, nuevoPrecio } = update;

                // 1. Validaciones por cada item
                const precioParsed = parseFloat(nuevoPrecio);
                if (!idModelo || !idCategoria || isNaN(precioParsed) || precioParsed < 0) {
                    throw new Error(`Datos inválidos en el lote para modelo ${idModelo} y categoría ${idCategoria}.`);
                }

                // 2. Invalidar precio actual
                await PriceCategory.invalidatePrice(idModelo, idCategoria, connection);

                // 3. Insertar nuevo histórico
                await PriceCategory.insertPrice(idModelo, idCategoria, precioParsed, connection);
                
                procesados++;
            }

            // Si el loop termina sin errores, confirmamos TODO el bloque
            await connection.commit();

            return {
                success: true,
                message: `Se actualizaron correctamente ${procesados} tarifas de forma transaccional.`,
                count: procesados
            };

        } catch (error) {
            // Falla uno, fallan todos. Rollback global.
            await connection.rollback();
            console.error("Transacción abortada en updatePriceBatch:", error);
            throw new Error(`Fallo en actualización masiva: ${error.message}`);
        } finally {
            connection.release();
        }
    };

}

module.exports = PriceService;