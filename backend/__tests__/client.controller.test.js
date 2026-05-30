const request = require('supertest');
const app = require('../src/app'); // Asegúrate de exportar "app" en tu index.js o app.js
const ClientService = require('../src/services/client.service');

// Mockeamos el servicio para aislar la prueba en la capa de red (HTTP)
jest.mock('../src/services/client.service');


describe('ClientController - Pruebas de Integración REST', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/clientes', () => {
        
        it('Debe retornar 201 Created cuando los datos son válidos', async () => {
            // Arrange
            ClientService.createClient.mockResolvedValue({ message: 'OK', id_cliente: 10 });

            // Act
            const response = await request(app)
                .post('/api/clients')
                .send({ nombre: 'Prueba', cuit: '111', provincia: 'SF', ciudad: 'SF', categoria: 1 });

            // Assert
            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty('id_cliente', 10);
        });

        it('Debe retornar 400 Bad Request si el servicio detecta error de validación', async () => {
            // Arrange
            ClientService.createClient.mockRejectedValue({ status: 400, message: 'Faltan campos' });

            // Act
            const response = await request(app)
                .post('/api/clients')
                .send({}); // Body vacío

            // Assert
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe('Faltan campos');
        });
    });
});