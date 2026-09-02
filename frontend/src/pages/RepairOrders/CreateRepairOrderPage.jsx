import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClients } from '../../services/client.service';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmationModal from '../../components/common/ConfirmationModal'
import { createRepairOrder, fetchProductsByClient } from '../../services/repairOrder.service';

const CreateRepairOrderPage = () => {
    const navigate = useNavigate();

    // Clientes
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState("");
    const [selectedClient, setSelectedClient] = useState("");
    
    // Productos
    const [products, setProducts] = useState([]);
    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const [customPrices, setCustomPrices] = useState([]);

    // Manejo
    const [message, setMessage] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // Cargar los clientes al select
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const clientData = await fetchClients();
                setClients(clientData);
            } catch (err) {
                setMessage(`Error al cargar datos: ${err.message}`);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);

    // Seleccion de un cliente
    const handleClientChange = async (e) => {
        const id = e.target.value;
        setSelectedClientId(id);
        setSelectedClient(
            clients.find(client => client.id_cliente === parseInt(id))
        );
        
        if (id) {
            const productsList = await fetchProductsByClient(id);
            setProducts(productsList);
        } else {
            setProducts([]);
        }
    }

    const handleProductSelected = (productId) => {
        setSelectedProductIds(prevSelected => {
            // Si ya estaba seleccionado, lo quitamos. Si no, lo agregamos.
            if (prevSelected.includes(productId)) {
                return prevSelected.filter(id => id !== productId);
            } else {
                return [...prevSelected, productId];
            }
        });
    };

    const handlePriceChange = (id_modelo, newPrice) => {
        setCustomPrices(prev => ({
            ...prev,
            [id_modelo]: parseFloat(newPrice) || 0
        }));
    }
    
    const selectedProducts = products.filter(p => selectedProductIds.includes(p.id_producto));

    const groupedProducts = Object.values(
        selectedProducts.reduce((accumulator, product) => {
            const { id_modelo, modelo_nombre, tipo_nombre, precio_sugerido } = product;

            if (!accumulator[id_modelo]) {
                const currentPrice = customPrices[id_modelo] !== undefined
                    ? customPrices[id_modelo]
                    : (precio_sugerido || 0);

                accumulator[id_modelo] = {
                    id_modelo,
                    descripcion: `${tipo_nombre} ${modelo_nombre}`,
                    cantidad: 0,
                    precioSugerido: currentPrice,
                    subtotal: 0
                };
            }

            accumulator[id_modelo].cantidad +=1;
            accumulator[id_modelo].subtotal = accumulator[id_modelo].cantidad * accumulator[id_modelo].precioSugerido;

            return accumulator;
        }, {})
    );

    const orderTotal = groupedProducts.reduce((sum, item) => sum + item.subtotal, 0);


    const handleSaveIntent = async (esCerrada) => {
        if (!selectedClientId) {
            setMessage("Por favor, seleccione un cliente antes de guardar.");
            setIsError(true);
            return;
        }

        if (selectedProductIds.length === 0) {
            setMessage("Debe seleccionar al menos una válvula para la orden.");
            setIsError(true);
            return;
        }

        setIsSaving(false);
        setMessage(false);

        if (esCerrada) {
            setIsConfirmOpen(true);
        } else {
            executeSave(false);
        }
    };

    const executeSave = async (esCerrada) => {
        setIsSaving(true);
        setMessage(false);

        try {
            const itemsToSubmit = selectedProductIds.map(id => {
                const product = products.find(p => p.id_producto === id);
                return {
                    id_producto: id,
                    precio_final: customPrices[product.id_modelo] || product.precio_sugerido
                };
            });

            const payload = {
                id_cliente: parseInt(selectedClientId),
                es_cerrada: esCerrada,
                items: itemsToSubmit
            };

            const result = await createRepairOrder(payload);

            setMessage(esCerrada 
                ? ("Orden NRO " + result.id_orden_reparacion + " cerrada y registrada con éxito.") 
                : ("Orden NRO " + result.id_orden_reparacion + " guardada como borrador."));
            setIsError(false);

            setTimeout(() => handleClearScreen(), 2000);

        } catch (error) {
            setMessage(`Error al procesar la orden: ${error.message}`);
            setIsError(true);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClearScreen = async () => {
        // Recargamos todo de nuevo
        setCustomPrices([]);
        setProducts([]);
        setSelectedClientId("");
        setSelectedClient("");
        setSelectedProductIds([]);
        setMessage(false);
    }


    if (isLoading) return <div className="p-10 text-center animate-pulse text-gray-400">Cargando protocolo de recepción...</div>;

    return (
        <div className="max-w-5xl mx-auto pb-10 px-4 animate-fade-in space-y-6">
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                
                {/* Header Institucional */}
                <div className="bg-slate-800 p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold uppercase tracking-tight">Generar Orden de Reparación</h1>
                        <p className="text-slate-400 text-xs mt-1 uppercase font-mono">Módulo Administrativo y Contable</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-xs bg-slate-700 px-3 py-1.5 rounded-md font-mono text-blue-400 font-bold border border-slate-600">
                            Fecha: {new Date().toLocaleDateString('es-AR')}
                        </span>
                        <span className="text-xs bg-slate-700 px-3 py-1.5 rounded-md font-mono text-emerald-400 font-bold border border-slate-600">
                            N° Orden: #AUTOGENERADO
                        </span>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    
                    {/* SECCIÓN 1: Datos de la Orden */}
                    <div className="space-y-4">
                        <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b pb-2">1. Datos Iniciales</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-1">Cliente Asociado *</label>
                                <select 
                                    name="id_cliente" 
                                    value={selectedClientId} // Controlamos el select con React
                                    onChange={handleClientChange} // Disparamos la función al cambiar
                                    required
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-gray-700 text-sm"
                                >
                                    <option value="">Seleccione el cliente para ver sus válvulas...</option>
                                    {clients.map((client) => (
                                        <option key={client.id_cliente} value={client.id_cliente}>
                                            {client.nombre} ({client.cuit})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-1">Datos del cliente</label>
                                {selectedClient ? (
                                    <div>
                                        <div className="pl-2 block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1"> 
                                            <span className="text-emerald-600">Cliente:</span> {selectedClient.nombre}
                                        </div>
                                        <div className="pl-2 block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1"> 
                                            <span className="text-emerald-600">CUIT:</span> {selectedClient.cuit}
                                        </div>
                                        <div className="pl-2 block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1"> 
                                            <span className="text-emerald-600">Domicilio:</span> {selectedClient.direccion || 'No especificado'}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="items-center h-full pl-2 block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Esperando selección de cliente...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: Selección de Válvulas Disponibles */}
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                            <h2 className="text-xs font-black uppercase text-slate-500 tracking-widest">2. Válvulas Disponibles en Taller</h2>
                            <span className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-1 rounded text-slate-500 uppercase">Estado: Recibido / Libre / Reparado</span>
                        </div>
                        {products.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 font-medium">
                                Seleccione un cliente para obtener sus válvulas.
                            </div>
                        ) : (
                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50 font-bold text-gray-600 text-xs uppercase tracking-wider sticky top-0 shadow-sm">
                                        <tr>
                                            <th className="px-4 py-3 text-center w-12">Agregar</th>
                                            <th className="px-4 py-3 text-left">ID</th>
                                            <th className="px-4 py-3 text-left">Descripción</th>
                                            <th className="px-4 py-3 text-left">Estado Actual</th>
                                            <th className="px-4 py-3 text-left">Fecha Recepción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200 text-gray-700 font-medium">
                                        {products.map((p) => (
                                            <tr 
                                                key={p.id_producto}
                                                className="hover:bg-emerald-100/50 transition-colors cursor-pointer">
                                                <td className="px-4 py-3 text-center">
                                                    <input 
                                                    className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                                                    type="checkbox"
                                                    checked={selectedProductIds.includes(p.id_producto)}
                                                    onChange={() => handleProductSelected(p.id_producto)}/>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-slate-600">{p.id_producto}</td>
                                                <td className="px-4 py-3 font-bold text-slate-800">{p.tipo_nombre} {p.modelo_nombre}</td>
                                                <td className="px-4 py-3">
                                                    <StatusBadge status={p.estado_nombre} />
                                                </td >
                                                <td className="px-4 py-3 font-mono text-slate-600">
                                                    {new Date(p.fecha_recepcion).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN 3: Grilla de Cotización Agrupada */}
                    <div className="space-y-3">
                        <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest">3. Detalle y Cotización (Agrupado por Modelo)</h2>
                        {selectedProducts.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 font-medium">
                                Seleccione válvulas en el paso anterior para generar la cotización.
                            </div>
                        ) : (
                            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50 font-bold text-gray-600 text-xs uppercase tracking-wider">
                                        <tr>
                                            
                                            <th className="px-4 py-3 text-center">Cant. Seleccionada</th>
                                            <th className="px-4 py-3 text-left">Descripción</th>
                                            <th className="px-4 py-3 text-right">Precio Unit. ($)</th>
                                            <th className="px-4 py-3 text-right">IMPORTE ($)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200 text-gray-700 font-medium">
                                        {groupedProducts.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-4 text-center font-mono text-slate-600">{item.cantidad}</td>
                                                <td className="px-4 py-4 font-bold text-slate-800">{item.descripcion}</td>
                                                <td className="px-4 py-4 text-right">
                                                    <input 
                                                        type="number" 
                                                        onChange={(e) => handlePriceChange(item.id_modelo, e.target.value)}
                                                        value={item.precioSugerido}
                                                        className="w-32 p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-right font-mono text-sm"
                                                    />
                                                </td>
                                                <td className="px-4 py-4 text-right font-black text-slate-800 font-mono">
                                                    {item.subtotal}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Banner de Total */}
                        <div className="flex justify-end pt-4">
                            <div className="bg-slate-800 text-white p-4 rounded-xl shadow-md min-w-[280px] flex justify-between items-center border border-slate-700">
                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Total Orden</span>
                                <span className="text-xl font-mono font-bold text-emerald-400">$ {orderTotal}</span>
                            </div>
                        </div>
                    </div>

                    
                    {message && (
                        <div className={`flex-1 mt-5 mx-5 p-3 rounded-xl text-s font-bold text-center animate-fade-in 
                            ${isError ? 'bg-red-100 text-red-800 border border-red-100' : 'bg-emerald-100 text-emerald-800 border border-emerald-100'}`}>
                            {message}
                        </div>
                    )}

                    {/* BOTONERA DE ACCIONES */}
                    <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-end">
                        <button 
                            type="button" 
                            onClick={() => navigate(-1)}
                            className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors mr-auto"
                        >
                            Cancelar
                        </button>
                        
                        <button 
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleSaveIntent(false)}
                            className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest text-slate-700 border-2 border-slate-200 transition-all
                                ${isSaving ? 'opacity-50 cursor-not-allowed' : 'bg-white hover:bg-slate-50 hover:border-slate-300 active:scale-95'}`}
                        >
                            Guardar Abierta
                        </button>

                        <button 
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleSaveIntent(true)}
                            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest text-white shadow-lg transition-all
                                ${isSaving ? 'bg-gray-300 shadow-none cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-100'}`}
                        >
                            Guardar y Cerrar
                        </button>
                    </div>

                </div>
            </div>
            <ConfirmationModal 
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={() => {
                    setIsConfirmOpen(false);
                    executeSave(true);
                }}
                title="¿Confirmar Cierre de Orden?"
                message="Esta acción guarda las válvulas en su estado final y cierra la orden de reparación. Una vez cerrada, el remito no admitirá modificaciones."
                isDanger={false}
            />
        </div>
    );
};

export default CreateRepairOrderPage;