/**
 * @file price.controller.test.js
 * @description Pruebas de integración de caja negra para los endpoints de Precios.
 */

const request = require('supertest');
const express = require('express');
const priceRoutes = require('../src/routes/price.routes');
const PriceService = require('../src/services/price.service');

// Mockeamos el servicio para no afectar la base de datos real durante los tests de red
jest.mock('../src/services/price.service');

const app = express();
app.use(express.json());
app.use('/api/prices', priceRoutes);

describe('PriceController - API REST Endpoints', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/prices/suggested', () => {
        it('Debería devolver 200 OK y el precio si los Query Params son correctos', async () => {
            PriceService.getSuggestedPrice.mockResolvedValue({ precio: 1500 });

            const res = await request(app).get('/api/prices/suggested?modelo=1&categoria=2');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('precio', 1500);
        });

        it('Debería devolver 400 Bad Request si faltan Query Params', async () => {
            // Faltan enviar los parámetros ?modelo=X&categoria=Y
            const res = await request(app).get('/api/prices/suggested');

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        it('Debería devolver 404 Not Found si el servicio lanza error de tarifa inexistente', async () => {
            PriceService.getSuggestedPrice.mockRejectedValue(new Error("No existe una tarifa activa parametrizada para este modelo y categoría de cliente."));

            const res = await request(app).get('/api/prices/suggested?modelo=99&categoria=99');

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('POST /api/prices/bulk', () => {
        it('Debería devolver 200 OK cuando se envía un JSON correcto', async () => {
            const payload = {
                updates: [
                    { idModelo: 1, idCategoria: 1, nuevoPrecio: 2000 }
                ]
            };

            PriceService.updatePriceBatch.mockResolvedValue({ success: true, count: 1 });

            const res = await request(app)
                .post('/api/prices/bulk')
                .send(payload);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('Debería devolver 400 Bad Request si el body no contiene el array de updates', async () => {
            const res = await request(app)
                .post('/api/prices/bulk')
                .send({ algunOtroDato: 123 }); // Payload malformado

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });
    });
});