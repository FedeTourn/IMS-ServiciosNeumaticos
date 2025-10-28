const API_URL = 'http://localhost:3001/api/auth'; // Asegúrate que el puerto coincida

/**
 * Función para iniciar sesión.
 * @param {string} username - Nombre de usuario.
 * @param {string} password - Contraseña.
 * @returns {Promise<Object>} Datos del usuario y token.
 */
export const login = async (username, password) => {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        // Lanza un error si el backend responde con un código de error (401, 500, etc.)
        throw new Error(data.message || "Failed to log in.");
    }

    // Si el login es exitoso, guarda el token en el almacenamiento local (LocalStorage)
    if (data.token) {
        localStorage.setItem('user_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
    }

    return data.user;
};

/**
 * Función para cerrar la sesión (elimina el token).
 */
export const logout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_data');
};

/**
 * Función para obtener los datos del usuario logueado desde el almacenamiento local.
 */
export const getCurrentUser = () => {
    const user_data = localStorage.getItem('user_data');
    return user_data ? JSON.parse(user_data) : null;
};