import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClients } from '../../services/client.service';
import { fetchProductTypes, fetchProductModels } from '../../services/product.service';
import { registerReceiptWithProducts } from '../../services/receipt.service'; // Nuestro nuevo servicio

/**
 * @fileoverview Página de Registro de Recepción Unificada.
 * Fusiona la selección maestra de comprobantes con la adición dinámica de múltiples productos.
 */
const RegisterReceiptPage = () => {
    const navigate = useNavigate();
    
    // Estados para Catálogos maestros (Lookup Tables)
    const [clients, setClients] = useState([]);
    const [productTypes, setProductTypes] = useState([]);
    const [productModels, setProductModels] = useState([]);
    
    // 1. Estado del Encabezado del Comprobante
    const [receiptMeta, setReceiptMeta] = useState({
        id_cliente: '',
        descripcion: '',
        fecha_recepcion: '',
        ruta_imagen: null // Preparado para futuras extensiones de adjuntos
    });

    // 2. Estado de la Consola de Entrada (Ítem temporal actual)
    const [currentItem, setCurrentItem] = useState({
        tipo_seleccionado: '',
        modelo: '',
        observaciones: ''
    });

    // 3. Estado del Lote / Arreglo Masivo de Productos Añadidos
    const [productsList, setProductsList] = useState([]);

    // Estados de Control de Flujo de Interfaz
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Carga de colecciones maestras iniciales
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [clientData, typeData] = await Promise.all([
                    fetchClients(),
                    fetchProductTypes(),
                ]);
                setClients(clientData);
                setProductTypes(typeData);
            } catch (err) {
                setMessage(`Error al cargar datos: ${err.message}`);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);

    // Efecto reactivo para actualizar los modelos basados en el tipo seleccionado
    useEffect(() => {
        const loadModels = async () => {
            if (currentItem.tipo_seleccionado) {
                try {
                    const models = await fetchProductModels(currentItem.tipo_seleccionado);
                    setProductModels(models);
                    setCurrentItem(prev => ({ ...prev, modelo: '' })); 
                } catch (err) {
                    setMessage(`Error al cargar modelos: ${err.message}`);
                    setIsError(true);
                }
            } else {
                 setProductModels([]);
            }
        };
        loadModels();
    }, [currentItem.tipo_seleccionado]);

    // Manejador para los cambios del encabezado (Comprobante)
    const handleReceiptChange = (e) => {
        const { name, value } = e.target;
        setReceiptMeta(prev => ({ ...prev, [name]: value }));
        setMessage('');
    };

    // Manejador para los cambios de la consola de entrada (Producto)
    const handleItemChange = (e) => {
        const { name, value } = e.target;
        setCurrentItem(prev => ({ ...prev, [name]: value }));
        setMessage('');
    };

    /**
     * Inyecta el producto actualmente configurado en la consola al listado temporal.
     * Realiza validaciones previas en el cliente.
     */
    const handleAddProductToList = () => {
        if (!currentItem.modelo) {
            setMessage('Debe seleccionar obligatoriamente un modelo antes de añadir la válvula.');
            setIsError(true);
            return;
        }

        // Busca el objeto tipo seleccionado para recuperar el nombre visual en la grilla
        const selectedTipoObj = productTypes.find(t => String(t.id_tipo) === String(currentItem.tipo_seleccionado));
        const tipoNombre = selectedTipoObj ? selectedTipoObj.nombre : 'Tipo Desconocido';

        // Buscar el objeto modelo seleccionado para recuperar su nombre visual en la grilla
        const selectedModelObj = productModels.find(m => String(m.id_modelo) === String(currentItem.modelo));
        const modeloNombre = selectedModelObj ? selectedModelObj.nombre : 'Modelo Desconocido';


        const newProduct = {
            modelo: currentItem.modelo,
            descripcionValvula: `${tipoNombre} - ${modeloNombre}`,
            observaciones: currentItem.observaciones/* ,
            fecha_recepcion: null */
        };

        // Mutación inmutable del estado del arreglo
        setProductsList(prev => [...prev, newProduct]);

        // Limpieza selectiva de la consola para agilizar la carga del siguiente ítem
        setCurrentItem({
            tipo_seleccionado: '',
            modelo: '',
            observaciones: ''
        });
        setMessage('');
        setIsError(false);
    };

    /**
     * Remueve un producto del lote basándose en su índice de posición.
     * @param {number} indexToRemove - Índice del elemento en el arreglo.
     */
    const handleRemoveProductFromList = (indexToRemove) => {
        setProductsList(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    /**
     * Envía la estructura completa consolidada de forma síncrona hacia el Backend REST.
     */
    const handleSubmitReceipt = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsSaving(true);

        const today = new Date();
        const fecha_recibo = new Date(receiptMeta.fecha_recepcion);

        if (!receiptMeta.id_cliente) {
            setMessage('El Cliente solicitante es un campo requerido.');
            setIsError(true);
            setIsSaving(false);
            return;
        }

        if (productsList.length === 0) {
            setMessage('Regla de negocio: Debe incorporar al menos una válvula al listado antes de confirmar.');
            setIsError(true);
            setIsSaving(false);
            return;
        }

        if (!receiptMeta.fecha_recepcion) {
            setMessage('La Fecha de Ingreso es un campo requerido.');
            setIsError(true);
            setIsSaving(false);
            return;
        }

        if (fecha_recibo > today) {
            setMessage('La Fecha de Ingreso no puede ser futura.');
            setIsError(true);
            setIsSaving(false);
            return;
        }

        const cleanedProductsList = productsList.map(p => ({
            modelo: p.modelo,
            observaciones: p.observaciones/* ,
            fecha_recepcion: receiptMeta.fecha_recepcion */
        }));

        try {
            // Envío del Payload Unificado estructurado para el Controlador Express
            await registerReceiptWithProducts({
                receiptData: receiptMeta,
                productsList: cleanedProductsList
            });

            setMessage(`✅ Comprobante y lote de ${cleanedProductsList.length} productos registrados con éxito.`);
            setTimeout(() => navigate('/productos-reparar'), 2000);
        } catch (err) {
            setMessage(`❌ Error al procesar la transacción: ${err.message}`);
            setIsError(true);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-10 text-center animate-pulse text-gray-400">Cargando protocolo de recepción...</div>;

    return (
        <div className="max-w-5xl mx-auto pb-10 px-4 animate-fade-in space-y-6">
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                
                {/* Header Institucional */}
                <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold uppercase tracking-tight">Generar Comprobante de Recepción</h1>
                        <p className="text-slate-400 text-xs mt-1 uppercase font-mono">Módulo Administrativo y Contable</p>
                    </div>
                    <span className="text-s bg-slate-700 px-3 py-1.5 rounded-md font-mono text-emerald-400 font-bold border border-slate-600">
                        Válvulas en lote: {productsList.length}
                    </span>
                </div>

                <div className="p-8 space-y-8">
                    
                    {/* SECCIÓN 1: Encabezado del Comprobante */}
                    <div className="space-y-4">
                        <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b pb-2">1. Datos del Comprobante</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Cliente Solicitante *</label>
                                <select 
                                    name="id_cliente" 
                                    value={receiptMeta.id_cliente} 
                                    onChange={handleReceiptChange} 
                                    required
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-gray-700 text-sm"
                                >
                                    <option value="">Seleccione el cliente responsable...</option>
                                    {clients.map(client => (
                                        <option key={client.id_cliente} value={client.id_cliente}>
                                            {client.nombre} ({client.cuit})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Fecha de Ingreso</label>
                                <input 
                                    type="date" 
                                    name="fecha_recepcion" 
                                    value={receiptMeta.fecha_recepcion} 
                                    onChange={handleReceiptChange} 
                                    required 
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Observaciones Generales del Remito</label>
                                <textarea 
                                    name="descripcion"
                                    value={receiptMeta.descripcion}
                                    onChange={handleReceiptChange}
                                    placeholder="Detalles sobre el estado del transporte, urgencias o condiciones comerciales del ingreso general..."
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-h-[60px] text-sm"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: Consola de Carga Rápida de Componentes */}
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                        <h2 className="text-xs font-black uppercase text-slate-500 tracking-widest border-b border-slate-200 pb-2">2. Consola de Entrada de Válvulas</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Filtrar Tipo</label>
                                <select 
                                    name="tipo_seleccionado" 
                                    value={currentItem.tipo_seleccionado} 
                                    onChange={handleItemChange}
                                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Seleccione tipo...</option>
                                    {productTypes.map(type => (
                                        <option key={type.id_tipo} value={type.id_tipo}>{type.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Modelo Específico *</label>
                                <select 
                                    name="modelo" 
                                    value={currentItem.modelo} 
                                    onChange={handleItemChange} 
                                    disabled={!currentItem.tipo_seleccionado}
                                    className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500
                                        ${!currentItem.tipo_seleccionado ? 'bg-gray-100 cursor-not-allowed border-gray-200' : 'bg-white border-gray-200'}`}
                                >
                                    <option value="">{currentItem.tipo_seleccionado ? 'Seleccione el modelo...' : '← Seleccione tipo'}</option>
                                    {productModels.map(model => (
                                        <option key={model.id_modelo} value={model.id_modelo}>{model.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Fallas Reportadas / Estado Físico Inicial</label>
                                <input 
                                    type="text"
                                    name="observaciones"
                                    value={currentItem.observaciones}
                                    onChange={handleItemChange}
                                    placeholder="Ej. Pérdida por escape secundario, bobina quemada, etc."
                                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button 
                                type="button"
                                onClick={handleAddProductToList}
                                className="px-5 py-2 bg-slate-700 hover:bg-slate-900 font-bold text-[11px] text-white uppercase tracking-widest rounded-xl transition-all shadow-md shadow-slate-100"
                            >
                                + Insertar en Lote
                            </button>
                        </div>
                    </div>

                    {/* SECCIÓN 3: Grilla Dinámica de Válvulas Cargadas */}
                    <div className="space-y-3">
                        <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest">3. Resumen del Lote</h2>
                        {productsList.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 font-medium">
                                No se han añadido válvulas al lote de recepción todavía. Use la consola de arriba.
                            </div>
                        ) : (
                            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50 font-bold text-gray-600 text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Ítem</th>
                                            <th className="px-4 py-3 text-left">Descripción Válvula</th>
                                            <th className="px-4 py-3 text-left">Estado Mandatorio</th>
                                            <th className="px-4 py-3 text-left">Observaciones Técnicas</th>
                                            <th className="px-4 py-3 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200 text-gray-700 font-medium">
                                        {productsList.map((product, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3 font-mono text-xs text-gray-400">{idx + 1}</td>
                                                <td className="px-4 py-3 font-bold text-slate-800">{product.descripcionValvula}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                                        Recibido
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 text-xs italic">{product.observaciones || 'Sin observaciones'}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleRemoveProductFromList(idx)}
                                                        className="text-xs text-red-500 hover:text-red-700 font-bold uppercase tracking-wider transition-colors"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Mensaje Informativo y Botonera General */}
                    <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-center">
                        <button 
                            type="button"
                            onClick={handleSubmitReceipt}
                            disabled={isSaving || productsList.length === 0}
                            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg transition-all
                                ${isSaving || productsList.length === 0 
                                    ? 'bg-gray-300 shadow-none cursor-not-allowed' 
                                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-100'}`}
                        >
                            {isSaving ? 'Registrando lote...' : 'Finalizar y Generar Comprobante'}
                        </button>
                        
                        <button 
                            type="button" 
                            onClick={() => navigate('/productos-reparar')}
                            className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
                        >
                            Cancelar
                        </button>

                        {message && (
                            <div className={`flex-1 p-3 rounded-xl text-xs font-bold text-center animate-fade-in 
                                ${isError ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                {message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterReceiptPage;