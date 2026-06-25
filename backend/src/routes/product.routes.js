const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
// Pendiente: Middleware de autenticación

// GET /api/products - Consultar Productos (Válvulas)
router.get('/', productController.getAllProducts);

// POST /api/products - Crear Producto (Recepción)
router.post('/', productController.createProduct);

// GET /api/products/states - Consultar Estados (Lista de referencia)
router.get('/states', productController.getProductStates);

// GET /api/products/states/transitions - Consultar Transiciones de estados
router.get('/states/transitions', productController.getStateTransitions);

// =========================
// RUTAS DE TIPO DE PRODUCTO
// =========================

// GET /api/products/types - Consultar Tipos
router.get('/types', productController.getProductTypes);

// GET /api/products/types/:id_tipo - Consultar Tipo por ID
router.get('/types/:id_tipo', productController.getProductTypeById);

// POST /api/products/types - Crear Tipo
router.post('/types', productController.createProductType);

// PUT /api/products/types/:id_tipo - Modificar Tipo
router.put('/types/:id_tipo', productController.updateProductType);

// ============================
// RUTAS DE MODELO DE PRODUCTO
// ============================

// GET /api/products/models - Consultar Modelos
router.get('/models', productController.getProductModels);

// GET /api/products/models/:id_modelo - Consultar Modelo por ID
router.get('/models/:id_modelo', productController.getProductModelById);

// POST /api/products/models - Crear Modelo
router.post('/models', productController.createProductModel);

// PUT /api/products/models/:id_modelo - Modificar Modelo
router.put('/models/:id_modelo', productController.updateProductModel);

// ============================
// RUTAS DE PRODUCTO GENERICAS
// ============================

// GET /api/products/:id_producto - Consultar Producto por ID (Detalle)
router.get('/:id_producto', productController.getProductById);

// PUT /api/products/:id_producto - Modificar Producto
router.put('/:id_producto', productController.updateProduct);



module.exports = router;