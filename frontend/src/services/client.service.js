const API_URL = 'http://localhost:3001/api/clients'; 

// Función auxiliar para obtener el token de autenticación
const getAuthHeaders = () => {
    const token = localStorage.getItem('user_token');
    return {
        'Content-Type': 'application/json',
        // IMPORTANTE: Necesitas enviar el token para la autorización
        'Authorization': `Bearer ${token}` 
    };
};

/**
 * Consulta la lista de clientes, con opciones de filtro/ordenamiento.
 */
export const fetchClients = async (params = {}) => {
    // Construye el query string a partir de los parámetros
    const queryParams = new URLSearchParams(params).toString();
    const url = `${API_URL}${queryParams ? '?' + queryParams : ''}`;
    
    const response = await fetch(url, { // Usa la URL con parámetros
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch clients.");
    }
    return response.json();
};

/**
 * Crea un nuevo cliente.
 */
export const createClient = async (clientData) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(clientData),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to create client.");
    }
    return data;
};

/**
 * Consulta el detalle de un cliente por su ID.
 */
export const fetchClientById = async (id_cliente) => {
    const response = await fetch(`${API_URL}/${id_cliente}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch client detail.");
    }
    return response.json();
};

/**
 * Actualiza un cliente existente.
 */
export const updateClient = async (id_cliente, clientData) => {
    const response = await fetch(`${API_URL}/${id_cliente}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(clientData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update client.");
    }
    return response.json();
};


/**
 * Deshabilita (Soft Delete) a un cliente por ID.
 */
export const disableClient = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to disable client.");
    }
    return data;
};

/**
 * Obtiene todas las categorías de clientes.
 */
export const fetchClientCategories = async () => {
    // Asume que tienes un endpoint para categorías (ej. /api/clients/categories)
    const response = await fetch(`${API_URL}/categories`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch client categories.");
    }
    return response.json();
};

/**
 * Rehabilita (marcar como activo) a un cliente por ID.
 */
export const reactivateClient = async (id_cliente) => {
    const response = await fetch(`${API_URL}/${id_cliente}/reactivate`, {
        method: 'PUT',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to reactivate client.");
    }
    return data;
};