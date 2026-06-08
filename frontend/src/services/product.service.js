import {API_BASE_URL} from '../config'; // Importa la constante base

const API_URL = `${API_BASE_URL}/products`;

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
/* export const fetchProducts = async () => {
    const response = await fetch(API_URL, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch products.");
    }
    return response.json();
}; */

/**
 * Consulta la lista de todos los productos, con opciones de filtro/ordenamiento.
 */
export const fetchProducts = async (params = {}) => {
    // Construye el query string a partir de los parámetros
    const queryParams = new URLSearchParams(params).toString();
    const url = `${API_URL}${queryParams ? '?' + queryParams : ''}`;
    
    const response = await fetch(url, { // Usa la URL con parámetros
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

// ============================
// MANEJO DE TIPOS DE PRODUCTO
// ============================

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
 * Consulta un tipo de producto.
 */
export const fetchTypeById = async (id) => {
    const response = await fetch(`${API_URL}/types/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error("Failed to fetch type data.");
    }
    return response.json();
};

/**
 * Registra un tipo de producto.
 */
export const createProductType = async (typeData) => {
    const response = await fetch(`${API_URL}/types`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(typeData),
    });
    if (!response.ok) {
        throw new Error("Failed to create product type.");
    }
    return response.json();
};

/**
 * Actualiza la información de un tipo de producto.
 */
export const updateProductType = async (id, typeData) => {
    const response = await fetch(`${API_URL}/types/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(typeData),
    });
    if (!response.ok) {
        throw new Error("Failed to update product type.");
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