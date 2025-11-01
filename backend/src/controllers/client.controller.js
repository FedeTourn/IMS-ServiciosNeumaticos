const Client = require('../models/Client');

// --- 1. CONSULTAR CLIENTES ---
exports.getAllClients = async (req, res) => {
    try {
        const clients = await Client.findAll();
        // Nota: En una fase posterior, se implementaría el filtrado y ordenamiento[cite: 108].
        res.status(200).json(clients);
    } catch (error) {
        console.error("Error getting all clients:", error);
        res.status(500).json({ message: "Error retrieving client list." });
    }
};

// --- 2. REGISTRAR NUEVO CLIENTE (ABM - Alta) ---
exports.createClient = async (req, res) => {
    const { nombre, direccion, cuit, email, categoria } = req.body;

    if (!nombre || !cuit) {
        return res.status(400).json({ message: "Nombre y CUIT son campos requeridos." });
    }
    
    // Requisito: Validar unicidad (simple)
    // Nota: Una implementación real requeriría una función de modelo más robusta para verificar unicidad.

    // 1. APLICAR FORMATO A LOS DATOS ANTES DE USARLOS
    nombre = formatter.toUpperCase(nombre);
    direccion = formatter.toUpperCase(direccion);
    cuit = formatter.toUpperCase(cuit);
    email = email ? email.toLowerCase().trim() : null; // Limpieza simple para el email

    try {
        const newClientId = await Client.create({ nombre, direccion, cuit, email, categoria });
        res.status(201).json({ message: "Client created successfully.", id_cliente: newClientId });
    } catch (error) {
        // Manejo de error específico (ej. duplicidad de CUIT/Email)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "A client with this CUIT or Email already exists." });
        }
        console.error("Error creating client:", error);
        res.status(500).json({ message: "Error saving new client data." });
    }
};

// --- 3. MODIFICAR CLIENTE (ABM - Modificación) ---
exports.updateClient = async (req, res) => {
    const { id_cliente } = req.params;
    const { direccion, email } = req.body; // Solo permitimos modificar estos campos por el momento

    try {
        const affectedRows = await Client.update(id_cliente, { direccion, email });
        
        if (affectedRows === 0) {
            return res.status(404).json({ message: "Client not found or no changes made." });
        }

        res.status(200).json({ message: "Client updated successfully." });
    } catch (error) {
        console.error("Error updating client:", error);
        res.status(500).json({ message: "Error updating client data." });
    }
};

// --- 4. DESHABILITAR CLIENTE (Simulación de Baja) ---
// Para esto, asumiremos que agregamos un campo 'is_active' (BOOLEAN) a la tabla Cliente
// Nota: Debes modificar tu tabla Cliente para incluir 'is_active BOOLEAN NOT NULL DEFAULT TRUE'

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
    const { id_cliente } = req.params;
    try {
        const client = await Client.findById(id_cliente);
        
        if (!client) {
            return res.status(404).json({ message: "Client not found." });
        }
        
        // Si todo va bien, devolvemos el objeto cliente como JSON.
        res.status(200).json(client);
    } catch (error) {
        console.error("Error retrieving client by ID:", error);
        res.status(500).json({ message: "Error retrieving client data." });
    }
};