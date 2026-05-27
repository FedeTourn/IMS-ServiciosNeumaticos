const Client = require('../models/Client');
const ClientCategory = require('../models/ClientCategory');
const ClientService = require('../services/client.service');

/**
 * Consulta clientes (listado flexible)
 */
exports.getAllClients = async (req, res) => {
    try {
        const result = await ClientService.getAllClients(req.query);
        res.status(200).json(result);
    } catch (error) {
        // Manejo de errores controlados por la lógica de negocio
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Error getting all clients:", error);
        res.status(500).json({ message: "Error retrieving client list." });
    }
};

/**
 * Registrar un nuevo cliente
 */
exports.createClient = async (req, res) => {
    try {
        const result = await ClientService.createClient(req.body);
        res.status(201).json(result);

    } catch (error) {
        if(error.status){
            return res.status(error.status).json({ message: error.message }); 
        }
        console.error("Error creating client:", error);
        res.status(500).json({ message: "Error saving new client data." });
    }
};

/**
 * Modificar Cliente
 */
exports.updateClient = async (req, res) => {
    try {
        const result = await ClientService.updateClient(req.params.id, req.body);
        res.status(200).json(result);

    } catch (error) {
        if(error.status){
            return res.status(error.status).json({ message: error.message }); 
        }
        console.error("Error updating client:", error);
        res.status(500).json({ message: "Error updating client data." });
    }
};

/**
 * Deshabilitar cliente (Baja)
 */
exports.disableClient = async (req, res) => {
    try {
        const result = await ClientService.updateStatus(req.params.id, false);
        res.status(200).json(result);
    } catch (error) {
        if(error.status){
            return res.status(error.status).json({ message: error.message }); 
        }
        console.error("Error disabling client:", error);
        res.status(500).json({ message: "Error al procesar la baja del cliente." });
    }
};

/**
 * Rehabilitar cliente
 */
exports.reactivateClient = async (req, res) => {
    try {
        const result = await ClientService.updateStatus(req.params.id, true);
        res.status(200).json(result);
    } catch (error) {
        if(error.status){
            return res.status(error.status).json({ message: error.message }); 
        }
        console.error("Error reactivating client:", error);
        res.status(500).json({ message: "Error processing client reactivation." });
    }
};

/**
 * Consultar cliente por ID
 */
exports.getClientById = async (req, res) => {
    try {
        const result = await ClientService.getCliendById(req.params.id);

        res.status(200).json(result);
    } catch (error) {
        if(error.status){
            return res.status(error.status).json({ message: error.message }); 
        }
        console.error("Error retrieving client detail:", error);
        res.status(500).json({ message: "Error retrieving client detail." });
    }
};

/**
 * Consultar categorias de cliente
 */
exports.getAllClientCategories = async (req, res) => {
    try {
        const result = await ClientService.getAllClientCategories();
        res.status(200).json(result);
    } catch (error) {
        if(error.status){
            return res.status(error.status).json({ message: error.message }); 
        }
        console.error("Error retrieving client categories list:", error);
        res.status(500).json({ message: "Error retrieving client categories list." });
    }
};