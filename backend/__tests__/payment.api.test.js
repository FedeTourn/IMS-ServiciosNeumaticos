const request = require('supertest');
const app = require('../src/app');
const { pool: db } = require('../src/config/db.config');

describe('Módulo de Pagos - Pruebas de Integración', () => {

    beforeAll(async () => {
        // Limpiamos las tablas antes de correr los tests para evitar basura
        // NOTA: Asegúrate de que NODE_ENV sea 'test' para no borrar producción.
        if (process.env.NODE_ENV === 'test') {
            await db.execute('SET FOREIGN_KEY_CHECKS = 0;');
            await db.execute('TRUNCATE TABLE Pago;');
            await db.execute('TRUNCATE TABLE Cliente;');
            await db.execute('TRUNCATE TABLE EstadoPago;');
            await db.execute('TRUNCATE TABLE MedioPago;');
            await db.execute('SET FOREIGN_KEY_CHECKS = 1;');

            await db.execute(
                "INSERT INTO EstadoPago (id_estado_pago, nombre) VALUES (1, 'Borrador'), (2, 'Pendiente de acreditación'), (3, 'Aceptado'), (4, 'Rechazado')"
            );
            await db.execute(
                "INSERT INTO MedioPago (id_medio_pago, nombre, es_diferido) VALUES (1, 'Efectivo', 0), (2, 'Cheque', 1)"
            );
            // CategoriaCliente es un catálogo compartido con otros módulos: no se trunca,
            // solo se garantiza que la categoría usada por el cliente de prueba exista.
            await db.execute(
                "INSERT IGNORE INTO CategoriaCliente (id_categoria, nombre_categoria) VALUES (1, 'CATEGORIA 1')"
            );
            await db.execute(
                "INSERT INTO Cliente (id_cliente, nombre, cuit, categoria, activo) VALUES (1, 'Cliente Test Pagos', '30-999-1', 1, 1)"
            );
        }
    });

    afterAll(async () => {
        await db.end();
    });

    it('debe registrar un pago con medio de pago inmediato en estado "Borrador" (no "Aceptado")', async () => {
        const payload = {
            id_cliente: 1,
            id_medio_pago: 1, // Efectivo, es_diferido = 0
            monto: 1500,
            fecha_pago: '2026-09-20'
        };

        const res = await request(app).post('/api/payment').send(payload);

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.estado_pago_nombre).toBe('Borrador');

        const [pagos] = await db.execute('SELECT * FROM Pago WHERE id_pago = ?', [res.body.data.id_pago]);
        expect(pagos.length).toBe(1);
        expect(pagos[0].id_estado_pago).toBe(1); // Borrador
    });

    it('debe registrar un pago con medio de pago diferido en estado "Borrador" (no "Pendiente de acreditación")', async () => {
        const payload = {
            id_cliente: 1,
            id_medio_pago: 2, // Cheque, es_diferido = 1
            monto: 2500,
            fecha_pago: '2026-09-20'
        };

        const res = await request(app).post('/api/payment').send(payload);

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.estado_pago_nombre).toBe('Borrador');

        const [pagos] = await db.execute('SELECT * FROM Pago WHERE id_pago = ?', [res.body.data.id_pago]);
        expect(pagos.length).toBe(1);
        expect(pagos[0].id_estado_pago).toBe(1); // Borrador
    });

    it('debe retornar 404 y no insertar fila si el id_cliente no existe', async () => {
        const payload = {
            id_cliente: 99999,
            id_medio_pago: 1,
            monto: 1000,
            fecha_pago: '2026-09-20'
        };

        const [pagosAntes] = await db.execute('SELECT COUNT(*) AS total FROM Pago');

        const res = await request(app).post('/api/payment').send(payload);

        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);

        const [pagosDespues] = await db.execute('SELECT COUNT(*) AS total FROM Pago');
        expect(pagosDespues[0].total).toBe(pagosAntes[0].total);
    });

    it('debe retornar 400 y no insertar fila si el monto es menor o igual a cero', async () => {
        const payload = {
            id_cliente: 1,
            id_medio_pago: 1,
            monto: 0,
            fecha_pago: '2026-09-20'
        };

        const [pagosAntes] = await db.execute('SELECT COUNT(*) AS total FROM Pago');

        const res = await request(app).post('/api/payment').send(payload);

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);

        const [pagosDespues] = await db.execute('SELECT COUNT(*) AS total FROM Pago');
        expect(pagosDespues[0].total).toBe(pagosAntes[0].total);
    });

    it('debe incluir estado_pago_nombre: "Borrador" en el DTO devuelto con 201', async () => {
        const payload = {
            id_cliente: 1,
            id_medio_pago: 1,
            monto: 500,
            fecha_pago: '2026-09-20',
            numero_comprobante: 'B-0001',
            observaciones: 'Pago de integración'
        };

        const res = await request(app).post('/api/payment').send(payload);

        expect(res.statusCode).toBe(201);
        expect(res.body.data).toHaveProperty('estado_pago_nombre', 'Borrador');
    });
});
