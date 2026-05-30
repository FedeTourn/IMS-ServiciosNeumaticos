/**
 * Punto de entrada principal (Entry Point) del servidor.
 * Orquesta la inicialización de la conexión a la DB y el levantamiento de Express.
 * Se encarga de inicializar la escucha de peticiones en el puerto configurado.
 */

const app = require('./src/app');
const { verifyConnection } = require('./src/config/db.config');
require('dotenv').config(); // Carga las variables del .env

/**
 * Función autoejecutable para inicializar los servicios del sistema.
 */
const startApplication = async () => {
  try {
    // Paso 1: Verificar disponibilidad de la persistencia (MySQL)
    await verifyConnection();

    // Paso 2: Escuchar peticiones en el puerto configurado
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`[Server] Servidor web iniciado exitosamente en puerto ${PORT}`);
      console.log(`[Env] Entorno actual: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('[Critical] Fallo catastrófico al iniciar la aplicación.');
    console.error(error.message);
    process.exit(1);
  }
};

startApplication();

/* const port = process.env.PORT || 3001;
const host = process.env.HOST || 'localhost';

// Escucha en el puerto definido
//El método app.listen sin un host específico permite conexiones desde cualquier interfaz de red (0.0.0.0)
app.listen(port, () => {
  console.log(`Server is running`);
  console.log(`Local environment: http://localhost:${port}`);
  console.log(`Network environment: http://${host}:${port} (Check IP on backend/server.js)`);
}); */