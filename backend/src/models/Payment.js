/**
 * @file Payment.js
 * @description Modelo de acceso a datos (DAO) para los catálogos maestros del módulo de pagos.
 * Mapea las consultas directas contra las tablas EstadoPago, MedioPago y Banco usando CommonJS.
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
 * Consulta la totalidad de registros de la tabla maestra Banco ordenados alfabéticamente por nombre.
 * @returns {Promise<Array<Object>>} Colección completa de entidades bancarias.
 */
exports.findAllBanks = async () => {
    const query = `
        SELECT id_banco, nombre
        FROM Banco
        ORDER BY nombre ASC;
    `;

    try {
        const [rows] = await db.query(query);
        return rows;
    } catch (error) {
        console.error("Error en Payment.findAllBanks:", error);
        throw new Error("Error en la capa de datos al consultar los bancos.");
    }
};

/**
 * Busca una entidad bancaria puntual por su identificador, para soportar validaciones de integridad referencial.
 * @param {number} idBanco - Identificador único de la entidad Banco.
 * @returns {Promise<Object|null>} Registro del banco o null si no existe.
 */
exports.findBankById = async (idBanco) => {
    const query = `
        SELECT id_banco, nombre
        FROM Banco
        WHERE id_banco = ?
        LIMIT 1;
    `;

    try {
        const [rows] = await db.query(query, [idBanco]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("Error en Payment.findBankById:", error);
        throw new Error("Error en la capa de datos al buscar el banco.");
    }
};

/**
 * Busca una entidad bancaria por coincidencia exacta de nombre, para soportar la detección de
 * duplicados. La colación del esquema resuelve la equivalencia de mayúsculas y minúsculas.
 * @param {string} nombre - Nombre del banco ya normalizado por el Service.
 * @returns {Promise<Object|null>} Registro del banco homónimo o null si no existe.
 */
exports.findBankByName = async (nombre) => {
    const query = `
        SELECT id_banco, nombre
        FROM Banco
        WHERE nombre = ?
        LIMIT 1;
    `;

    try {
        const [rows] = await db.query(query, [nombre]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("Error en Payment.findBankByName:", error);
        throw new Error("Error en la capa de datos al buscar el banco por nombre.");
    }
};

/**
 * Inserta una nueva entidad bancaria en la tabla maestra Banco. Soporta la inyección explícita de
 * una conexión transaccional; en su ausencia, utiliza el pool general de conexiones.
 * @param {string} nombre - Nombre del banco ya normalizado por el Service.
 * @param {Object} [connection=null] - Conexión transaccional inyectada por el Service (opcional).
 * @returns {Promise<number>} Identificador (`insertId`) del banco creado.
 */
exports.createBank = async (nombre, connection = null) => {
    const executor = connection || db;

    const query = `
        INSERT INTO Banco (nombre)
        VALUES (?);
    `;

    try {
        const [result] = await executor.execute(query, [nombre]);
        return result.insertId;
    } catch (error) {
        console.error("Error en Payment.createBank:", error);
        throw new Error("Error en la capa de datos al registrar el banco.");
    }
};

/**
 * Consulta el historial de pagos aplicando filtrado multicriterio dinámico bajo lógica acumulativa
 * (AND) mediante sentencias preparadas. Realiza los cruzamientos relacionales con Cliente, EstadoPago
 * y MedioPago, y el cruzamiento externo con Banco (nulo en los cobros no diferidos), para retornar
 * registros hidratados y legibles, ordenados de más reciente a más antiguo.
 * @param {Object} [filters={}] - Criterios opcionales de búsqueda ya validados por el Service.
 * @param {number|null} [filters.id_pago] - Número interno del pago (coincidencia exacta).
 * @param {number|null} [filters.id_cliente] - Identificador del cliente asociado.
 * @param {number|null} [filters.id_estado_pago] - Identificador del estado de pago.
 * @param {number|null} [filters.id_medio_pago] - Identificador del medio de pago.
 * @param {number|null} [filters.id_banco] - Identificador del banco emisor (coincidencia exacta).
 * @param {number|null} [filters.monto] - Importe exacto del pago.
 * @param {number|null} [filters.monto_min] - Límite inferior del rango de importes.
 * @param {number|null} [filters.monto_max] - Límite superior del rango de importes.
 * @param {string|null} [filters.fecha_desde] - Límite temporal inferior de `fecha_recepcion` (YYYY-MM-DD).
 * @param {string|null} [filters.fecha_hasta] - Límite temporal superior de `fecha_recepcion` (YYYY-MM-DD).
 * @param {string|null} [filters.vencimiento_desde] - Límite inferior de `fecha_vencimiento` (YYYY-MM-DD).
 * @param {string|null} [filters.vencimiento_hasta] - Límite superior de `fecha_vencimiento` (YYYY-MM-DD).
 * @param {string|null} [filters.numero_comprobante] - Comprobante externo (coincidencia parcial, LIKE).
 * @param {string|null} [filters.creacion_desde] - Límite inferior de `fecha_creacion` (YYYY-MM-DD).
 * @param {string|null} [filters.creacion_hasta] - Límite superior de `fecha_creacion` (YYYY-MM-DD).
 * @param {string|null} [filters.actualizacion_desde] - Límite inferior de `fecha_actualizacion` (YYYY-MM-DD).
 * @param {string|null} [filters.actualizacion_hasta] - Límite superior de `fecha_actualizacion` (YYYY-MM-DD).
 * @param {string|null} [filters.sort_by] - Concepto de ordenamiento ya validado por el Service.
 * @param {string|null} [filters.sort_order] - Sentido del ordenamiento ('ASC' o 'DESC').
 * @returns {Promise<Array<Object>>} Colección de pagos coincidentes con sus entidades relacionadas.
 */
exports.findAll = async (filters = {}) => {

    // Traducción de conceptos de ordenamiento a columnas reales, para no exponer el esquema
    // físico a la capa de presentación ni interpolar texto arbitrario en la sentencia SQL.
    const SORT_COLUMN_MAP = {
        id_pago: 'P.id_pago',
        cliente_nombre: 'C.nombre',
        monto: 'P.monto',
        medio_pago_nombre: 'MP.nombre',
        banco_nombre: 'B.nombre',
        numero_comprobante: 'P.numero_comprobante',
        estado_pago_nombre: 'EP.nombre',
        fecha_recepcion: 'P.fecha_recepcion',
        fecha_vencimiento: 'P.fecha_vencimiento',
        fecha_creacion: 'P.fecha_creacion',
        fecha_actualizacion: 'P.fecha_actualizacion'
    };

    const {
        id_pago,
        id_cliente,
        id_estado_pago,
        id_medio_pago,
        id_banco,
        monto,
        monto_min,
        monto_max,
        fecha_desde,
        fecha_hasta,
        vencimiento_desde,
        vencimiento_hasta,
        numero_comprobante,
        creacion_desde,
        creacion_hasta,
        actualizacion_desde,
        actualizacion_hasta,
        sort_by,
        sort_order
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
            P.id_banco,
            B.nombre AS banco_nombre,
            P.monto,
            P.fecha_recepcion,
            P.fecha_vencimiento,
            P.numero_comprobante,
            P.observaciones,
            P.fecha_creacion,
            P.fecha_actualizacion
        FROM Pago P
        INNER JOIN Cliente C ON P.id_cliente = C.id_cliente
        INNER JOIN EstadoPago EP ON P.id_estado_pago = EP.id_estado_pago
        INNER JOIN MedioPago MP ON P.id_medio_pago = MP.id_medio_pago
        LEFT JOIN Banco B ON P.id_banco = B.id_banco
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

    // Filtrado exacto por Banco emisor
    if (id_banco) {
        conditions.push(`P.id_banco = ?`);
        values.push(id_banco);
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

    // Rango de Fechas de recepción del cobro
    if (fecha_desde) {
        conditions.push(`P.fecha_recepcion >= ?`);
        values.push(fecha_desde);
    }
    if (fecha_hasta) {
        conditions.push(`P.fecha_recepcion <= ?`);
        values.push(fecha_hasta);
    }

    // Rango de Fechas de vencimiento del cheque (los cobros inmediatos carecen del dato)
    if (vencimiento_desde) {
        conditions.push(`P.fecha_vencimiento >= ?`);
        values.push(vencimiento_desde);
    }
    if (vencimiento_hasta) {
        conditions.push(`P.fecha_vencimiento <= ?`);
        values.push(vencimiento_hasta);
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

    // Ordenamiento descendente por defecto sobre la fecha de recepción, para priorizar los registros
    // más recientes. El número interno oficia siempre de criterio de desempate determinista.
    const sorter = SORT_COLUMN_MAP[sort_by] || SORT_COLUMN_MAP.fecha_recepcion;
    const sortDirection = (sort_order === 'ASC') ? 'ASC' : 'DESC';

    query += ` ORDER BY ${sorter} ${sortDirection}, P.id_pago DESC;`;

    try {
        const [rows] = await db.query(query, values);
        return rows;
    } catch (error) {
        console.error("Error en Payment.findAll:", error);
        throw new Error("Error en la capa de datos al consultar los pagos.");
    }
};

/**
 * Busca un pago puntual por su número interno, hidratado con las entidades relacionadas
 * (cliente, estado, medio de pago y banco emisor), de modo que la capa de servicio pueda evaluar
 * el nombre del estado vigente y la bandera de acreditación diferida sin consultas adicionales.
 * @param {number} idPago - Identificador único del pago.
 * @returns {Promise<Object|null>} Registro del pago con sus entidades relacionadas o null si no existe.
 */
exports.findById = async (idPago) => {
    const query = `
        SELECT
            P.id_pago,
            P.id_cliente,
            C.nombre AS cliente_nombre,
            C.cuit AS cliente_cuit,
            P.id_estado_pago,
            EP.nombre AS estado_pago_nombre,
            P.id_medio_pago,
            MP.nombre AS medio_pago_nombre,
            MP.es_diferido,
            P.id_banco,
            B.nombre AS banco_nombre,
            P.monto,
            P.fecha_recepcion,
            P.fecha_vencimiento,
            P.numero_comprobante,
            P.observaciones,
            P.fecha_creacion,
            P.fecha_actualizacion
        FROM Pago P
        INNER JOIN Cliente C ON P.id_cliente = C.id_cliente
        INNER JOIN EstadoPago EP ON P.id_estado_pago = EP.id_estado_pago
        INNER JOIN MedioPago MP ON P.id_medio_pago = MP.id_medio_pago
        LEFT JOIN Banco B ON P.id_banco = B.id_banco
        WHERE P.id_pago = ?
        LIMIT 1;
    `;

    try {
        const [rows] = await db.query(query, [idPago]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("Error en Payment.findById:", error);
        throw new Error("Error en la capa de datos al buscar el pago.");
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
 * @param {number|null} [paymentData.id_banco] - Banco emisor (solo en medios diferidos).
 * @param {number} paymentData.monto - Importe del pago (estrictamente positivo).
 * @param {Date|string} paymentData.fecha_recepcion - Fecha en que el taller recibió el cobro.
 * @param {Date|string|null} [paymentData.fecha_vencimiento] - Fecha de presentación al cobro (solo en medios diferidos).
 * @param {string} [paymentData.numero_comprobante] - Número de comprobante de respaldo (opcional).
 * @param {string} [paymentData.observaciones] - Observaciones adicionales (opcional).
 * @param {Object} [connection=null] - Conexión transaccional inyectada por el Service (opcional).
 * @returns {Promise<number>} Identificador (`insertId`) del registro de pago creado.
 */
exports.create = async (paymentData, connection = null) => {
    const executor = connection || db;

    const query = `
        INSERT INTO Pago
        (id_cliente, id_estado_pago, id_medio_pago, id_banco, monto, fecha_recepcion, fecha_vencimiento, numero_comprobante, observaciones)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    try {
        const [result] = await executor.execute(query, [
            paymentData.id_cliente,
            paymentData.id_estado_pago,
            paymentData.id_medio_pago,
            paymentData.id_banco || null,
            paymentData.monto,
            paymentData.fecha_recepcion,
            paymentData.fecha_vencimiento || null,
            paymentData.numero_comprobante || null,
            paymentData.observaciones || null
        ]);
        return result.insertId;
    } catch (error) {
        console.error("Error en Payment.create:", error);
        throw new Error("Error en la capa de datos al registrar el pago.");
    }
};

/**
 * Actualiza las columnas mutables autorizadas de un pago existente. No inspecciona qué campos
 * cambiaron: recibe el registro completo ya resuelto por el Service. El estado vigente exigido
 * forma parte de la cláusula WHERE para que la propia sentencia impida alterar un pago que fue
 * formalizado de manera concurrente. Soporta la inyección explícita de una conexión transaccional.
 * @param {number} idPago - Identificador del pago a modificar.
 * @param {Object} paymentData - Datos completos a persistir.
 * @param {number} paymentData.id_estado_pago - Identificador del estado destino del pago.
 * @param {number} paymentData.id_medio_pago - Identificador del medio de pago.
 * @param {number|null} paymentData.id_banco - Banco emisor (null en medios inmediatos).
 * @param {number} paymentData.monto - Importe del pago (estrictamente positivo).
 * @param {Date|string} paymentData.fecha_recepcion - Fecha en que el taller recibió el cobro.
 * @param {Date|string|null} paymentData.fecha_vencimiento - Fecha de presentación al cobro (null en medios inmediatos).
 * @param {string|null} paymentData.numero_comprobante - Número de comprobante de respaldo.
 * @param {string|null} paymentData.observaciones - Observaciones adicionales.
 * @param {number} idEstadoActual - Estado que el pago debe conservar para admitir la mutación.
 * @param {Object} [connection=null] - Conexión transaccional inyectada por el Service (opcional).
 * @returns {Promise<number>} Cantidad de filas afectadas por la actualización.
 */
exports.update = async (idPago, paymentData, idEstadoActual, connection = null) => {
    const executor = connection || db;

    const query = `
        UPDATE Pago SET
            monto = ?,
            id_medio_pago = ?,
            id_banco = ?,
            id_estado_pago = ?,
            fecha_recepcion = ?,
            fecha_vencimiento = ?,
            numero_comprobante = ?,
            observaciones = ?
        WHERE id_pago = ? AND id_estado_pago = ?;
    `;

    try {
        const [result] = await executor.execute(query, [
            paymentData.monto,
            paymentData.id_medio_pago,
            paymentData.id_banco ?? null,
            paymentData.id_estado_pago,
            paymentData.fecha_recepcion,
            paymentData.fecha_vencimiento ?? null,
            paymentData.numero_comprobante ?? null,
            paymentData.observaciones ?? null,
            idPago,
            idEstadoActual
        ]);
        return result.affectedRows;
    } catch (error) {
        console.error("Error en Payment.update:", error);
        throw new Error("Error en la capa de datos al modificar el pago.");
    }
};

/**
 * Ejecuta la baja de un pago. El estado vigente exigido forma parte de la cláusula WHERE para que
 * la propia sentencia impida eliminar un pago que fue formalizado de manera concurrente.
 * Soporta la inyección explícita de una conexión transaccional.
 * @param {number} idPago - Identificador del pago a eliminar.
 * @param {number} idEstadoActual - Estado que el pago debe conservar para admitir la baja.
 * @param {Object} [connection=null] - Conexión transaccional inyectada por el Service (opcional).
 * @returns {Promise<number>} Cantidad de filas afectadas por la eliminación.
 */
exports.delete = async (idPago, idEstadoActual, connection = null) => {
    const executor = connection || db;

    const query = `
        DELETE FROM Pago
        WHERE id_pago = ? AND id_estado_pago = ?;
    `;

    try {
        const [result] = await executor.execute(query, [idPago, idEstadoActual]);
        return result.affectedRows;
    } catch (error) {
        console.error("Error en Payment.delete:", error);
        throw new Error("Error en la capa de datos al eliminar el pago.");
    }
};
