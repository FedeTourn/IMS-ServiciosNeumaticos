const { pool:db } = require('../config/db.config');
const Receipt = require('../models/Receipt')

class ReceiptService {

    static async registerReceiptWithProducts(receiptPayload, productsList) {
        // Validación de regla de negocio previa a la transacción
        if (!productsList || productsList.length === 0) {
            const error = new Error('No se puede registrar un comprobante de recepción sin asociar al menos una válvula.');
            error.statusCode = 400;
            throw error;
        }
        // Adquisición explícita de un cliente del pool para soporte de transacciones ACID
        const connection = await db.getConnection();

        try {
            const Product= require('../models/Product'); // Importamos el modelo de productos centralizado

            // Inicialización de la transacción atómica
            await connection.beginTransaction();

            // Inserción del encabezado del comprobante de recepción
            const receiptId = await Receipt.insertReceipt(connection, receiptPayload);            

            // Creacion de los productos uno a uno en paralelo usando su propia lógica
            const productPromises = productsList.map(product => {
                return Product.create(connection, {
                    ...product,
                    id_comprobante_recepcion: receiptId,
                    id_cliente: receiptPayload.id_cliente,
                    fecha_recepcion: receiptPayload.fecha_recepcion,
                    estado: 1 // Forzado por regla de negocio
                });
            });

            // Promise.all asegura que se ejecuten todos dentro de la misma transacción
            await Promise.all(productPromises);

            // Si los pasos previos son válidos, consolidamos los cambios de forma permanente
            await connection.commit();

            return {
                success: true,
                id_comprobante: receiptId,
                productos_registrados: productPromises.length
            };
            
        } catch (error) {
            // Ante cualquier fallo en el lote de ejecución, revertimos los cambios para evitar datos huérfanos
            await connection.rollback();
            
            // Log técnico interno para auditoría del servidor
            console.error(`[ReceiptService Error] Transacción abortada de manera segura. Razón: ${error.message}`);
            
            // Propagación limpia del error hacia la capa de exposición (Controlador)
            throw error;
            
        } finally {
            connection.release();
        }
    };


    /**
     * Recupera y procesa el historial de comprobantes de recepción aplicando filtros y ordenamiento seguro.
     * @param {Object} filters - Criterios opcionales de búsqueda e inclusión.
     * @param {string|null} [filters.search] - Texto para buscar coincidencias por nombre o CUIT de cliente.
     * @param {number|null} [filters.id_cliente] - Identificador único de un cliente para filtrado directo.
     * @param {string|null} [filters.fecha_desde] - Límite temporal inferior en formato ISO/string (YYYY-MM-DD).
     * @param {string|null} [filters.fecha_hasta] - Límite temporal superior en formato ISO/string (YYYY-MM-DD).
     * @param {string} [filters.sort_by='fecha'] - Concepto base para ordenar la grilla de datos.
     * @param {string} [filters.sort_order='DESC'] - Sentido del ordenamiento ('ASC' o 'DESC').
     * @returns {Promise<Array<Object>>} Retorna la lista de comprobantes procesados con sus correspondientes agregaciones.
     * @throws {Error} Propaga excepciones lógicas o de base de datos capturadas.
     */
    static async getAllReceipts(filters = {}) {

        // Valores por defecto utilizando desestructuración limpia
        const {
            search = null,
            id_cliente = null,
            fecha_desde = null,
            fecha_hasta = null,
            sort_by = null,
            sort_order = 'DESC'
        } = filters;

        const allowedSortColumns = ['fecha', 'id', 'cliente'];
        const allowedSortOrders = ['ASC', 'DESC'];
        
        
        const validatedSortBy = allowedSortColumns.includes(sort_by) ? sort_by : 'fecha';
        const validatedSortOrder = allowedSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';
        
        try {
            const queryCriteria = {
                search,
                id_cliente,
                fecha_desde,
                fecha_hasta,
                sort_by: validatedSortBy,
                sort_order: validatedSortOrder
            };

            return Receipt.findReceiptsByCriteria(queryCriteria);

        } catch (error) {
            console.error(`[ReceiptService Error] Falla en subproceso getAllReceipts: ${error.message}`);
            // Propagación limpia hacia el controlador REST
            throw error;
        }
    }
}

module.exports = ReceiptService;