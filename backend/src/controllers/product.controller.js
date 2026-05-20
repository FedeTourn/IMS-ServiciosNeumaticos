const Product = require('../models/Product');

// --- FUNCIONES AUXILIARES ---

// Mapeo de IDs de estado de DB (Verificar que coincidan)
const STATE_IDS = {
    RECIBIDO: 1,
    EN_REPARACION: 2,
    REPARADO: 3,
    ENTREGADO: 4,
    NO_REPARABLE: 5,
    LIBRE: 6
};

// Reglas de Transición: ID_ESTADO_ACTUAL: [IDs_ESTADOS_POSIBLES]
const TRANSITION_RULES = {
    // 1: RECIBIDA -> Todos son posibles (2, 3, 4, 5, 6)
    [STATE_IDS.RECIBIDO]: [2, 3, 4, 5, 6], 

    // 2: EN_REPARACION -> Todos excepto Recibido (1)
    [STATE_IDS.EN_REPARACION]: [3, 4, 5, 6], 
    
    // 3: REPARADA -> Entregado (4) y Libre (6)
    [STATE_IDS.REPARADO]: [4, 6],
    
    // 4: ENTREGADA -> Ninguno (El producto sale del sistema)
    [STATE_IDS.ENTREGADO]: [], 
    
    // 5: NO_REPARABLE -> Entregado (4) o Libre (6)
    [STATE_IDS.NO_REPARABLE]: [4, 6],
    
    // 6: LIBRE -> Todos menos Recibido (1)
    [STATE_IDS.LIBRE]: [2, 3, 4, 5]
};




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
    const { id_producto } = req.params;
    const { observaciones, estado } = req.body; // 'estado' es el NUEVO estado (ID)
    
    if (!estado) {
        return res.status(400).json({ message: "Product state is required." });
    }

    try {
        // 1. Obtener el estado ACTUAL y la información del producto
        const product = await Product.findById(id_producto);
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }
        
        const current_state_id = product.estado; // ID del estado actual
        const new_state_id = parseInt(estado); // ID del estado propuesto

        // 2. VERIFICAR RESTRICCIONES DE TRANSICIÓN
        const allowed_states = TRANSITION_RULES[current_state_id];

        // Verificar si la transición es válida
        if (current_state_id !== new_state_id && (!allowed_states || !allowed_states.includes(new_state_id))) {
             return res.status(403).json({ 
                 message: `Transition not allowed: Cannot move from '${product.estado_nombre}' to '${(await Product.findById(new_state_id)).estado_nombre}'.` 
             });
        }
        
        // 3. Si la transición es válida o solo se cambiaron las observaciones, actualizar
        const affectedRows = await Product.update(id_producto, { observaciones, estado });
        
        if (affectedRows === 0) {
            return res.status(404).json({ message: "Product not found or no changes made." });
        }

        res.status(200).json({ message: "Product updated successfully." });
    } catch (error) {
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