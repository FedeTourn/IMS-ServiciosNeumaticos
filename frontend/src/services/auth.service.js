const API_URL = 'http://localhost:3001/api/auth';

const getAuthHeaders = () => {
    const token = localStorage.getItem('user_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
    };
};

/**
 * Función para registrar un nuevo usuario (Alta de Usuarios).
 * Esta función está protegida en el backend, por lo que necesita el token del administrador.
 * @param {Object} userData - Datos del usuario (full_name, username, password, id_role).
 * @returns {Promise<Object>} Mensaje de éxito.
 */
export const register = async (userData) => {
    // La ruta es /api/auth/register
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        // Usamos getAuthHeaders() para enviar el Content-Type y el token del administrador
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
        // Maneja errores como CUIT duplicado o validación de contraseña
        throw new Error(data.message || "Registration failed.");
    }

    return data;
};

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

/**
 * Consulta la lista de todos los usuarios registrados.
 * Solo debe ser accesible para administradores (asumido por el middleware en el backend).
 */
export const fetchAllUsers = async () => {
    // La ruta es /api/auth/users
    const response = await fetch(`${API_URL}/users`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        // En un entorno real, manejaríamos el error 403 (Prohibido)
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch user list.");
    }
    return response.json();
};

/**
 * Consulta la lista de todos los roles disponibles.
 */
export const fetchAllRoles = async () => {
    // La ruta es /api/auth/roles
    const response = await fetch(`${API_URL}/roles`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch roles list.");
    }
    return response.json();
};

/**
 * Obtiene los datos de un solo usuario por su ID.
 */
export const fetchUserById = async (id) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch user data.");
    }
    return response.json();
};

/**
 * Actualiza la información y el estado de un usuario.
 */
export const updateUserData = async (id, userData) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to update user.");
    }
    return data;
};