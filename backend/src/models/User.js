/**
 * Modelo de datos para la entidad Usuario (User).
 * Basado en una arquitectura de tres capas, este archivo representa el DAO (Data Access Object)
 * encargado exclusivamente de la comunicación con la base de datos MySQL.
 */
// Importa el pool de conexiones de la base de datos
const { pool:db } = require('../config/db.config'); 

/**
 * Busca un usuario por su nombre de usuario.
 * @param {string} username - El nombre de usuario a buscar.
 * @returns {Promise<Object>} Un objeto con los datos del usuario y su rol o null.
 */
exports.findByUsername = async (username) => {
    // Consulta SQL para obtener todos los datos del usuario, incluyendo el nombre del rol.
    const sql = `
        SELECT 
            u.id_usuario AS id_user
            , u.nombre_completo AS full_name
            , u.nombre_usuario AS username
            , u.hash_contrasena AS password_hash
            , u.activo AS is_active
            , r.nombre_rol AS role_name 
        FROM Usuario u
        JOIN Rol r ON u.id_rol = r.id_rol
        WHERE u.nombre_usuario = ?
    `;
    
    try {
        const [rows] = await db.execute(sql, [username]);
        // Si se encuentra una fila, devuelve el primer objeto (el usuario)
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error(`[Model:User] Error en findByUsername: ${error.message}`);
        throw error;
    }
};

/**
 * Registra un nuevo usuario en la base de datos.
 * @param {Object} userData - Datos del usuario (full_name, username, password_hash, id_role).
 * @returns {Promise<number>} El ID del usuario recién creado.
 */
exports.create = async (userData) => {
    const { full_name, username, password_hash, id_role } = userData;
    const sql = `
        INSERT INTO Usuario (nombre_completo, nombre_usuario, hash_contrasena, id_rol)
        VALUES (?, ?, ?, ?)
    `;
    
    try {
        const [result] = await db.execute(sql, [
            userData.full_name,
            userData.username,
            userData.password_hash,
            userData.id_role
        ]);
        
        return result.insertId;
    } catch (error) {
        console.error(`[Model:User] Error en create: ${error.message}`);
        throw error;
    }
};

/**
 * Consulta todos los usuarios activos, incluyendo el nombre del rol.
 * @param {boolean} onlyActive - Si es true, filtra solo usuarios habilitados.
 * @returns {Promise<Array>}
 */
exports.findAll = async (onlyActive) => {
    const sql = `
        SELECT 
            u.id_usuario AS id_user
            , u.nombre_completo AS full_name
            , u.nombre_usuario AS username
            , u.activo AS is_active
            , r.nombre_rol AS role_name
        FROM Usuario u
        JOIN Rol r ON u.id_rol = r.id_rol
    `;
    if (onlyActive) {
        sql.concat= `WHERE u.activo = TRUE`;
    }

    sql.concat= `ORDER BY u.nombre_completo ASC`;

    try {
        const [rows] = await db.execute(sql);
        return rows;
    } catch (error) {
        console.error(`[Model:User] Error en findAll: ${error.message}`);
        throw error;
    }
};

/**
 * Consulta un usuario por ID.
 * @param {number} id_user 
 * @returns {Promise<Object>} Objeto Usuario.
 */
exports.findById = async (id_user) => {
    const sql = `
        SELECT 
            u.id_usuario AS id_user
            , u.nombre_completo AS full_name
            , u.nombre_usuario AS username
            , u.id_rol AS id_role
            , u.activo AS is_active
            , r.nombre_rol AS role_name
        FROM Usuario u
        JOIN Rol r ON u.id_rol = r.id_rol
        WHERE u.id_usuario = ?
    `;
    try {
        const [rows] = await db.execute(sql, [id_user]);
        return rows[0] || null;
    } catch (error) {
        console.error(`[Model:User] Error en findById: ${error.message}`);
        throw error;
    }
};

/**
 * Actualiza los datos de un usuario existente.
 * Permite modificar nombre, rol, estado, y opcionalmente, la contraseña.
 * @param {number} id_user 
 * @param {Object} updateData 
 * @returns {Promise<number>} Cantidad de filas afectadas.
 */
exports.update = async (id_user, updateData) => {
    // Construye la consulta dinámicamente
    let fields = [];
    let values = [];
    for (const [key, value] of Object.entries(updateData)){
        if(value !== undefined) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
    }
    /* if (updateData.full_name) { fields.push("full_name = ?"); values.push(updateData.full_name); }
    if (updateData.id_role) { fields.push("id_role = ?"); values.push(updateData.id_role); }
    if (updateData.is_active !== undefined) { fields.push("is_active = ?"); values.push(updateData.is_active); }
    if (updateData.password_hash) { fields.push("password_hash = ?"); values.push(updateData.password_hash); } */
    
    if (fields.length === 0) return 0; // No hay nada que actualizar

    const sql = `
        UPDATE Usuario SET 
            ${fields.join(', ')},
            fecha_modificacion = CURRENT_TIMESTAMP
        WHERE id_usuario = ?
    `;
    values.push(id_user);

    try {
        const [result] = await db.execute(sql, values);
        return result.affectedRows;
    } catch (error) {
        console.error(`[Model:User] Error en update: ${error.message}`);
        throw error;
    }
};