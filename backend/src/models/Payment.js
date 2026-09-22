/**
 * @file Payment.js
 * @description Modelo de acceso a datos (DAO) para los catálogos maestros del módulo de pagos.
 * Mapea las consultas directas contra las tablas EstadoPago y MedioPago usando CommonJS.
 */

const { pool: db } = require('../config/db.config');

/**
 * Consulta la totalidad de registros de la tabla maestra EstadoPago ordenados por identificador.
 * @returns {Promise<Array<Object>>} Colección completa de estados de pago.
 */
exports.findAllStates = async () => {
    const query = `
        SELECT id_estado_pago, nombre
        FROM EstadoPago
        ORDER BY id_estado_pago ASC;
    `;

    try {
        const [rows] = await db.query(query);
        return rows;
    } catch (error) {
        console.error("Error en Payment.findAllStates:", error);
        throw new Error("Error en la capa de datos al consultar los estados de pago.");
    }
};

/**
 * Consulta la totalidad de registros de la tabla maestra MedioPago junto con sus banderas operativas.
 * @returns {Promise<Array<Object>>} Colección completa de medios de pago.
 */
exports.findAllMethods = async () => {
    const query = `
        SELECT id_medio_pago, nombre, es_diferido
        FROM MedioPago
        ORDER BY id_medio_pago ASC;
    `;

    try {
        const [rows] = await db.query(query);
        return rows;
    } catch (error) {
        console.error("Error en Payment.findAllMethods:", error);
        throw new Error("Error en la capa de datos al consultar los medios de pago.");
    }
};

/**
 * Busca un estado de pago puntual por su identificador, para soportar validaciones de integridad referencial.
 * @param {number} idEstadoPago - Identificador único de la entidad EstadoPago.
 * @returns {Promise<Object|null>} Registro del estado de pago o null si no existe.
 */
