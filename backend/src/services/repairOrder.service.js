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

    static async getProductPricesByClient(id_cliente) {
        const products = await Product.findProductPricesByClient(id_cliente); // Pasa las opciones al modelo
        return products;
    }
}

module.exports = RepairOrderService;