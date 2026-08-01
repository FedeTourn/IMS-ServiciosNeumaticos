import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/repair-orders`;

/**
 * Construye las cabeceras estándar con el token de sesión.
 * @returns {Object} Cabeceras HTTP.
 */
/* const getAuthHeaders = () => {
    const token = localStorage.getItem('user_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
    };
}; */

/**
 * Envía el payload para crear una nueva Orden de Reparación.
 * @param {Object} orderData - DTO con los datos de la orden y las válvulas.
 * @returns {Promise<Object>} - Respuesta del backend con el ID generado.
 * @throws {Error} - Lanza un error detallado si la petición falla.
 */
export const createRepairOrder = async (orderData) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${localStorage.getItem('token')}` // Descomentar cuando integres seguridad
            },
            body: JSON.stringify(orderData)
        });

        const data = await response.json();

        // Validamos si el backend respondió con un código de error (ej: 400 Bad Request o 500 Internal Error)
        if (!response.ok) {
            // Lanzamos el error con el mensaje que nos mandó el backend (tu controlador)
            throw new Error(data.message || 'Ocurrió un error al crear la orden de reparación.');
        }

        // Si todo salió bien (201 Created), devolvemos la data
        return data;

    } catch (error) {
        console.error("[RepairOrderService - createRepairOrder] Error de red o servidor:", error);
        // Relanzamos el error para que la vista (UI) pueda atajarlo y mostrar un Toast/Banner
        throw error;
    }
};

/**
     * Recupera el listado de órdenes de reparación aplicando filtros y ordenamiento seguro.
     * Abstrae la comunicación de red y traduce los errores HTTP en excepciones de interfaz.
     * * @param {Object} filters - Criterios opcionales de búsqueda y ordenamiento.
     * @param {string|number} [filters.id_orden_reparacion] - Búsqueda parcial por número de orden.
     * @param {number|string} [filters.id_cliente] - Filtrado exacto por cliente.
     * @param {string} [filters.estado] - Estado de la orden (ej. 'Abierta', 'Cerrada').
     * @param {string} [filters.sort_by] - Columna por la cual ordenar.
     * @param {string} [filters.sort_order] - Dirección del ordenamiento ('ASC' o 'DESC').
     * @returns {Promise<Array>} Retorna el arreglo de órdenes mapeadas listas para los estados de React.
     * @throws {Error} Excepción enriquecida con el código de estado HTTP para manejo en UI.
     */
    export const fetchRepairOrders = async (filters = {}) => {
        try {
            // Inicializar el constructor nativo de parámetros URL
            const queryParams = new URLSearchParams();

            // Mapeo defensivo de criterios: Solo inyectamos parámetros con valor real
            if (filters.id_orden_reparacion && String(filters.id_orden_reparacion).trim() !== '') {
                queryParams.append('id_orden_reparacion', String(filters.id_orden_reparacion).trim());
            }
            if (filters.id_cliente) {
                queryParams.append('id_cliente', filters.id_cliente);
            }
            if (filters.estado && filters.estado.trim() !== '') {
                queryParams.append('estado', filters.estado.trim());
            }
            if (filters.sort_by) {
                queryParams.append('sort_by', filters.sort_by);
            }
            if (filters.sort_order) {
                queryParams.append('sort_order', filters.sort_order);
            }

            const url = `${API_URL}?${queryParams.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                    // 'Authorization': `Bearer ${localStorage.getItem('token')}` // Descomentar si usa JWT
                }
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.message || 'Error al recuperar las órdenes de reparación.');
                error.statusCode = response.status;
                throw error;
            }

            return data.data; 

        } catch (error) {
            console.error(`[RepairOrderService Fetch Error] Falla en GET /api/repair-orders: ${error.message}`);
            throw error;
        }
};

/**
 * Servicio para obtener productos disponibles de un cliente con sus precios vigentes.
 * @param {number} id_cliente - ID del cliente seleccionado.
 * @returns {Promise<Array>} - Lista de productos con precios.
 */
export const fetchProductsByClient = async (id_cliente) => {
    try {
        const response = await fetch(`${API_URL}/products-by-client/${id_cliente}`);
        
        if (!response.ok) {
            throw new Error('Error al obtener productos y precios del cliente.');
        }
        
        return await response.json();
    } catch (error) {
        console.error("[RepairOrderService - fetchProductsByClient] Error:", error);
        throw error;
    }
};
// Aquí iremos agregando luego las demás llamadas (Req 26, 27, 28)
// export const fetchRepairOrders = async (params) => { ... }
// export const fetchRepairOrderById = async (id) => { ... }