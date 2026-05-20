const { pool:db } = require('../config/db.config'); 

/**
 * Busca todos los clientes con su categoría.
 * @returns {Promise<Array>} Lista de objetos cliente.
 */
/* exports.findAll = async () => {
    const query = `
        SELECT 
            c.id_cliente, c.nombre, c.direccion, c.cuit, c.email, cat.nombre_categoria
        FROM Cliente c
        JOIN CategoriaCliente cat ON c.categoria = cat.id_categoria
        ORDER BY c.nombre ASC
    `;
    try {
        const [rows] = await db.query(query);
        return rows;
    } catch (error) {
        console.error("Error fetching all clients:", error);
        throw error;
    }
}; */

/**
 * Registra un nuevo cliente. (Crear Cliente)
 * Requisito: Validar unicidad por CUIT, Apellido y Nombre, o Email. 
 * Nota: Solo validamos CUIT y Email por ser identificadores técnicos.
 * @param {Object} clientData - Datos del cliente (nombre, direccion, cuit, email, categoria).
 * @returns {Promise<number>} El ID del cliente recién creado.
 */
exports.create = async (clientData) => {
    // Implementación simple de INSERT. La validación de unicidad compleja se hace en el controlador.
    const query = `
        INSERT INTO Cliente (nombre, direccion, cuit, email, categoria)
        VALUES (?, ?, ?, ?, ?)
    `;
    try {
        const [result] = await db.query(query, [
            clientData.nombre,
            clientData.direccion,
            clientData.cuit,
            clientData.email,
            clientData.categoria || 1 // Asume categoría por defecto si no se especifica.
        ]);
        return result.insertId;
    } catch (error) {
        console.error("Error creating client:", error);
        throw error;
    }
};

/**
 * Actualiza la información principal de un cliente.
 * Solo actualiza los campos permitidos: direccion, email, categoria.
 * @param {number} id_cliente - ID del cliente a modificar.
 * @param {Object} clientData - Datos nuevos del cliente (Direccion, Email, Categoria).
 * @returns {Promise<number>} Cantidad de filas afectadas.
 */
exports.update = async (id_cliente, clientData) => {
    const query = `
        UPDATE Cliente 
        SET direccion = ?, email = ?, categoria = ?
        WHERE id_cliente = ?
    `;
    try {
        const [result] = await db.query(query, [
            clientData.direccion,
            clientData.email,
            clientData.categoria,
            id_cliente
        ]);
        return result.affectedRows;
    } catch (error) {
        console.error("Error updating client:", error);
        throw error;
    }
};

/**
 * Consulta un cliente por ID, con sus datos de categoría.
 * @param {number} id_cliente - ID del cliente a consultado.
 * @returns {Promise<Object>} Objeto cliente o null. 
 */
exports.findById = async (id_cliente) => {
    const query = `
        SELECT 
            c.id_cliente, 
            c.nombre, 
            c.direccion, 
            c.cuit, 
            c.email, 
            c.categoria AS id_categoria,
            c.activo AS is_active,
            cat.nombre_categoria
        FROM Cliente c
        JOIN CategoriaCliente cat ON c.categoria = cat.id_categoria
        WHERE c.id_cliente = ?
    `;
    try {
        const [rows] = await db.query(query, [id_cliente]);
        return rows[0] || null;
    } catch (error) {
        console.error("Error fetching client by ID:", error);
        throw error;
    }
};

/**
 * Consulta todos los teléfonos asociados a un cliente.
 * Se modifica para devolver un objeto limpio, no una cadena.
 * @param {number} id_cliente - Cliente del que se quiere saber los telefonos.
 */
exports.findAllPhonesByClient = async (id_cliente) => {
    const query = `
        SELECT telefono, Descripcion
        FROM TelefonoCliente
        WHERE id_cliente = ?
    `;
    try {
        const [rows] = await db.query(query, [id_cliente]);
        // Devuelve el array de objetos directamente para el frontend de edición
        return rows.map(r => ({
            numero: r.telefono,
            descripcion: r.Descripcion || ''
        }));
    } catch (error) {
        console.error("Error fetching client phones for edit:", error);
        throw error;
    }
};

/**
 * Consulta todos los clientes, permitiendo filtros y ordenamiento, e incluyendo teléfonos.
 * @param {Object} options - { orderBy, sortOrder, searchField, searchTerm }.
 * @returns {Promise<Array>} Lista de objetos cliente.
 */
