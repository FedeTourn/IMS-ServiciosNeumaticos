const request = require('supertest');
const app = require('../src/app');
const { pool: db } = require('../src/config/db.config');

describe('Integración: PUT /api/products/:id_producto', () => {
    let testProductId;

    beforeAll(async () => {
        if (process.env.NODE_ENV === 'test') {
            await db.execute('SET FOREIGN_KEY_CHECKS = 0;');
            await db.execute('TRUNCATE TABLE Producto;');
            await db.execute('SET FOREIGN_KEY_CHECKS = 1;');

            // Catálogos compartidos con otros módulos: no se truncan, solo se garantiza
            // que existan las filas necesarias para esta suite.
            await db.execute("INSERT IGNORE INTO CategoriaCliente (id_categoria, nombre_categoria) VALUES (1, 'CATEGORIA 1')");
            await db.execute("INSERT IGNORE INTO Cliente (id_cliente, nombre, cuit, categoria, activo) VALUES (1, 'Cliente Test Productos', '30-888-1', 1, 1)");
            await db.execute("INSERT IGNORE INTO TipoProducto (id_tipo, nombre) VALUES (1, 'FRENO MANO')");
            await db.execute("INSERT IGNORE INTO ModeloProducto (id_modelo, nombre, tipo) VALUES (1, 'VOLVO', 1)");
            await db.execute(
                "INSERT IGNORE INTO EstadoProducto (id_estado, nombre) VALUES (1, 'RECIBIDO'), (2, 'EN REPARACION'), (3, 'REPARADO'), (4, 'ENTREGADO'), (5, 'NO REPARABLE'), (6, 'LIBRE')"
            );
            // Reglas de transición reales: desde RECIBIDO (1) se puede avanzar, pero nada retrocede a RECIBIDO.
            await db.execute(
                "INSERT IGNORE INTO DiccionarioEstado (estado_origen, estado_destino) VALUES (1,2), (1,3), (1,4), (1,5), (1,6)"
            );

            const [result] = await db.execute(
                "INSERT INTO Producto (modelo, fecha_recepcion, estado, id_cliente, observaciones) VALUES (1, '2025-10-15', 1, 1, 'Prueba inicial')"
            );
            testProductId = result.insertId;
        }
    });

    afterAll(async () => {
        await db.end();
    });

    it('Debe permitir la transición de RECIBIDO (1) a EN_REPARACION (2) devolviendo 200 OK', async () => {
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
        expect(response.body.message).toMatch(/Transici[oó]n no permitida/);
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
