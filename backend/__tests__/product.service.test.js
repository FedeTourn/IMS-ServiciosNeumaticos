/**
 * @file product.service.test.js
 * @description Pruebas unitarias para la capa de Servicio de Productos.
 * Utiliza Mocks de Jest para aislar la lógica de negocio de la base de datos.
 */

const ProductService = require('../src/services/product.service');
const Product = require('../src/models/Product');

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

describe('ProductService - Lógica Compleja', () => {
    
    // Prueba de Regla de Negocio: Transición Prohibida
    it('debería lanzar error 403 al intentar una transición prohibida', async () => {
        // Simulamos producto en estado 4 (ENTREGADO) que no tiene transiciones permitidas
        Product.findById.mockResolvedValue({ id_producto: 1, estado: 4, estado_nombre: 'Entregado' });

        await expect(ProductService.updateProductState(1, 2, 'Cualquier observacion'))
            .rejects
            .toMatchObject({ status: 403 });
    });

    // Prueba de Lógica: Listado con filtros
    it('debería pasar los filtros correctamente al modelo', async () => {
        const mockFilters = { orderBy: 'fecha_recepcion', sortOrder: 'DESC' };
        Product.findAll.mockResolvedValue([{ id_producto: 1 }]);

        const result = await ProductService.getAllProducts(mockFilters);

        expect(Product.findAll).toHaveBeenCalledWith(mockFilters);
        expect(result).toHaveLength(1);
    });
});

describe('Unit Test: ProductService - Gestión de Tipos de Producto', () => {

    it('createType: Debe rechazar un nombre vacío', async () => {
        await expect(ProductService.createType(' '))
            .rejects
            .toMatchObject({ status: 400 });
    });

    it('createType: Debe rechazar un nombre duplicado', async () => {
        // Preparamos el mock para devolver un tipo existente
        Product.findAllProductTypes.mockResolvedValue([{ nombre: 'VALVULA' }]);

        await expect(ProductService.createType('VALVULA'))
            .rejects
            .toMatchObject({ status: 409 });
    });

    it('createType: Debe crear un tipo si el nombre es válido y único', async () => {
        Product.findAllProductTypes.mockResolvedValue([{ nombre: 'BOMBA' }]);
        Product.createType.mockResolvedValue(1);

        const id = await ProductService.createType('VALVULA');
        
        expect(id).toBe(1);
        expect(Product.createType).toHaveBeenCalledWith({ nombre: 'VALVULA' });
    });

    it('updateType: Debe rechazar actualización si el ID no existe', async () => {
        Product.findTypeById.mockResolvedValue(null);

        await expect(ProductService.updateType(999, 'Nuevo Nombre'))
            .rejects
            .toMatchObject({ status: 404 });
    });
});

describe('Unit Test: ProductService - Gestión de Modelos de Producto', () => {

    it('createModel: Debe rechazar la creación si el nombre viene vacío o falta el tipo', async () => {
        // Validación de campos obligatorios
        await expect(ProductService.createModel(' ', 1))
            .rejects
            .toMatchObject({ status: 400, message: "El nombre del modelo y el ID de tipo son requeridos." });

        await expect(ProductService.createModel('Modelo Alpha', null))
            .rejects
            .toMatchObject({ status: 400, message: "El nombre del modelo y el ID de tipo son requeridos." });
    });

    it('createModel: Debe rechazar si el TipoProducto (id_tipo) asignado no existe en la base de datos', async () => {
        // Simulamos que el Tipo maestro no existe (devuelve null)
        Product.findTypeById.mockResolvedValue(null);

        await expect(ProductService.createModel('5/2 MONOESTABLE', 999))
            .rejects
            .toMatchObject({ status: 404, message: "Operación abortada: El tipo de producto con ID 999 no existe." });
        
        // Verificamos que no se haya llamado a la inserción
        expect(Product.createModel).not.toHaveBeenCalled();
    });

    it('createModel: Debe persistir el modelo en mayúsculas si el tipo existe y los datos son válidos', async () => {
        // Simulamos que el Tipo maestro sí existe
        Product.findTypeById.mockResolvedValue({ id_tipo: 2, nombre: 'VALVULAS' });
        Product.createModel.mockResolvedValue(45); // ID autoincremental simulado

        const idResult = await ProductService.createModel('  3/2 biestable  ', 2);

        expect(idResult).toBe(45);
        // Comprobamos la normalización UPPERCASE y el parseo del tipo
        expect(Product.createModel).toHaveBeenCalledWith({
            nombre: '3/2 BIESTABLE',
            tipo: 2
        });
    });

    it('updateModel: Debe lanzar error 404 si el modelo a modificar no existe o no tiene cambios', async () => {
        // El tipo existe, pero el update del modelo afecta a 0 filas
        Product.findTypeById.mockResolvedValue({ id_tipo: 1, nombre: 'CILINDROS' });
        Product.updateModel.mockResolvedValue(0);

        await expect(ProductService.updateModel(88, 'Nuevo Nombre', 1))
            .rejects
            .toMatchObject({ status: 404, message: "Modelo de producto no encontrado o sin cambios." });
    });
});