// Importa el pool de conexiones de la base de datos
const { pool:db } = require('../config/db.config'); 


/**
 * Inserta un nuevo registro de comprobante de recepción.
 * @param {Object} connection - Conexión activa de MySQL para resguardo transaccional.
 * @param {Object} receiptData - Datos del encabezado del comprobante.
 * @returns {Promise<number>} Retorna el ID autogenerado del comprobante.
 */
exports.insertReceipt = async (connection, receiptData) => {
    const { ruta_imagen = null, fecha_recepcion, descripcion = null, id_cliente } = receiptData;

    const query = `
        INSERT INTO ComprobanteRecepcion (ruta_imagen, fecha_recepcion, descripcion, id_cliente)
        VALUES (?, ?, ?, ?);
    `;
    
    const [result] = await connection.query(query, [ruta_imagen, fecha_recepcion, descripcion, id_cliente]);
    return result.insertId;

}

/**
 * Consulta el historial de comprobantes aplicando filtros dinámicos.
 * @param {Object} queryCriteria - Criterios de filtrado y ordenamiento ya sanitizados.
 * @returns {Promise<Array<Object>>} Listado de comprobantes optimizado para la UI.
 */
exports.findReceiptsByCriteria = async (queryCriteria) => {
    
    const SORT_COLUMN_MAP = {
        'fecha':   'fecha_recepcion',
        'id':      'id_comprobante',
        'cliente': 'id_cliente'
    };

    const { search, id_cliente, fecha_desde, fecha_hasta, sort_by, sort_order } = queryCriteria;

    const conditions = [];
    const values = [];

    let query = `
        SELECT 
            CR.id_comprobante,
            CR.fecha_recepcion,
            CR.descripcion,
            C.nombre AS cliente_nombre,
            C.cuit AS cliente_cuit
        FROM ComprobanteRecepcion CR
        INNER JOIN Cliente C ON CR.id_cliente = C.id_cliente
    `;

    // Filtrado dinámico por texto (LIKE)
    if (search) {
        conditions.push(`(C.nombre LIKE ? OR C.cuit LIKE ?)`);
        values.push(`%${search}%`, `%${search}%`);
    }

    // Filtrado exacto por Cliente
    if (id_cliente) {
        conditions.push(`CR.id_cliente = ?`);
        values.push(id_cliente);
    }

    // Rango de Fechas
    if (fecha_desde) {
        conditions.push(`DATE(CR.fecha_recepcion) >= ?`);
        values.push(fecha_desde);
    }
    if (fecha_hasta) {
        conditions.push(`DATE(CR.fecha_recepcion) <= ?`);
        values.push(fecha_hasta);
    }

    // Ensamble de condiciones WHERE
    if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
    }

    const sorter = SORT_COLUMN_MAP[sort_by];

    // Ordenamiento dinámico inyectado (Validado por Whitelisting en el Service)
    query += ` ORDER BY CR.${sorter} ${sort_order}`;

    try{
        const [rows] = await db.query(query, values);
        return rows;
    }catch{
        console.error("[Receipt Model Error] Fallo al ejecutar findReceiptsByCriteria:", error);
        throw error;
    }
}


/**
 * Inserta masivamente los nuevos productos (válvulas) asociados al comprobante.
 * @param {Object} connection - Conexión activa de MySQL para resguardo transaccional.
 * @param {number} receiptId - ID del comprobante recién generado.
 * @param {Array<Object>} productsList - Arreglo de objetos con los detalles de cada válvula.
 * @returns {Promise<number>} Cantidad de productos registrados en el ingreso.
 */
/* exports.insertBulkProducts = async (connection, receiptId, productsList) => {
    // MySQL soporta inserción masiva estructurando un arreglo de arreglos: [[val1, val2], [val1, val2]]
    const query = `
        INSERT INTO Producto (modelo, observaciones, estado, id_comprobante_recepcion, id_cliente, precio)
        VALUES ?;
    `;
    
    // Mapeamos los objetos del negocio al formato plano que requiere el driver mysql2 para bulk insert
    const values = productsList.map(product => [
        product.modelo,
        product.observaciones || null,
        1, // Estado forzado estricto por regla de negocio
        receiptId,
        product.id_cliente,
        product.precio || 0
    ]);
    
    const [result] = await connection.query(query, [values]);
    return result.affectedRows;
} */