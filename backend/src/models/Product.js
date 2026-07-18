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

    // Ensamble final de la consulta
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
 * Crea un nuevo producto. (Alta de Producto/Recepción)
 * @param {Object} productData - Objeto con la informacion del producto (modelo, fecha_recepcion, estado, id_cliente, observaciones).
 * @returns {Promise<number>} Id del producto creado.
 */
exports.create = async (connection = db, productData) => {
    const query = `
        INSERT INTO Producto (modelo, fecha_recepcion, estado, id_cliente, observaciones, id_comprobante_recepcion)
        VALUES (?, ?, ?, ?, ?, ?);
    `;
    // Nota: El tipo se infiere del modelo, por lo tanto no se incluye en el INSERT
    const values = [
        productData.modelo,
        productData.fecha_recepcion,
        productData.estado || 1, // Asume el estado '1: Recibida' por defecto
        productData.id_cliente,
        productData.observaciones || null,
        productData.id_comprobante_recepcion
    ];

    // Se ejecuta sobre la conexión inyectada (que puede ser la transacción del Servicio de Comprobantes)
    const [result] = await connection.query(query,values);
    return result.insertId;

    /* try {
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
    } */
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


// ---------------------------------------------------------
// EXPORTACIONES DE TIPOS DE PRODUCTO
// ---------------------------------------------------------

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
 * Busca un Tipo de Producto por su ID único.
 * @param {number} id_tipo - Identificador del tipo de producto.
 * @returns {Promise<Object|null>} Objeto TipoProducto o null si no existe.
 */
exports.findTypeById = async (id_tipo) => {
    const query = `SELECT id_tipo, nombre FROM TipoProducto WHERE id_tipo = ?`;
    try {
        const [rows] = await db.query(query, [id_tipo]);
        return rows[0] || null;
    } catch (error) {
        console.error("Error en ProductModel.findTypeById:", error);
        throw new Error("Error al consultar el tipo de producto por ID.");
    }
};

/**
 * Registra un nuevo Tipo de Producto en el sistema.
 * @param {Object} typeData - Objeto con el nombre del tipo.
 * @returns {Promise<number>} ID del tipo creado.
 */
exports.createType = async (typeData) => {
    const query = `INSERT INTO TipoProducto (nombre) VALUES (?)`;
    try {
        const [result] = await db.query(query, [typeData.nombre]);
        return result.insertId;
    } catch (error) {
        console.error("Error en ProductModel.createType:", error);
        throw error;
    }
};

/**
 * Actualiza el nombre de un Tipo de Producto existente.
 * @param {number} id_tipo - ID del tipo a modificar.
 * @param {Object} typeData - Objeto con el nuevo nombre.
 * @returns {Promise<number>} Cantidad de filas afectadas.
 */
exports.updateType = async (id_tipo, typeData) => {
    const query = `UPDATE TipoProducto SET nombre = ? WHERE id_tipo = ?`;
    try {
        const [result] = await db.query(query, [typeData.nombre, id_tipo]);
        return result.affectedRows;
    } catch (error) {
        console.error("Error en ProductModel.updateType:", error);
        throw error;
    }
};

// ---------------------------------------------------------
// EXPORTACIONES DE MODELOS DE PRODUCTO
// ---------------------------------------------------------

/**
 * Consulta todos los modelos de producto con el nombre del tipo asociado.
 * @param {number|null} typeId - Filtro opcional por ID de tipo.
 * @returns {Promise<Array>} Lista de objetos ModeloProducto con el nombre del tipo.
 */
exports.findAllProductModels = async (typeId = null) => {
    let query = `
        SELECT 
            mp.id_modelo, 
            mp.nombre, 
            mp.tipo AS id_tipo,
            tp.nombre AS tipo_nombre
        FROM ModeloProducto mp
        JOIN TipoProducto tp ON mp.tipo = tp.id_tipo
    `;
    let params = [];
    if (typeId) {
        query += ` WHERE mp.tipo = ?`;
        params.push(typeId);
    }
    query += ` ORDER BY mp.nombre ASC`;
    
    try {
        const [rows] = await db.query(query, params);
        return rows;
    } catch (error) {
        console.error("Error fetching all product models:", error);
        throw error;
    }
};

/**
 * Busca un Modelo de Producto por su ID único, incluyendo los datos de su Tipo.
 * @param {number} id_modelo - Identificador del modelo.
 * @returns {Promise<Object|null>} Objeto ModeloProducto enriquecido o null.
 */
exports.findModelById = async (id_modelo) => {
    const query = `
        SELECT 
            mp.id_modelo, 
            mp.nombre, 
            mp.tipo AS id_tipo,
            tp.nombre AS tipo_nombre
        FROM ModeloProducto mp
        JOIN TipoProducto tp ON mp.tipo = tp.id_tipo
        WHERE mp.id_modelo = ?
    `;
    try {
        const [rows] = await db.query(query, [id_modelo]);
        return rows[0] || null;
    } catch (error) {
        console.error("Error en ProductModel.findModelById:", error);
        throw new Error("Error en la capa de datos al consultar el modelo por ID.");
    }
};

/**
 * Registra un nuevo Modelo de Producto.
 */
exports.createModel = async (modelData) => {
    const query = `INSERT INTO ModeloProducto (nombre, tipo) VALUES (?, ?)`;
    try {
        const [result] = await db.query(query, [modelData.nombre, modelData.tipo]);
        return result.insertId;
    } catch (error) {
        console.error("Error en ProductModel.createModel:", error);
        throw error;
    }
};

/**
 * Actualiza los datos de un modelo.
 */
exports.updateModel = async (id_modelo, modelData) => {
    const query = `UPDATE ModeloProducto SET nombre = ?, tipo = ? WHERE id_modelo = ?`;
    try {
        const [result] = await db.query(query, [modelData.nombre, modelData.tipo, id_modelo]);
        return result.affectedRows;
    } catch (error) {
        console.error("Error en ProductModel.updateModel:", error);
        throw error;
    }
};


/**
 * Consulta en el diccionario los identificadores de estados destino permitidos para un origen dado.
 * @param {number} estado_origen - Identificador del estado actual del producto.
 * @returns {Promise<number[]>} Matriz con los IDs de los estados destinos parametrizados como válidos.
 */
exports.findAllowedDestinations = async (estado_origen) => {
    const query = `
        SELECT estado_destino 
        FROM DiccionarioEstado 
        WHERE estado_origen = ?
    `;
    try {
        const [rows] = await db.query(query, [estado_origen]);
        // Mapeamos las filas para devolver un array simple de números [2, 3, 4]
        return rows.map(row => row.estado_destino);
    } catch (error) {
        console.error("Error en ProductModel.findAllowedDestinations:", error);
        throw new Error("Error en la capa de datos al consultar las reglas de transición de estados.");
    }
};

/**
 * Consulta todas las reglas de transición registradas en el DiccionarioEstado.
 * Realiza un JOIN para traer los nombres legibles de los estados.
 * @returns {Promise<Array>} Lista de objetos { estado_origen, estado_destino, nombre_origen, nombre_destino }
 */
exports.getAllStateTransitions = async () => {
    const query = `
        SELECT 
            de.estado_origen,
            de.estado_destino,
            eo.nombre AS nombre_origen,
            ed.nombre AS nombre_destino
        FROM DiccionarioEstado de
        JOIN EstadoProducto eo ON de.estado_origen = eo.id_estado
        JOIN EstadoProducto ed ON de.estado_destino = ed.id_estado
        ORDER BY de.estado_origen ASC, de.estado_destino ASC
    `;
    
    try {
        const [rows] = await db.query(query);
        return rows;
    } catch (error) {
        console.error("Error en ProductModel.getAllStateTransitions:", error);
        throw new Error("Error en la capa de datos al consultar el diccionario de estados.");
    }
};