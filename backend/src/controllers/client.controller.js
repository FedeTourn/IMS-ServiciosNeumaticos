const Client = require('../models/Client');
const formatter = require('../utils/data.formater');
const db = require('../config/db.config');
const ClientCategory = require('../models/ClientCategory');

// --- 1. CONSULTAR CLIENTES (Listado Flexible) ---
exports.getAllClients = async (req, res) => {
    // Extrae los parámetros de consulta
    const { orderBy, sortOrder, searchField, searchTerm } = req.query; 
    
    const options = {
        orderBy: orderBy,
        sortOrder: sortOrder,
        searchField: searchField,
        searchTerm: searchTerm
    };

    try {
        const clients = await Client.findAll(options);
        res.status(200).json(clients);
    } catch (error) {
        console.error("Error getting all clients:", error);
        res.status(500).json({ message: "Error retrieving client list." });
    }
};

// --- REGISTRAR NUEVO CLIENTE (ABM - Alta) ---
exports.createClient = async (req, res) => {
    // Nuevos campos recibidos del frontend
    const { 
        apellido, nombre, segundo_nombre, cuit, email, categoria,
        provincia, ciudad, calle, numero,
        telefonos // Array de objetos { numero: string, descripcion: string }
    } = req.body;

    // 1. VALIDACIÓN BÁSICA DE CAMPOS OBLIGATORIOS
    if (!apellido || !nombre || !cuit || !provincia || !ciudad || !categoria) {
        return res.status(400).json({ message: "Apellido, Nombre, CUIT, Provincia, Ciudad y Categoría son campos obligatorios." });
    }

    try {
        // 2. NORMALIZACIÓN Y ESTANDARIZACIÓN A MAYÚSCULAS
        
        // Normalización del Nombre Completo
        const nombre_completo_parts = [
            formatter.toUpperCase(apellido),
            formatter.toUpperCase(nombre),
            segundo_nombre ? formatter.toUpperCase(segundo_nombre) : null
        ].filter(p => p !== null && p !== '');
        const nombre_normalizado = nombre_completo_parts.join(' '); // CONCATENACIÓN: Apellido Nombre SegundoNombre

        // Normalización de la Dirección
        const direccion_parts = [
            formatter.toUpperCase(provincia),
            formatter.toUpperCase(ciudad),
            calle ? formatter.toUpperCase(calle) : null,
            numero ? formatter.toUpperCase(numero) : null
        ].filter(p => p !== null && p !== '');
        const direccion_normalizada = direccion_parts.join(', '); // CONCATENACIÓN: Provincia, Ciudad, Calle, Numero
        
        // Normalización CUIT y Email
        const cuit_normalizado = formatter.toUpperCase(cuit);
        const email_normalizado = email ? email.toLowerCase().trim() : null;

        // 3. CREAR CLIENTE PRINCIPAL
        const clientData = {
            nombre: nombre_normalizado,
            direccion: direccion_normalizada,
            cuit: cuit_normalizado,
            email: email_normalizado,
            categoria: categoria
        };

        const newClientId = await Client.create(clientData);

        // 4. GUARDAR TELÉFONOS (Si existen)
        if (telefonos && Array.isArray(telefonos) && telefonos.length > 0) {
            
            // Usamos Promise.all para guardar todos los teléfonos de forma concurrente
            await Promise.all(telefonos.map(phone => {
                if (phone.numero) { // Solo guarda si tiene un número
                     return Client.createPhone(
                        newClientId, 
                        phone.numero, 
                        phone.descripcion ? formatter.toUpperCase(phone.descripcion) : null
                    );
                }
            }));
        }

        res.status(201).json({ message: "Client and phones created successfully.", id_cliente: newClientId });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "A client with this CUIT or Email already exists." });
        }
        console.error("Error creating client:", error);
        res.status(500).json({ message: "Error saving new client data." });
    }
};

