const AuthService = require('../services/auth.service');
const UserService = require('../services/user.service');

// --- 1. CONFIGURACIÓN ---
//const SALT_ROUNDS = 10; // Nivel de seguridad para el hashing de bcrypt


// --- FUNCIÓN DE LOGIN (Inicio de Sesión) ---
exports.login = async (req, res) => {
    
    try {
        const { username, password } = req.body;
        const result = await AuthService.login(username, password);
        res.status(200).json(result);

    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error('Login error:', error);
        res.status(500).json({ message: "Internal server error during login." });
    }
};

// --- FUNCIÓN DE REGISTRO (Alta de Usuarios) ---
exports.register = async (req, res) => {
    try {
        const result = await UserService.registerUser(req.body);
        res.status(201).json(result);
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error('Registration error:', error);
        res.status(500).json({ message: "Internal server error during registration." });
    }
};

// --- CONSULTAR LISTA DE USUARIOS ---
exports.getAllUsers = async (req, res) => {
    try {
        const result = await UserService.getAllUsers();
        res.status(200).json(result);
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Error getting user list:", error);
        res.status(500).json({ message: "Error retrieving user list." });
    }
};

// --- CONSULTAR USUARIO POR ID ---
exports.getUserById = async (req, res) => {
    try {
        const { id_user } = req.params;
        const result = await UserService.getUserById(id_user);
        
        res.status(200).json(result);
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Error getting user by ID:", error);
        res.status(500).json({ message: "Error retrieving user data." });
    }
};

// --- MODIFICAR USUARIO ---
exports.updateUser = async (req, res) => {    
    try {
        const { id_user } = req.params;
        const { full_name, id_role, is_active, password } = req.body;
        const updateData = { full_name, id_role, is_active };

        await UserService.updateUser(id_user, password, updateData);

        res.status(200).json({ message: "User updated successfully." });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Error updating user data." });
    }
};

// --- CONSULTAR LISTA DE ROLES ---
exports.getAllRoles = async (req, res) => {
    try {
        const result = await UserService.getAllRoles();
        res.status(200).json(result);
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error("Error getting roles list:", error);
        res.status(500).json({ message: "Error retrieving roles list." });
    }
};

// --- CREAR NUEVO ROL ---
exports.createRole = async (req, res) => {
    try {
        const result = await UserService.createRole(req.body);

        res.status(201).json(result);
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }

        console.error("Error creating new role:", error);
        res.status(500).json({ message: "Error creating new role." });
    }
};