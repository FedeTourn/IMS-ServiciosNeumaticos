// Importa el pool de conexiones de la base de datos
//const { pool: db } = require('../config/db.config');

/**
 * Crea una nueva Orden de Reparación y vincula los productos masivamente en una transacción atómica.
 * * @param {Object} orderData - Datos de cabecera de la orden.
 * @param {number} orderData.id_cliente - ID del cliente.
 * @param {number} orderData.id_estado_orden - ID del estado (ej. Abierta o Cerrada).
 * @param {string} [orderData.observaciones] - Observaciones generales (opcional).
 * @param {Date|null} [orderData.fecha_cierre] - Fecha de cierre si aplica (opcional).
 * @param {Array} items - Lista de productos a actualizar.
 * @param {number} items[].id_producto - ID del producto/válvula.
 * @param {number} items[].precio_final - Precio acordado/sugerido para esa válvula.
 * @param {number} items[].nuevo_estado - ID del nuevo estado al que transiciona la válvula.
 * @returns {Promise<number>} - Retorna el ID de la orden de reparación creada.
 * @throws {Error} - Lanza una excepción si la transacción falla, revirtiendo todos los cambios.
 */
exports.create = async (orderData, connection) => {
    
    const query = `
        INSERT INTO OrdenReparacion 
        (id_cliente, id_estado_orden, importe_total, observaciones, fecha_cierre) 
        VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(query, [
        orderData.id_cliente,
        orderData.id_estado_orden,
        orderData.importe_total,
        orderData.observaciones || null,
        orderData.fecha_cierre || null
    ]);

    return result.insertId;
    
};