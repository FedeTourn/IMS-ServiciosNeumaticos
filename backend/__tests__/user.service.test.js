/**
 * @file user.service.test.js
 * @description Pruebas unitarias para la gestión de usuarios y roles.
 */

const UserService = require('../src/services/user.service');
const User = require('../src/models/User');
const Role = require('../src/models/Role');
const bcrypt = require('bcrypt');

jest.mock('../src/models/User');
jest.mock('../src/models/Role');
jest.mock('bcrypt');

describe('UserService - Unit Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('registerUser()', () => {
        const validUserData = { full_name: 'Juan Perez', username: 'jperez', password: 'password123', id_role: 2 };

        it('Debe rechazar contraseñas de menos de 8 caracteres (HTTP 400)', async () => {
            const invalidData = { ...validUserData, password: '123' };
            
            await expect(UserService.registerUser(invalidData))
                .rejects.toEqual({ status: 400, message: "Password must be at least 8 characters long." });
            
            expect(User.create).not.toHaveBeenCalled(); // Aseguramos que la DB no se tocó
        });

        it('Debe rechazar si el nombre de usuario ya existe (HTTP 409)', async () => {
            User.findByUsername.mockResolvedValue({ id_user: 99, username: 'jperez' });

            await expect(UserService.registerUser(validUserData))
                .rejects.toEqual({ status: 409, message: "Username already exists." });
        });

        it('Debe encriptar la contraseña y guardar el usuario exitosamente (HTTP 201)', async () => {
            User.findByUsername.mockResolvedValue(null); // Usuario libre
            bcrypt.hash.mockResolvedValue('hashed_password_mock');
            User.create.mockResolvedValue(15); // Simulamos que MySQL devuelve el ID 15

            const result = await UserService.registerUser(validUserData);

            expect(result.userId).toBe(15);
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
                password_hash: 'hashed_password_mock'
            }));
        });
    });

    describe('createRole()', () => {
        it('Debe transformar el error ER_DUP_ENTRY de MySQL en un error 409 de Dominio', async () => {
            // Simulamos que el Modelo arroja el error genérico que implementamos en el Patrón de Traducción
            Role.create.mockRejectedValue(new Error('DUPLICATE_ROLE_NAME'));

            await expect(UserService.createRole({ name: 'ADMIN' }))
                .rejects.toEqual({ status: 409, message: "A role with this name already exists." });
        });
    });
});