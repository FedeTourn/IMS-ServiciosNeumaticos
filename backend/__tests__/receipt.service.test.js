const ReceiptService = require('../src/services/receipt.service');
const pool = require('../src/config/db.config');
const Receipt = require('../src/models/Receipt');
const Product = require('../src/models/Product');

// Mockear dependencias estructurales de persistencia
jest.mock('../src/config/db.config', () => ({
    getConnection: jest.fn()
}));
jest.mock('../src/models/Receipt');
jest.mock('../src/models/Product');

describe('ReceiptService - Pruebas Unitarias de Lógica de Negocio', () => {
    let mockConnection;

    beforeEach(() => {
        jest.clearAllMocks();

        // Configurar el mock de la conexión transaccional de MySQL
        mockConnection = {
            beginTransaction: jest.fn().mockResolvedValue(),
            commit: jest.fn().mockResolvedValue(),
            rollback: jest.fn().mockResolvedValue(),
            release: jest.fn()
        };

        pool.getConnection.mockResolvedValue(mockConnection);
    });

    test('Debe ejecutar rollback de forma segura si la creación de los productos falla', async () => {
        const receiptPayload = { id_cliente: 4, descripcion: 'Ingreso urgente' };
        const productsList = [{ modelo: 1, observaciones: 'Falla menor' }];

        // Configurar simulación: El encabezado se inserta, pero el modelo de producto arroja un error crítico
        Receipt.insertReceipt.mockResolvedValue(101);
        Product.create.mockRejectedValue(new Error('Falla de integridad referencial o sintáctica en MySQL'));

        // Ejecutar y verificar la propagación controlada del error
        await expect(
            ReceiptService.registerReceiptWithProducts(receiptPayload, productsList)
        ).rejects.toThrow('Falla de integridad referencial o sintáctica en MySQL');

        // Aserciones críticas del estándar de Clean Code para transacciones
        expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
        expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
        expect(mockConnection.commit).not.toHaveBeenCalled();
        expect(mockConnection.release).toHaveBeenCalledTimes(1);
    });

    test('Debe lanzar una excepción con status 400 si el arreglo de productos llega vacío', async () => {
        const receiptPayload = { id_cliente: 4, descripcion: 'Ingreso inválido' };
        const productsList = [];

        await expect(
            ReceiptService.registerReceiptWithProducts(receiptPayload, productsList)
        ).rejects.toThrow('No se puede registrar un comprobante de recepción sin asociar al menos una válvula.');

        // Bloquear accesos innecesarios a las conexiones del pool
        expect(pool.getConnection).not.toHaveBeenCalled();
    });
});