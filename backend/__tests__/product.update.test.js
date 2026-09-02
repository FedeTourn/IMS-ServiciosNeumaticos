// Este código dispara peticiones reales al servidor Express, validando las reglas de negocio como están hoy.
/**
 * @file product.update.test.js
 * @description Pruebas de integración para la actualización de estados de productos.
 * Utiliza Supertest para simular peticiones HTTP y verificar contratos de API.
 */

const request = require('supertest');
const app = require('../src/app'); 
const Product = require('../src/models/Product'); 

describe('Integración: PUT /api/products/:id_producto', () => {
    let testProductId;

    beforeAll(async () => {
        
        // Mockeamos la creación para tener un ID válido.
        testProductId = await Product.create({
            id_cliente: 1,
            modelo: 1,
            observaciones: 'Prueba inicial',
            fecha_recepcion: '2025-10-15'
        });
    });
    afterAll(async () => {
        // Aquí iría un script para vaciar la tabla de productos de la base de pruebas.
    });

    it('Debe permitir la transición de RECIBIDO (1) a EN_REPARACION (2) devolviendo 200 OK', async () => {
        Product.findAllowedDestinations.mockResolvedValue([2, 3, 4, 5, 6]);
        
        const response = await request(app)
            .put(`/api/products/${testProductId}`)
            .send({
                estado: 2, 
                observaciones: 'El técnico comenzó la inspección.'
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Product updated successfully.");
    });
    
    // 2. Regla de Negocio (Falla Esperada)
    it('Debe rechazar la transición de EN_REPARACION (2) a RECIBIDO (1) devolviendo 403 Forbidden', async () => {
        const response = await request(app)
            .put(`/api/products/${testProductId}`)
            .send({
                estado: 1, 
                observaciones: 'Intento de regresión inválido.'
            });

        expect(response.status).toBe(403);
        expect(response.body.message).toMatch(/Transition not allowed/);
    });

    // 3. Validación de Entrada
    it('Debe retornar 400 Bad Request si no se envía el parámetro "estado"', async () => {
        const response = await request(app)
            .put(`/api/products/${testProductId}`)
            .send({
                observaciones: 'Actualizando sin estado.'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Product state is required.");
    });
});