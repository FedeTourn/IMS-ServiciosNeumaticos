const request = require('supertest');
const app = require('../src/app'); // Instancia de Express configurada
const { pool: db } = require('../src/config/db.config');

describe('Receipt REST API - Pruebas de Integración', () => {

    let comprobanteExistenteId;

    beforeAll(async () => {
        if (process.env.NODE_ENV === 'test') {
            await db.execute('SET FOREIGN_KEY_CHECKS = 0;');
            await db.execute('TRUNCATE TABLE Producto;');
            await db.execute('TRUNCATE TABLE ComprobanteRecepcion;');
            await db.execute('SET FOREIGN_KEY_CHECKS = 1;');

            // Catálogos compartidos con otros módulos: no se truncan, solo se garantiza
            // que existan las filas necesarias para esta suite.
            await db.execute("INSERT IGNORE INTO CategoriaCliente (id_categoria, nombre_categoria) VALUES (1, 'CATEGORIA 1')");
            await db.execute(
                "INSERT IGNORE INTO Cliente (id_cliente, nombre, cuit, categoria, activo) VALUES (4, 'Cliente Test Remitos', '30-777-4', 1, 1), (1, 'Cliente Test Remitos Filtro', '30-777-1', 1, 1)"
            );
            await db.execute("INSERT IGNORE INTO TipoProducto (id_tipo, nombre) VALUES (1, 'FRENO MANO')");
            await db.execute("INSERT IGNORE INTO ModeloProducto (id_modelo, nombre, tipo) VALUES (1, 'VOLVO', 1), (2, '2 CIRCUITOS', 1)");
            await db.execute(
                "INSERT IGNORE INTO EstadoProducto (id_estado, nombre) VALUES (1, 'RECIBIDO'), (2, 'EN REPARACION'), (3, 'REPARADO'), (4, 'ENTREGADO'), (5, 'NO REPARABLE'), (6, 'LIBRE')"
            );

            // Comprobante existente con su válvula aún en estado 'Recibido', usado por la prueba de actualización (PUT)
            const [comprobanteResult] = await db.execute(
                "INSERT INTO ComprobanteRecepcion (fecha_recepcion, descripcion, id_cliente) VALUES ('2026-01-10', 'Comprobante seed para PUT', 4)"
            );
            comprobanteExistenteId = comprobanteResult.insertId;

            await db.execute(
                "INSERT INTO Producto (modelo, fecha_recepcion, estado, id_cliente, id_comprobante_recepcion) VALUES (1, '2026-01-10', 1, 4, ?)",
                [comprobanteExistenteId]
            );
        }
    });

    afterAll(async () => {
        await db.end();
    });

    test('POST /api/receipts - Debe registrar con éxito el remito masivo y devolver 201 Created', async () => {
        // Objeto de transporte conforme al contrato de interfaz
        const body = {
            receiptData: {
                id_cliente: 4, // Cliente de prueba sembrado en beforeAll
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
        const res = await request(app).get('/api/receipts?id_cliente=4');
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('PUT /api/receipts/:id debería actualizar fecha y descripción', async () => {
        const payload = {
            fecha_recepcion: '2026-07-01',
            descripcion: 'Actualización de prueba'
        };
        const res = await request(app).put(`/api/receipts/${comprobanteExistenteId}`).send(payload);
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
    });
});
