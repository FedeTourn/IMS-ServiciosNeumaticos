const db = require('../config/db.config'); 

/**
 * Consulta todos los roles (Administrador, Operario, etc.).
 */
exports.findAll = async () => {
    const query = `
        SELECT id_role, name
        FROM Role
        ORDER BY name ASC
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
 */
exports.create = async (roleData) => {
    const query = `
        INSERT INTO Role (name)
        VALUES (?)
    `;
    try {
        const [result] = await db.query(query, [roleData.name]);
        return result.insertId;
    } catch (error) {
        console.error("Error creating new role:", error);
        throw error;
    }
};