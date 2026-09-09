import React from 'react';

/**
 * Normaliza un texto a mayúsculas sin acentos para permitir un matching robusto de claves.
 * @param {string} text - Texto a normalizar.
 * @returns {string} Texto normalizado.
 */
const normalize = (text) => (text || '')
  .toUpperCase()
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '');

// Mapeo de estados de pago a esquemas de estilo TailwindCSS.
const statusStyles = {
  'BORRADOR': 'bg-gray-100 text-gray-700 border-gray-200',
  'PENDIENTE DE ACREDITACION': 'bg-amber-100 text-amber-800 border-amber-200',
  'ACEPTADO': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'RECHAZADO': 'bg-rose-100 text-rose-800 border-rose-200',
};

/**
 * Componente funcional para mostrar el estado de un pago con estilos dinámicos.
 */
const PaymentStatusBadge = ({ status }) => {
  const currentStyle = statusStyles[normalize(status)] || 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentStyle}`}>
      {status}
    </span>
  );
};

export default PaymentStatusBadge;
