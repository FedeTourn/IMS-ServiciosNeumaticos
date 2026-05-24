/**
 * @file auth.service.test.js
 * @description Pruebas unitarias aisladas para la lógica de autenticación.
 */

const AuthService = require('../src/services/auth.service');
const User = require('../src/models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 1. Congelamos (Mockeamos) las dependencias externas y la Base de Datos
jest.mock('../src/models/User');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService - Unit Tests', () => {
    
    beforeEach(() => {
        jest.clearAllMocks(); // Limpiamos el historial de los mocks antes de cada test
    });

    describe('login()', () => {
        it('Debe rechazar si faltan credenciales (HTTP 400)', async () => {
            await expect(AuthService.login('', 'password123'))
                .rejects.toEqual({ status: 400, message: "Username and password are required." });
        });

        it('Debe rechazar si el usuario no existe o está inactivo (HTTP 401)', async () => {
            // Simulamos que la BD no encuentra al usuario
            User.findByUsername.mockResolvedValue(null); 

            await expect(AuthService.login('admin', 'password123'))
                .rejects.toEqual({ status: 401, message: "Invalid credentials or account disabled." });
        });

        it('Debe rechazar si la contraseña es incorrecta (HTTP 401)', async () => {
            // Simulamos un usuario válido
            User.findByUsername.mockResolvedValue({ is_active: 1, password_hash: 'hash_falso' });
            // Simulamos que Bcrypt dice "Las contraseñas NO coinciden" (false)
            bcrypt.compare.mockResolvedValue(false);

            await expect(AuthService.login('admin', 'wrong_password'))
                .rejects.toEqual({ status: 401, message: "Invalid credentials." });
        });

        it('Debe retornar un Token JWT si las credenciales son válidas (HTTP 200)', async () => {
            const mockUser = { id_user: 1, username: 'admin', full_name: 'Admin', role_name: 'ADMIN', is_active: 1, password_hash: 'hash' };
            
            User.findByUsername.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true); // Bcrypt aprueba la contraseña
            jwt.sign.mockReturnValue('fake-jwt-token-123'); // JWT emite un token de mentira

            const result = await AuthService.login('admin', 'password123');

            expect(result.message).toBe("Login successful.");
            expect(result.token).toBe('fake-jwt-token-123');
            expect(result.user.username).toBe('admin');
            
            // Verificamos que el servicio haya llamado a JWT con los datos correctos
            expect(jwt.sign).toHaveBeenCalledWith(
                { id: 1, role: 'ADMIN' },
                expect.any(String),
                { expiresIn: '3h' }
            );
        });
    });
});