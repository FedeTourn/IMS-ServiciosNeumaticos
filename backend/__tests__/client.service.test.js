const ClientService = require('../src/services/client.service');
const Client = require('../src/models/Client'); // Importamos el modelo para mockearlo

// 1. Mockeamos completamente la capa de datos
jest.mock('../src/models/Client');

describe('ClientService - Pruebas Unitarias', () => {

    // Limpiamos los mocks antes de cada prueba para evitar que se contaminen entre sí
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createClient()', () => {
        
        const validClientDTO = {
            apellido: 'Perez',
            nombre: 'Juan',
            cuit: '20-42329627-6',
            email: 'JUAN@test.com',
            categoria: 1,
            provincia: 'Santa Fe',
            ciudad: 'Santo Tomé',
            telefonos: []
        };

        it('Debe crear un cliente exitosamente y normalizar los datos (Mayúsculas/Minúsculas)', async () => {
            // Arrange: Configuramos el mock para que simule que el insert en DB fue exitoso y devolvió el ID 5
            Client.create.mockResolvedValue(5);

            // Act: Ejecutamos el servicio
            const result = await ClientService.createClient(validClientDTO);

            // Assert: Verificamos el resultado y que los datos se hayan normalizado correctamente
            expect(result).toEqual({ message: "Client created successfully.", id_cliente: 5 });
            expect(Client.create).toHaveBeenCalledWith(
                expect.objectContaining({
                nombre: 'PEREZ JUAN', // Verificamos normalización
                cuit: '20-42329627-6',
                email: 'juan@test.com' // Verificamos minúsculas
            }));
            expect(Client.create).toHaveBeenCalledTimes(1);
        });

        it('Debe lanzar error 400 si faltan campos obligatorios', async () => {
            // Arrange: Quitamos el CUIT del DTO
            const invalidDTO = { ...validClientDTO, cuit: null };

            // Act & Assert: Verificamos que lance la excepción esperada
            await expect(ClientService.createClient(invalidDTO))
                .rejects
                .toEqual(expect.objectContaining({ 
                    status: 400, 
                    message: expect.any(String) 
                }));
            
            // Verificamos que NO se haya llamado a la base de datos
            expect(Client.create).not.toHaveBeenCalled();
        });

        it('Debe lanzar error 409 si el CUIT o Email ya existen en la base de datos', async () => {
            // Arrange: Simulamos que MySQL arroja un error de entrada duplicada
            const dbError = new Error('Duplicate entry');
            dbError.code = 'DUPLICATE_CLIENT_ENTRY';
            Client.create.mockRejectedValue(dbError);

            // Act & Assert
            await expect(ClientService.createClient(validClientDTO))
                .rejects
                .toEqual(expect.objectContaining({ 
                    status: 409 
                }));
        });
    });
});