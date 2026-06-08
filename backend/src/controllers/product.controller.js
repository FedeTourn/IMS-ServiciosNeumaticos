const Product = require('../models/Product');
const ProductService = require('../services/product.service');

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

// ---------------------------------------------------------
// MANEJO DE TIPOS DE PRODUCTO
// ---------------------------------------------------------

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
 * Registrar un nuevo Tipo de Producto.
 */
exports.createProductType = async (req, res) => {
    try {
        const { nombre } = req.body;
        const result = await ProductService.createType(nombre);
        res.status(201).json({ 
            message: "Tipo de producto creado exitosamente.", 
            id_tipo: result 
        });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Error en ProductController.createProductType:", error);
        res.status(500).json({ message: "Error interno al crear el tipo de producto." });
    }
};

/**
 * Actualizar un Tipo de Producto existente.
 */
exports.updateProductType = async (req, res) => {
    try {
        const { id_tipo } = req.params;
        const { nombre } = req.body;
        
        await ProductService.updateType(id_tipo, nombre);
        
        res.status(200).json({ message: "Tipo de producto actualizado exitosamente." });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Error en ProductController.updateProductType:", error);
        res.status(500).json({ message: "Error interno al actualizar el tipo de producto." });
    }
};

/**
 * Consultar un tipo de producto por ID.
 */
exports.getProductTypeById = async (req, res) => {
    try {
        const { id_tipo } = req.params;
        const result = await ProductService.getProductTypeById(id_tipo);
        res.status(200).json(result);
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Error en ProductController.getProductTypeById:", error);
        res.status(500).json({ message: "Error interno al consultar el tipo de producto." });
    }
};

// ---------------------------------------------------------
// MANEJO DE MODELOS DE PRODUCTO
// ---------------------------------------------------------

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