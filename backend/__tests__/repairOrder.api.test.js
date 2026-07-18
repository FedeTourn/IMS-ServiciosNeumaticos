const request = require('supertest');
const app = require('../src/app');
const { pool: db } = require('../src/config/db.config');

describe('POST /api/repair-orders (Integración)', () => {

    beforeAll(async () => {
        // Limpiamos las tablas antes de correr los tests para evitar basura
        // NOTA: Asegúrate de que NODE_ENV sea 'test' para no borrar producción.
        if(process.env.NODE_ENV === 'test') {
           await db.execute('SET FOREIGN_KEY_CHECKS = 0;');
           await db.execute('TRUNCATE TABLE Producto;');
           await db.execute('TRUNCATE TABLE OrdenReparacion;');
           await db.execute('TRUNCATE TABLE Cliente;');
           await db.execute('SET FOREIGN_KEY_CHECKS = 1;');
           
           // Insertamos datos básicos necesarios (Dummy Data)
           await db.execute("INSERT INTO Cliente (id_cliente, nombre, cuit) VALUES (1, 'Cliente Test', '30-123')");
           // Insertamos dos válvulas libres/recibidas
           await db.execute("INSERT INTO Producto (id_producto, id_cliente, estado, modelo) VALUES (10, 1, 1, 2), (11, 1, 6, 3)");
        }
    });

    afterAll(async () => {
        await db.end(); // Cerramos el pool al finalizar la suite
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
});