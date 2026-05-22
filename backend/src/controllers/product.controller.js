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

// --- CONSULTAR PRODUCTOS (Listado) ---
exports.getAllProducts = async (req, res) => {
    // Extrae los parámetros de ordenamiento y filtro del query string (ej: /api/products?orderBy=cliente&sortOrder=DESC)
    const { orderBy, sortOrder, searchField, searchTerm } = req.query; 
    
    const options = {
        orderBy: orderBy,
        sortOrder: sortOrder,
        searchField: searchField,
        searchTerm: searchTerm
    };

    try {
        const products = await Product.findAll(options); // Pasa las opciones al modelo
        res.status(200).json(products);
    } catch (error) {
        console.error("Error retrieving product list:", error);
        res.status(500).json({ message: "Error retrieving product list." });
    }
};

// --- CONSULTAR TIPOS DE PRODUCTO ---
exports.getProductTypes = async (req, res) => {
    try {
        const types = await Product.findAllProductTypes();
        res.status(200).json(types);
    } catch (error) {
        console.error("Error retrieving product types:", error);
        res.status(500).json({ message: "Error retrieving product types list." });
    }
};

// --- CONSULTAR MODELOS DE PRODUCTO ---
exports.getProductModels = async (req, res) => {
    const { typeId } = req.query; // Obtener el ID del tipo de producto del query string (ej: ?typeId=1)
    try {
        const models = await Product.findAllProductModels(typeId);
        res.status(200).json(models);
    } catch (error) {
        console.error("Error retrieving product models:", error);
        res.status(500).json({ message: "Error retrieving product models list." });
    }
};

// --- CREAR PRODUCTO (ALTA) ---
exports.createProduct = async (req, res) => {
    const { id_cliente, modelo, observaciones, fecha_recepcion, fecha_entrega_pactada } = req.body;
    
    if (!id_cliente || !modelo || !fecha_recepcion) {
        return res.status(400).json({ message: "Client ID, Model, and Reception Date are required." });
    }

    try {
        const newProductId = await Product.create({ 
            id_cliente, 
            modelo, 
            observaciones,
            fecha_recepcion,
            // Nota: El estado 'Recibida' (ID 1) se establece en el modelo.
            // La fecha_entrega_pactada se puede almacenar en otra tabla de Órdenes/Comprobantes después.
        });
        res.status(201).json({ message: "Product received and registered successfully.", id_producto: newProductId });
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ message: "Error registering new product." });
    }
};

// --- CONSULTAR PRODUCTO POR ID (Detalle) ---
exports.getProductById = async (req, res) => {
    const { id_producto } = req.params;
    try {
        const product = await Product.findById(id_producto);
        
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }
        
        res.status(200).json(product);
    } catch (error) {
        console.error("Error retrieving product by ID:", error);
        res.status(500).json({ message: "Error retrieving product data." });
    }
};

// --- MODIFICAR PRODUCTO ---
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

        // Manejo de errores catastróficos
        console.error("Error updating product:", error);
        res.status(500).json({ message: "Error updating product data." });
    }
};

// --- CONSULTAR ESTADOS DE PRODUCTO ---
exports.getProductStates = async (req, res) => {
    try {
        const states = await Product.findAllProductStates();
        res.status(200).json(states);
    } catch (error) {
        console.error("Error retrieving product states:", error);
        res.status(500).json({ message: "Error retrieving product states list." });
    }
};