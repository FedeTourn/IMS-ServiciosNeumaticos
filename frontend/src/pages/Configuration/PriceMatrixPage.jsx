import React, { useState, useEffect } from 'react';
// Asumiendo que ya configuraste tus servicios API según lo acordado
import { getAllPrices, updateBulkPrices } from '../../services/price.service'; 
import PriceMatrixTable from './PriceMatrixTable';

export default function PriceMatrixPage() {
    const [isLoading, setIsLoading] = useState(true);
    // Datos planos de la DB 
    const [originalData, setOriginalData] = useState([]);// eslint-disable-line
    const [matrixData, setMatrixData] = useState({}); // Datos pivotados para render
    const [categories, setCategories] = useState([]); // Cabeceras de columna
    const [models, setModels] = useState([]); // Cabeceras de fila
    const [pendingUpdates, setPendingUpdates] = useState({}); // Tracking de celdas modificadas

    const [validationErrors, setValidationErrors] = useState({});

    // Transforma el array plano del backend a una estructura (Modelo -> Categoría -> Precio)
    const pivotDataForTable = (flatData) => {
        const uniqueCategories = [];
        const uniqueModels = [];
        const matrix = {};

        flatData.forEach(item => {
            // Recopilar categorías únicas para las columnas
            if (!uniqueCategories.find(c => c.id_categoria === item.id_categoria)) {
                uniqueCategories.push({ id_categoria: item.id_categoria, nombre: item.categoria_nombre });
            }
            // Recopilar modelos únicos capturando la jerarquía (Tipo + Modelo)
            if (!uniqueModels.find(m => m.id_modelo === item.id_modelo)) {
                uniqueModels.push({ 
                    id_modelo: item.id_modelo, 
                    nombre: item.modelo_nombre,
                    tipo: item.tipo_nombre });
            }

            // Construir la matriz de acceso rápido
            if (!matrix[item.id_modelo]) matrix[item.id_modelo] = {};
            matrix[item.id_modelo][item.id_categoria] = item.precio;
        });

        setCategories(uniqueCategories.sort((a, b) => a.nombre.localeCompare(b.nombre)));
        
        setModels(uniqueModels.sort((a, b) => {
            const tipoA = Number(a.tipo);
            const tipoB = Number(b.tipo);

            if (tipoA === tipoB) {
                // Desempata ordenando alfabéticamente por el nombre del Modelo
                return a.nombre.localeCompare(b.nombre);
            }
            return tipoA - tipoB;
        }));

        setMatrixData(matrix);
        setPendingUpdates({}); // Limpiar cambios pendientes
    };

    const fetchPrices = async () => {
        setIsLoading(true);
        try {
            const data = await getAllPrices();
            setOriginalData(data);
            pivotDataForTable(data);
        } catch (error) {
            console.error("Error cargando matriz de precios:", error);
            // Aquí podrías usar un toast o alerta visual
            alert("Error al cargar la lista de precios.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPrices(); // eslint-disable-line
    }, []);

    // Handler cuando el usuario escribe en un input
    const handlePriceChange = (idModelo, idCategoria, newPrice) => {
        const cellKey = `${idModelo}-${idCategoria}`;
        
        // Validación Lógica Estricta mediante RegEx:
        // Acepta vacío (para poder borrar), o números enteros/decimales puros.
        // Rechaza letras, símbolos extraños o múltiples puntos.
        const isNumericValid = newPrice === '' || /^\d*\.?\d*$/.test(newPrice);

        if (!isNumericValid) {
            // Si tiene letras o formato inválido, disparamos el error
            setValidationErrors(prev => ({
                ...prev,
                [cellKey]: 'Solo números.'
            }));
        } else {
            // Si se corrigió, limpiamos el error de esa celda
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[cellKey];
                return newErrors;
            });
        }

        // Actualizar el estado visual de la tabla
        setMatrixData(prev => ({
            ...prev,
            [idModelo]: {
                ...prev[idModelo],
                [idCategoria]: newPrice
            }
        }));

        // Registrar la actualización pendiente (armando la clave compuesta)
        setPendingUpdates(prev => ({
            ...prev,
            [cellKey]: { idModelo, idCategoria, nuevoPrecio: newPrice }
        }));
    };

    // Handler para enviar masivamente al backend
    const handleSaveUpdates = async () => {
        const updatesArray = Object.values(pendingUpdates);
        if (updatesArray.length === 0) return;

        try {
            setIsLoading(true);
            await updateBulkPrices({ updates: updatesArray });
            alert(`¡Se han actualizado ${updatesArray.length} tarifas correctamente!`);
            // Recargar datos frescos de la DB
            await fetchPrices(); 
        } catch (error) {
            console.error("Error al guardar cambios masivos:", error);
            alert("Error al intentar guardar los precios.");
        } finally {
            setIsLoading(false);
        }
    };

    const hasChanges = Object.keys(pendingUpdates).length > 0;

    const hasErrors = Object.keys(validationErrors).length > 0;
    const canSave = hasChanges && !hasErrors;

    if (isLoading) return <div className="p-8 text-center text-gray-500">Cargando catálogo...</div>;

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Precios por Categoría de Cliente</h1>
                <button
                    onClick={handleSaveUpdates}
                    disabled={!canSave}
                    className={`px-4 py-2 rounded shadow transition-colors ${
                        canSave 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {hasErrors 
                        ? 'Corregir errores para guardar' 
                        : (hasChanges ? `Guardar Cambios (${Object.keys(pendingUpdates).length})` : 'Sin Cambios')
                    }
                </button>
            </div>

            <PriceMatrixTable 
                models={models} 
                categories={categories} 
                matrixData={matrixData} 
                pendingUpdates={pendingUpdates}
                errors={validationErrors}
                onPriceChange={handlePriceChange} 
            />
        </div>
    );
}