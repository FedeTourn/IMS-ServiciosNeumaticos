const { pool: db } = require('../config/db.config');

/**
 * Crea una nueva Orden de Reparación y vincula los productos masivamente en una transacción atómica.
 * @param {Object} orderData - Datos de cabecera de la orden.
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

/**
 * Consulta y recupera el listado completo de órdenes de reparación aplicando
 * criterios dinámicos de filtrado y ordenamiento en la capa de datos.
 *
 * @param {Object} queryCriteria - Objeto con los parámetros de búsqueda y ordenamiento.
 * @returns {Promise<Array<Object>>} Promesa que resuelve al listado de órdenes mapeadas.
 * @throws {Error} Si ocurre un fallo en la ejecución de la sentencia SQL.
 */
exports.findAll = async (queryCriteria = {}) => {

    const SORT_COLUMN_MAP = {
        orden_reparacion: 'id_orden_reparacion',
        fecha_creacion: 'fecha_creacion',
        fecha_cierre: 'fecha_cierre',
        cliente_nombre: 'cliente_nombre',
        importe_total: 'importe_total',
        estado_orden: 'estado_orden'
    };

    const {
        id_orden_reparacion,
        id_cliente,
        estado,
        sort_by,
        sort_order
    } = queryCriteria;

    let query = `
        SELECT 
            o.id_orden_reparacion,
            o.fecha_creacion,
            o.fecha_cierre,
            c.nombre AS cliente_nombre,
            o.id_cliente,
            o.importe_total,
            e.nombre AS estado_orden
        FROM OrdenReparacion o
        INNER JOIN Cliente c ON o.id_cliente = c.id_cliente
        INNER JOIN EstadoOrdenReparacion e ON o.id_estado_orden = e.id_estado_orden
    `;


    const conditions = [];
    const values = [];


    // Se utiliza CAST para permitir búsquedas con LIKE sobre una columna de tipo INT
    if (id_orden_reparacion !== undefined && id_orden_reparacion !== null && id_orden_reparacion !== '') {
        conditions.push(`CAST(o.id_orden_reparacion AS CHAR) LIKE ?`);
        values.push(`%${id_orden_reparacion}%`);
    }

    if (id_cliente) {
        conditions.push(`o.id_cliente = ?`);
        values.push(id_cliente);
    }

    if (estado) {
        conditions.push(`e.nombre = ?`);
        values.push(estado);
    }

    if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
    }

    const sorter = SORT_COLUMN_MAP[sort_by] || SORT_COLUMN_MAP.fecha_creacion;

    const sortDirection = (sort_order === 'ASC') ? 'ASC' : 'DESC';
    
    query += ` ORDER BY ${sorter} ${sortDirection}`;

    try {
        const [rows] = await db.execute(query, values);
        return rows;
    } catch (error) {
        console.error("[RepairOrderModel Error] Fallo al ejecutar findAll: ", error);
        throw error;
    }
};

/**
 * Recupera el detalle completo de una orden de reparación (Maestro-Detalle).
 * Ejecuta consultas paralelas para optimizar la latencia I/O.
 * 
 * @param {number|string} id - Identificador único de la orden de reparación.
 * @returns {Promise<Object|null>} Retorna el objeto de la orden con su arreglo de productos, o null si no existe.
 * @throws {Error} Propaga errores de sintaxis o conexión del motor MySQL.
 */
exports.findById = async (id) => {
    const headerQuery = `
        SELECT 
            O.id_orden_reparacion,
            O.id_estado_orden,
            EOR.nombre AS estado_orden_nombre,
            O.fecha_cierre,
            O.importe_total,
            O.observaciones,
            C.id_cliente,
            C.nombre AS cliente_nombre,
            C.cuit AS cliente_cuit,
            C.direccion AS cliente_direccion
        FROM OrdenReparacion O
        INNER JOIN Cliente C ON O.id_cliente = C.id_cliente
        INNER JOIN EstadoOrdenReparacion EOR ON O.id_estado_orden = EOR.id_estado_orden
        WHERE O.id_orden_reparacion = ?;
    `;

    const detailsQuery = `
        SELECT 
            P.id_producto,
            MP.nombre AS modelo_nombre,
            MP.id_modelo AS id_modelo,
            TP.nombre AS tipo_nombre,
            EP.nombre AS producto_estado_nombre,
            P.fecha_recepcion,
            P.precio AS precio_final

        FROM Producto P
        INNER JOIN ModeloProducto MP ON P.modelo = MP.id_modelo
        INNER JOIN TipoProducto TP ON MP.tipo = TP.id_tipo
        INNER JOIN EstadoProducto EP ON P.estado = EP.id_estado
        WHERE P.id_orden_reparacion = ?;
    `;

    try {
        const [headerResult, detailsResult] = await Promise.all([
            db.query(headerQuery, [id]),
            db.query(detailsQuery, [id])
        ]);

        const headerRows = headerResult[0];
        const detailRows = detailsResult[0];

        if (headerRows.length === 0) {
            return null;
        }

        const repairOrderDetail = {
            ...headerRows[0],
            productos: detailRows
        };

        return repairOrderDetail;

    } catch (error) {
        console.error(`[RepairOrder Model Error] Fallo al ejecutar findById(${id}):`, error);
        throw error;
    }
};