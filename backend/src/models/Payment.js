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
