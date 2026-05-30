import React from 'react';

/**
 * Componente funcional para mostrar el estado de un producto con estilos dinámicos.
 * @param {string} status - El estado actual del producto (ej. 'Recibido', 'Reparado').
 */
const StatusBadge = ({ status }) => {
  // Mapeo de estados a clases de TailwindCSS
  const statusStyles = {
    'Recibido': 'bg-blue-100 text-blue-800 border-blue-200',
    'En Reparación': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Reparado': 'bg-green-100 text-green-800 border-green-200',
    'Entregado': 'bg-gray-100 text-gray-800 border-gray-200',
    'No Reparable': 'bg-red-100 text-red-800 border-red-200',
    'Libre': 'bg-purple-100 text-purple-800 border-purple-200',
  };

  // Estilo por defecto si el estado no coincide
  const currentStyle = statusStyles[status] || 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentStyle}`}>
      {status}
    </span>
  );
};

export default StatusBadge;