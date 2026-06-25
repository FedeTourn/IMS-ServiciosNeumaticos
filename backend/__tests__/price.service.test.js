/**
 * @file price.service.test.js
 * @description Pruebas unitarias para la lógica de negocio de Precios por Categoría.
 */

const PriceService = require('../src/services/price.service');
const PriceCategory = require('../src/models/PriceCategory');
const { pool: db } = require('../src/config/db.config');

// Aislar la capa de Acceso a Datos
jest.mock('../src/models/PriceCategory');
jest.mock('../src/config/db.config', () => ({
    pool: {
        getConnection: jest.fn()
    }
}));

describe('PriceService - Pruebas Unitarias', () => {
    let mockConnection;

    beforeEach(() => {
        // Limpiar los mocks antes de cada test
        jest.clearAllMocks();

        // Configurar el mock de la conexión transaccional
        mockConnection = {
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn(),
        };
        db.getConnection.mockResolvedValue(mockConnection);
    });

    describe('getSuggestedPrice()', () => {
        it('Debería retornar la tarifa si los parámetros son válidos y existe', async () => {
            PriceCategory.findSuggestedPrice.mockResolvedValue({ precio: 1500 });
            
            const result = await PriceService.getSuggestedPrice(1, 2);
            
            expect(result).toEqual({ precio: 1500 });
            expect(PriceCategory.findSuggestedPrice).toHaveBeenCalledWith(1, 2);
        });

        it('Debería lanzar error 404 (Not Found conceptual) si la tarifa no existe', async () => {
            PriceCategory.findSuggestedPrice.mockResolvedValue(null);
            
            await expect(PriceService.getSuggestedPrice(1, 99))
                .rejects
                .toThrow("No existe una tarifa activa parametrizada");
        });
    });

    describe('updatePriceBatch() - Transacciones ACID', () => {
        it('Debería completar la transacción (commit) para un lote válido', async () => {
            const validBatch = [
                { idModelo: 1, idCategoria: 1, nuevoPrecio: 2000 },
                { idModelo: 1, idCategoria: 2, nuevoPrecio: 1800 }
            ];

            PriceCategory.invalidatePrice.mockResolvedValue(true);
            PriceCategory.insertPrice.mockResolvedValue(10); // Simula el ID generado

            const result = await PriceService.updatePriceBatch(validBatch);

            // Verificaciones ACID
            expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
            expect(PriceCategory.invalidatePrice).toHaveBeenCalledTimes(2);
            expect(PriceCategory.insertPrice).toHaveBeenCalledTimes(2);
            expect(mockConnection.commit).toHaveBeenCalledTimes(1);
            expect(mockConnection.rollback).not.toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalledTimes(1);
            
            expect(result.success).toBe(true);
            expect(result.count).toBe(2);
        });

        it('Debería abortar (rollback) si un precio en el lote es inválido o negativo', async () => {
            const invalidBatch = [
                { idModelo: 1, idCategoria: 1, nuevoPrecio: 2000 },
                { idModelo: 2, idCategoria: 1, nuevoPrecio: -500 } // Precio negativo inaceptable
            ];

            await expect(PriceService.updatePriceBatch(invalidBatch))
                .rejects
                .toThrow("Datos inválidos en el lote");

            // Verificaciones ACID: El escudo de integridad
            expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
            expect(mockConnection.commit).not.toHaveBeenCalled();
            expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
            expect(mockConnection.release).toHaveBeenCalledTimes(1);
        });
    });
});