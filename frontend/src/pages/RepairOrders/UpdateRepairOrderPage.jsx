import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import { fetchRepairOrderById } from '../../services/repairOrder.service';

const UpdateRepairOrderPage = () => {
    const navigate = useNavigate();
    const { id_orden } = useParams();

    const [selectedClient, setSelectedClient] = useState(null);
    const [products, setProducts] = useState([]);
    
    // Manejo de UI
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState(false);
    const [isError, setIsError] = useState(false);
    const [esCerrada, setEsCerrada] = useState(false);

    useEffect(() => {
        const loadOrderData = async () => {
            setIsLoading(true);
            setMessage(false);
            setIsError(false);

            try {
                const response = await fetchRepairOrderById(id_orden);
                const orderData = response.data ? response.data : response;

                setSelectedClient(orderData.cliente);
                
                setProducts(orderData.productos || []);
                
                setEsCerrada(orderData.estado_nombre === 'Cerrada');

            } catch (err) {
                setMessage(`Error al cargar la orden: ${err.message}`);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };

        if (id_orden) {
            loadOrderData();
        }
    }, [id_orden]);

    const groupedProducts = Object.values(
        products.reduce((accumulator, product) => {
            const { id_modelo, modelo_nombre, tipo_nombre, precio_final } = product;

            if (!accumulator[id_modelo]) {
                accumulator[id_modelo] = {
                    id_modelo,
                    descripcion: `${tipo_nombre} ${modelo_nombre}`,
                    cantidad: 0,
                    precioSugerido: precio_final || 0,
                    subtotal: 0
                };
            }

            accumulator[id_modelo].cantidad += 1;
            accumulator[id_modelo].subtotal = accumulator[id_modelo].cantidad * accumulator[id_modelo].precioSugerido;

            return accumulator;
        }, {})
    );

    const orderTotal = groupedProducts.reduce((sum, item) => sum + item.subtotal, 0);


    if (isLoading) return <div className="p-10 text-center animate-pulse text-gray-400">Cargando protocolo de recepción...</div>;

    return (
        <div className="max-w-5xl mx-auto pb-10 px-4 animate-fade-in space-y-6">
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                
                {/* Header Institucional (Mantenido) */}
                <div className="bg-slate-800 p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold uppercase tracking-tight">Detalle de Orden de Reparación</h1>
                        <p className="text-slate-400 text-xs mt-1 uppercase font-mono" > Módulo Administrativo y Contable </p>
                    </div>
                    <div className="flex gap-3">
                        {esCerrada? 
                            <span className="text-xs bg-red-600 px-3 py-1.5 rounded-md font-mono text-white font-bold border border-red-900">
                                CERRADA
                            </span> 
                        :   <span className="text-xs px-3 py-1.5 rounded-md font-mono font-bold border bg-green-600 text-white border-green-900">
                                ABIERTA
                            </span>}
                        
                        <span className="text-xs bg-slate-700 px-3 py-1.5 rounded-md font-mono text-blue-400 font-bold border border-slate-600">
                            Fecha: {new Date().toLocaleDateString('es-AR')}
                        </span>
                        <span className="text-xs bg-slate-700 px-3 py-1.5 rounded-md font-mono text-emerald-400 font-bold border border-slate-600">
                            N° Orden: #{id_orden || '1024'}
                        </span>
                    </div>
                </div>

                <div className="p-8 space-y-8">

                    <div className="space-y-4">
                        <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b pb-2">1. Datos del Cliente Asociado</h2>
                        <div >
                            {selectedClient && (
                                <div className="flex  gap-6 text-xs">
                                    <div className="pl-2 flex-1 block font-bold text-slate-600 uppercase tracking-widest mb-1"> 
                                        <span className="text-emerald-600">Cliente:</span> {selectedClient.nombre}
                                    </div>
                                    <div className="pl-2 flex-1 block font-bold text-slate-600 uppercase tracking-widest mb-1"> 
                                        <span className="text-emerald-600">CUIT:</span> {selectedClient.cuit}
                                    </div>
                                    <div className="pl-2 flex-1 block font-bold text-slate-600 uppercase tracking-widest mb-1"> 
                                        <span className="text-emerald-600">Domicilio:</span> {selectedClient.direccion || 'No especificado'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b pb-2">2. Válvulas Asignadas a esta Orden</h2>
                        <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50 font-bold text-gray-600 text-xs uppercase tracking-wider sticky top-0 shadow-sm">
                                        <tr>
                                            {!esCerrada && <th className="px-4 py-3 text-center w-12">Inc.</th>}
                                            <th className="px-4 py-3 text-left">ID</th>
                                            <th className="px-4 py-3 text-left">Descripción</th>
                                            <th className="px-4 py-3 text-left">Estado Actual</th>
                                            <th className="px-4 py-3 text-left">Fecha Recepción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200 text-gray-700 font-medium">
                                        {products.map((p) => (
                                            <tr key={p.id_producto} className="hover:bg-slate-50 transition-colors">
                                                {!esCerrada && <td className="px-4 py-3 text-center">
                                                    <input 
                                                        className="w-4 h-4 text-emerald-600 bg-gray-200 border-gray-300 rounded cursor-not-allowed opacity-70"
                                                        type="checkbox"
                                                        checked={true}
                                                        readOnly
                                                    />
                                                </td>
                                                }
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
                            <div>
                                <span className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-1 rounded text-slate-500 uppercase">Total: {products.length}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b pb-2">3. Detalle y Cotización</h2>
                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50 font-bold text-gray-600 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 text-center">Cant. Seleccionada</th>
                                        <th className="px-4 py-3 text-left">Descripción</th>
                                        <th className="px-4 py-3 text-right">Precio Unitario ($)</th>
                                        <th className="px-4 py-3 text-right">IMPORTE ($)</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 text-gray-700 font-medium">
                                    {groupedProducts.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-4 text-center font-mono text-slate-600">{item.cantidad}</td>
                                            <td className="px-4 py-4 font-bold text-slate-800">{item.descripcion}</td>
                                            <td className="px-4 py-4 text-right font-bold">
                                                { esCerrada ?
                                                    item.precioSugerido
                                                : <input 
                                                    type="number" 
                                                    value={item.precioSugerido}
                                                    readOnly
                                                    className="w-32 p-2 bg-gray-50 border border-gray-200 text-gray-500 rounded-lg outline-none text-right font-mono text-sm cursor-not-allowed"
                                                />
                                                }
                                                
                                            </td>
                                            <td className="px-4 py-4 text-right font-black text-slate-800 font-mono">
                                                {item.subtotal}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Banner de Total */}
                        <div className="flex justify-end pt-4">
                            <div className="bg-slate-800 text-white p-4 rounded-xl shadow-md min-w-[280px] flex justify-between items-center border border-slate-700">
                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Importe Total</span>
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

                    {/* BOTONERA DE ACCIONES (Adaptada a Consulta) */}
                    <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-end">
                        <button 
                            type="button" 
                            onClick={() => navigate(-1)}
                            className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors mr-auto"
                        >
                            Volver al Listado
                        </button>
                        
                        {/* Botón de Impresión - Requerimiento 27 */}
                        <button 
                            type="button"
                            onClick={() => window.print()}
                            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest text-white shadow-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-100 transition-all"
                        >
                            Imprimir Remito
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default UpdateRepairOrderPage;