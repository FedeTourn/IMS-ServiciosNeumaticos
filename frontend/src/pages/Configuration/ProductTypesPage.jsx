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
            {/* 3. Renderizado simple del feedback */}
            {feedback && (
                <div className={`p-4 mb-4 rounded ${feedback.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {feedback.msg}
                </div>
            )}

            <button 
                onClick={() => { setCurrentType(null); setIsModalOpen(true); }}
                className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
                Agregar Tipo
            </button>

            <table className="min-w-full text-center bg-white border border-gray-200">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b">Nombre</th>
                        <th className="py-2 px-4 border-b">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {types.map(t => (
                        <tr key={t.id_tipo}>
                            <td className="py-2 px-4 border-b">{t.nombre}</td>
                            <td className="py-2 px-4 border-b">
                                <button onClick={() => { setCurrentType(t); setIsModalOpen(true); }} className=" bg-blue-600 text-white px-4 py-2 rounded-lg">Editar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
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