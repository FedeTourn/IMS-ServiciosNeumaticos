/**
 * @file user.service.js
 * @description Capa de lógica de negocio para la gestión de usuarios y roles.
 */
const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcrypt');
const formatter = require('../utils/data.formater');

const SALT_ROUNDS = 10;

class UserService {

    /**
     * Registra un nuevo usuario aplicando reglas de negocio.
     */
    static async registerUser(userData) {
        const { full_name, username, password, id_role } = userData;

        if (!username || !password || !full_name || !id_role) {
            throw { status: 400, message: "All fields are required." };
        }
        
        if (password.length < 8) {
            throw { status: 400, message: "Password must be at least 8 characters long." };
        }

        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            throw { status: 409, message: "Username already exists." };
        }

        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

        const newUserId = await User.create({
            full_name, username, password_hash, id_role 
        });

        return { message: "User registered successfully.", userId: newUserId };
    };

    /**
     * Consulta la lista de usuarios
     */
    static async getAllUsers(){
        const users = await User.findAll();

        return {users};
    };

    /**
     * Consulta de usuario por ID
     */
    static async getUserById(id_user){
        const user = await User.findById(id_user);
        
        if (!user) {
            throw { status: 404, message: "User not found." };
        }

        delete user.password_hash;

        return {user};
    };



    /**
     * Actualizar usuario
     */
    static async updateUser(id_user, password, updateData){
        // Hashing de contraseña opcional
        if (password) {
             if (password.length < 8) {
                throw { status: 400, message: "Password must be at least 8 characters long." }
            }
            const password_hash = await bcrypt.hash(password, 10);
            updateData.password_hash = password_hash;
        }

        const affectedRows = await User.update(id_user, updateData);
        
        if (affectedRows === 0) {
            throw { status: 404, message: "User not found or no changes made." };
        }
    };




    /**
     * Consultar todos los roles
     */
    static async getAllRoles(){
        const roles = await Role.findAll();
        return {roles};
    };

    /**
     * Crear nuevo rol
     */
    static async createRole(roleData){

        const {name} = roleData;
        if (!name) {
            throw { status: 400, message: "Role name is required." };
        }

        const formattedName = formatter.toUpperCase(name);

        try {
            const newRoleId = await Role.create({ name });
            return { message: "Role created successfully.", roleId: newRoleId };
        } catch (error) {
            // Mapeo del error de dominio a una respuesta HTTP
            if (error.message === 'DUPLICATE_ROLE_NAME') {
                throw { status: 409, message: "A role with this name already exists." };
            }
            throw error;
        }
        
    } 

}

module.exports = UserService;