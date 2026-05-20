/** @type {import('jest').Config} */
module.exports = {
  // Indica que testeamos una app de Node (no un navegador)
  testEnvironment: 'node',
  // Muestra un reporte detallado de cada test que pasa o falla
  verbose: true,
  // Limpia los mocks y espías entre cada prueba para evitar falsos positivos
  clearMocks: true,
};