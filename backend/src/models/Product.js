const db = require('../config/db.config'); 

/**
 * Consulta todos los productos con sus datos relacionados.
 * @returns {Promise<Array>} Lista de objetos producto.
 */
exports.findAll = async () => {
    // Consulta JOIN para obtener el nombre en lugar de IDs
    const query = `
        SELECT 
            p.id_producto,
            c.nombre AS cliente_nombre,
            tp.nombre AS tipo_nombre,
            mp.nombre AS modelo_nombre,
            ep.nombre AS estado_nombre,
            p.fecha_recepcion,
            p.fecha_entrega,
            p.id_orden_reparacion
        FROM Producto p
        JOIN Cliente c ON p.id_cliente = c.id_cliente
        JOIN ModeloProducto mp ON p.modelo = mp.id_modelo
        JOIN TipoProducto tp ON mp.tipo = tp.id_tipo
        JOIN EstadoProducto ep ON p.estado = ep.id_estado
        ORDER BY p.fecha_recepcion DESC
    `;
    try {
        const [rows] = await db.query(query);
        return rows;
    } catch (error) {
        console.error("Error fetching all products:", error);
        throw error;
    }
};

// Aquí se añadirán más funciones (findById, create, update, etc.) en pasos posteriores.
exports.findAllProductTypes = async () => {
    const query = `SELECT id_tipo, nombre FROM TipoProducto ORDER BY nombre ASC`;
    try {
        const [rows] = await db.query(query);
        return rows;
    } catch (error) {
        console.error("Error fetching all product types:", error);
        throw error;
    }
};

/**
 * Consulta todos los Modelos de Producto (opcionalmente filtrados por tipo).
 */
exports.findAllProductModels = async (typeId = null) => {
    let query = `SELECT id_modelo, nombre, tipo FROM ModeloProducto`;
    let params = [];
    if (typeId) {
        query += ` WHERE tipo = ?`;
        params.push(typeId);
    }
    query += ` ORDER BY nombre ASC`;
    
    try {
        const [rows] = await db.query(query, params);
        return rows;
    } catch (error) {
        console.error("Error fetching all product models:", error);
        throw error;
    }
};

/**
 * Crea un nuevo producto. (Alta de Producto/Recepción)
 */
exports.create = async (productData) => {
    const query = `
        INSERT INTO Producto (modelo, fecha_recepcion, estado, id_cliente, observaciones)
        VALUES (?, ?, ?, ?, ?)
    `;
    // Nota: El tipo se infiere del modelo, por lo tanto no se incluye en el INSERT
    try {
        const [result] = await db.query(query, [
            productData.modelo,
            productData.fecha_recepcion,
            productData.estado || 1, // Asume el estado '1: Recibida' por defecto
            productData.id_cliente,
            productData.observaciones
        ]);
        return result.insertId;
    } catch (error) {
        console.error("Error creating product:", error);
        throw error;
    }
};

/**
 * Busca un producto por ID con todos sus datos relacionados (cliente, tipo, modelo, estado).
 */
exports.findById = async (id_producto) => {
    const query = `
        SELECT 
            p.*,
            c.nombre AS cliente_nombre,
            c.id_cliente,
            tp.nombre AS tipo_nombre,
            mp.nombre AS modelo_nombre,
            ep.nombre AS estado_nombre,
            ep.id_estado
        FROM Producto p
        JOIN Cliente c ON p.id_cliente = c.id_cliente
        JOIN ModeloProducto mp ON p.modelo = mp.id_modelo
        JOIN TipoProducto tp ON mp.tipo = tp.id_tipo
        JOIN EstadoProducto ep ON p.estado = ep.id_estado
        WHERE p.id_producto = ?
    `;
    try {
        const [rows] = await db.query(query, [id_producto]);
        return rows[0] || null;
    } catch (error) {
        console.error("Error fetching product by ID:", error);
        throw error;
    }
};

/**
 * Actualiza los atributos modificables de un producto (observaciones y estado).
 */
exports.update = async (id_producto, updateData) => {
    const query = `
        UPDATE Producto SET 
            observaciones = ?,
            estado = ?,
            -- Se actualiza la fecha de reparación/modificación
            fecha_reparacion = CURRENT_TIMESTAMP
        WHERE id_producto = ?
    `;
    try {
        const [result] = await db.query(query, [
            updateData.observaciones,
            updateData.estado,
            id_producto
        ]);
        return result.affectedRows;
    } catch (error) {
        console.error("Error updating product:", error);
        throw error;
    }
};

/**
 * Consulta todos los Estados de Producto (necesario para el dropdown de modificación).
 */
exports.findAllProductStates = async () => {
    const query = `SELECT id_estado, nombre FROM EstadoProducto ORDER BY nombre ASC`;
    try {
        const [rows] = await db.query(query);
        return rows;
    } catch (error) {
        console.error("Error fetching all product states:", error);
        throw error;
    }
};