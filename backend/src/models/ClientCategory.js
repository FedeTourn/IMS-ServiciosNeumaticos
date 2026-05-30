const { pool:db } = require('../config/db.config');

/**
 * Consulta todas las categorías de clientes.
 * @returns {Promise<Array>} Lista de objetos de categoría.
 */
exports.findAll = async () => {
    const query = `
        SELECT id_categoria, nombre_categoria 
        FROM CategoriaCliente
        ORDER BY id_categoria ASC
    `;
    try {
        const [rows] = await db.query(query);
        return rows;
    } catch (error) {
        console.error("Error fetching client categories:", error);
        throw error;
    }
};

// Se van a añadir funciones como exports.findById, exports.create, etc. para el manejo de las categorias desde el sistema