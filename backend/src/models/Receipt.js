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