const { pool:db } = require('../config/db.config'); 

// ---------------------------------------------------------
// CONSTANTES DE CONFIGURACIÓN Y MAPEOS SEGUROS
// ---------------------------------------------------------
const ALLOWED_ORDER_BY = {
    cliente: 'c.nombre',
    tipo: 'tp.nombre',
    modelo: 'mp.nombre',
    estado: 'ep.nombre',
    fecha_recepcion: 'p.fecha_recepcion'
};

const SEARCH_COLUMNS = {
    cliente: 'c.nombre',
    tipo: 'tp.nombre',
    modelo: 'mp.nombre',
    estado: 'ep.nombre',
    recepcion: 'p.fecha_recepcion',
    todos: ['c.nombre', 'tp.nombre', 'mp.nombre', 'ep.nombre']
};

// ---------------------------------------------------------
// FUNCIONES AUXILIARES (PRIVADAS AL MÓDULO)
// ---------------------------------------------------------

/**
 * Construye dinámicamente la cláusula WHERE y los parámetros para evitar inyección SQL.
 * @param {string} searchField - Campo sobre el cual buscar.
 * @param {string} searchTerm - Texto ingresado por el usuario.
 * @returns {Object} { condition: string, params: Array }
 */
const _buildSearchClause = (searchField, searchTerm) => {
    if (!searchTerm || searchTerm.trim() === '') {
        return { condition: '', params: [] };
    }

    const term = `%${searchTerm.trim()}%`;
    const isGlobalSearch = searchField === 'todos' || !SEARCH_COLUMNS[searchField];
    const fieldsToSearch = isGlobalSearch ? SEARCH_COLUMNS.todos : [SEARCH_COLUMNS[searchField]];

    const sqlConditions = fieldsToSearch.map(field => `${field} LIKE ?`).join(' OR ');
    const params = Array(fieldsToSearch.length).fill(term);

    return { condition: `WHERE (${sqlConditions})`, params };
};

/**
 * Sanitiza y construye la cláusula ORDER BY.
 * @param {string} orderBy - Criterio de ordenamiento enviado por el cliente.
 * @param {string} sortOrder - Dirección del ordenamiento (ASC/DESC).
 * @returns {string} Cláusula ORDER BY validada.
 */
const _buildOrderClause = (orderBy, sortOrder) => {
    const column = ALLOWED_ORDER_BY[orderBy] || ALLOWED_ORDER_BY.fecha_recepcion;
    const direction = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    return `ORDER BY ${column} ${direction}`;
};

// ---------------------------------------------------------
// EXPORTACIONES DEL MODELO (CAPA DE DATOS)
// ---------------------------------------------------------

/**
 * Consulta los productos con sus datos relacionados, permitiendo filtrado y ordenamiento dinámico.
 * @param {Object} options - Parámetros de consulta { orderBy, sortOrder, searchField, searchTerm }.
 * @returns {Promise<Array>} Lista de objetos de la entidad Producto.
 */
exports.findAll = async (options = {}) => {
    const { orderBy, sortOrder, searchField, searchTerm } = options;

    const baseQuery = `
        SELECT 
            p.id_producto,
            c.nombre AS cliente_nombre,
            tp.nombre AS tipo_nombre,
            mp.nombre AS modelo_nombre,
            ep.nombre AS estado_nombre,
            p.fecha_recepcion,
            p.fecha_entrega,
            p.id_orden_reparacion,
            p.observaciones
        FROM Producto p
        JOIN Cliente c ON p.id_cliente = c.id_cliente
        JOIN ModeloProducto mp ON p.modelo = mp.id_modelo
        JOIN TipoProducto tp ON mp.tipo = tp.id_tipo
        JOIN EstadoProducto ep ON p.estado = ep.id_estado
    `;

    const { condition: whereClause, params } = _buildSearchClause(searchField, searchTerm);
    const orderClause = _buildOrderClause(orderBy, sortOrder);

    // Ensamblaje final de la consulta
    const query = `${baseQuery} ${whereClause} ${orderClause}`;

    try {
        const [rows] = await db.query(query, params);
        return rows;
    } catch (error) {
        console.error("Error en ProductoModel.findAll:", error);
        throw new Error("Error en la capa de datos al consultar los productos.");
    }
};

/**
 * Consulta todos los productos con sus datos relacionados, permitiendo filtros y ordenamiento.
 * @param {Object} options - { orderBy, sortOrder, searchField, searchTerm }
 * @returns {Promise<Array>} Lista de objetos producto.
 */
