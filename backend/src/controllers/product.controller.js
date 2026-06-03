const Product = require('../models/Product');
const ProductService = require('../services/product.service');

// --- CONSULTAR PRODUCTOS (Listado) ---
/* exports.getAllProducts = async (req, res) => {
    // Nota: Aquí se implementaría la lógica de filtrado y ordenamiento [cite: 88]
    try {
        const products = await Product.findAll();
        res.status(200).json(products);
    } catch (error) {
        console.error("Error retrieving product list:", error);
        res.status(500).json({ message: "Error retrieving product list." });
    }
}; */

/**
 * Consultar todos los productos.
 */
exports.getAllProducts = async (req, res) => {
    // Extrae los parámetros de ordenamiento y filtro del query string (ej: /api/products?orderBy=cliente&sortOrder=DESC)
    try {
        const { orderBy, sortOrder, searchField, searchTerm } = req.query; 
    
        const options = {
            orderBy: orderBy,
            sortOrder: sortOrder,
            searchField: searchField,
            searchTerm: searchTerm
        };

        const result = await ProductService.getAllProducts(options);
        
        res.status(200).json(result);
    } catch (error) {
        // Manejo de errores controlados por la lógica de negocio
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Error retrieving product list:", error);
        res.status(500).json({ message: "Error retrieving product list." });
    }
};

/**
 * Consultar los tipos de productos.
 */
exports.getProductTypes = async (req, res) => {
    try {
        const result = await ProductService.getProductTypes();
        res.status(200).json(result);
    } catch (error) {
        // Manejo de errores controlados por la lógica de negocio
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Error retrieving product types:", error);
        res.status(500).json({ message: "Error retrieving product types list." });
    }
};

/**
 * Consultar los modelos de productos.
 */
exports.getProductModels = async (req, res) => {
    const { type_id } = req.query;  // Obtener el ID del tipo de producto del query string (ej: ?typeId=1)
    try {
        const result = await ProductService.getProductModels(type_id);
        res.status(200).json(result);
    } catch (error) {
        // Manejo de errores controlados por la lógica de negocio
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Error retrieving product models:", error);
        res.status(500).json({ message: "Error retrieving product models list." });
    }
};

/**
 * Crear producto.
 */
exports.createProduct = async (req, res) => {
    try {
        const { id_cliente, modelo, observaciones, fecha_recepcion, fecha_entrega_pactada } = req.body;
        const result = await ProductService.createProduct(id_cliente, modelo, observaciones, fecha_recepcion, fecha_entrega_pactada);

        res.status(201).json(result);
    } catch (error) {
        // Manejo de errores controlados por la lógica de negocio
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Error creating product:", error);
        res.status(500).json({ message: "Error registering new product." });
    }
};

/**
 * Consultar producto por ID (Detalle)
 */
exports.getProductById = async (req, res) => {
    try {
        const result = await ProductService.getProductById(req.params.id_producto);
        res.status(200).json(result);

    } catch (error) {
        // Manejo de errores controlados por la lógica de negocio
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Error retrieving product by ID:", error);
        res.status(500).json({ message: "Error retrieving product data." });
    }
};

/**
 * Modificar Producto
 */
exports.updateProduct = async (req, res) => {
    try {
        const { id_producto } = req.params;
        const { observaciones, estado } = req.body; // 'estado' es el NUEVO estado (ID)
        const result = await ProductService.updateProductState(id_producto, estado, observaciones);

        res.status(200).json(result);
    } catch (error) {
        // Manejo de errores controlados por la lógica de negocio
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Error updating product:", error);
        res.status(500).json({ message: "Error updating product data." });
    }
};

/**
 * Consultar estados de producto
 */
exports.getProductStates = async (req, res) => {
    try {
        const result = await ProductService.getProductStates();
        res.status(200).json(result);
    } catch (error) {
        // Manejo de errores controlados por la lógica de negocio
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Error retrieving product states:", error);
        res.status(500).json({ message: "Error retrieving product states list." });
    }
};