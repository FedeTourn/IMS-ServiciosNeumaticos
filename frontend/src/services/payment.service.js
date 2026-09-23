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
 * Envía el payload para registrar un nuevo pago.
 * @returns {Promise<Object>} Registro de pago creado, incluyendo su identificador y estado inicial.
 */
export const apiCreatePayment = async (paymentData) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(paymentData)
        });
        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.message || 'Error al registrar el pago.');
            error.statusCode = response.status;
            throw error;
        }

        return data.data;
    } catch (error) {
        console.error('[PaymentService Front Error] Falla de comunicación con el endpoint POST /api/payment:', error.message);
        throw error;
    }
};


/**
 * Recupera el historial de pagos registrados aplicando criterios de filtrado acumulativos (AND).
 * Serializa dinámicamente el objeto de filtros hacia una Query String, descartando los criterios
 * no informados para mantener URLs canónicas limpias, y traduce los errores HTTP en excepciones
 * de interfaz. Resuelve el Requerimiento 31.1 de consulta y auditoría de pagos.
 * @param {Object} [filters={}] - Criterios opcionales de búsqueda provenientes de los inputs de la UI.
 * @param {string|number} [filters.id_pago] - Número interno del pago (coincidencia exacta).
 * @param {string|number} [filters.id_cliente] - Identificador del cliente asociado.
 * @param {string|number} [filters.id_estado_pago] - Identificador del estado de pago.
 * @param {string|number} [filters.id_medio_pago] - Identificador del medio de pago.
 * @param {string|number} [filters.monto] - Importe exacto del pago.
 * @param {string|number} [filters.monto_min] - Límite inferior del rango de importes.
 * @param {string|number} [filters.monto_max] - Límite superior del rango de importes.
 * @param {string} [filters.fecha_desde] - Límite inferior de la fecha de cobro (YYYY-MM-DD).
 * @param {string} [filters.fecha_hasta] - Límite superior de la fecha de cobro (YYYY-MM-DD).
 * @param {string} [filters.numero_comprobante] - Comprobante externo (coincidencia parcial).
 * @param {string} [filters.creacion_desde] - Límite inferior de la fecha de creación (YYYY-MM-DD).
 * @param {string} [filters.creacion_hasta] - Límite superior de la fecha de creación (YYYY-MM-DD).
 * @param {string} [filters.sort_by] - Columna por la cual ordenar la grilla de datos.
 * @param {string} [filters.sort_order] - Dirección del ordenamiento ('ASC' o 'DESC').
 * @returns {Promise<Array<Object>>} Listado de pagos hidratados con cliente, estado y medio de pago.
 * @throws {Error} Excepción enriquecida con el código de estado HTTP para su manejo en la UI.
 */
export const fetchPayments = async (filters = {}) => {
    try {
        // Inicializar el constructor nativo de parámetros URL
        const queryParams = new URLSearchParams();

        // Mapeo defensivo de criterios: Solo inyectamos parámetros con valor real
        if (filters.id_pago && String(filters.id_pago).trim() !== '') {
            queryParams.append('id_pago', String(filters.id_pago).trim());
        }
        if (filters.id_cliente) {
            queryParams.append('id_cliente', filters.id_cliente);
        }
        if (filters.id_estado_pago) {
            queryParams.append('id_estado_pago', filters.id_estado_pago);
        }
        if (filters.id_medio_pago) {
            queryParams.append('id_medio_pago', filters.id_medio_pago);
        }
        if (filters.monto && String(filters.monto).trim() !== '') {
            queryParams.append('monto', String(filters.monto).trim());
        }
        if (filters.monto_min && String(filters.monto_min).trim() !== '') {
            queryParams.append('monto_min', String(filters.monto_min).trim());
        }
        if (filters.monto_max && String(filters.monto_max).trim() !== '') {
            queryParams.append('monto_max', String(filters.monto_max).trim());
        }
        if (filters.fecha_desde) {
            queryParams.append('fecha_desde', filters.fecha_desde);
        }
        if (filters.fecha_hasta) {
            queryParams.append('fecha_hasta', filters.fecha_hasta);
        }
        if (filters.numero_comprobante && filters.numero_comprobante.trim() !== '') {
            queryParams.append('numero_comprobante', filters.numero_comprobante.trim());
        }
        if (filters.creacion_desde) {
            queryParams.append('creacion_desde', filters.creacion_desde);
        }
        if (filters.creacion_hasta) {
            queryParams.append('creacion_hasta', filters.creacion_hasta);
        }
        // La fecha de última actualización queda deliberadamente fuera de la integración:
        // es un dato de auditoría interna del backend y no se expone como criterio de búsqueda.
        if (filters.sort_by) {
            queryParams.append('sort_by', filters.sort_by);
        }
        if (filters.sort_order) {
            queryParams.append('sort_order', filters.sort_order);
        }

        // Construcción de la URL final (Ej: /api/payment?id_cliente=1&fecha_desde=2026-01-01)
        const url = `${API_URL}?${queryParams.toString()}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.message || 'Error al recuperar el historial de pagos.');
            error.statusCode = response.status;
            throw error;
        }

        return data.data;
    } catch (error) {
        console.error('[PaymentService Front Error] Falla de comunicación con el endpoint GET /api/payment:', error.message);
        throw error;
    }
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
