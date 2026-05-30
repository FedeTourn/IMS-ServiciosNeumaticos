/**
 * @file auth.service.js
 * @description Capa de lógica de negocio para autenticación, autorización y criptografía.
 */
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SECURE_RANDOM_SECRET_KEY';


class AuthService{
    /**
     * Valida credenciales y genera un token JWT.
     * @param {string} username - Nombre de usuario.
     * @param {string} password - Contraseña en texto plano.
     * @returns {Object} Token JWT y datos del usuario.
     * @throws {Object} Objeto con estado HTTP y mensaje.
     */
    static async login(username, password){
        if (!username || !password) {
            throw { status: 400, message: "Username and password are required." };
        }

        const user = await User.findByUsername(username);
        
        if (!user || !user.is_active) {
            throw { status: 401, message: "Invalid credentials or account disabled." };
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw { status: 401, message: "Invalid credentials." };
        }

        const token = jwt.sign(
            { id: user.id_user, role: user.role_name }, 
            JWT_SECRET, 
            { expiresIn: '3h' }
        );

        return {
            message: "Login successful.",
            token,
            user: {
                id: user.id_user,
                full_name: user.full_name,
                username: user.username,
                role: user.role_name
            }
        };

    }
}

module.exports = AuthService;