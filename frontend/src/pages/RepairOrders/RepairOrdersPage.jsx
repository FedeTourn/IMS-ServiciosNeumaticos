import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRepairOrders } from '../../services/repairOrder.service';
import { fetchClients } from '../../services/client.service';
import StatusBadge from '../../components/common/StatusBadge';


const RepairOrdersPage = () => {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [clients, setClients] = useState([]);

    const [filters, setFilters] = useState({
        id_orden_reparacion: '',
        id_cliente: '',
        estado: '',
        sort_by: 'fecha_creacion',
        sort_order: 'DESC'
    });

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadClients = async () => {
            try {
                const data = await fetchClients();
                setClients(data);
            } catch (err) {
                console.error("[RepairOrdersPage] Error al cargar clientes:", err);
            }
        };
        loadClients();
    }, []);

    useEffect(() => {
        const loadOrders = async () => {
            setIsLoading(true);
            setError('');
            try {
                const data = await fetchRepairOrders(filters);
                setOrders(data || []); 
            } catch (err) {
                setError(`Error al recuperar las órdenes de reparación: ${err.message}`);
                setOrders([]);
            } finally {
                setIsLoading(false);
            }
        };

        // En un escenario real con inputs de texto, aquí convendría aplicar un setTimeout (Debounce)
        loadOrders();
    }, [filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSort = (columnKey) => {
        setFilters(prev => {
            // Si el usuario hace clic en la misma columna, invertimos el sentido (ASC/DESC)
            if (prev.sort_by === columnKey) {
                return { ...prev, sort_order: prev.sort_order === 'DESC' ? 'ASC' : 'DESC' };
            }
            // Si hace clic en una columna nueva, el valor por defecto será descendente
            return { ...prev, sort_by: columnKey, sort_order: 'DESC' };
        });
    };

    const getSortIndicator = (columnKey) => {
        if (filters.sort_by !== columnKey) return <span className="text-gray-300">↕</span>;
        return filters.sort_order === 'ASC' ? <span className="text-emerald-500">▲</span> : <span className="text-emerald-500">▼</span>;
    };

    const formatDate = (isoString) => {
        if (!isoString || isoString === '-') return 'Pendiente'; // O 'N/A' según prefiera el usuario
        const date = new Date(isoString);
        // Retorna formato DD/MM/YYYY
        return date.toLocaleDateString('es-AR');
    };

    return (
        <div className="max-w-7xl mx-auto pb-10 px-4 animate-fade-in space-y-6">
            <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
                {/* --- CABECERA Y ACCIONES --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Gestión de Órdenes de Reparación</h1>
                        <p className="text-sm text-gray-500">Historial de Órdenes y trazabilidad de entregas del taller.</p>
                    </div>

                    <button
                        onClick={() => navigate('/crear-orden')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95 text-sm">
                        + Registrar Nueva Órden
                    </button>
                </div>

                {/* Panel de Filtros y Barras de Búsqueda */}
                <div className='pt-4'>
                    <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest pb-1">Filtros de Búsqueda</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Búsqueda por Nro de Orden */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-xs font-semibold text-gray-600">Buscar por Nro de Orden</label>
                            <input 
                                type="text" 
                                placeholder="Ej. 151"
                                value={filters.id_orden_reparacion}
                                name="id_orden_reparacion"
                                onChange={handleFilterChange}
                                className="border border-gray-300 rounded-lg p-2 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                            />
                        </div>

                        {/* Filtro por Cliente Específico (Selector) */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-xs font-semibold text-gray-600">Filtrar por Cliente</label>
                            <select 
                                value={filters.id_cliente}
                                name="id_cliente"
                                onChange={handleFilterChange}
                                className="border border-gray-300 rounded-lg p-2 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Todos los clientes</option>
                                {clients.map(c =>
                                    <option key={c.id_cliente} value={c.id_cliente}>
                                        {c.nombre}
                                    </option>    
                                )}
                                
                            </select>
                        </div>

                        {/* Filtro por Estado */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-xs font-semibold text-gray-600">Filtrar por Estado</label>
                            <select 
                                value={filters.estado}
                                name="estado"
                                onChange={handleFilterChange}
                                className="border border-gray-300 rounded-lg p-2 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Todos los Estados</option>
                                <option value="Abierta">Abierta</option>
                                <option value="Cerrada">Cerrada</option>
                                <option value="Entregada">Entregada</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            

            {/* Contenedor de la Tabla Principal */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                {/*Manejo de errores*/}
                {error && (
                    <div className="p-4 m-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3.5 text-left"
                                    onClick={() => handleSort('id_orden_reparacion')}
                                >
                                    N° Orden {getSortIndicator('id_orden_reparacion')}
                                </th>
                                <th className="px-4 py-3.5 text-left"
                                    onClick={() => handleSort('fecha_creacion')}
                                >
                                    Fecha Creación {getSortIndicator('fecha_creacion')}
                                </th>
                                <th className="px-4 py-3.5 text-left"
                                    onClick={() => handleSort('fecha_cierre')}
                                >
                                    Fecha Cierre {getSortIndicator('fecha_cierre')}
                                </th>
                                <th className="px-4 py-3.5 text-left"
                                    onClick={() => handleSort('cliente_nombre')}
                                >
                                    Cliente {getSortIndicator('cliente_nombre')}
                                </th>
                                <th className="px-4 py-3.5 text-left"
                                    onClick={() => handleSort('importe_total')}
                                >
                                    Importe ($) {getSortIndicator('importe_total')}
                                </th>
                                <th className="px-4 py-3.5 text-center"
                                    onClick={() => handleSort('estado_orden')}>
                                    Estado {getSortIndicator('estado_orden')}
                                </th>
                                <th className="px-4 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-gray-700 font-medium">

                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400 animate-pulse">
                                        Cargando Órdenes de Reparación ...
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-gray-400 font-medium border-2 border-dashed border-gray-100">
                                        No se encontraron órdenes que coincidan con los filtros seleccionados.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((orden) => (
                                    <tr key={orden.id_orden_reparacion} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-blue-600 font-bold">
                                            #ORD-{orden.id_orden_reparacion.toString().padStart(4, '0')}
                                        </td>
                                        <td className="px-6 py-3 font-mono text-slate-600">
                                            {formatDate(orden.fecha_creacion)}
                                        </td>
                                        <td className="px-6 py-3 font-mono text-slate-600">
                                            {formatDate(orden.fecha_cierre)}
                                        </td>
                                        <td className="px-6 py-3 font-bold text-slate-700">
                                            {orden.cliente_nombre}
                                        </td>
                                        <td className="px-6 py-3 font-mono font-black text-left text-slate-800">
                                            {orden.importe_total}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <StatusBadge status={orden.estado_orden} />
                                        </td>
                                        <td className="px-6 py-3 text-center flex justify-center gap-3">
                                            <button 
                                                type="button"
                                                onClick={() => navigate(`/repair-orders/${orden.id_orden_reparacion}`)}
                                                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-white hover:bg-blue-600 border border-slate-200 rounded-lg transition-all"
                                            >
                                                Ver Detalle
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pie de tabla */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">
                        Mostrando {orders.length} comprobante{orders.length !== 1 && 's'} listado{orders.length !== 1 && 's'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default RepairOrdersPage;