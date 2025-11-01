const db = require('../config/db.config'); 

/**
 * Busca todos los clientes con su categoría.
 * @returns {Promise<Array>} Lista de objetos cliente.
 */
exports.findAll = async () => {
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
};

/**
 * Registra un nuevo cliente. (Crear Cliente)
 * Requisito: Validar unicidad por CUIT, Apellido y Nombre, o Email. 
 * Nota: Solo validamos CUIT y Email por ser identificadores técnicos.
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
 * Modifica la información de un cliente. (Modificar Cliente)
 * Requisito: Los campos modificables son dirección y teléfono (aunque teléfono necesita su propia tabla TelefonoCliente).
 * Por ahora, solo modificaremos dirección y email para mantenerlo simple.
 */
exports.update = async (id_cliente, updateData) => {
    // Solo permitiremos modificar dirección y email por simplicidad inicial
    const query = `
        UPDATE Cliente SET 
            direccion = ?, 
            email = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id_cliente = ?
    `;
    try {
        const [result] = await db.query(query, [
            updateData.direccion,
            updateData.email,
            id_cliente
        ]);
        return result.affectedRows;
    } catch (error) {
        console.error("Error updating client:", error);
        throw error;
    }
};

/**
 * Obtiene un solo cliente por ID (para la vista "Modificar").
 */
exports.findById = async (id_cliente) => {
    const query = `
        SELECT c.*, cat.nombre_categoria FROM Cliente c
        JOIN CategoriaCliente cat ON c.categoria = cat.id_categoria
        WHERE c.id_cliente = ?
    `;
     try {
        const [rows] = await db.query(query, [id_cliente]);
        return rows[0] || null;
    } catch (error) {
        console.error("Error finding client by ID:", error);
        throw error;
    }
}