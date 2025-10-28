// Importa el pool de conexiones de la base de datos
const db = require('../config/db.config'); 

/**
 * Busca un usuario por su nombre de usuario.
 * @param {string} username - El nombre de usuario a buscar.
 * @returns {Promise<Object>} Un objeto con los datos del usuario o null.
 */
exports.findByUsername = async (username) => {
    // Consulta SQL para obtener todos los datos del usuario, incluyendo el nombre del rol.
    const query = `
        SELECT 
            u.id_user, u.full_name, u.username, u.password_hash, u.is_active, r.name as role_name 
        FROM User u
        JOIN Role r ON u.id_role = r.id_role
        WHERE u.username = ?
    `;
    
    try {
        const [rows] = await db.query(query, [username]);
        // Si se encuentra una fila, devuelve el primer objeto (el usuario)
        return rows[0] || null;
    } catch (error) {
        console.error("Error finding user by username:", error);
        throw error;
    }
};

/**
 * Registra un nuevo usuario en la base de datos.
 * @param {Object} userData - Datos del usuario (full_name, username, password_hash, id_role).
 * @returns {Promise<number>} El ID del usuario recién creado.
 */
exports.create = async (userData) => {
    // Requerimiento: El sistema debe registrar nuevos usuarios [cite: 54]
    const query = `
        INSERT INTO User (full_name, username, password_hash, id_role)
        VALUES (?, ?, ?, ?)
    `;
    
    try {
        const [result] = await db.query(query, [
            userData.full_name,
            userData.username,
            userData.password_hash,
            userData.id_role
        ]);
        
        return result.insertId;
    } catch (error) {
        console.error("Error creating new user:", error);
        throw error;
    }
};

// Se pueden añadir aquí otras funciones del CRUD (ej. exports.update, exports.delete)