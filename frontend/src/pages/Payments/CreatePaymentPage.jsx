import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClients } from '../../services/client.service';
//import StatusBadge from '../../components/common/StatusBadge';
import ConfirmationModal from '../../components/common/ConfirmationModal'
import { createRepairOrder, fetchProductsByClient } from '../../services/repairOrder.service';

const CreatePaymentPage = () => {
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

    /* const handleProductSelected = (productId) => {
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
    ); */

    // const orderTotal = groupedProducts.reduce((sum, item) => sum + item.subtotal, 0);


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
                        <h1 className="text-xl font-bold uppercase tracking-tight">Registrar Pago</h1>
                        <p className="text-slate-400 text-xs mt-1 uppercase font-mono">Módulo Administrativo y Contable</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-xs bg-slate-700 px-3 py-1.5 rounded-md font-mono text-blue-400 font-bold border border-slate-600">
                            Fecha: {new Date().toLocaleDateString('es-AR')}
                        </span>
                        <span className="text-xs bg-slate-700 px-3 py-1.5 rounded-md font-mono text-emerald-400 font-bold border border-slate-600">
                            N° Pago: #AUTOGENERADO
                        </span>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    
                    <div className="space-y-4">
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
                                    <option value="">Seleccione el cliente para asignarle el pago...</option>
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

                    {/* DATOS DEL PAGO*/}
                    <div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Monto *</label>
                            <input 
                                type="number" 
                                name="monto" 
                                // value={receiptMeta.fecha_recepcion} 
                                // onChange={handleReceiptChange} 
                                required 
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-1">Método de Pago *</label>
                            <select 
                                name="id_cliente" 
                                value={selectedClientId} // Controlamos el select con React
                                onChange={handleClientChange} // Disparamos la función al cambiar
                                required
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-gray-700 text-sm"
                            >
                                <option value="">Seleccione el método de pago...</option>
                                {clients.map((client) => (
                                    <option key={client.id_cliente} value={client.id_cliente}>
                                        {client.nombre} ({client.cuit})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Fecha de Pago</label>
                            <input 
                                type="date" 
                                name="fecha_recepcion" 
                                // value={receiptMeta.fecha_recepcion} 
                                // onChange={handleReceiptChange} 
                                required 
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Identificacion de comprobante (externo)</label>
                            <input 
                                type="text"
                                name="comprobante_externo"
                                //value={currentItem.observaciones}
                                //onChange={handleItemChange}
                                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Observaciones sobre el pago</label>
                            <input 
                                type="text"
                                name="observaciones"
                                //value={currentItem.observaciones}
                                //onChange={handleItemChange}
                                placeholder="Ej. Entregado por pepito, retirado de oficinas por Juan, etc."
                                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                            />
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
                            Crear Pago en Borrador
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

export default CreatePaymentPage;