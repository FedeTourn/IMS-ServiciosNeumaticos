const { pool:db } = require('../config/db.config');
const Receipt = require('../models/Receipt')

class ReceiptService {

    static async registerReceiptWithProducts(receiptPayload, productsList) {
        // Validación de regla de negocio previa a la transacción
        if (!productsList || productsList.length === 0) {
            const error = new Error('No se puede registrar un comprobante de recepción sin asociar al menos una válvula.');
            error.statusCode = 400;
            throw error;
        }
        // Adquisición explícita de un cliente del pool para soporte de transacciones ACID
        const connection = await db.getConnection();

        try {
            const Product= require('../models/Product'); // Importamos el modelo de productos centralizado

            // Inicialización de la transacción atómica
            await connection.beginTransaction();

            // Inserción del encabezado del comprobante de recepción
            const receiptId = await Receipt.insertReceipt(connection, receiptPayload);            

            // Creacion de los productos uno a uno en paralelo usando su propia lógica
            const productPromises = productsList.map(product => {
                return Product.create(connection, {
                    ...product,
                    id_comprobante_recepcion: receiptId,
                    id_cliente: receiptPayload.id_cliente,
                    fecha_recepcion: receiptPayload.fecha_recepcion,
                    estado: 1 // Forzado por regla de negocio
                });
            });

            // Promise.all asegura que se ejecuten todos dentro de la misma transacción
            await Promise.all(productPromises);

            // Si los pasos previos son válidos, consolidamos los cambios de forma permanente
            await connection.commit();

            return {
                success: true,
                id_comprobante: receiptId,
                productos_registrados: productPromises.length
            };
            
        } catch (error) {
            // Ante cualquier fallo en el lote de ejecución, revertimos los cambios para evitar datos huérfanos
            await connection.rollback();
            
            // Log técnico interno para auditoría del servidor
            console.error(`[ReceiptService Error] Transacción abortada de manera segura. Razón: ${error.message}`);
            
            // Propagación limpia del error hacia la capa de exposición (Controlador)
            throw error;
            
        } finally {
            connection.release();
        }
    };


}

module.exports = ReceiptService;