const User = require('../models/User');
const Role = require('../models/Role');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// --- 1. CONFIGURACIÓN ---
// Deberías mover esto a tu archivo .env por seguridad.
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SECURE_RANDOM_SECRET_KEY';
const SALT_ROUNDS = 10; // Nivel de seguridad para el hashing de bcrypt


// --- 2. FUNCIÓN DE REGISTRO (Alta de Usuarios) ---
exports.register = async (req, res) => {
    // Requerimientos: nombre completo, nombre de usuario, contraseña y rol.
    // Requerimiento: El nombre de usuario debe ser único.
    const { full_name, username, password, id_role } = req.body;

    // Validación mínima de entrada
    if (!username || !password || !full_name || !id_role) {
        return res.status(400).json({ message: "All fields (full_name, username, password, id_role) are required." });
    }
    
    // Requerimiento: La contraseña debe cumplir con longitud mínima. 
    if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    try {
        // 1. Verificar unicidad del usuario
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.status(409).json({ message: "Username already exists." });
        }

        // 2. Cifrar la contraseña
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

        // 3. Crear el nuevo usuario
        const newUserId = await User.create({
            full_name,
            username,
            password_hash,
            id_role 
        });

        // 4. Respuesta exitosa
        res.status(201).json({ 
            message: "User registered successfully.", 
            userId: newUserId 
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: "Internal server error during registration." });
    }
};



// --- 3. FUNCIÓN DE LOGIN (Inicio de Sesión) ---

exports.login = async (req, res) => {
    // Requerimiento: Permitir inicio de sesión mediante nombre de usuario y contraseña.
    // Requerimiento: El sistema debe validar las credenciales de acceso.
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    try {
        // 1. Buscar usuario por nombre de usuario
        const user = await User.findByUsername(username);
        
        // Verificar si el usuario existe o si está deshabilitado
        if (!user || !user.is_active) {
            return res.status(401).json({ message: "Invalid credentials or account disabled." });
        }

        // 2. Comparar la contraseña ingresada con el hash guardado
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // 3. Generar el Token de Autenticación (JWT)
        const token = jwt.sign(
            { id: user.id_user, role: user.role_name }, 
            JWT_SECRET, 
            { expiresIn: '3h' } // Token expira en 3 horas
            // Supongo que van a dejar todo abierto y seria incomodo que tengan que volver a ingresar
        );

        // 4. Respuesta exitosa (enviando el token y la información del usuario)
        res.status(200).json({
            message: "Login successful.",
            token,
            user: {
                id: user.id_user,
                full_name: user.full_name,
                username: user.username,
                role: user.role_name
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: "Internal server error during login." });
    }
};

// --- 4. CONSULTAR LISTA DE USUARIOS ---
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.status(200).json(users);
    } catch (error) {
        console.error("Error getting user list:", error);
        res.status(500).json({ message: "Error retrieving user list." });
    }
};

// --- 5. CONSULTAR USUARIO POR ID ---
exports.getUserById = async (req, res) => {
    const { id_user } = req.params;
    try {
        const user = await User.findById(id_user);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error getting user by ID:", error);
        res.status(500).json({ message: "Error retrieving user data." });
    }
};

// --- 6. MODIFICAR USUARIO ---
exports.updateUser = async (req, res) => {
    const { id_user } = req.params;
    let { full_name, id_role, is_active, password } = req.body;
    let updateData = { full_name, id_role, is_active };

    try {
        // Hashing de contraseña opcional
        if (password) {
             if (password.length < 8) {
                return res.status(400).json({ message: "Password must be at least 8 characters long." });
            }
            const password_hash = await bcrypt.hash(password, 10);
            updateData.password_hash = password_hash;
        }

        const affectedRows = await User.update(id_user, updateData);
        
        if (affectedRows === 0) {
            return res.status(404).json({ message: "User not found or no changes made." });
        }

        res.status(200).json({ message: "User updated successfully." });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Error updating user data." });
    }
};

// --- CONSULTAR LISTA DE ROLES ---
exports.getAllRoles = async (req, res) => {
    try {
        const roles = await Role.findAll();
        res.status(200).json(roles);
    } catch (error) {
        console.error("Error getting roles list:", error);
        res.status(500).json({ message: "Error retrieving roles list." });
    }
};

// --- CREAR NUEVO ROL ---
exports.createRole = async (req, res) => {
    let { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: "Role name is required." });
    }
    
    // Estandarización: Usar el formatter (asumiendo que ya está importado)
    name = formatter.toUpperCase(name); 

    try {
        const newRoleId = await Role.create({ name });
        res.status(201).json({ message: "Role created successfully.", id_role: newRoleId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "A role with this name already exists." });
        }
        console.error("Error creating new role:", error);
        res.status(500).json({ message: "Error creating new role." });
    }
};