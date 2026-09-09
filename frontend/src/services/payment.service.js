import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/payment`;

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

/**
 * Obtiene el catálogo completo de medios de pago parametrizados (ej. Efectivo, Transferencia, Cheque).
 * @returns {Promise<Array<Object>>} Listado de medios de pago disponibles.
 */
export const fetchPaymentMethods = async () => {
    try {
        const response = await fetch(`${API_URL}/methods`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.message || 'Error al recuperar el catálogo de medios de pago.');
            error.statusCode = response.status;
            throw error;
        }

        return data.data;
    } catch (error) {
        console.error('[PaymentService Front Error] Falla de comunicación con el endpoint GET /api/payment/methods:', error.message);
        throw error;
    }
};

/**
 * Obtiene el catálogo completo de estados de pago parametrizados (Borrador, Pendiente de acreditación, Aceptado, Rechazado).
 * @returns {Promise<Array<Object>>} Listado de estados de pago disponibles.
 */
export const fetchPaymentStates = async () => {
    try {
        const response = await fetch(`${API_URL}/states`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.message || 'Error al recuperar el catálogo de estados de pago.');
            error.statusCode = response.status;
            throw error;
        }

        return data.data;
    } catch (error) {
        console.error('[PaymentService Front Error] Falla de comunicación con el endpoint GET /api/payment/states:', error.message);
        throw error;
    }
};
