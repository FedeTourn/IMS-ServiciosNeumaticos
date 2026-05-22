/**
 * @file product.service.test.js
 * @description Pruebas unitarias para la capa de Servicio de Productos.
 * Utiliza Mocks de Jest para aislar la lógica de negocio de la base de datos.
 */

const ProductService = require('../src/services/product.service');
const Product = require('../src/models/Product');

// Le decimos a Jest que intercepte y "congele" el modelo Product
jest.mock('../src/models/Product');

describe('Unit Test: ProductService.updateProductState', () => {
    // Limpiamos los mocks antes de cada test para evitar contaminación
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Debe rechazar la transición si el nuevo estado no está en TRANSITION_RULES', async () => {
        // PREPARACIÓN (Arrange): Simulamos que la DB nos devuelve una válvula en estado 4 (ENTREGADO)
        Product.findById.mockResolvedValue({
            id_producto: 99,
            estado: 4, 
            estado_nombre: 'Entregado'
        });

        // ACCIÓN Y ASERCIÓN (Act & Assert)
        // Intentamos pasarla a estado 2 (EN_REPARACION). Esto debe fallar según tus reglas.
        await expect(ProductService.updateProductState(99, 2, 'Intento ilegal'))
            .rejects
            .toEqual({ status: 403, message: "Transition not allowed: Cannot move from '${product.estado_nombre}' to '${(await Product.findById(new_state_id)).estado_nombre}'." });
        
        // Verificamos que el servicio NUNCA haya intentado llamar al UPDATE de la base de datos
        expect(Product.update).not.toHaveBeenCalled();
    });

    it('Debe procesar la transición correctamente si es válida', async () => {
        // PREPARACIÓN (Arrange)
        // Simulamos una válvula RECIBIDA (1)
        Product.findById.mockResolvedValue({ id_producto: 100, estado: 1 });
        // Simulamos que el update afecta a 1 fila
        Product.update.mockResolvedValue(1); 

        // ACCIÓN (Act)
        // Pasamos a EN_REPARACION (2)
        const result = await ProductService.updateProductState(100, 2, 'Iniciando');

        // ASERCIÓN (Assert)
        expect(result.message).toBe("Product updated successfully.");
        // Verificamos que el servicio haya llamado a la base de datos con los datos correctos
        expect(Product.update).toHaveBeenCalledWith(100, { observaciones: 'Iniciando', estado: 2 });
    });
});