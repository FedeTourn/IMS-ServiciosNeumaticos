import React, { useState, useEffect } from 'react';
import * as ProductService from '../../services/product.service';
import ModalProductType from './ModalProductType';

const ProductTypesPage = () => {
    const [types, setTypes] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentType, setCurrentType] = useState(null);
    const [feedback, setFeedback] = useState(null);

    

    useEffect(() => {
        const loadTypes = async () => {
        try {
            const data = await ProductService.fetchProductTypes();
            setTypes(data);
        } catch (err) {
            setFeedback({ msg: "Error al cargar tipos", type: 'error' });
        }
        };
        loadTypes();
    }, []);

    const handleSave = async (data) => {
        try {
            if (currentType) {
                await ProductService.updateProductType(currentType.id_tipo, data);
                setFeedback({ msg: "Tipo actualizado con éxito", type: 'success' });
            } else {
                await ProductService.createProductType(data);
                setFeedback({ msg: "Tipo creado con éxito", type: 'success' });
            }
            setIsModalOpen(false);
            //loadTypes();
        } catch (err) {
            setFeedback({ msg: err.message, type: 'error' });
        }
    };

    return (
        <div className="p-6">
            {feedback && (
                <div className={`p-4 mb-4 rounded ${feedback.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {feedback.msg}
                </div>
            )}

            <button 
                onClick={() => { setCurrentType(null); setIsModalOpen(true); }}
                className="mb-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
                Agregar Tipo
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                    <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-xs font-semibold">
                        <tr>
                            <th className="py-3 px-4">Tipo de Producto</th>
                            <th className="py-3 px-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-700">
                        {types.map(t => (
                            <tr key={t.id_tipo} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 font-mono font-">{t.nombre}</td>
                                <td className="py-3 px-4 text-center">
                                    <button 
                                        onClick={() => { setCurrentType(t); setIsModalOpen(true); }} 
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
            
            <ModalProductType 
                key={currentType ? currentType.id_tipo : 'new'}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={currentType}
            />
        </div>
    );
};

export default ProductTypesPage;