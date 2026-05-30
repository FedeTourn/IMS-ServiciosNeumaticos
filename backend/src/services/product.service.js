/**
 * @file product.service.js
 * @description Capa de lógica de negocio para la gestión de productos (válvulas).
 */
const Product = require('../models/Product');

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

class ProductService {

    static async getAllProducts(options){
        const products = await Product.findAll(options); // Pasa las opciones al modelo
        return products;
    };

    static async getProductTypes(){
        const types = await Product.findAllProductTypes();
        return types
    };

    
    static async getProductModels(typeId){
        const models = await Product.findAllProductModels(typeId);
        return models
    };

    static async createProduct(id_cliente, modelo, observaciones, fecha_recepcion, fecha_entrega_pactada){
        
        if (!id_cliente || !modelo || !fecha_recepcion) {
            throw { status: 400, message: "Client ID, Model, and Reception Date are required." };
        }

        const newProductId = await Product.create({ 
            id_cliente, 
            modelo, 
            observaciones,
            fecha_recepcion,
            // Nota: El estado 'Recibida' (ID 1) se establece en el modelo.
            // La fecha_entrega_pactada se puede almacenar en otra tabla de Órdenes/Comprobantes después.
        });

        return { message: "Product received and registered successfully.", id_producto: newProductId };
    };

    static async getProductById(id_producto){
        const product = await Product.findById(id_producto);

        if (!product) {
            throw { status: 404, message: "Product not found." };
        }

        return product;
    };

    /**
     * Valida y ejecuta la actualización de estado de un producto.
     * @param {number|string} id_producto - ID del producto a modificar.
     * @param {number} estado - ID del nuevo estado propuesto.
     * @param {string} observaciones - Observaciones adicionales.
     * @returns {Object} Objeto con mensaje de éxito.
     * @throws {Object} Objeto con código de estado HTTP y mensaje de error.
     */
    static async updateProductState(id_producto, estado, observaciones) {
        if (!estado) {
            throw { status: 400, message: "Product state is required." };
        }

        // Obtener el estado ACTUAL y la información del producto
        const product = await Product.findById(id_producto);
        if (!product) {
            throw { status: 404, message: "Product not found." };
        }
        
        const current_state_id = product.estado; // ID del estado actual
        const new_state_id = parseInt(estado); // ID del estado propuesto

        // Verificar transiciones posibles
        const allowed_states = TRANSITION_RULES[current_state_id];

        // Regla de Negocio: Verificación de Transición
        if (current_state_id !== new_state_id && (!allowed_states || !allowed_states.includes(new_state_id))) {
            throw { status: 403, message: "Transition not allowed: Cannot move from '${product.estado_nombre}' to '${(await Product.findById(new_state_id)).estado_nombre}'." };
        }
        
        // Si la transición es válida o solo se cambiaron las observaciones, actualizar
        const affectedRows = await Product.update(id_producto, { observaciones, estado });
        if (affectedRows === 0) {
            throw { status: 404, message: "Product not found or no changes made." };
        }

        return { message: "Product updated successfully." };
    };

    static async getProductStates(){
        const states = await Product.findAllProductStates();
        return states;
    }
}

module.exports = ProductService;