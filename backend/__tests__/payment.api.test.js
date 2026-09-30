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
            await db.execute('TRUNCATE TABLE Banco;');
            await db.execute('SET FOREIGN_KEY_CHECKS = 1;');

            await db.execute(
                "INSERT INTO EstadoPago (id_estado_pago, nombre) VALUES (1, 'Borrador'), (2, 'Pendiente de acreditación'), (3, 'Aceptado'), (4, 'Rechazado')"
            );
            await db.execute(
                "INSERT INTO MedioPago (id_medio_pago, nombre, es_diferido) VALUES (1, 'Efectivo', 0), (2, 'Cheque', 1), (3, 'Transferencia', 0)"
            );
            await db.execute(
                "INSERT INTO Banco (id_banco, nombre) VALUES (1, 'Banco Nación'), (2, 'Banco Galicia')"
            );
            // CategoriaCliente es un catálogo compartido con otros módulos: no se trunca,
            // solo se garantiza que la categoría usada por los clientes de prueba exista.
            await db.execute(
                "INSERT IGNORE INTO CategoriaCliente (id_categoria, nombre_categoria) VALUES (1, 'CATEGORIA 1')"
            );
            await db.execute(
                "INSERT INTO Cliente (id_cliente, nombre, cuit, categoria, activo) VALUES (1, 'Cliente Test Pagos', '30-999-1', 1, 1), (2, 'Hidráulica Sur SRL', '30-999-2', 1, 1)"
            );
        }
    });

    afterAll(async () => {
        await db.end();
    });

    describe('POST /api/payment (registro)', () => {

        it('debe registrar un pago con medio de pago inmediato en estado "Borrador" (no "Aceptado")', async () => {
            const payload = {
                id_cliente: 1,
                id_medio_pago: 1, // Efectivo, es_diferido = 0
                monto: 1500,
                fecha_recepcion: '2026-09-20'
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
                id_banco: 1,
                monto: 2500,
                fecha_recepcion: '2026-09-20',
                fecha_vencimiento: '2026-10-20',
                numero_comprobante: 'CH-0001'
            };

            const res = await request(app).post('/api/payment').send(payload);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.estado_pago_nombre).toBe('Borrador');

            const [pagos] = await db.execute('SELECT * FROM Pago WHERE id_pago = ?', [res.body.data.id_pago]);
            expect(pagos.length).toBe(1);
            expect(pagos[0].id_estado_pago).toBe(1); // Borrador
        });

        it('debe persistir banco y vencimiento en NULL para un medio de pago inmediato', async () => {
            const payload = {
                id_cliente: 1,
                id_medio_pago: 1,
                monto: 800,
                fecha_recepcion: '2026-09-21'
            };

            const res = await request(app).post('/api/payment').send(payload);

            expect(res.statusCode).toBe(201);

            const [pagos] = await db.execute(
                "SELECT id_banco, fecha_vencimiento, DATE_FORMAT(fecha_recepcion, '%Y-%m-%d') AS recepcion FROM Pago WHERE id_pago = ?",
                [res.body.data.id_pago]
            );
            expect(pagos[0].id_banco).toBeNull();
            expect(pagos[0].fecha_vencimiento).toBeNull();
            expect(pagos[0].recepcion).toBe('2026-09-21');
        });

        it('debe persistir banco, vencimiento y comprobante recortado para un medio de pago diferido', async () => {
            const payload = {
                id_cliente: 1,
                id_medio_pago: 2,
                id_banco: 2,
                monto: 3200,
                fecha_recepcion: '2026-09-21',
                fecha_vencimiento: '2026-11-21',
                numero_comprobante: '  CH-0002  '
            };

            const res = await request(app).post('/api/payment').send(payload);

            expect(res.statusCode).toBe(201);
            expect(res.body.data.banco_nombre).toBe('Banco Galicia');

            const [pagos] = await db.execute(
                "SELECT id_banco, numero_comprobante, DATE_FORMAT(fecha_vencimiento, '%Y-%m-%d') AS vencimiento FROM Pago WHERE id_pago = ?",
                [res.body.data.id_pago]
            );
            expect(pagos[0].id_banco).toBe(2);
            expect(pagos[0].vencimiento).toBe('2026-11-21');
            expect(pagos[0].numero_comprobante).toBe('CH-0002');
        });

        it.each([
            ['el id_cliente no existe', { id_cliente: 99999, id_medio_pago: 1, monto: 1000, fecha_recepcion: '2026-09-20' }, 404],
            ['el monto es menor o igual a cero', { id_cliente: 1, id_medio_pago: 1, monto: 0, fecha_recepcion: '2026-09-20' }, 400],
            ['falta la fecha de recepción', { id_cliente: 1, id_medio_pago: 1, monto: 1000 }, 400],
            ['un cheque no informa banco', { id_cliente: 1, id_medio_pago: 2, monto: 1000, fecha_recepcion: '2026-09-20', fecha_vencimiento: '2026-10-20', numero_comprobante: 'CH-9' }, 400],
            ['un cheque no informa comprobante', { id_cliente: 1, id_medio_pago: 2, id_banco: 1, monto: 1000, fecha_recepcion: '2026-09-20', fecha_vencimiento: '2026-10-20' }, 400],
            ['un cheque vence antes de su recepción', { id_cliente: 1, id_medio_pago: 2, id_banco: 1, monto: 1000, fecha_recepcion: '2026-09-20', fecha_vencimiento: '2026-09-19', numero_comprobante: 'CH-9' }, 400],
            ['un cheque informa un banco inexistente', { id_cliente: 1, id_medio_pago: 2, id_banco: 999, monto: 1000, fecha_recepcion: '2026-09-20', fecha_vencimiento: '2026-10-20', numero_comprobante: 'CH-9' }, 404],
            ['un medio inmediato informa banco', { id_cliente: 1, id_medio_pago: 1, id_banco: 1, monto: 1000, fecha_recepcion: '2026-09-20' }, 400],
            ['un medio inmediato informa vencimiento', { id_cliente: 1, id_medio_pago: 1, monto: 1000, fecha_recepcion: '2026-09-20', fecha_vencimiento: '2026-10-20' }, 400]
        ])('debe rechazar sin insertar fila si %s', async (_caso, payload, statusCode) => {
            const [pagosAntes] = await db.execute('SELECT COUNT(*) AS total FROM Pago');

            const res = await request(app).post('/api/payment').send(payload);

            expect(res.statusCode).toBe(statusCode);
            expect(res.body.success).toBe(false);

            const [pagosDespues] = await db.execute('SELECT COUNT(*) AS total FROM Pago');
            expect(pagosDespues[0].total).toBe(pagosAntes[0].total);
        });

        it('debe incluir estado_pago_nombre: "Borrador" en el DTO devuelto con 201', async () => {
            const payload = {
                id_cliente: 1,
                id_medio_pago: 1,
                monto: 500,
                fecha_recepcion: '2026-09-20',
                numero_comprobante: 'B-0001',
                observaciones: 'Pago de integración'
            };

            const res = await request(app).post('/api/payment').send(payload);

            expect(res.statusCode).toBe(201);
            expect(res.body.data).toHaveProperty('estado_pago_nombre', 'Borrador');
        });
    });

    describe('Catálogo de bancos (GET y POST /api/payment/banks)', () => {

        it('debe devolver el catálogo de bancos ordenado por nombre', async () => {
            const res = await request(app).get('/api/payment/banks');

            expect(res.statusCode).toBe(200);
            expect(res.body.data.map(b => b.nombre)).toEqual(['Banco Galicia', 'Banco Nación']);
        });

        it('debe dar de alta un banco con el nombre normalizado', async () => {
            const res = await request(app).post('/api/payment/banks').send({ nombre: '  Banco   Provincia ' });

            expect(res.statusCode).toBe(201);
            expect(res.body.data.nombre).toBe('Banco Provincia');

            const [bancos] = await db.execute('SELECT nombre FROM Banco WHERE id_banco = ?', [res.body.data.id_banco]);
            expect(bancos[0].nombre).toBe('Banco Provincia');
        });

        it.each(['BANCO PROVINCIA', 'banco nacion'])('debe retornar 409 y no insertar fila al repetir un nombre con distinta caja o acentuación (%p)', async (nombre) => {
            const [bancosAntes] = await db.execute('SELECT COUNT(*) AS total FROM Banco');

            const res = await request(app).post('/api/payment/banks').send({ nombre });

            expect(res.statusCode).toBe(409);
            expect(res.body.success).toBe(false);

            const [bancosDespues] = await db.execute('SELECT COUNT(*) AS total FROM Banco');
            expect(bancosDespues[0].total).toBe(bancosAntes[0].total);
        });
    });

    describe('GET /api/payment (consulta)', () => {

        beforeAll(async () => {
            if (process.env.NODE_ENV === 'test') {
                await db.execute('SET FOREIGN_KEY_CHECKS = 0;');
                await db.execute('TRUNCATE TABLE Pago;');
                await db.execute('SET FOREIGN_KEY_CHECKS = 1;');

                // Dos cobros inmediatos (sin banco ni vencimiento) y dos cheques de bancos distintos
                await db.execute(`
                    INSERT INTO Pago (id_pago, id_cliente, id_estado_pago, id_medio_pago, id_banco, monto, fecha_recepcion, fecha_vencimiento, numero_comprobante) VALUES
                    (1, 1, 1, 1, NULL, 1000, '2026-01-10', NULL, 'REC-001'),
                    (2, 1, 2, 2, 1, 5000, '2026-02-01', '2026-03-01', 'CH-AB-100'),
                    (3, 2, 1, 2, 2, 3000, '2026-02-15', '2026-04-15', 'CH-XY-200'),
                    (4, 2, 3, 3, NULL, 2000, '2026-03-05', NULL, NULL)
                `);
            }
        });

        it('debe devolver todos los pagos hidratados, incluidos los que no tienen banco, por fecha de recepción descendente', async () => {
            const res = await request(app).get('/api/payment');

            expect(res.statusCode).toBe(200);
            expect(res.body.data.map(p => p.id_pago)).toEqual([4, 3, 2, 1]);

            const cheque = res.body.data.find(p => p.id_pago === 2);
            expect(cheque).toMatchObject({
                cliente_nombre: 'Cliente Test Pagos',
                estado_pago_nombre: 'Pendiente de acreditación',
                medio_pago_nombre: 'Cheque',
                banco_nombre: 'Banco Nación'
            });

            const efectivo = res.body.data.find(p => p.id_pago === 1);
            expect(efectivo.id_banco).toBeNull();
            expect(efectivo.banco_nombre).toBeNull();
            expect(efectivo.fecha_vencimiento).toBeNull();
        });

        it('debe filtrar por banco, excluyendo los de otros bancos y los que no tienen banco', async () => {
            const res = await request(app).get('/api/payment?id_banco=1');

            expect(res.statusCode).toBe(200);
            expect(res.body.data.map(p => p.id_pago)).toEqual([2]);
        });

        it('debe filtrar por rango de vencimiento inclusive en los extremos, excluyendo los cobros inmediatos', async () => {
            const res = await request(app).get('/api/payment?vencimiento_desde=2026-03-01&vencimiento_hasta=2026-04-15');

            expect(res.statusCode).toBe(200);
            expect(res.body.data.map(p => p.id_pago)).toEqual([3, 2]);
        });

        it('debe ordenar por vencimiento sin que los pagos sin vencimiento provoquen error', async () => {
            const res = await request(app).get('/api/payment?sort_by=fecha_vencimiento&sort_order=ASC');

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(4);
            const cheques = res.body.data.filter(p => p.fecha_vencimiento !== null).map(p => p.id_pago);
            expect(cheques).toEqual([2, 3]);
        });

        it('debe combinar criterios bajo lógica AND', async () => {
            const res = await request(app).get('/api/payment?id_cliente=2&id_estado_pago=1');

            expect(res.statusCode).toBe(200);
            expect(res.body.data.map(p => p.id_pago)).toEqual([3]);
        });

        it('debe buscar por fragmento del comprobante sin distinguir mayúsculas', async () => {
            const res = await request(app).get('/api/payment?numero_comprobante=ab-1');

            expect(res.statusCode).toBe(200);
            expect(res.body.data.map(p => p.id_pago)).toEqual([2]);
        });

        it('debe filtrar por rango de importes inclusive en los extremos', async () => {
            const res = await request(app).get('/api/payment?monto_min=2000&monto_max=3000');

            expect(res.statusCode).toBe(200);
            expect(res.body.data.map(p => p.id_pago)).toEqual([4, 3]);
        });

        it('debe filtrar por rango de fechas de recepción inclusive en los extremos', async () => {
            const res = await request(app).get('/api/payment?fecha_desde=2026-02-01&fecha_hasta=2026-02-15');

            expect(res.statusCode).toBe(200);
            expect(res.body.data.map(p => p.id_pago)).toEqual([3, 2]);
        });

        it('debe ordenar de forma ascendente por importe', async () => {
            const res = await request(app).get('/api/payment?sort_by=monto&sort_order=ASC');

            expect(res.statusCode).toBe(200);
            expect(res.body.data.map(p => p.id_pago)).toEqual([1, 4, 3, 2]);
        });

        it('debe aplicar el orden por defecto ante un concepto de ordenamiento inexistente', async () => {
            const res = await request(app).get('/api/payment?sort_by=columna_inexistente');

            expect(res.statusCode).toBe(200);
            expect(res.body.data.map(p => p.id_pago)).toEqual([4, 3, 2, 1]);
        });

        it('debe devolver 200 con una colección vacía cuando no hay coincidencias', async () => {
            const res = await request(app).get('/api/payment?id_cliente=2&id_banco=1');

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toEqual([]);
        });

        it('debe retornar 400 ante un rango de vencimiento invertido', async () => {
            const res = await request(app).get('/api/payment?vencimiento_desde=2026-05-01&vencimiento_hasta=2026-04-01');

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('PUT y DELETE /api/payment/:id (modificación y baja)', () => {

        beforeAll(async () => {
            if (process.env.NODE_ENV === 'test') {
                await db.execute('SET FOREIGN_KEY_CHECKS = 0;');
                await db.execute('TRUNCATE TABLE Pago;');
                await db.execute('SET FOREIGN_KEY_CHECKS = 1;');

                // 12 es el único pago en estado definitivo (Aceptado); el resto permanece en Borrador
                await db.execute(`
                    INSERT INTO Pago (id_pago, id_cliente, id_estado_pago, id_medio_pago, id_banco, monto, fecha_recepcion, fecha_vencimiento, numero_comprobante) VALUES
                    (10, 1, 1, 1, NULL, 1000, '2026-05-10', NULL, NULL),
                    (11, 1, 1, 2, 1, 2000, '2026-05-10', '2026-06-10', 'CH-11'),
                    (12, 1, 3, 1, NULL, 3000, '2026-05-10', NULL, NULL),
                    (13, 1, 1, 1, NULL, 4000, '2026-05-10', NULL, NULL),
                    (14, 1, 1, 1, NULL, 5000, '2026-05-10', NULL, NULL),
                    (15, 1, 1, 1, NULL, 6000, '2026-05-10', NULL, NULL),
                    (16, 1, 1, 2, 2, 7000, '2026-05-10', '2026-06-10', 'CH-16')
                `);
            }
        });

        it('debe modificar importe y comprobante, estampando la fecha de actualización', async () => {
            const res = await request(app).put('/api/payment/10').send({ monto: 1500, numero_comprobante: '  REC-10 ' });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.monto).toBe('1500.00');

            const [pagos] = await db.execute('SELECT monto, numero_comprobante, fecha_actualizacion FROM Pago WHERE id_pago = 10');
            expect(Number(pagos[0].monto)).toBe(1500);
            expect(pagos[0].numero_comprobante).toBe('REC-10');
            expect(pagos[0].fecha_actualizacion).not.toBeNull();
        });

        it('debe rechazar con 400 la conversión a cheque sin los tres datos del instrumento', async () => {
            const res = await request(app).put('/api/payment/14').send({ id_medio_pago: 2 });

            expect(res.statusCode).toBe(400);

            const [pagos] = await db.execute('SELECT id_medio_pago FROM Pago WHERE id_pago = 14');
            expect(pagos[0].id_medio_pago).toBe(1);
        });

        it('debe convertir un medio inmediato en cheque cuando se informan los tres datos', async () => {
            const res = await request(app).put('/api/payment/14').send({
                id_medio_pago: 2,
                id_banco: 2,
                numero_comprobante: 'CH-14',
                fecha_vencimiento: '2026-06-01'
            });

            expect(res.statusCode).toBe(200);

            const [pagos] = await db.execute(
                "SELECT id_medio_pago, id_banco, numero_comprobante, DATE_FORMAT(fecha_vencimiento, '%Y-%m-%d') AS vencimiento FROM Pago WHERE id_pago = 14"
            );
            expect(pagos[0]).toEqual({ id_medio_pago: 2, id_banco: 2, numero_comprobante: 'CH-14', vencimiento: '2026-06-01' });
        });

        it('debe dejar banco y vencimiento en NULL al convertir un cheque en un medio inmediato', async () => {
            const res = await request(app).put('/api/payment/11').send({ id_medio_pago: 1 });

            expect(res.statusCode).toBe(200);

            const [pagos] = await db.execute('SELECT id_medio_pago, id_banco, fecha_vencimiento, numero_comprobante FROM Pago WHERE id_pago = 11');
            expect(pagos[0].id_medio_pago).toBe(1);
            expect(pagos[0].id_banco).toBeNull();
            expect(pagos[0].fecha_vencimiento).toBeNull();
            expect(pagos[0].numero_comprobante).toBe('CH-11');
        });

        it('debe rechazar con 400 una fecha de recepción posterior al vencimiento del cheque', async () => {
            const res = await request(app).put('/api/payment/16').send({ fecha_recepcion: '2026-07-01' });

            expect(res.statusCode).toBe(400);

            const [pagos] = await db.execute("SELECT DATE_FORMAT(fecha_recepcion, '%Y-%m-%d') AS recepcion FROM Pago WHERE id_pago = 16");
            expect(pagos[0].recepcion).toBe('2026-05-10');
        });

        it('debe rechazar con 409 la promoción directa a "Aceptado" de un cheque', async () => {
            const res = await request(app).put('/api/payment/16').send({ id_estado_pago: 3 });

            expect(res.statusCode).toBe(409);

            const [pagos] = await db.execute('SELECT id_estado_pago FROM Pago WHERE id_pago = 16');
            expect(pagos[0].id_estado_pago).toBe(1);
        });

        it('debe promover a "Aceptado" un pago con medio inmediato', async () => {
            const res = await request(app).put('/api/payment/15').send({ id_estado_pago: 3 });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.estado_pago_nombre).toBe('Aceptado');

            const [pagos] = await db.execute('SELECT id_estado_pago FROM Pago WHERE id_pago = 15');
            expect(pagos[0].id_estado_pago).toBe(3);
        });

        it('debe rechazar con 409 la modificación de un pago en estado definitivo', async () => {
            const res = await request(app).put('/api/payment/12').send({ monto: 1 });

            expect(res.statusCode).toBe(409);

            const [pagos] = await db.execute('SELECT monto FROM Pago WHERE id_pago = 12');
            expect(Number(pagos[0].monto)).toBe(3000);
        });

        it('debe rechazar con 409 la baja de un pago en estado definitivo', async () => {
            const res = await request(app).delete('/api/payment/12');

            expect(res.statusCode).toBe(409);

            const [pagos] = await db.execute('SELECT id_pago FROM Pago WHERE id_pago = 12');
            expect(pagos.length).toBe(1);
        });

        it('debe eliminar un pago en "Borrador"', async () => {
            const res = await request(app).delete('/api/payment/13');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);

            const [pagos] = await db.execute('SELECT id_pago FROM Pago WHERE id_pago = 13');
            expect(pagos.length).toBe(0);
        });

        it('debe retornar 404 al modificar o eliminar un pago inexistente', async () => {
            const resPut = await request(app).put('/api/payment/999').send({ monto: 100 });
            const resDelete = await request(app).delete('/api/payment/999');

            expect(resPut.statusCode).toBe(404);
            expect(resDelete.statusCode).toBe(404);
        });
    });

    describe('Catálogos de estados y medios de pago', () => {

        it('debe devolver los cuatro estados ordenados por identificador', async () => {
            const res = await request(app).get('/api/payment/states');

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toEqual([
                { id_estado_pago: 1, nombre: 'Borrador' },
                { id_estado_pago: 2, nombre: 'Pendiente de acreditación' },
                { id_estado_pago: 3, nombre: 'Aceptado' },
                { id_estado_pago: 4, nombre: 'Rechazado' }
            ]);
        });

        it('debe reflejar fielmente la bandera es_diferido de cada medio de pago', async () => {
            const res = await request(app).get('/api/payment/methods');

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toEqual([
                { id_medio_pago: 1, nombre: 'Efectivo', es_diferido: 0 },
                { id_medio_pago: 2, nombre: 'Cheque', es_diferido: 1 },
                { id_medio_pago: 3, nombre: 'Transferencia', es_diferido: 0 }
            ]);
        });
    });
});