/* exports.findAll = async (options) => {
    // 1. Sanitización de filtros (Crucial para evitar SQL Injection)
    const orderBy = ALLOWED_ORDER_BY.includes(options.orderBy) ? options.orderBy : 'fecha_recepcion';
    const sortOrder = ALLOWED_SORT_ORDER.includes(options.sortOrder?.toUpperCase()) ? options.sortOrder : 'DESC';

    const { orderBy, sortOrder, searchField, searchTerm } = options;

    let query = `
        SELECT 
            p.id_producto,
            c.nombre AS cliente_nombre,
            tp.nombre AS tipo_nombre,
            mp.nombre AS modelo_nombre,
            ep.nombre AS estado_nombre,
            p.fecha_recepcion,
            p.fecha_entrega,
            p.id_orden_reparacion,
            p.observaciones
        FROM Producto p
        JOIN Cliente c ON p.id_cliente = c.id_cliente
        JOIN ModeloProducto mp ON p.modelo = mp.id_modelo
        JOIN TipoProducto tp ON mp.tipo = tp.id_tipo
        JOIN EstadoProducto ep ON p.estado = ep.id_estado
    `;

    
    let params = [];
    let whereClauses = [];
    
    // --- Mapeo seguro de columnas para BÚSQUEDA ---
    const searchColumns = {
        // Columna Específica | Columna SQL
        cliente: 'c.nombre',
        tipo: 'tp.nombre',
        modelo: 'mp.nombre',
        estado: 'ep.nombre',
        recepcion: 'p.fecha_recepcion', // Se puede buscar por fecha (parcialmente)
        todos: [ // Búsqueda Global: Combina varios campos
            'c.nombre', 
            'tp.nombre', 
            'mp.nombre', 
            'ep.nombre'
        ]
    };

    // --- LÓGICA DE FILTRADO ---
    if (searchTerm && searchTerm.trim() !== '') {
        const term = `%${searchTerm.trim()}%`;
        
        if (searchField && searchColumns[searchField]) {
            let fieldsToSearch = [];

            if (searchField === 'todos') {
                // Búsqueda Global
                fieldsToSearch = searchColumns.todos;
            } else {
                // Búsqueda por Campo Específico
                fieldsToSearch = [searchColumns[searchField]];
            }
            
            // Construye la cláusula WHERE (campo LIKE %query%)
            const conditions = fieldsToSearch.map(field => `${field} LIKE ?`).join(' OR ');
            whereClauses.push(`(${conditions})`);

            // Añade el término de búsqueda tantas veces como campos se estén buscando
            fieldsToSearch.forEach(() => params.push(term));
        }
    }
    
    if (whereClauses.length > 0) {
        query += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    
    // --- LÓGICA DE ORDENAMIENTO ---
    const allowedColumns = {
        cliente: 'c.nombre',
        tipo: 'tp.nombre',
        modelo: 'mp.nombre',
        estado: 'ep.nombre',
        fecha_recepcion: 'p.fecha_recepcion'
    };

    if (orderBy && allowedColumns[orderBy]) {
        const orderDirection = sortOrder === 'DESC' ? 'DESC' : 'ASC';
        query += ` ORDER BY ${allowedColumns[orderBy]} ${orderDirection}`;
    } else {
        query += ` ORDER BY p.fecha_recepcion DESC`;
    }

    try {
        const [rows] = await db.query(query, params);
        return rows;
    } catch (error) {
        console.error("Error fetching all products with options:", error);
        throw error;
    }
}; */

/**
 * Consulta todos los Tipos de Producto.
 * @returns {Promise<Array>} Lista de Objetos TipoProducto.
 */
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
 * @param {number} typeId - Tipo de producto.
 * @returns {Promise<Array>} Lista de Objetos ModeloProducto.
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
 * @param {Object} productData - Objeto con la informacion del producto (modelo, fecha_recepcion, estado, id_cliente, observaciones).
 * @returns {Promise<number>} Id del producto creado.
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
 * Busca un producto por ID y muestra todos sus datos relacionados (cliente, tipo, modelo, estado).
 * @param {number} id_producto - Identificador de producto.
 * @returns {Promise<Object>} Objeto Producto encontrado.
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
 * @param {number} id_producto - ID de Producto a modificar.
 * @param {Object} updateData - Datos a modificar de producto (Observaciones y estado).
 * @returns {Promise<number>} Cantidad de filas afectadas.
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
 * @returns {Promise<Array>} Lista de objetos EstadoProducto.
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

/* *
 * Consulta todos los productos con sus datos relacionados.
 * @returns {Promise<Array>} Lista de objetos producto.
 */
/* exports.findAll = async () => {
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
}; */