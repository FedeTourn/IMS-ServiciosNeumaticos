import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/receipts`;

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

export const registerReceiptWithProducts = async (payload) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
            const error = new Error(data.message || "Error crítico en el lote de inserción del remito.");
            error.statusCode = response.status;
            throw error;
        }
        return data;
        
    } catch (error) {
        console.error(`[ReceiptService Front Error] Falla de comunicación con el endpoint POST /api/receipts: ${error.message}`);
        // Propaga el error para que sea capturado e instanciado en el catch de la UI (RegisterReceptionPage)
        throw error;
    }
    
};

/**
 * Obtiene el listado de comprobantes de recepción filtrados desde el servidor.
 * @param {Object} filters - Criterios de filtrado provenientes de los inputs de la UI.
 * @param {string} [filters.search] - Texto de coincidencia para nombre de cliente o CUIT.
 * @param {string|number} [filters.id_cliente] - ID específico de una entidad para filtrado directo.
 * @param {string} [filters.fecha_desde] - Límite inferior del rango de fechas (YYYY-MM-DD).
 * @param {string} [filters.fecha_hasta] - Límite superior del rango de fechas (YYYY-MM-DD).
 * @returns {Promise<Array<Object>>} Retorna un arreglo de comprobantes estructurados con metadatos del cliente.
 * @throws {Error} Si el servidor responde con un código de estado de error (4xx o 5xx).
 */
export const fetchReceipts = async (filters = {}) => {
    try {
        // Inicializar el constructor nativo de parámetros URL
        const queryParams = new URLSearchParams();

        // Mapeo defensivo de criterios: Solo inyectamos parámetros con valor real
        if (filters.search && filters.search.trim() !== '') {
            queryParams.append('search', filters.search.trim());
        }
        if (filters.id_cliente) {
            queryParams.append('id_cliente', filters.id_cliente);
        }
        if (filters.fecha_desde) {
            queryParams.append('fecha_desde', filters.fecha_desde);
        }
        if (filters.fecha_hasta) {
            queryParams.append('fecha_hasta', filters.fecha_hasta);
        }
        if (filters.sort_by) {
            queryParams.append('sort_by', filters.sort_by);
        }
        if (filters.sort_order) {
            queryParams.append('sort_order', filters.sort_order);
        }
        

        // Construcción de la URL final (Ej: /api/receipts?search=Tourn&id_cliente=1)
        const url = `${API_URL}?${queryParams.toString()}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.message || 'Error al recuperar el historial de comprobantes.');
            error.statusCode = response.status;
            throw error;
        }

        return data.data;

    } catch (error) {
        console.error(`[ReceiptService Fetch Error] Falla en GET /api/receipts: ${error.message}`);
        throw error;
    }
};

export const fetchReceiptById = async (id) => {
    const response = await fetch(`${API_URL}/${id}`,{
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al obtener los datos del comprobante.");
    }
    return response.json();
};

export const updateReceiptData = async (id, data) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (response.status === 409) {
        // Se lanza un mensaje al usuario de que no es posible modificar el comprobante
        throw new Error(result.message); // El mensaje viene del backend (la regla de negocio)
    }
    if (!response.ok) {
        const error = new Error(result.message || "Error en la modificacion del comprobante.");
        error.statusCode = response.status;
        throw error;
    }

    return result;    
};