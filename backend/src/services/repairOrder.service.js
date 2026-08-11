const { pool: db } = require('../config/db.config');
const RepairOrder = require('../models/RepairOrder');
const Product = require('../models/Product');

const ESTADO_PRODUCTO_REPARADO = 3; // Reemplazar por consulta a la tabla

/**
 * Servicio encargado de la lógica de negocio de las Órdenes de Reparación.
 */
class RepairOrderService {
    
    /**
     * Orquesta la creación de una Orden de Reparación y la actualización atómica
     * de los productos vinculados.
     * @param {Object} dto - Data Transfer Object proveniente del controlador.
     * @returns {Promise<Object>} - Resultado de la operación.
     */
    static async createRepairOrder(dto) {

        // Validaciones iniciales (Reglas de negocio)
        if (!dto.items || dto.items.length === 0) {
            const error = new Error('No se puede registrar una Orden de reparación sin asociar al menos una válvula.');
            error.statusCode = 400;
            throw error;
        }

        // Definir estado lógico (1 = Abierta, 2 = Cerrada) según el payload
        const id_estado_orden = dto.es_cerrada ? 2 : 1; 
        const fecha_cierre = dto.es_cerrada ? new Date() : null;

        // Calcular el importe total sumando los precios finales enviados en el DTO
        const importe_total = dto.items.reduce((acc, item) => acc + Number(item.precio_final), 0);

        // 2. Solicitar conexión para la Transacción
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Crear la Orden (Capa de Datos)
            const orderData = {
                id_cliente: dto.id_cliente,
                id_estado_orden: id_estado_orden,
                importe_total: importe_total,
                observaciones: dto.observaciones,
                fecha_cierre: fecha_cierre
            };
            
            // Pasamos 'connection' al modelo
            const newOrderId = await RepairOrder.create(orderData, connection);

            // Actualizar masivamente los Productos vinculados
            const updatePromises = dto.items.map(item => {
                // Si la orden se crea, la válvula pasa a "Reparado" (ID estado 3).
                const nuevo_estado = ESTADO_PRODUCTO_REPARADO; 

                const updateData = {
                    id_orden_reparacion: newOrderId,
                    precio_final: item.precio_final,
                    nuevo_estado: nuevo_estado
                };

                // Delegamos la mutación al modelo Product, pasándole la misma 'connection'
                return Product.updateForRepairOrder(item.id_producto, updateData, connection);
            });

            await Promise.all(updatePromises);

            // Consolidar transacción
            await connection.commit();

            return { 
                success: true, 
                message: "Orden de reparación creada exitosamente",
                id_orden_reparacion: newOrderId 
            };

        } catch (error) {
            // Ante cualquier fallo en el lote de ejecución, revertimos los cambios para evitar datos huérfanos
            await connection.rollback();

            // Log técnico interno para auditoría del servidor
            console.error(`[RepairOrderService Error] Transacción abortada de manera segura. Razón: ${error.message}`);
            
            // Propagación limpia del error hacia la capa de exposición (Controlador)
            throw error;

        } finally {

            // Liberar la conexión
            connection.release();
        }
    }

    /**
     * Recupera y procesa el historial de órdenes de reparación aplicando filtros y ordenamiento seguro.
     * * Este método valida los parámetros de entrada provenientes de la capa de presentación
     * antes de delegar la ejecución a la capa de acceso a datos, garantizando la integridad
     * estructural y previniendo inyecciones o fallos por tipos de datos incorrectos.
     * @param {Object} filters - Criterios opcionales de búsqueda e inclusión.
     * @param {string|number|null} [filters.id_orden_reparacion] - Identificador parcial de la orden para búsqueda.
     * @param {number|null} [filters.id_cliente] - Identificador único de un cliente para filtrado directo.
     * @param {string|null} [filters.estado] - Estado de la orden (ej. 'Abierta', 'Cerrada', 'Entregada').
     * @param {string} [filters.sort_by='fecha_creacion'] - Concepto base para ordenar la grilla de datos.
     * @param {string} [filters.sort_order='DESC'] - Sentido del ordenamiento ('ASC' o 'DESC').
     * @returns {Promise<Array<Object>>} Retorna la lista de órdenes procesadas.
     * @throws {Error} Propaga excepciones lógicas o de base de datos capturadas.
     */
    static async getRepairOrders(filters = {}) {

        const {
            id_orden_reparacion = null,
            id_cliente = null,
            estado = null,
            sort_by = null,
            sort_order = 'DESC'
        } = filters;

        let sanitizedIdOrden = id_orden_reparacion;
        if (sanitizedIdOrden !== null && sanitizedIdOrden !== undefined && sanitizedIdOrden !== '') {
            sanitizedIdOrden = String(sanitizedIdOrden).trim().replace(/^0+/, '');
        }

        const allowedSortColumns = [
            'id_orden_reparacion', 
            'fecha_creacion', 
            'fecha_cierre', 
            'cliente', 
            'importe_total', 
            'estado'
        ];
        const allowedSortOrders = ['ASC', 'DESC'];
        
        // Validación de Lista Blanca (Whitelisting) para sanitizar el ordenamiento
        const validatedSortBy = allowedSortColumns.includes(sort_by) ? sort_by : 'fecha_creacion';
        // Se previene un posible error si sort_order viene como null o undefined evaluando con fallback
        const validatedSortOrder = allowedSortOrders.includes(sort_order?.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';
        
        try {
            const queryCriteria = {
                id_orden_reparacion: sanitizedIdOrden,
                id_cliente,
                estado,
                sort_by: validatedSortBy,
                sort_order: validatedSortOrder
            };

            return await RepairOrder.findAll(queryCriteria);

        } catch (error) {
            console.error(`[RepairOrderService Error] Falla en subproceso getRepairOrders: ${error.message}`);
            // Propagación limpia hacia el controlador REST
            throw error;
        }
    }

    static async getProductPricesByClient(id_cliente) {
        const products = await Product.findProductPricesByClient(id_cliente);
        return products;
    }

    static async getRepairOrderById(id) {
        const rawOrder = await RepairOrder.findById(id);

        if (!rawOrder) {
            const error = new Error(`No se encontró ninguna orden de reparación asociada al identificador #${id}.`);
            error.statusCode = 404;
            throw error;
        }

        return {
            id_orden_reparacion: rawOrder.id_orden_reparacion,
            id_estado_orden: rawOrder.id_estado_orden,
            estado_nombre: rawOrder.estado_orden_nombre,
            fecha_cierre: rawOrder.fecha_cierre,
            importe_total: Number(rawOrder.importe_total),
            observaciones: rawOrder.observaciones,
            cliente: {
                id_cliente: rawOrder.id_cliente,
                nombre: rawOrder.cliente_nombre,
                cuit: rawOrder.cliente_cuit,
                direccion: rawOrder.cliente_direccion
            },
            productos: rawOrder.productos.map(p => ({
                id_producto: p.id_producto,
                id_modelo: p.id_modelo,
                modelo_nombre: p.modelo_nombre,
                tipo_nombre: p.tipo_nombre,
                estado_nombre: p.producto_estado_nombre,
                fecha_recepcion: p.fecha_recepcion,
                precio_final: Number(p.precio_final)
            }))
        };
    }
    

}

module.exports = RepairOrderService;