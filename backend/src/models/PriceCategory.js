/**
 * @file PriceCategory.js
 * @description Modelo de acceso a datos (DAO) para la gestión histórica de precios por categoría.
 * Mapea las consultas directas contra la tabla PrecioPorCategoria usando CommonJS.
 */

const { pool: db } = require('../config/db.config');

/**
 * Consulta la matriz completa de precios vigentes cruzada con sus maestros de dominio.
 * Filtra estrictamente por vigente = 1.
 * @async
 * @function findAllActive
 * @returns {Promise<Array<Object>>} Matriz plana de relaciones comerciales de precios activos.
 * @throws {Error} Excepción encapsulada ante fallos en la infraestructura de persistencia.
 */
exports.findAllActive = async () => {
    const query = `
        SELECT 
            p.id_precio,
            p.id_modelo,
            mp.nombre AS modelo_nombre,
            tp.nombre AS tipo_nombre,
            p.id_categoria,
            cc.nombre_categoria AS categoria_nombre,
            p.precio,
            p.vigencia_desde
        FROM PrecioPorCategoria p
        JOIN ModeloProducto mp ON p.id_modelo = mp.id_modelo
        JOIN TipoProducto tp ON mp.tipo = tp.id_tipo
        JOIN CategoriaCliente cc ON p.id_categoria = cc.id_categoria
        WHERE p.vigente = 1
        ORDER BY tp.nombre ASC, mp.nombre ASC, cc.nombre_categoria ASC;
    `;

    try {
        const [rows] = await db.query(query);
        return rows;
    } catch (error) {
        console.error("Error en PriceCategory.findAllActive:", error);
        throw new Error("Error en la capa de datos al consultar la matriz de precios activos.");
    }
};

/**
 * Busca el precio de catálogo sugerido y activo para una combinación específica de modelo y categoría.
 * Resuleve la carga automática de la orden de reparación.
 * @async
 * @function findSuggestedPrice
 * @param {number} idModelo - Identificador único de la entidad ModeloProducto.
 * @param {number} idCategoria - Identificador único de la entidad CategoriaCliente.
 * @returns {Promise<Object|null>} Objeto con el escalar de precio correspondiente o null si no existe tarifa.
 * @throws {Error} Excepción encapsulada ante fallos en el motor relacional.
 */
exports.findSuggestedPrice = async (idModelo, idCategoria) => {
    const query = `
        SELECT precio
        FROM PrecioPorCategoria
        WHERE id_modelo = ? 
          AND id_categoria = ? 
          AND vigente = 1
        LIMIT 1;
    `;

    try {
        const [rows] = await db.query(query, [idModelo, idCategoria]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("Error en PriceCategory.findSuggestedPrice:", error);
        throw new Error("Error en la capa de datos al buscar la tarifa sugerida del producto.");
    }
};

/**
 * Invalida temporalmente la tarifa activa para un modelo y categoría específicos fijando la fecha de fin.
 * @async
 * @function invalidatePrice
 * @param {number} idModelo - Identificador único de la entidad ModeloProducto.
 * @param {number} idCategoria - Identificador único de la entidad CategoriaCliente.
 * @param {Object} [connection] - Instancia de conexión transaccional de MySQL (opcional).
 * @returns {Promise<Object>} Resultado de la ejecución del driver relacional.
 * @throws {Error} Excepción encapsulada ante fallos en la persistencia.
 */
exports.invalidatePrice = async (idModelo, idCategoria, connection = db) => {
    const query = `
        UPDATE PrecioPorCategoria
        SET vigencia_hasta = CURRENT_TIMESTAMP
        WHERE id_modelo = ? 
          AND id_categoria = ? 
          AND vigente = 1;
    `;

    try {
        const [result] = await connection.query(query, [idModelo, idCategoria]);
        return result;
    } catch (error) {
        console.error("Error en PriceCategory.invalidatePrice:", error);
        throw new Error("Error en la capa de datos al dar de baja la vigencia del precio.");
    }
};

/**
 * Inserta un nuevo registro de tarifa inmutable dentro del catálogo histórico.
 * @async
 * @function insertPrice
 * @param {number} idModelo - Identificador único de la entidad ModeloProducto.
 * @param {number} idCategoria - Identificador único de la entidad CategoriaCliente.
 * @param {number} precio - Valor monetario decimal de la nueva tarifa.
 * @param {Object} [connection] - Instancia de conexión transaccional de MySQL (opcional).
 * @returns {Promise<number>} Identificador generado (insertId) para el nuevo registro de precio.
 * @throws {Error} Excepción encapsulada ante fallos en el motor relacional.
 */
exports.insertPrice = async (idModelo, idCategoria, precio, connection = db) => {
    const query = `
        INSERT INTO PrecioPorCategoria (id_modelo, id_categoria, precio)
        VALUES (?, ?, ?);
    `;

    try {
        const [result] = await connection.query(query, [idModelo, idCategoria, precio]);
        return result.insertId;
    } catch (error) {
        console.error("Error en PriceCategory.insertPrice:", error);
        throw new Error("Error en la capa de datos al insertar la nueva tarifa en el catálogo.");
    }
};