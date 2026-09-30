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
 * Recupera un comprobante de recepción específico junto con todo su detalle de válvulas.
 * @param {number} receiptId - Identificador único del comprobante.
 * @returns {Promise<Object|null>} Retorna el objeto del comprobante con su arreglo de productos, o null si no existe.
 * @throws {Error} Propaga errores de sintaxis o conexión del motor MySQL.
 */
exports.getReceiptById = async (receiptId) => {
    // Obtener el encabezado del comprobante y los datos del cliente asociado
    const headerQuery = `
        SELECT 
            CR.id_comprobante,
            CR.fecha_recepcion,
            CR.descripcion,
            C.id_cliente,
            C.nombre AS cliente_nombre,
            C.cuit AS cliente_cuit
        FROM ComprobanteRecepcion CR
        INNER JOIN Cliente C ON CR.id_cliente = C.id_cliente
        WHERE CR.id_comprobante = ?;
    `;

    // Obtener el detalle de los productos (válvulas) vinculados
    const detailsQuery = `
        SELECT 
            P.id_producto,
            P.estado,
            P.observaciones,
            MP.nombre AS nombre_modelo,
            TP.nombre AS nombre_tipo,
            EP.nombre AS nombre_estado
        FROM Producto P
        JOIN ModeloProducto MP ON P.modelo = MP.id_modelo
        JOIN TipoProducto TP ON MP.tipo = TP.id_tipo
        JOIN EstadoProducto EP ON P.estado = EP.id_estado
        WHERE P.id_comprobante_recepcion = ?;
    `;

    try {
        // Ejecutamos ambas consultas de lectura en paralelo para optimizar la latencia I/O
        const [headerResult, detailsResult] = await Promise.all([
            db.query(headerQuery, [receiptId]),
            db.query(detailsQuery, [receiptId])
        ]);

        const headerRows = headerResult[0];
        const detailRows = detailsResult[0];

        // Verificamos existencia
        if (headerRows.length === 0) {
            return null;
        }

        // Ensamblamos el objeto de negocio principal con su arreglo subordinado
        const receiptDetail = {
            ...headerRows[0],
            productos: detailRows // Arreglo de válvulas (puede estar vacío pero nunca será undefined)
        };

        return receiptDetail;

    } catch (error) {
        console.error(`[Receipt Model Error] Fallo al ejecutar getReceiptById(${receiptId}):`, error);
        throw error;
    }
}


/**
 * Actualiza de forma segura la información administrativa de un comprobante.
 * @param {number} receiptId - Identificador del comprobante a mutar.
 * @param {Object} updatedData - Objeto con los datos mutables autorizados.
 * @param {string} updatedData.fecha_recepcion - Nueva fecha de registro asignada.
 * @param {string} [updatedData.descripcion] - Nuevas observaciones del remito.
 * @returns {Promise<number>} Cantidad de filas afectadas por la actualización.
 */
exports.updateReceipt = async (receiptId, updatedData) => {
    const { fecha_recepcion, descripcion = null } = updatedData;

    const query = `
        UPDATE ComprobanteRecepcion 
        SET 
            fecha_recepcion = ?, 
            descripcion = ?
        WHERE id_comprobante = ?;
    `;

    try {
        const [result] = await db.query(query, [fecha_recepcion, descripcion, receiptId]);
        return result.affectedRows;
    } catch (error) {
        console.error(`[Receipt Model Error] Fallo al ejecutar updateReceiptMetadata para ID ${receiptId}:`, error);
        throw error;
    }
}