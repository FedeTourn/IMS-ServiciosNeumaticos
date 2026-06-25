import {API_BASE_URL} from '../config'; // Importa la constante base

const API_URL = `${API_BASE_URL}/prices`;

/**
 * Obtiene la matriz completa de precios activos.
 * @async
 * @returns {Promise<Array>} Listado plano de precios activos.
 * @throws {Error} Si el servidor responde con un código de error HTTP.
 */
export const getAllPrices = async () => {
    try {
        const response = await fetch(`${API_URL}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Fallo en la red: HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error en price.service (getAllPrices):", error);
        throw error;
    }
};

/**
 * Consulta la tarifa sugerida para la carga automática de la orden de reparación.
 * @async
 * @param {number} idModelo - Identificador del modelo de válvula.
 * @param {number} idCategoria - Identificador de la categoría del cliente.
 * @returns {Promise<Object|null>} Objeto con el precio o null si no se encuentra (404).
 */
export const getSuggestedPrice = async (idModelo, idCategoria) => {
    try {
        const response = await fetch(`${API_URL}/suggested?modelo=${idModelo}&categoria=${idCategoria}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Si el precio no existe, el backend devuelve 404. Lo atajamos limpiamente.
        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error en price.service (getSuggestedPrice):", error);
        throw error; // Propagamos para que el componente React pueda reaccionar
    }
};

/**
 * Envía un lote de actualizaciones de precios al backend para ser procesado transaccionalmente.
 * @async
 * @param {Object} payload - Objeto con el formato { updates: [{ idModelo, idCategoria, nuevoPrecio }] }
 * @returns {Promise<Object>} Confirmación de la actualización masiva.
 */
export const updateBulkPrices = async (payload) => {
    try {
        const response = await fetch(`${API_URL}/bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // Nota: Si implementaste JWT, aquí agregarías:
                // 'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            // Mapeamos el mensaje de error semántico que enviamos desde el backend
            throw new Error(data.error || 'Fallo desconocido al actualizar el catálogo.');
        }

        return data;
    } catch (error) {
        console.error("Error en price.service (updateBulkPrices):", error);
        throw error;
    }
};