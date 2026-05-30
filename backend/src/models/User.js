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
    // 1. Diccionario de Mapeo Seguro (Whitelist): JS Key -> DB Column
    const columnMap = {
        full_name: 'nombre_completo',
        id_role: 'id_rol',
        is_active: 'activo',
        password_hash: 'hash_contrasena'
    };

    
    let fields = [];
    let values = [];

    // 2. Construcción Dinámica y Segura
    for (const [key, value] of Object.entries(updateData)){
        // Aca uso la lista blanca
        if(value !== undefined && columnMap[key]) {
            fields.push(`${columnMap[key]} = ?`);
            values.push(value);
        }
    }
    
    if (fields.length === 0) return 0; // No hay nada que actualizar
    
    // Añadimos el ID al final del array de valores para la cláusula WHERE
    values.push(id_user);

    const sql = `
        UPDATE Usuario SET 
            ${fields.join(', ')},
            fecha_modificacion = CURRENT_TIMESTAMP
        WHERE id_usuario = ?
    `;

    try {
        const [result] = await db.execute(sql, values);
        return result.affectedRows;
    } catch (error) {
        console.error(`[Model:User] Error en update: ${error.message}`);
        throw error;
    }
};