exports.findStateById = async (idEstadoPago) => {
    const query = `
        SELECT id_estado_pago, nombre
        FROM EstadoPago
        WHERE id_estado_pago = ?
        LIMIT 1;
    `;

    try {
        const [rows] = await db.query(query, [idEstadoPago]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("Error en Payment.findStateById:", error);
        throw new Error("Error en la capa de datos al buscar el estado de pago.");
    }
};

/**
 * Busca un medio de pago puntual por su identificador, para soportar validaciones de integridad referencial.
 * @param {number} idMedioPago - Identificador único de la entidad MedioPago.
 * @returns {Promise<Object|null>} Registro del medio de pago o null si no existe.
 */
exports.findMethodById = async (idMedioPago) => {
    const query = `
        SELECT id_medio_pago, nombre, es_diferido
        FROM MedioPago
        WHERE id_medio_pago = ?
        LIMIT 1;
    `;

    try {
        const [rows] = await db.query(query, [idMedioPago]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("Error en Payment.findMethodById:", error);
        throw new Error("Error en la capa de datos al buscar el medio de pago.");
    }
};

/**
 * Consulta el historial de pagos aplicando filtrado multicriterio dinámico bajo lógica acumulativa
 * (AND) mediante sentencias preparadas. Realiza los cruzamientos relacionales con Cliente, EstadoPago
 * y MedioPago para retornar registros hidratados y legibles, ordenados de más reciente a más antiguo.
 * @param {Object} [filters={}] - Criterios opcionales de búsqueda ya validados por el Service.
 * @param {number|null} [filters.id_pago] - Número interno del pago (coincidencia exacta).
 * @param {number|null} [filters.id_cliente] - Identificador del cliente asociado.
 * @param {number|null} [filters.id_estado_pago] - Identificador del estado de pago.
 * @param {number|null} [filters.id_medio_pago] - Identificador del medio de pago.
 * @param {number|null} [filters.monto] - Importe exacto del pago.
 * @param {number|null} [filters.monto_min] - Límite inferior del rango de importes.
 * @param {number|null} [filters.monto_max] - Límite superior del rango de importes.
 * @param {string|null} [filters.fecha_desde] - Límite temporal inferior de `fecha_pago` (YYYY-MM-DD).
 * @param {string|null} [filters.fecha_hasta] - Límite temporal superior de `fecha_pago` (YYYY-MM-DD).
 * @param {string|null} [filters.numero_comprobante] - Comprobante externo (coincidencia parcial, LIKE).
 * @param {string|null} [filters.creacion_desde] - Límite inferior de `fecha_creacion` (YYYY-MM-DD).
 * @param {string|null} [filters.creacion_hasta] - Límite superior de `fecha_creacion` (YYYY-MM-DD).
 * @param {string|null} [filters.actualizacion_desde] - Límite inferior de `fecha_actualizacion` (YYYY-MM-DD).
 * @param {string|null} [filters.actualizacion_hasta] - Límite superior de `fecha_actualizacion` (YYYY-MM-DD).
 * @returns {Promise<Array<Object>>} Colección de pagos coincidentes con sus entidades relacionadas.
 */
exports.findAll = async (filters = {}) => {

    const {
        id_pago,
        id_cliente,
        id_estado_pago,
        id_medio_pago,
        monto,
        monto_min,
        monto_max,
        fecha_desde,
        fecha_hasta,
        numero_comprobante,
        creacion_desde,
        creacion_hasta,
        actualizacion_desde,
        actualizacion_hasta
    } = filters;

    const conditions = [];
    const values = [];

    let query = `
        SELECT
            P.id_pago,
            P.id_cliente,
            C.nombre AS cliente_nombre,
            C.cuit AS cliente_cuit,
            P.id_estado_pago,
            EP.nombre AS estado_pago_nombre,
            P.id_medio_pago,
            MP.nombre AS medio_pago_nombre,
            P.monto,
            P.fecha_pago,
            P.numero_comprobante,
            P.observaciones,
            P.fecha_creacion,
            P.fecha_actualizacion
        FROM Pago P
        INNER JOIN Cliente C ON P.id_cliente = C.id_cliente
        INNER JOIN EstadoPago EP ON P.id_estado_pago = EP.id_estado_pago
        INNER JOIN MedioPago MP ON P.id_medio_pago = MP.id_medio_pago
    `;

    // Filtrado exacto por número interno de pago
    if (id_pago) {
        conditions.push(`P.id_pago = ?`);
        values.push(id_pago);
    }

    // Filtrado exacto por Cliente
    if (id_cliente) {
        conditions.push(`P.id_cliente = ?`);
        values.push(id_cliente);
    }

    // Filtrado exacto por Estado de Pago
    if (id_estado_pago) {
        conditions.push(`P.id_estado_pago = ?`);
        values.push(id_estado_pago);
    }

    // Filtrado exacto por Medio de Pago
    if (id_medio_pago) {
        conditions.push(`P.id_medio_pago = ?`);
        values.push(id_medio_pago);
    }

    // Importe exacto o rango de importes
    if (monto !== null && monto !== undefined) {
        conditions.push(`P.monto = ?`);
        values.push(monto);
    }
    if (monto_min !== null && monto_min !== undefined) {
        conditions.push(`P.monto >= ?`);
        values.push(monto_min);
    }
    if (monto_max !== null && monto_max !== undefined) {
        conditions.push(`P.monto <= ?`);
        values.push(monto_max);
    }

    // Rango de Fechas de emisión del cobro
    if (fecha_desde) {
        conditions.push(`DATE(P.fecha_pago) >= ?`);
        values.push(fecha_desde);
    }
    if (fecha_hasta) {
        conditions.push(`DATE(P.fecha_pago) <= ?`);
        values.push(fecha_hasta);
    }

    // Filtrado por comprobante externo (coincidencia parcial)
    if (numero_comprobante) {
        conditions.push(`P.numero_comprobante LIKE ?`);
        values.push(`%${numero_comprobante}%`);
    }

    // Rango cronológico de creación del registro
    if (creacion_desde) {
        conditions.push(`DATE(P.fecha_creacion) >= ?`);
        values.push(creacion_desde);
    }
    if (creacion_hasta) {
        conditions.push(`DATE(P.fecha_creacion) <= ?`);
        values.push(creacion_hasta);
    }

    // Rango cronológico de última actualización del registro
    if (actualizacion_desde) {
        conditions.push(`DATE(P.fecha_actualizacion) >= ?`);
        values.push(actualizacion_desde);
    }
    if (actualizacion_hasta) {
        conditions.push(`DATE(P.fecha_actualizacion) <= ?`);
        values.push(actualizacion_hasta);
    }

    // Ensamble de condiciones WHERE
    if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
    }

    // Ordenamiento descendente por defecto para priorizar los registros más recientes
    query += ` ORDER BY P.fecha_pago DESC, P.id_pago DESC;`;

    try {
        const [rows] = await db.query(query, values);
        return rows;
    } catch (error) {
        console.error("Error en Payment.findAll:", error);
        throw new Error("Error en la capa de datos al consultar los pagos.");
    }
};

/**
 * Inserta un nuevo registro de pago en la tabla Pago. Soporta la inyección explícita de una
 * conexión transaccional para garantizar atomicidad en operaciones compuestas; en su ausencia,
 * utiliza el pool general de conexiones.
 * @param {Object} paymentData - Datos del pago a persistir.
 * @param {number} paymentData.id_cliente - Identificador del cliente asociado.
 * @param {number} paymentData.id_estado_pago - Identificador del estado inicial del pago.
 * @param {number} paymentData.id_medio_pago - Identificador del medio de pago utilizado.
 * @param {number} paymentData.monto - Importe del pago (estrictamente positivo).
 * @param {Date|string} paymentData.fecha_pago - Fecha y hora de la transacción.
 * @param {string} [paymentData.numero_comprobante] - Número de comprobante de respaldo (opcional).
 * @param {string} [paymentData.observaciones] - Observaciones adicionales (opcional).
 * @param {Object} [connection=null] - Conexión transaccional inyectada por el Service (opcional).
 * @returns {Promise<number>} Identificador (`insertId`) del registro de pago creado.
 */
exports.create = async (paymentData, connection = null) => {
    const executor = connection || db;

    const query = `
        INSERT INTO Pago
        (id_cliente, id_estado_pago, id_medio_pago, monto, fecha_pago, numero_comprobante, observaciones)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    `;

    try {
        const [result] = await executor.execute(query, [
            paymentData.id_cliente,
            paymentData.id_estado_pago,
            paymentData.id_medio_pago,
            paymentData.monto,
            paymentData.fecha_pago,
            paymentData.numero_comprobante || null,
            paymentData.observaciones || null
        ]);
        return result.insertId;
    } catch (error) {
        console.error("Error en Payment.create:", error);
        throw new Error("Error en la capa de datos al registrar el pago.");
    }
};
