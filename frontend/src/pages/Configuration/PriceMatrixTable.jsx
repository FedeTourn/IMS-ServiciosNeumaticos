import React from 'react';

export default function PriceMatrixTable({ models, categories, matrixData, pendingUpdates, errors,  onPriceChange }) {
    
    // Determina si una celda específica fue editada en la sesión actual
    const isCellEdited = (idModelo, idCategoria) => {
        return !!pendingUpdates[`${idModelo}-${idCategoria}`];
    };

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                            Descripción
                        </th>
                        {categories.map(cat => (
                            <th key={cat.id_categoria} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {cat.nombre}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {models.map(modelo => (
                        <tr key={modelo.id_modelo} className="hover:bg-gray-50 transition-colors">
                            {/* Columna estática de Descripción */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white shadow-[1px_0_0_0_rgba(229,231,235,1)]">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        {modelo.tipo}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900 mt-0.5">
                                        {modelo.nombre}
                                    </span>
                                </div>
                            </td>
                            
                            {/* Celdas de precios editables */}
                            {categories.map(cat => {
                                const cellKey = `${modelo.id_modelo}-${cat.id_categoria}`;
                                const currentValue = matrixData[modelo.id_modelo]?.[cat.id_categoria] || '';
                                const edited = isCellEdited(modelo.id_modelo, cat.id_categoria);
                                const cellError = errors[cellKey]; // Evaluamos si esta celda específica tiene un error
                                
                                return (
                                    <td key={cat.id_categoria} className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="flex items-center">
                                                <span className="text-gray-500 mr-1">$</span>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={currentValue}
                                                    onChange={(e) => onPriceChange(modelo.id_modelo, cat.id_categoria, e.target.value)}
                                                    className={`w-24 text-right p-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                                        cellError
                                                            ? 'border-red-500 bg-red-50 text-red-700 focus:ring-red-400' // Estilo de Error
                                                            : edited 
                                                                ? 'bg-yellow-50 border-yellow-400 font-semibold text-blue-800' 
                                                                : 'border-gray-300'
                                                    }`}
                                                />
                                            </div>
                                            {/* Mensaje de error condicional */}
                                            {cellError && (
                                                <span className="text-red-500 text-xs absolute bottom-0">
                                                    {cellError}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}