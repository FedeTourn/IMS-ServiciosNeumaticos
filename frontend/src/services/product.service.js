import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/products`;

/**
 * Construye las cabeceras estándar con el token de sesión.
 * @returns {Object} Cabeceras HTTP.
 */
const getAuthHeaders = () => {
    const token = localStorage.getItem('user_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
    };
};

// =========================================================
// GESTIÓN DE PRODUCTOS (VÁLVULAS)
// =========================================================

/**
 * Consulta la lista de todos los productos con opciones de filtro/ordenamiento.
 */
export const fetchProducts = async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${API_URL}${queryParams ? '?' + queryParams : ''}`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al obtener los productos.");
    }
    return response.json();
};

/**
 * Registra la recepción de un producto en el taller.
 */
export const registerProductReception = async (productData) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(productData),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Error al registrar la recepción del producto.");
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al obtener los datos del producto.");
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
        throw new Error(data.message || "Error al actualizar el producto.");
    }
    return data;
};

/**
 * Consulta la lista histórica de estados de producto.
 */
export const fetchProductStates = async () => {
    const response = await fetch(`${API_URL}/states`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al obtener los estados de producto.");
    }
    return response.json();
};

/**
 * Consulta la lista histórica de estados de producto.
 */
export const fetchStateTransitions = async () => {
    const response = await fetch(`${API_URL}/states/transitions`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al obtener las transiciones de estados.");
    }
    return response.json();
};

// =========================================================
// GESTIÓN DE TIPOS DE PRODUCTO
// =========================================================

/**
 * Consulta la lista completa de tipos de producto.
 */
export const fetchProductTypes = async () => {
    const response = await fetch(`${API_URL}/types`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al obtener los tipos de producto.");
    }
    return response.json();
};

/**
 * Consulta un tipo de producto específico por su ID.
 */
export const fetchTypeById = async (id) => {
    const response = await fetch(`${API_URL}/types/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al obtener los datos del tipo de producto.");
    }
    return response.json();
};

/**
 * Registra un nuevo tipo de producto.
 */
export const createProductType = async (typeData) => {
    const response = await fetch(`${API_URL}/types`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(typeData),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Error al crear el tipo de producto.");
    }
    return data;
};

/**
 * Actualiza el nombre de un tipo de producto existente.
 */
export const updateProductType = async (id, typeData) => {
    const response = await fetch(`${API_URL}/types/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(typeData),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Error al actualizar el tipo de producto.");
    }
    return data;
};

// =========================================================
// GESTIÓN DE MODELOS DE PRODUCTO
// =========================================================

/**
 * Consulta la lista de modelos de producto (filtrados por query string si se provee typeId).
 */
export const fetchProductModels = async (typeId = null) => {
    const url = typeId ? `${API_URL}/models?type_id=${typeId}` : `${API_URL}/models`;
    const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al obtener los modelos de producto.");
    }
    return response.json();
};

/**
 * Consulta un modelo de producto específico por su ID.
 */
export const fetchModelById = async (id) => {
    const response = await fetch(`${API_URL}/models/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al obtener los datos del modelo de producto.");
    }
    return response.json();
};

/**
 * Registra un nuevo modelo de producto vinculándolo a un tipo.
 */
export const createProductModel = async (modelData) => {
    const response = await fetch(`${API_URL}/models`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(modelData),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Error al crear el modelo de producto.");
    }
    return data;
};

/**
 * Actualiza la información de un modelo de producto existente.
 */
export const updateProductModel = async (id, modelData) => {
    const response = await fetch(`${API_URL}/models/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(modelData),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Error al actualizar el modelo de producto.");
    }
    return data;
};