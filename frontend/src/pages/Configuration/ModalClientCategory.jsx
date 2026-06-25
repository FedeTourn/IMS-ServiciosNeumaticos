import React, {useState, useEffect} from "react";
import { fetchClientCategories } from "../../services/client.service";

const ModalClientCategory = ({ isOpen, onClose}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState();
    

    const loadCategories = async () => {
        setIsLoading(true);
        try {
            const data = await fetchClientCategories();
            setCategories(data);
        } catch (err) {
            setError("No se pudieron cargar las categorías.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadCategories(); // eslint-disable-line
        } else {
            // Limpiar el estado cuando se cierra para evitar datos viejos
            setCategories([]);
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">

                {/* Cabecera */}
                <div className="flex justify-center px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-xl font-bold mb-4 text-slate-800">
                        Categorias de Cliente
                    </h2>
                </div>
                
                {/* Cuerpo del Modal */}
                <div className="p-6 min-h-[200px]">
                    {isLoading && <p className="text-center text-gray-500">Cargando...</p>}
                    
                    {error && <p className="text-center text-red-500">{error}</p>}
                    
                    {!isLoading && !error && categories.length === 0 && (
                        <p className="text-center text-gray-500">No hay categorías registradas.</p>
                    )}

                    {!isLoading && !error && categories.length > 0 && (
                        <ul className="divide-y divide-gray-200">
                            {categories.map((cat) => (
                                <li key={cat.id_categoria} className="py-3 flex justify-between items-center">
                                    <span className="font-medium text-gray-700">{cat.nombre_categoria}</span>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                        ID: {cat.id_categoria}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                
                {/*Pie del Modal*/}
                <div className="flex justify-center gap-3 mt-6">
                    <button
                        type="button" 
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border-2"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    )
};

export default ModalClientCategory;