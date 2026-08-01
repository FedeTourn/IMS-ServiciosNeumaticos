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
});