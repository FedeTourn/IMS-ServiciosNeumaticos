const request = require('supertest');
const app = require('../src/app'); // Instancia de Express configurada

describe('Receipt REST API - Pruebas de Integración', () => {
    
    test('POST /api/receipts - Debe registrar con éxito el remito masivo y devolver 201 Created', async () => {
        // Objeto de transporte conforme al contrato de interfaz
        const validPayload = {
            receiptData: {
                id_cliente: 1, // Asume la existencia del cliente de prueba en taller_db_test
                descripcion: 'Lote de válvulas recibido mediante transporte interno',
                fecha_recepcion: '2026-04-23'
            },
            productsList: [
                { modelo: 'ISO 1', observaciones: 'Bobina primaria quemada' },
                { modelo: 'ISO 2', observaciones: 'Pérdida por junta menor' }
            ]
        };

        const response = await request(app)
            .post('/api/receipts')
            .send(validPayload)
            .set('Accept', 'application/json');

        // Aserciones del estándar REST unificado
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('id_comprobante');
        expect(response.body.productos_registrados).toBe(2);
    });

    test('POST /api/receipts - Debe rebotar la petición con 400 si falta el modelo en un producto', async () => {
        const invalidPayload = {
            receiptData: { id_cliente: 1 },
            productsList: [
                { modelo: '', observaciones: 'Atributo modelo ausente' }
            ]
        };

        const response = await request(app)
            .post('/api/receipts')
            .send(invalidPayload);

        // Verificación de la interceptación defensiva del middleware de validación sintáctica
        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("El campo 'modelo' de la válvula es obligatorio.");
    });
});