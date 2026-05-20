const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
// Pendiente: Middleware de autenticación

// --- 1. Rutas Estáticas de Listas de Referencia (DEBEN IR PRIMERO) ---

// --- 2. Rutas Generales / Parametrizadas (DEBEN IR DESPUÉS) ---

// GET /api/products - Consultar Productos (Válvulas)
router.get('/', productController.getAllProducts);

// GET /api/products/types - Consultar Tipos
router.get('/types', productController.getProductTypes);

// GET /api/products/models - Consultar Modelos
router.get('/models', productController.getProductModels);

// POST /api/products - Crear Producto (Recepción)
router.post('/', productController.createProduct);

// GET /api/products/states - Consultar Estados (Lista de referencia)
router.get('/states', productController.getProductStates);

// GET /api/products/:id_producto - Consultar Producto por ID (Detalle)
router.get('/:id_producto', productController.getProductById);

// PUT /api/products/:id_producto - Modificar Producto
router.put('/:id_producto', productController.updateProduct);

module.exports = router;