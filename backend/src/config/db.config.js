/**
 * Configuración de conexión a la base de datos MySQL.
 * Se utiliza un Pool de conexiones para optimizar el rendimiento y la reutilización de hilos.
 * Soporta conmutación dinámica basada en variables de entorno para pruebas automatizadas.
 */

const mysql = require('mysql2/promise'); 
require('dotenv').config();

// Evaluación en tiempo de ejecución para determinar el esquema de destino
// Si ejecutamos tests, forzamos el uso de la base de datos aislada
const databaseTarget = process.env.NODE_ENV === 'test' 
  ? process.env.DB_NAME_TEST  // <-- Ahora lee del .env
  : process.env.DB_NAME;

// Objeto de configuración centralizado y adaptativo
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: databaseTarget, // <-- Inyección dinámica del esquema
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10, 
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

// Instanciación del Pool de conexiones relacionales
const pool = mysql.createPool(dbConfig);

/**
 * Verifica la disponibilidad de la base de datos al iniciar el servicio o la suite de pruebas.
 * Previene el levantamiento de la API si la capa de datos no responde de forma óptima.
 * @returns {Promise<boolean>} Retorna true si la conexión fue exitosa.
 * @throws {Error} Lanza una excepción si falla la conexión en entorno de testing.
 */
const verifyConnection = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Silenciamos los logs informativos en entorno de test para mantener limpia la consola de Jest
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[DB] Conexión establecida exitosamente en entorno [${process.env.NODE_ENV || 'development'}]. ID de hilo: ${connection.threadId}`);
    }
    
    connection.release();
    return true;
  } catch (error) {
    console.error('[DB] Error crítico: No se pudo conectar a la base de datos.');
    console.error(`[DB] Detalle: ${error.message}`);
    
    // GESTIÓN DE FALLOS SEPARADA:
    // Si estamos testeando, lanzar el error permite que Jest lo capture y lo muestre en el reporte.
    // Usar process.exit(1) aquí abortaría la ejecución de la suite completa impidiendo ver reportes de errores.
    if (process.env.NODE_ENV === 'test') {
      throw error;
    } else {
      process.exit(1); 
    }
  }
};

module.exports = {
  pool,
  verifyConnection
};