/* const ReceiptService = require('../src/services/receipt.service');
const Receipt = require('../src/models/Receipt');
const Product = require('../src/models/Product');
const { pool: db } = require('../src/config/db.config'); // Importamos el objeto real

// Mockeamos el módulo completo
jest.mock('../src/config/db.config', () => ({
    pool: {
        getConnection: jest.fn()
    }
}));
jest.mock('../src/models/Receipt');
jest.mock('../src/models/Product');

describe('ReceiptService - Pruebas Unitarias de Lógica de Negocio', () => {
    let mockConnection;

    beforeEach(() => {
        jest.clearAllMocks();

        mockConnection = {
            beginTransaction: jest.fn().mockResolvedValue(),
            commit: jest.fn().mockResolvedValue(),
            rollback: jest.fn().mockResolvedValue(),
            release: jest.fn()
        };

        // Al ser un mock de Jest, podemos acceder directamente a db.getConnection
        db.getConnection.mockResolvedValue(mockConnection);
    });

    test('Debe ejecutar rollback de forma segura si la creación de los productos falla', async () => {
        const receiptPayload = { id_cliente: 4, fecha_recepcion: '2026-06-26' };
        const productsList = [{ modelo: 1 }];

        Receipt.insertReceipt.mockResolvedValue(101);
        // Simulamos que Product.create explota
        Product.create.mockRejectedValue(new Error('Falla de integridad referencial'));

        await expect(
            ReceiptService.registerReceiptWithProducts(receiptPayload, productsList)
        ).rejects.toThrow('Falla de integridad referencial');

        expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
        expect(mockConnection.commit).not.toHaveBeenCalled();
    });

    test('Debe lanzar una excepción con status 400 si el arreglo de productos llega vacío', async () => {
        const receiptPayload = { id_cliente: 4, descripcion: 'Ingreso inválido' };
        const productsList = [];

        await expect(
            ReceiptService.registerReceiptWithProducts(receiptPayload, productsList)
        ).rejects.toThrow('No se puede registrar un comprobante de recepción sin asociar al menos una válvula.');

        // Bloquear accesos innecesarios a las conexiones del pool
        expect(db.getConnection).not.toHaveBeenCalled();
    });

    test('getAllReceipts debe filtrar y ordenar correctamente', async () => {
        const filters = { search: 'Tourn', sort_by: 'fecha', sort_order: 'ASC' };
        Receipt.findReceiptsByCriteria.mockResolvedValue([{ id: 1 }]);
        
        await ReceiptService.getAllReceipts(filters);
        
        expect(Receipt.findReceiptsByCriteria).toHaveBeenCalledWith(expect.objectContaining({
            search: 'Tourn',
            sort_by: 'fecha'
        }));
    });

    test('updateReceipt debe lanzar error 409 si los productos están avanzados', async () => {
        const mockReceipt = {
            id_comprobante: 1,
            productos: [{ estado: 'En Reparación' }] // Estado > 'Recibido'
        };
        
        jest.spyOn(ReceiptService, 'getReceiptDetails').mockResolvedValue(mockReceipt);
        
        await expect(ReceiptService.updateReceipt(1, { descripcion: 'test' }))
            .rejects.toThrow('Inmutabilidad Contable');
    });
}); */