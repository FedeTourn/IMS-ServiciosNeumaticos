const API_URL = 'http://localhost:3001/api/products'; 

const getAuthHeaders = () => {
    const token = localStorage.getItem('user_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
    };
};

/**
 * Consulta la lista de todos los productos (Válvulas).
 */
export const fetchProducts = async () => {
    const response = await fetch(API_URL, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch products.");
    }
    return response.json();
};

/**
 * Consulta la lista de tipos de producto.
 */
export const fetchProductTypes = async () => {
    const response = await fetch(`${API_URL}/types`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error("Failed to fetch product types.");
    }
    return response.json();
};

/**
 * Consulta la lista de modelos de producto (opcionalmente filtrados por typeId).
 */
export const fetchProductModels = async (typeId = null) => {
    const url = typeId ? `${API_URL}/models?typeId=${typeId}` : `${API_URL}/models`;
    const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error("Failed to fetch product models.");
    }
    return response.json();
};

/**
 * Registra la recepción de un producto.
 */
export const registerProductReception = async (productData) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(productData),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to register product reception.");
    }
    return data;
};

/**
 * Obtiene los datos de un solo producto por su ID.
 */
export const fetchProductById = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch product data.");
    }
    return response.json();
};

/**
 * Actualiza la información y el estado de un producto.
 */
export const updateProduct = async (id, productData) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(productData),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to update product.");
    }
    return data;
};

/**
 * Consulta la lista de estados de producto.
 */
export const fetchProductStates = async () => {
    const response = await fetch(`${API_URL}/states`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error("Failed to fetch product states.");
    }
    return response.json();
};