/**
 * @file product.service.js
 * @description Capa de lógica de negocio para la gestión de productos (válvulas).
 */
const Product = require('../models/Product');

class ProductService {

    static async getAllProducts(options){
        const products = await Product.findAll(options); // Pasa las opciones al modelo
        return products;
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
        if (current_state_id !== new_state_id) {
            // Consultamos la BD para ver los destinos permitidos
            const allowed_states = await Product.findAllowedDestinations(current_state_id);

            if (!allowed_states.includes(new_state_id)) {
                throw { 
                    status: 403, 
                    message: `Transición no permitida: No se puede pasar del estado '${product.estado_nombre}' al estado destino con ID ${new_state_id}.` 
                };
            }
        }
        
        // Si la transición es válida o solo se cambiaron las observaciones, actualizar
        const affectedRows = await Product.update(id_producto, { observaciones, estado: new_state_id });
        if (affectedRows === 0) {
            throw { status: 404, message: "Product not found or no changes made." };
        }

        return { message: "Product updated successfully." };
    };

    static async getProductStates(){
        const states = await Product.findAllProductStates();
        return states;
    }

    // ---------------------------------------------------------
    // MANEJO DE TIPOS DE PRODUCTO
    // ---------------------------------------------------------

    static async getProductTypes(){
        const types = await Product.findAllProductTypes();
        return types
    };

    /**
     * Valida y crea un nuevo Tipo de Producto.
     * @param {string} nombre - Nombre del nuevo tipo.
     * @returns {Promise<number>} ID del tipo creado.
     * @throws {Object} Error si el nombre es inválido o ya existe.
     */
    static async createType(nombre) {
        // 1. Validación de formato
        if (!nombre || nombre.trim() === '') {
            throw { status: 400, message: "El nombre del tipo de producto no puede estar vacío." };
        }

        const nombreNormalizado = nombre.trim().toUpperCase();

        // 2. Verificación de duplicidad
        const allTypes = await Product.findAllProductTypes();
        const exists = allTypes.find(t => t.nombre.toUpperCase() === nombreNormalizado);
        
        if (exists) {
            throw { status: 409, message: "Ya existe un tipo de producto con ese nombre." };
        }

        return await Product.createType({ nombre: nombreNormalizado });
    }

    /**
     * Obtiene un tipo de producto por su ID.
     */
    static async getProductTypeById(id_tipo) {
        const type = await Product.findTypeById(id_tipo);
        if (!type) {
            throw { status: 404, message: "Tipo de producto no encontrado." };
        }
        return type;
    }

    /**
     * Valida y actualiza un Tipo de Producto existente.
     * @param {number} id_tipo - ID del tipo a modificar.
     * @param {string} nombre - Nuevo nombre.
     * @returns {Promise<number>} Cantidad de filas afectadas.
     * @throws {Object} Error si el nombre es inválido o si el ID no existe.
     */
    static async updateType(id_tipo, nombre) {
        // 1. Validación de formato
        if (!nombre || nombre.trim() === '') {
            throw { status: 400, message: "El nombre del tipo de producto no puede estar vacío." };
        }

        // 2. Verificación de existencia previa
        const existingType = await Product.findTypeById(id_tipo);
        if (!existingType) {
            throw { status: 404, message: "Tipo de producto no encontrado." };
        }

        const nombreNormalizado = nombre.trim().toUpperCase();

        // 3. Verificación de duplicidad (excluyendo el actual)
        const allTypes = await Product.findAllProductTypes();
        const isDuplicate = allTypes.find(t => t.nombre.toUpperCase() === nombreNormalizado && t.id_tipo !== parseInt(id_tipo));

        if (isDuplicate) {
            throw { status: 409, message: "Ya existe otro tipo de producto con ese nombre." };
        }

        return await Product.updateType(id_tipo, { nombre: nombreNormalizado });
    }
    
    // ---------------------------------------------------------
    // MANEJO DE MODELOS DE PRODUCTO
    // ---------------------------------------------------------
    
    static async getProductModels(typeId){
        const models = await Product.findAllProductModels(typeId);
        return models
    };

    /**
     * Obtiene la información detallada de un modelo de producto específico.
     * @param {number} id_modelo - ID del modelo a consultar.
     * @returns {Promise<Object>} Datos del modelo encontrado.
     * @throws {Object} Error 404 si el modelo no existe en el sistema.
     */
    static async getProductModelById(id_modelo) {
        const model = await Product.findModelById(id_modelo);
        if (!model) {
            throw { status: 404, message: "Modelo de producto no encontrado." };
        }
        return model;
    }

    /**
     * Valida la existencia del tipo de producto y registra un nuevo Modelo.
     * @param {string} nombre - Nombre identificador del modelo.
     * @param {number} tipo - ID del TipoProducto asociado (FK).
     * @returns {Promise<number>} ID del nuevo modelo registrado.
     * @throws {Object} Error 400 por campos vacíos o 404 si el tipo no existe.
     */
    static async createModel(nombre, tipo) {
        if (!nombre || nombre.trim() === '' || !tipo) {
            throw { status: 400, message: "El nombre del modelo y el ID de tipo son requeridos." };
        }

        
        const existingType = await Product.findTypeById(tipo);
        if (!existingType) {
            throw { status: 404, message: `Operación abortada: El tipo de producto con ID ${tipo} no existe.` };
        }

        const nombreNormalizado = nombre.trim().toUpperCase();

        
        return await Product.createModel({
            nombre: nombreNormalizado,
            tipo: parseInt(tipo)
        });
    }

    /**
     * Valida y actualiza un Modelo de Producto existente.
     * @param {number} id_modelo - ID del modelo a modificar.
     * @param {string} nombre - Nuevo nombre del modelo.
     * @param {number} tipo - Nuevo ID de tipo asociado.
     * @returns {Promise<number>} Cantidad de filas afectadas.
     * @throws {Object} Error si los datos son inválidos, si el modelo o el tipo no existen.
     */
    static async updateModel(id_modelo, nombre, tipo) {
        if (!id_modelo || !nombre || nombre.trim() === '' || !tipo) {
            throw { status: 400, message: "Todos los campos son requeridos para actualizar el modelo." };
        }

        // Verificar la existencia del tipo maestro
        const existingType = await Product.findTypeById(tipo);
        if (!existingType) {
            throw { status: 404, message: `El tipo de producto asignado (ID: ${tipo}) no existe.` };
        }

        const nombreNormalizado = nombre.trim().toUpperCase();

        const affectedRows = await Product.updateModel(id_modelo, {
            nombre: nombreNormalizado,
            tipo: parseInt(tipo)
        });

        if (affectedRows === 0) {
            throw { status: 404, message: "Modelo de producto no encontrado o sin cambios." };
        }

        return affectedRows;
    }

    /**
     * Consulta el diccionario de estados permitidos (matriz de transiciones).
     * @returns {Promise<Array>} Lista de todas las transiciones válidas.
     */
    static async getStateTransitions() {
        const transitions = await Product.getAllStateTransitions();
        return transitions;
    }
}

module.exports = ProductService;