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
    
}