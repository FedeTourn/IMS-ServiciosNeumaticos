import React, { useState, useEffect } from 'react';
import * as ProductService from '../../services/product.service';
import ModalProductModel from './ModalProductModel';

const ProductModelsPage = () => {
    const [models, setModels] = useState([]);
    const [types, setTypes] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentModel, setCurrentModel] = useState(null);
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        const loadInitialData = async () => {
        try {
            const [modelsData, typesData] = await Promise.all([
                ProductService.fetchProductModels(),
                ProductService.fetchProductTypes()
            ]);
            setModels(modelsData);
            setTypes(typesData);
        } catch (err) {
            setFeedback({ msg: "Error al sincronizar catálogos con el servidor.", type: 'error' });
        }
    };
        loadInitialData();
    }, []);

    const handleSave = async (formData) => {
        try {
            if (currentModel) {
                await ProductService.updateProductModel(currentModel.id_modelo, formData);
                setFeedback({ msg: "Modelo actualizado con éxito.", type: 'success' });
            } else {
                await ProductService.createProductModel(formData);
                setFeedback({ msg: "Modelo registrado con éxito.", type: 'success' });
            }
            setIsModalOpen(false);
        } catch (err) {
            setFeedback({ msg: err.message, type: 'error' });
        }
    };

    return (
        <div className="p-6">
            {feedback && (
                <div className={`p-4 mb-4 text-sm rounded-lg ${feedback.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {feedback.msg}
                </div>
            )}

            <button 
                onClick={() => { setCurrentModel(null); setIsModalOpen(true); }}
                className="mb-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
                Agregar Modelo
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                    <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-xs font-semibold">
                        <tr>
                            <th className="py-3 px-4">ID</th>
                            <th className="py-3 px-4">Nombre del Modelo</th>
                            <th className="py-3 px-4">Tipo de Producto</th>
                            <th className="py-3 px-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-700">
                        {models.map((m) => (
                            <tr key={m.id_modelo} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 font-mono text-xs">{m.id_modelo}</td>
                                <td className="py-3 px-4 font-medium">{m.nombre}</td>
                                <td className="py-3 px-4">
                                    <span className="px-2 py-1 bg-amber-50 text-amber-800 rounded-md text-xs font-medium border border-amber-100">
                                        {m.tipo_nombre}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <button 
                                        onClick={() => { setCurrentModel(m); setIsModalOpen(true); }} 
                                        className="bg-blue-600 text-white hover:bg-blue-500 font-medium transition-colors px-3 py-1 rounded-lg"
                                    >
                                        Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <ModalProductModel 
                key={currentModel ? currentModel.id_modelo : 'new-model'}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={currentModel}
                productTypes={types}
            />
        </div>
    );
};

export default ProductModelsPage;