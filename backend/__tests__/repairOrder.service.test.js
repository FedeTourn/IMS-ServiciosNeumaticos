const RepairOrderService = require('../src/services/repairOrder.service');
const RepairOrder = require('../src/models/RepairOrder');
const Product = require('../src/models/Product');
const { pool: db } = require('../src/config/db.config');

// 1. Mockeamos (simulamos) las dependencias externas
jest.mock('../src/models/RepairOrder');
jest.mock('../src/models/Product');
jest.mock('../src/config/db.config', () => ({
    pool: {
        getConnection: jest.fn()
    }
}));

describe('RepairOrderService Unit Tests', () => {
    let mockConnection;

    beforeEach(() => {
        // Configuramos el mock de la conexión a DB para simular una transacción exitosa
        mockConnection = {
            beginTransaction: jest.fn().mockResolvedValue(true),
            commit: jest.fn().mockResolvedValue(true),
            rollback: jest.fn().mockResolvedValue(true),
            release: jest.fn()
        };
        db.getConnection.mockResolvedValue(mockConnection);
        jest.clearAllMocks();
    });

    it('debe crear una orden "Abierta" correctamente y calcular el importe total', async () => {
        // Arrange (Preparación)
        const mockDTO = {
            id_cliente: 1,
            es_cerrada: false, // Orden Abierta
            observaciones: "Test abierta",
            items: [
                { id_producto: 10, precio_final: 5000 },
                { id_producto: 11, precio_final: 7500 }
            ]
        };
        
        // Simulamos que la BD devuelve el ID 99 al crear la orden
        RepairOrder.create.mockResolvedValue(99);
        Product.updateForRepairOrder.mockResolvedValue(1); // 1 fila afectada

        // Act (Ejecución)
        const result = await RepairOrderService.createRepairOrder(mockDTO);

        // Assert (Verificación)
        expect(db.getConnection).toHaveBeenCalled();
        expect(mockConnection.beginTransaction).toHaveBeenCalled();
        
        // Verificamos que se calculó bien el total (5000 + 7500 = 12500)
        // y que se mandó el estado 1 (Abierta)
        expect(RepairOrder.create).toHaveBeenCalledWith(
            expect.objectContaining({
                id_cliente: 1,
                id_estado_orden: 1, 
                importe_total: 12500,
                fecha_cierre: null
            }),
            mockConnection
        );

        // Verificamos que se actualizó el producto con el estado 2 (En Reparación)
        expect(Product.updateForRepairOrder).toHaveBeenCalledTimes(2);
        expect(Product.updateForRepairOrder).toHaveBeenCalledWith(
            10, 
            expect.objectContaining({ nuevo_estado: 3 }), 
            mockConnection
        );

        expect(mockConnection.commit).toHaveBeenCalled();
        expect(mockConnection.release).toHaveBeenCalled();
        expect(result.id_orden_reparacion).toBe(99);
    });

    it('debe revertir la transacción (rollback) si falla un modelo', async () => {
        // Arrange
        const mockDTO = {
            id_cliente: 1,
            es_cerrada: true,
            items: [{ id_producto: 10, precio_final: 5000 }]
        };
        
        // Simulamos un fallo en la base de datos al crear la orden
        RepairOrder.create.mockRejectedValue(new Error("Database connection lost"));

        // Act & Assert
        await expect(RepairOrderService.createRepairOrder(mockDTO)).rejects.toThrow("Database connection lost");

        expect(mockConnection.beginTransaction).toHaveBeenCalled();
        expect(mockConnection.rollback).toHaveBeenCalled();
        expect(mockConnection.commit).not.toHaveBeenCalled();
        expect(mockConnection.release).toHaveBeenCalled();
    });

    it('debe aplicar valores por defecto, normalizar ordenamiento y limpiar ceros iniciales en id_orden_reparacion', async () => {
        const rawFilters = {
            id_orden_reparacion: '00150', // Debe transformarse a '150' con la regex ^0+
            id_cliente: '2',
            estado: 'Abierta',
            sort_by: 'importe_total',
            sort_order: 'dsc' // Debe normalizarse a DESC
        };

        const mockResolvedData = [{ id_orden_reparacion: 150, importe_total: 50000 }];
        RepairOrder.findAll.mockResolvedValue(mockResolvedData);

        const result = await RepairOrderService.getRepairOrders(rawFilters);

        expect(RepairOrder.findAll).toHaveBeenCalledTimes(1);
        expect(RepairOrder.findAll).toHaveBeenCalledWith({
            id_orden_reparacion: '150',
            id_cliente: '2',
            estado: 'Abierta',
            sort_by: 'importe_total',
            sort_order: 'DESC'
        });

        expect(result).toEqual(mockResolvedData);
    });

    it('debe aplicar listas blancas (whitelisting) y fallbacks ante parámetros inválidos de ordenamiento', async () => {
        const maliciousFilters = {
            sort_by: 'columna_ilegal_injection',
            sort_order: 'INVALID'
        };

        RepairOrder.findAll.mockResolvedValue([]);

        await RepairOrderService.getRepairOrders(maliciousFilters);

        expect(RepairOrder.findAll).toHaveBeenCalledWith(
            expect.objectContaining({
                sort_by: 'fecha_creacion',
                sort_order: 'DESC'
            })
        );
    });

    it('debe propagar limpiamente el error si la capa de datos de consulta falla', async () => {
        const dbError = new Error('Error al ejecutar query en base de datos');
        RepairOrder.findAll.mockRejectedValue(dbError);

        await expect(RepairOrderService.getRepairOrders({})).rejects.toThrow('Error al ejecutar query en base de datos');
    });

    it('debe obtener y mapear correctamente el detalle de una orden, casteando los numéricos', async () => {
        const mockRawModelData = {
            id_orden_reparacion: 15,
            id_estado_orden: 2,
            estado_orden_nombre: 'Cerrada',
            fecha_cierre: '2026-08-15T10:00:00Z',
            importe_total: '125000.50',
            observaciones: 'Prueba de mapeo',
            id_cliente: 7,
            cliente_nombre: 'Cliente Test SA',
            cliente_cuit: '30-12345678-9',
            cliente_direccion: 'Calle Falsa 123',
            productos: [
                {
                    id_producto: 101,
                    modelo_nombre: 'Modelo X',
                    tipo_nombre: 'Válvula',
                    producto_estado_nombre: 'Reparado',
                    fecha_recepcion: '2026-08-01T10:00:00Z',
                    precio_final: '62500.25'
                }
            ]
        };

        RepairOrder.findById.mockResolvedValue(mockRawModelData);

        const result = await RepairOrderService.getRepairOrderById(15);

        // Assert: Verificamos delegación al DAO
        expect(RepairOrder.findById).toHaveBeenCalledWith(15);
        
        // Assert: Verificamos el mapeo estructural (Data Mapper)
        expect(result.id_orden_reparacion).toBe(15);
        expect(result.cliente.nombre).toBe('Cliente Test SA');
        expect(result.productos).toHaveLength(1);
        expect(result.productos[0].modelo_nombre).toBe('Modelo X');

        // Assert: CRÍTICO - Verificamos el Type Safety (casteo estricto a Number)
        expect(typeof result.importe_total).toBe('number');
        expect(result.importe_total).toBe(125000.50);
        expect(typeof result.productos[0].precio_final).toBe('number');
        expect(result.productos[0].precio_final).toBe(62500.25);
    });

    it('debe lanzar un error 404 si la capa de datos retorna null al buscar por ID', async () => {
        // Arrange: Modelo no encuentra la orden
        RepairOrder.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(RepairOrderService.getRepairOrderById(99))
            .rejects
            .toMatchObject({
                statusCode: 404,
                message: 'No se encontró ninguna orden de reparación asociada al identificador #99.'
            });

        expect(RepairOrder.findById).toHaveBeenCalledWith(99);
    });

    describe('updateRepairOrder', () => {
        const mockOpenOrder = {
            id_orden_reparacion: 5,
            estado_orden_nombre: 'Abierta',
            observaciones: 'Observación original',
            productos: [
                { id_producto: 10 },
                { id_producto: 11 }
            ]
        };

        it('debe lanzar un error 404 si la orden a modificar no existe', async () => {
            RepairOrder.findById.mockResolvedValue(null);

            await expect(RepairOrderService.updateRepairOrder(99, {
                items: [{ id_producto: 10, precio_final: 1000 }]
            })).rejects.toMatchObject({ statusCode: 404 });

            expect(db.getConnection).not.toHaveBeenCalled();
        });

        it('debe lanzar un error 409 (Fail-Fast) si la orden ya se encuentra Cerrada', async () => {
            RepairOrder.findById.mockResolvedValue({ ...mockOpenOrder, estado_orden_nombre: 'Cerrada' });

            await expect(RepairOrderService.updateRepairOrder(5, {
                items: [{ id_producto: 10, precio_final: 1000 }]
            })).rejects.toMatchObject({ statusCode: 409 });

            expect(db.getConnection).not.toHaveBeenCalled();
            expect(RepairOrder.update).not.toHaveBeenCalled();
        });

        it('debe lanzar un error 400 si el payload no contiene items', async () => {
            RepairOrder.findById.mockResolvedValue(mockOpenOrder);

            await expect(RepairOrderService.updateRepairOrder(5, { items: [] }))
                .rejects.toMatchObject({ statusCode: 400 });

            expect(db.getConnection).not.toHaveBeenCalled();
        });

        it('debe desvincular únicamente las válvulas que fueron removidas del payload', async () => {
            RepairOrder.findById.mockResolvedValue(mockOpenOrder);
            Product.unlinkFromRepairOrder.mockResolvedValue(1);
            Product.updateForRepairOrder.mockResolvedValue(1);
            RepairOrder.update.mockResolvedValue(1);

            await RepairOrderService.updateRepairOrder(5, {
                items: [{ id_producto: 10, precio_final: 1000 }]
            });

            expect(Product.unlinkFromRepairOrder).toHaveBeenCalledTimes(1);
            expect(Product.unlinkFromRepairOrder).toHaveBeenCalledWith(11, mockConnection);
        });

        it('no debe desvincular ninguna válvula si el payload conserva todas las existentes', async () => {
            RepairOrder.findById.mockResolvedValue(mockOpenOrder);
            Product.updateForRepairOrder.mockResolvedValue(1);
            RepairOrder.update.mockResolvedValue(1);

            await RepairOrderService.updateRepairOrder(5, {
                items: [
                    { id_producto: 10, precio_final: 1000 },
                    { id_producto: 11, precio_final: 2000 }
                ]
            });

            expect(Product.unlinkFromRepairOrder).not.toHaveBeenCalled();
        });

        it('debe vincular/actualizar cada válvula presente en el payload con su precio y nuevo estado', async () => {
            RepairOrder.findById.mockResolvedValue(mockOpenOrder);
            Product.updateForRepairOrder.mockResolvedValue(1);
            RepairOrder.update.mockResolvedValue(1);

            await RepairOrderService.updateRepairOrder(5, {
                items: [
                    { id_producto: 10, precio_final: 1000 },
                    { id_producto: 12, precio_final: 2000 }
                ]
            });

            expect(Product.updateForRepairOrder).toHaveBeenCalledTimes(2);
            expect(Product.updateForRepairOrder).toHaveBeenCalledWith(
                10,
                expect.objectContaining({ id_orden_reparacion: 5, precio_final: 1000, nuevo_estado: 3 }),
                mockConnection
            );
            expect(Product.updateForRepairOrder).toHaveBeenCalledWith(
                12,
                expect.objectContaining({ id_orden_reparacion: 5, precio_final: 2000, nuevo_estado: 3 }),
                mockConnection
            );
        });

        it('debe recalcular el importe_total y mantener la orden Abierta cuando es_cerrada es false', async () => {
            RepairOrder.findById.mockResolvedValue(mockOpenOrder);
            Product.unlinkFromRepairOrder.mockResolvedValue(1);
            Product.updateForRepairOrder.mockResolvedValue(1);
            RepairOrder.update.mockResolvedValue(1);

            await RepairOrderService.updateRepairOrder(5, {
                es_cerrada: false,
                items: [
                    { id_producto: 10, precio_final: 1500 },
                    { id_producto: 11, precio_final: 2500 }
                ]
            });

            expect(RepairOrder.update).toHaveBeenCalledWith(
                5,
                expect.objectContaining({
                    importe_total: 4000,
                    id_estado_orden: 1,
                    fecha_cierre: null
                }),
                mockConnection
            );
        });

        it('debe transicionar la orden a Cerrada (id_estado_orden 2, fecha_cierre asignada) cuando es_cerrada es true', async () => {
            RepairOrder.findById.mockResolvedValue(mockOpenOrder);
            Product.unlinkFromRepairOrder.mockResolvedValue(1);
            Product.updateForRepairOrder.mockResolvedValue(1);
            RepairOrder.update.mockResolvedValue(1);

            await RepairOrderService.updateRepairOrder(5, {
                es_cerrada: true,
                items: [{ id_producto: 10, precio_final: 1000 }]
            });

            expect(RepairOrder.update).toHaveBeenCalledWith(
                5,
                expect.objectContaining({ id_estado_orden: 2 }),
                mockConnection
            );

            const updateCallArgs = RepairOrder.update.mock.calls[0][1];
            expect(updateCallArgs.fecha_cierre).toBeInstanceOf(Date);
        });

        it('debe preservar las observaciones existentes si el DTO no las envía', async () => {
            RepairOrder.findById.mockResolvedValue(mockOpenOrder);
            Product.unlinkFromRepairOrder.mockResolvedValue(1);
            Product.updateForRepairOrder.mockResolvedValue(1);
            RepairOrder.update.mockResolvedValue(1);

            await RepairOrderService.updateRepairOrder(5, {
                items: [{ id_producto: 10, precio_final: 1000 }]
            });

            expect(RepairOrder.update).toHaveBeenCalledWith(
                5,
                expect.objectContaining({ observaciones: mockOpenOrder.observaciones }),
                mockConnection
            );
        });

        it('debe sobrescribir las observaciones si el DTO las envía explícitamente', async () => {
            RepairOrder.findById.mockResolvedValue(mockOpenOrder);
            Product.unlinkFromRepairOrder.mockResolvedValue(1);
            Product.updateForRepairOrder.mockResolvedValue(1);
            RepairOrder.update.mockResolvedValue(1);

            await RepairOrderService.updateRepairOrder(5, {
                observaciones: 'Nueva observación',
                items: [{ id_producto: 10, precio_final: 1000 }]
            });

            expect(RepairOrder.update).toHaveBeenCalledWith(
                5,
                expect.objectContaining({ observaciones: 'Nueva observación' }),
                mockConnection
            );
        });

        it('debe revertir la transacción (rollback) si falla la actualización de un producto', async () => {
            RepairOrder.findById.mockResolvedValue(mockOpenOrder);
            Product.updateForRepairOrder.mockRejectedValue(new Error('Fallo de conexión'));

            await expect(RepairOrderService.updateRepairOrder(5, {
                items: [{ id_producto: 10, precio_final: 1000 }]
            })).rejects.toThrow('Fallo de conexión');

            expect(mockConnection.beginTransaction).toHaveBeenCalled();
            expect(mockConnection.rollback).toHaveBeenCalled();
            expect(mockConnection.commit).not.toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalled();
        });

        it('debe retornar el resultado exitoso con el formato esperado', async () => {
            RepairOrder.findById.mockResolvedValue(mockOpenOrder);
            Product.unlinkFromRepairOrder.mockResolvedValue(1);
            Product.updateForRepairOrder.mockResolvedValue(1);
            RepairOrder.update.mockResolvedValue(1);

            const result = await RepairOrderService.updateRepairOrder(5, {
                items: [{ id_producto: 10, precio_final: 1000 }]
            });

            expect(result).toEqual({
                success: true,
                message: "Orden de reparación actualizada exitosamente",
                id_orden_reparacion: 5
            });

            expect(mockConnection.commit).toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalled();
        });
    });
});