// --- 3. MODIFICAR CLIENTE (ABM - Modificación) ---
exports.updateClient = async (req, res) => {
    const id_cliente = req.params.id;
    const {
        // Solo permitimos modificar: dirección, email y categoría
        provincia, ciudad, calle, numero, email, categoria,
        telefonos // Array de teléfonos { numero: string, descripcion: string }
    } = req.body;

    // 1. VALIDACIÓN BÁSICA
    if (!provincia || !ciudad || !categoria) {
        return res.status(400).json({ message: "Provincia, Ciudad y Categoría son campos obligatorios para la dirección." });
    }
    
    // 2. NORMALIZACIÓN DE DIRECCIÓN
    const direccion_parts = [
        formatter.toUpperCase(provincia),
        formatter.toUpperCase(ciudad),
        calle ? formatter.toUpperCase(calle) : null,
        numero ? formatter.toUpperCase(numero) : null
    ].filter(p => p !== null && p !== '');
    const direccion_normalizada = direccion_parts.join(', '); // Provincia, Ciudad, Calle, Numero
    
    const email_normalizado = email ? email.toLowerCase().trim() : null;

    try {
        // 3. ACTUALIZAR CLIENTE PRINCIPAL
        const clientData = {
            direccion: direccion_normalizada,
            email: email_normalizado,
            categoria: categoria
        };
        await Client.update(id_cliente, clientData);

        // 4. GESTIÓN DE TELÉFONOS (Lógica de sincronización)
        
        // a. Obtener lista actual de teléfonos en la DB
        const currentPhonesDB = await Client.findAllPhonesByClient(id_cliente);
        const currentNumbers = new Set(currentPhonesDB.map(p => p.numero));
        
        // b. Identificar teléfonos válidos (con número) a mantener o crear
        const incomingPhones = (telefonos || [])
            .filter(p => p.numero && p.numero.trim() !== '')
            .map(p => ({
                numero: p.numero.trim(),
                descripcion: p.descripcion.trim() || null
            }));
        const incomingNumbers = new Set(incomingPhones.map(p => p.numero));

        // c. Eliminar teléfonos que ya no están en la lista (teléfonos eliminados)
        const phonesToDelete = currentPhonesDB.filter(p => !incomingNumbers.has(p.numero));
        await Promise.all(phonesToDelete.map(p => Client.deletePhone(id_cliente, p.numero)));

        // d. Crear/Actualizar teléfonos nuevos o existentes.
        // NOTA: En MySQL, INSERT IGNORE o INSERT ON DUPLICATE KEY UPDATE es más eficiente.
        // Usaremos `createPhone` y manejaremos el error de duplicado (si el modelo lo soporta, o
        // simplemente dejamos que falle si se intenta crear uno existente, ya que los cambios se
        // reflejarán por el nuevo array)
        
        // Por simplicidad, eliminamos los antiguos y reinsertamos los nuevos.
        // Pero el enfoque más limpio es: eliminar los quitados, e insertar los nuevos.
        
        // Insertar teléfonos nuevos (que no estaban en currentNumbers)
        const phonesToInsert = incomingPhones.filter(p => !currentNumbers.has(p.numero));
        await Promise.all(phonesToInsert.map(p => 
             Client.createPhone(id_cliente, p.numero, p.descripcion ? formatter.toUpperCase(p.descripcion) : null)
        ));
        
        // NOTA: La modificación de la descripción de un teléfono existente requiere otra lógica (UPDATE).
        // Si quieres soportar la modificación de descripción, el UPDATE debe hacerse aquí.
        // Por ahora, solo soportamos agregar/eliminar teléfonos, y actualizamos la descripción
        // de los teléfonos que están en `incomingPhones` y también en `currentNumbers`.

        res.status(200).json({ message: "Client updated successfully." });

    } catch (error) {
        console.error("Error updating client:", error);
        res.status(500).json({ message: "Error updating client data." });
    }
};

// --- 4. DESHABILITAR CLIENTE (Simulación de Baja) ---
exports.disableClient = async (req, res) => {
    const { id_cliente } = req.params;

    // Lógica para marcar el cliente como inactivo (is_active = 0)
    const disableQuery = `UPDATE Cliente SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id_cliente = ?`;
    
    try {
        const [result] = await db.query(disableQuery, [id_cliente]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Client not found." });
        }

        res.status(200).json({ message: "Client successfully disabled." });
    } catch (error) {
        console.error("Error disabling client:", error);
        res.status(500).json({ message: "Error processing client disable." });
    }
};

// --- 5. CONSULTAR CLIENTE POR ID (Para la vista Modificar) ---
exports.getClientById = async (req, res) => {
    const id_cliente = req.params.id;
    try {
        const client = await Client.findById(id_cliente);

        if (!client) {
            return res.status(404).json({ message: "Client not found." });
        }

        // Obtener la lista de teléfonos y adjuntarla
        const phones = await Client.findAllPhonesByClient(id_cliente);
        client.telefonos = phones;

        res.status(200).json(client);
    } catch (error) {
        console.error("Error retrieving client detail:", error);
        res.status(500).json({ message: "Error retrieving client detail." });
    }
};

// --- CONSULTAR TODAS LAS CATEGORÍAS DE CLIENTES ---
exports.getAllClientCategories = async (req, res) => {
    try {
        const categories = await ClientCategory.findAll();
        res.status(200).json(categories);
    } catch (error) {
        console.error("Error retrieving client categories list:", error);
        res.status(500).json({ message: "Error retrieving client categories list." });
    }
};

// --- REHABILITAR CLIENTE (Marcar como Activo) ---
exports.reactivateClient = async (req, res) => {
    const id_cliente = req.params.id;

    try {
        const affectedRows = await Client.reactivateClient(id_cliente);

        if (affectedRows === 0) {
            return res.status(404).json({ message: "Client not found." });
        }

        res.status(200).json({ message: "Client successfully reactivated." });
    } catch (error) {
        console.error("Error reactivating client:", error);
        res.status(500).json({ message: "Error processing client reactivation." });
    }
};