exports.findAll = async (options = {}) => {
    const { orderBy, sortOrder, searchField, searchTerm } = options;

    let query = `
        SELECT 
            c.id_cliente, 
            c.nombre, 
            c.direccion, 
            c.cuit, 
            c.email, 
            cat.nombre_categoria
        FROM Cliente c
        JOIN CategoriaCliente cat ON c.categoria = cat.id_categoria
    `;
    let params = [];
    let whereClauses = [];
    
    // --- Mapeo seguro de columnas para BÚSQUEDA ---
    const searchColumns = {
        // Columna Específica | Columna SQL
        todos: ['c.nombre', 'c.cuit', 'c.email'], // Búsqueda Global
        nombre: 'c.nombre',
        cuit: 'c.cuit',
        email: 'c.email',
    };

    // --- LÓGICA DE FILTRADO ---
    if (searchTerm && searchTerm.trim() !== '') {
        const term = `%${searchTerm.trim()}%`;
        const field = searchField in searchColumns ? searchField : 'todos';

        let fieldsToSearch = [];

        if (field === 'todos') {
            fieldsToSearch = searchColumns.todos;
        } else {
            fieldsToSearch = [searchColumns[field]];
        }
        
        const conditions = fieldsToSearch.map(f => `${f} LIKE ?`).join(' OR ');
        whereClauses.push(`(${conditions})`);
        
        // Añade el término tantas veces como campos se estén buscando
        fieldsToSearch.forEach(() => params.push(term));
    }
    
    if (whereClauses.length > 0) {
        query += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    
    // --- LÓGICA DE ORDENAMIENTO ---
    const allowedColumns = {
        nombre: 'c.nombre',
        cuit: 'c.cuit',
        email: 'c.email',
        categoria: 'cat.nombre_categoria'
    };

    if (orderBy && allowedColumns[orderBy]) {
        const orderDirection = sortOrder === 'DESC' ? 'DESC' : 'ASC';
        query += ` ORDER BY ${allowedColumns[orderBy]} ${orderDirection}`;
    } else {
        query += ` ORDER BY c.nombre ASC`; // Orden por defecto
    }
    
    try {
        const [rows] = await db.query(query, params);
        
        // 🚨 POST-PROCESAMIENTO: Obtener teléfonos para cada cliente (lento, pero necesario por ahora)
        const clientsWithPhones = await Promise.all(rows.map(async (client) => {
            const phones = await exports.findAllPhonesByClient(client.id_cliente);
            return { ...client, telefonos: phones };
        }));

        return clientsWithPhones;
    } catch (error) {
        console.error("Error fetching all clients with options:", error);
        throw error;
    }
};

/**
 * Registra un nuevo número de teléfono asociado a un cliente.
 * @param {number} id_cliente - Cliente al que se le asocian los telefonos.
 * @param {number} telefono - Numero de telefono.
 * @param {String} descripcion - Descripcion del numero de telefono.
 * @returns {Promise<number>} El ID del cliente modificado.
 */
exports.createPhone = async (id_cliente, telefono, descripcion) => {
    // La tabla es TelefonoCliente
    const query = `
        INSERT INTO TelefonoCliente (telefono, id_cliente, Descripcion)
        VALUES (?, ?, ?)
    `;
    try {
        const [result] = await db.query(query, [
            telefono,
            id_cliente,
            descripcion || null // Permite null si la descripción está vacía
        ]);
        return result.insertId;
    } catch (error) {
        console.error("Error creating phone for client:", error);
        throw error;
    }
};

/**
 * Elimina un teléfono específico de un cliente.
 * @param {number} id_cliente - Cliente a modificar.
 * @param {number} telefono - Telefono a eliminar.
 * @returns {Promise<number>} Cantidad de filas afectadas.
 */
exports.deletePhone = async (id_cliente, telefono) => {
    const query = `
        DELETE FROM TelefonoCliente
        WHERE id_cliente = ? AND telefono = ?
    `;
    try {
        const [result] = await db.query(query, [id_cliente, telefono]);
        return result.affectedRows;
    } catch (error) {
        console.error("Error deleting client phone:", error);
        throw error;
    }
};

/**
 * Reactiva un cliente marcando is_active = TRUE.
 */
/* exports.reactivateClient = async (id_cliente) => {
    const query = `
        UPDATE Cliente 
        SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE id_cliente = ?
    `;
    try {
        const [result] = await db.query(query, [id_cliente]);
        return result.affectedRows;
    } catch (error) {
        console.error("Error reactivating client:", error);
        throw error;
    }
}; */

/**
 * Cambia el estado de activación de un cliente (Soft Delete).
 * @param {number} id_cliente - ID del cliente a modificar.
 * @param {boolean} status - Nuevo estado (true para activo, false para inactivo).
 * @returns {Promise<number>} Cantidad de filas afectadas.
 */
exports.updateStatus = async (id_cliente, status) => {
    const sql = `
        UPDATE Cliente 
        SET activo = ?, ultima_modificacion = CURRENT_TIMESTAMP 
        WHERE id_cliente = ?
    `;
    try {
        const [result] = await db.execute(sql, [status ? 1 : 0, id_cliente]);
        return result.affectedRows;
    } catch (error) {
        console.error(`[Model:Client] Error en updateStatus: ${error.message}`);
        throw error;
    }
};