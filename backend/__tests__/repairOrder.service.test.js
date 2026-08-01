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
});