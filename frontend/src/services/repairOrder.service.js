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