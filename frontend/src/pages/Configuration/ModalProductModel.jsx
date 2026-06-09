import React, { useState } from 'react';

/**
 * Modal para Alta y Edición de Modelos de Producto.
 */
const ModalProductModel = ({ isOpen, onClose, onSave, initialData, productTypes }) => {
    const [nombre, setNombre] = useState(initialData ? initialData.nombre : '');
    const [tipo, setTipo] = useState(initialData ? initialData.id_tipo : '');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!tipo) return;
        onSave({ nombre, tipo });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
                <h2 className="text-xl font-bold mb-4 text-slate-800">
                    {initialData ? 'Editar Modelo' : 'Nuevo Modelo'}
                </h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Modelo</label>
                            <input
                                type="text"
                                defaultValue={initialData ? initialData.nombre : ''}
                                onChange={(e) => setNombre(e.target.value)}
                                required
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                placeholder="Ej: 5/2 Monoestable"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Producto</label>
                            <select
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value)}
                                required
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                            >
                                <option value="">-- Seleccione un Tipo --</option>
                                {productTypes.map((t) => (
                                    <option key={t.id_tipo} value={t.id_tipo}>
                                        {t.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-6">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalProductModel;