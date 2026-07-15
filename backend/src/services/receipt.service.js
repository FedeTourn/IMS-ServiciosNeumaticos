const { pool:db } = require('../config/db.config');
const Receipt = require('../models/Receipt');
const Product= require('../models/Product');

const ESTADO_PRODUCTO_RECIBIDO = 1; // Reemplazar por consulta a la tabla

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
    };


    /**
     * Recupera la estructura de datos completa de un comprobante para su visualización e impresión (REQ 23).
     * @param {number|string} receiptId - El identificador único del remito.
     * @returns {Promise<Object>} El objeto de dominio con el encabezado y sus productos asociados.
     * @throws {Error} Excepción HTTP 404 si el documento no existe en los registros.
     */
    static async getReceiptDetails(receiptId) {
        if (!receiptId || isNaN(receiptId)) {
            const error = new Error('Identificador de comprobante inválido o no proporcionado.');
            error.statusCode = 400; // Bad Request
            throw error;
        }

        const receipt = await Receipt.getReceiptById(receiptId);

        if (!receipt) {
            const error = new Error(`No se encontró un comprobante registrado bajo el número de documento #${receiptId}.`);
            error.statusCode = 404; // Not Found
            throw error;
        }

        return receipt;
    };

    /**
     * Actualiza los metadatos permitidos de un comprobante aplicando la Regla de Inmutabilidad Contable (REQ 24).
     * @param {number|string} receiptId - El identificador único del remito.
     * @param {Object} updateData - Estructura con los nuevos valores.
     * @param {string} updateData.fecha_recepcion - Fecha de ingreso a modificar.
     * @param {string} [updateData.descripcion] - Observaciones a modificar.
     * @returns {Promise<Object>} Objeto de confirmación de la mutación.
     * @throws {Error} Excepción HTTP 409 si el estado de los componentes impide la modificación.
     */
    static async updateReceipt(receiptId, updateData) {
        // Validamos la existencia y recuperamos el estado actual del dominio
        const currentReceipt = await this.getReceiptDetails(receiptId);

        // REGLA DE NEGOCIO CRÍTICA (Protección de Inmutabilidad)
        // Asumimos que '1' es la representación lógica del estado 'Recibido' (estado inicial).
        // Evaluamos si alguna de las válvulas asociadas ha migrado a un estado superior en la cadena de reparación.
        const hasAdvancedProducts = currentReceipt.productos.some(prod => String(prod.estado) !== '1');

        if (hasAdvancedProducts) {
            const error = new Error('Inmutabilidad Contable: No se puede modificar el comprobante porque una o más válvulas vinculadas ya han avanzado en el proceso de reparación en el taller.');
            error.statusCode = 409; // Conflict (Problema de estado con los recursos)
            throw error;
        }

        // Ejecutamos la mutación estrictamente sobre los metadatos autorizados
        const safePayload = {
            fecha_recepcion: updateData.fecha_recepcion,
            descripcion: updateData.descripcion
        };

        const affectedRows = await Receipt.updateReceipt(receiptId, safePayload);

        return {
            success: true,
            message: 'Los datos del comprobante han sido actualizados y auditados correctamente.',
            affectedRows
        };
    }
}

module.exports = ReceiptService;