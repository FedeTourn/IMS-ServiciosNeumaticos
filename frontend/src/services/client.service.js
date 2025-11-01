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
 * Consulta la lista de clientes.
 */
export const fetchClients = async () => {
    // Nota: Debemos añadir el token JWT en el header.
    const response = await fetch(API_URL, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch clients.");
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

export const fetchClientById = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch client data.");
    }
    return response.json();
};


/**
 * Actualiza la información de un cliente.
 */
export const updateClient = async (id, clientData) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(clientData),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to update client.");
    }
    return data;
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