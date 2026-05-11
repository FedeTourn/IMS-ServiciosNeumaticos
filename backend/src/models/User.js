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

/**
 * Consulta todos los usuarios activos, incluyendo el nombre del rol.
 * Necesario para la página de Consulta de Usuarios.
 */
exports.findAll = async () => {
    const query = `
        SELECT 
            u.id_user, u.full_name, u.username, u.is_active, r.name AS role_name
        FROM User u
        JOIN Role r ON u.id_role = r.id_role
        WHERE u.is_active = TRUE -- Asume que solo se listan los activos
        ORDER BY u.full_name ASC
    `;
    try {
        const [rows] = await db.query(query);
        return rows;
    } catch (error) {
        console.error("Error fetching all users:", error);
        throw error;
    }
};

/**
 * Consulta un usuario por ID.
 */
exports.findById = async (id_user) => {
    const query = `
        SELECT 
            u.id_user, u.full_name, u.username, u.id_role, u.is_active, r.name AS role_name
        FROM User u
        JOIN Role r ON u.id_role = r.id_role
        WHERE u.id_user = ?
    `;
    try {
        const [rows] = await db.query(query, [id_user]);
        return rows[0] || null;
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        throw error;
    }
};

/**
 * Actualiza los datos de un usuario existente.
 * Permite modificar nombre, rol, estado, y opcionalmente, la contraseña.
 */
exports.update = async (id_user, updateData) => {
    // Construye la consulta dinámicamente
    let updates = [];
    let values = [];

    if (updateData.full_name) { updates.push("full_name = ?"); values.push(updateData.full_name); }
    if (updateData.id_role) { updates.push("id_role = ?"); values.push(updateData.id_role); }
    if (updateData.is_active !== undefined) { updates.push("is_active = ?"); values.push(updateData.is_active); }
    if (updateData.password_hash) { updates.push("password_hash = ?"); values.push(updateData.password_hash); }
    
    if (updates.length === 0) return 0; // No hay nada que actualizar

    const query = `
        UPDATE User SET 
            ${updates.join(', ')},
            updated_at = CURRENT_TIMESTAMP
        WHERE id_user = ?
    `;
    values.push(id_user);

    try {
        const [result] = await db.query(query, values);
        return result.affectedRows;
    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
};