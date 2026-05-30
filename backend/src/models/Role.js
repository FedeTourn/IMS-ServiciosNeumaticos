const { pool:db } = require('../config/db.config'); 

/**
 * Consulta todos los roles (Administrador, Operario, etc.).
 * @returns {Promise<Array>} Lista de objetos Rol.
 */
exports.findAll = async () => {
    const query = `
        SELECT id_rol as id_role, nombre_rol as name
        FROM Rol
        ORDER BY nombre_rol ASC
    `;
    try {
        const [rows] = await db.query(query);
        return rows;
    } catch (error) {
        console.error("Error fetching all roles:", error);
        throw error;
    }
};

/**
 * Crea un nuevo rol.
 * @param {Object} roleData - Informacion del Rol.
 * @returns {Promise<number>} Id de Rol agregado.
 */
exports.create = async (roleData) => {
    const query = `
        INSERT INTO Rol (nombre_rol)
        VALUES (?)
    `;
    try {
        const [result] = await db.query(query, [roleData.name]);
        return result.insertId;
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('DUPLICATE_ROLE_NAME'); // Error genérico de dominio
        }
        throw error;
    }
};