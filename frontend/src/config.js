/**
 * Configuración global de la aplicación Frontend.
 * Centraliza las variables de entorno para facilitar el mantenimiento.
 */

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Documentación para el desarrollador:
// Para cambiar la IP en desarrollo, modificar el archivo .env en la raíz del frontend.