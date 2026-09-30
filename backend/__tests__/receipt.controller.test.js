const request = require('supertest');
const app = require('../src/app'); // Instancia de Express configurada

describe('Receipt REST API - Pruebas de Integración', () => {
    
    test('POST /api/receipts - Debe registrar con éxito el remito masivo y devolver 201 Created', async () => {
        // Objeto de transporte conforme al contrato de interfaz
        const body = {
            receiptData: {
                id_cliente: 4, // Asume la existencia del cliente de prueba
                descripcion: 'Lote de válvulas recibido mediante transporte interno',
                fecha_recepcion: '2026-04-23',
                ruta_imagen: ''
            },
            productsList: [
                { modelo: 1, observaciones: 'Bobina primaria quemada' },
                { modelo: 2, observaciones: 'Pérdida por junta menor' }
            ]
        };

        const response = await request(app).post('/api/receipts').send(body);

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

    test('GET /api/receipts debería retornar lista con filtros', async () => {
        const res = await request(app).get('/api/receipts?id_cliente=5');
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('PUT /api/receipts/:id debería actualizar fecha y descripción', async () => {
        const payload = { 
            fecha_recepcion: '2026-07-01', 
            descripcion: 'Actualización de prueba' 
        };
        const res = await request(app).put('/api/receipts/3').send(payload);
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
    });
});