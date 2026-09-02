const request = require('supertest');
const app = require('../src/app');
const { pool: db } = require('../src/config/db.config');

describe('Módulo de Órdenes de Reparación - Pruebas de Integración', () => {

    beforeAll(async () => {
        // Limpiamos las tablas antes de correr los tests para evitar basura
        // NOTA: Asegúrate de que NODE_ENV sea 'test' para no borrar producción.
        if(process.env.NODE_ENV === 'test') {
            await db.execute('SET FOREIGN_KEY_CHECKS = 0;');
            await db.execute('TRUNCATE TABLE Producto;');
            await db.execute('TRUNCATE TABLE OrdenReparacion;');
            await db.execute('TRUNCATE TABLE Cliente;');
            await db.execute('TRUNCATE TABLE EstadoOrdenReparacion;');
            await db.execute('SET FOREIGN_KEY_CHECKS = 1;');
           
            await db.execute("INSERT INTO EstadoOrdenReparacion (id_estado_orden, nombre) VALUES (1, 'Abierta'), (2, 'Cerrada')");
            await db.execute("INSERT INTO Cliente (id_cliente, nombre, cuit) VALUES (1, 'Cliente Test', '30-123'), (2, 'Servicios Hidráulicos SRL', '30-222')");
            await db.execute("INSERT INTO Producto (id_producto, id_cliente, estado, modelo) VALUES (10, 1, 1, 2), (11, 1, 6, 3)");
           
        }
    });

    afterAll(async () => {
        await db.end(); 
    });

    it('debe retornar 400 Bad Request si el DTO no tiene items', async () => {
        const payload = {
            id_cliente: 1,
            es_cerrada: false,
            items: [] // Invalido
        };

        const res = await request(app)
            .post('/api/repair-orders')
            .send(payload);

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/items/i);
    });

    it('debe registrar la orden exitosamente en la BD real de prueba', async () => {
        const payload = {
            id_cliente: 1,
            observaciones: "Integración exitosa",
            es_cerrada: true, // Esto transicionará las válvulas a estado 3 (Reparado)
            items: [
                { id_producto: 10, precio_final: 1000 },
                { id_producto: 11, precio_final: 2000 }
            ]
        };

        const res = await request(app)
            .post('/api/repair-orders')
            .send(payload);

        // Verificamos respuesta de la API
        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body).toHaveProperty('id_orden_reparacion');

        const nuevaOrdenId = res.body.id_orden_reparacion;

        // Verificación de Integridad en Base de Datos
        // 1. Verificamos que la orden se insertó con el importe total correcto (3000)
        const [ordenes] = await db.execute('SELECT * FROM OrdenReparacion WHERE id_orden_reparacion = ?', [nuevaOrdenId]);
        expect(ordenes.length).toBe(1);
        expect(Number(ordenes[0].importe_total)).toBe(3000);
        expect(ordenes[0].id_estado_orden).toBe(2); // 2 = Cerrada

        // 2. Verificamos que los productos se actualizaron atómicamente
        const [productos] = await db.execute('SELECT * FROM Producto WHERE id_orden_reparacion = ?', [nuevaOrdenId]);
        expect(productos.length).toBe(2);
        
        // Verificamos que el producto 10 cambió de estado 1 a 3
        const prod10 = productos.find(p => p.id_producto === 10);
        expect(prod10.estado).toBe(3); 
        expect(Number(prod10.precio)).toBe(1000);
    });

    
    it('debe retornar un listado con las órdenes registradas aplicando ordenamiento por defecto', async () => {
        const res = await request(app).get('/api/repair-orders');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length > 0);
    });

    it('debe filtrar correctamente las órdenes por id_cliente exacto', async () => {
        const res = await request(app).get('/api/repair-orders?id_cliente=1');

        expect(res.statusCode).toBe(200);
        res.body.data.forEach(order => {
            expect(order.id_cliente).toBe(1);
        });
    });

    it('debe permitir la búsqueda parcial de órdenes omitiendo ceros iniciales (ej: 001 -> 1)', async () => {
        // Asumiendo que la orden creada en el test anterior tiene ID 1
        const res = await request(app).get('/api/repair-orders?id_orden_reparacion=001');

        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].id_orden_reparacion).toBe(1);
    });
    it('debe retornar 200 OK y el DTO detallado al consultar un ID válido', async () => {
        const res = await request(app).get('/api/repair-orders/1');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
        
        expect(res.body.data).toHaveProperty('id_orden_reparacion', 1);
        expect(res.body.data).toHaveProperty('estado_nombre');
        expect(res.body.data).toHaveProperty('importe_total');
        
        expect(res.body.data.cliente).toHaveProperty('id_cliente');
        expect(res.body.data.cliente).toHaveProperty('nombre');
        
        expect(Array.isArray(res.body.data.productos)).toBe(true);
        expect(res.body.data.productos.length).toBeGreaterThan(0);
        expect(res.body.data.productos[0]).toHaveProperty('id_producto');
        expect(res.body.data.productos[0]).toHaveProperty('precio_final');
    });

    it('debe retornar 404 Not Found si se consulta una orden que no existe', async () => {
        const res = await request(app).get('/api/repair-orders/99999');

        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/No se encontró ninguna orden de reparación/i);
    });

    it('debe retornar 400 Bad Request si el parámetro ID es inválido (Fail-Fast)', async () => {
        const res = await request(app).get('/api/repair-orders/texto-invalido');

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/inválido o no fue proporcionado/i);
    });

    describe('Modificación de Órdenes de Reparación (PUT)', () => {
        let ordenAbiertaId;
        let ordenObsId;

        beforeAll(async () => {
            if (process.env.NODE_ENV === 'test') {
                // Válvulas adicionales para los escenarios de edición
                await db.execute(
                    "INSERT INTO Producto (id_producto, id_cliente, estado, modelo) VALUES (12, 1, 1, 2), (13, 1, 6, 3), (14, 1, 6, 3)"
                );

                const ordenAbiertaRes = await request(app)
                    .post('/api/repair-orders')
                    .send({
                        id_cliente: 1,
                        observaciones: 'Orden para pruebas de modificación',
                        es_cerrada: false,
                        items: [{ id_producto: 12, precio_final: 500 }]
                    });
                ordenAbiertaId = ordenAbiertaRes.body.id_orden_reparacion;

                const ordenObsRes = await request(app)
                    .post('/api/repair-orders')
                    .send({
                        id_cliente: 1,
                        observaciones: 'Observación persistente',
                        es_cerrada: false,
                        items: [{ id_producto: 14, precio_final: 200 }]
                    });
                ordenObsId = ordenObsRes.body.id_orden_reparacion;
            }
        });

        it('debe retornar 404 Not Found al intentar modificar una orden inexistente', async () => {
            const res = await request(app)
                .put('/api/repair-orders/99999')
                .send({ items: [{ id_producto: 12, precio_final: 500 }] });

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/No se encontró ninguna orden de reparación/i);
        });

        it('debe retornar 400 Bad Request si el payload no contiene items', async () => {
            const res = await request(app)
                .put(`/api/repair-orders/${ordenAbiertaId}`)
                .send({ items: [] });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/items/i);
        });

        it('debe retornar 400 Bad Request si el ID de la orden es inválido', async () => {
            const res = await request(app)
                .put('/api/repair-orders/texto-invalido')
                .send({ items: [{ id_producto: 12, precio_final: 500 }] });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/inválido/i);
        });

        it('debe preservar las observaciones existentes si el payload no las envía', async () => {
            const payload = {
                id_cliente: 1,
                es_cerrada: false,
                items: [{ id_producto: 14, precio_final: 250 }]
            };

            const res = await request(app)
                .put(`/api/repair-orders/${ordenObsId}`)
                .send(payload);

            expect(res.statusCode).toBe(200);

            const [ordenes] = await db.execute('SELECT * FROM OrdenReparacion WHERE id_orden_reparacion = ?', [ordenObsId]);
            expect(ordenes[0].observaciones).toBe('Observación persistente');
            expect(Number(ordenes[0].importe_total)).toBe(250);
        });

        it('debe actualizar exitosamente una orden Abierta agregando una válvula y modificando el precio de otra', async () => {
            const payload = {
                id_cliente: 1,
                es_cerrada: false,
                items: [
                    { id_producto: 12, precio_final: 800 },
                    { id_producto: 13, precio_final: 300 }
                ]
            };

            const res = await request(app)
                .put(`/api/repair-orders/${ordenAbiertaId}`)
                .send(payload);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);

            const [ordenes] = await db.execute('SELECT * FROM OrdenReparacion WHERE id_orden_reparacion = ?', [ordenAbiertaId]);
            expect(Number(ordenes[0].importe_total)).toBe(1100);
            expect(ordenes[0].id_estado_orden).toBe(1); // Sigue Abierta

            const [productos] = await db.execute('SELECT * FROM Producto WHERE id_orden_reparacion = ?', [ordenAbiertaId]);
            expect(productos.length).toBe(2);

            const prod12 = productos.find(p => p.id_producto === 12);
            expect(Number(prod12.precio)).toBe(800);
            expect(prod12.estado).toBe(3); // Reparado

            const prod13 = productos.find(p => p.id_producto === 13);
            expect(Number(prod13.precio)).toBe(300);
            expect(prod13.estado).toBe(3); // Reparado
        });

        it('debe desvincular una válvula removida del payload conservando su estado actual', async () => {
            const payload = {
                id_cliente: 1,
                es_cerrada: false,
                items: [{ id_producto: 12, precio_final: 800 }]
            };

            const res = await request(app)
                .put(`/api/repair-orders/${ordenAbiertaId}`)
                .send(payload);

            expect(res.statusCode).toBe(200);

            const [productos] = await db.execute('SELECT * FROM Producto WHERE id_producto = 13');
            expect(productos[0].id_orden_reparacion).toBeNull();
            expect(productos[0].estado).toBe(3); // Conserva "Reparado" pese a la desvinculación

            const [ordenes] = await db.execute('SELECT * FROM OrdenReparacion WHERE id_orden_reparacion = ?', [ordenAbiertaId]);
            expect(Number(ordenes[0].importe_total)).toBe(800);
        });

        it('debe volver a listar la válvula desvinculada como disponible para el cliente (Disponibilidad Real)', async () => {
            const res = await request(app).get('/api/repair-orders/products-by-client/1');

            expect(res.statusCode).toBe(200);

            const producto13 = res.body.find(p => p.id_producto === 13);
            expect(producto13).toBeDefined();
            expect(producto13.estado_nombre).toBe('REPARADO');
        });

        it('debe retornar 409 Conflict al intentar modificar una orden Cerrada', async () => {
            const payload = {
                id_cliente: 1,
                es_cerrada: false,
                items: [{ id_producto: 10, precio_final: 9999 }]
            };

            const res = await request(app)
                .put('/api/repair-orders/1')
                .send(payload);

            expect(res.statusCode).toBe(409);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/Cerrada/i);

            const [ordenes] = await db.execute('SELECT * FROM OrdenReparacion WHERE id_orden_reparacion = 1');
            expect(Number(ordenes[0].importe_total)).toBe(3000); // Sin cambios

            const [productos] = await db.execute('SELECT * FROM Producto WHERE id_orden_reparacion = 1');
            const prod10 = productos.find(p => p.id_producto === 10);
            expect(Number(prod10.precio)).toBe(1000); // Sin cambios
        });

        it('debe permitir cerrar la orden vía PUT y volverla inmutable a partir de ese momento', async () => {
            const payload = {
                id_cliente: 1,
                es_cerrada: true,
                items: [{ id_producto: 12, precio_final: 800 }]
            };

            const res = await request(app)
                .put(`/api/repair-orders/${ordenAbiertaId}`)
                .send(payload);

            expect(res.statusCode).toBe(200);

            const [ordenes] = await db.execute('SELECT * FROM OrdenReparacion WHERE id_orden_reparacion = ?', [ordenAbiertaId]);
            expect(ordenes[0].id_estado_orden).toBe(2); // Cerrada
            expect(ordenes[0].fecha_cierre).not.toBeNull();

            const segundoRes = await request(app)
                .put(`/api/repair-orders/${ordenAbiertaId}`)
                .send(payload);

            expect(segundoRes.statusCode).toBe(409);
        });
    });

});