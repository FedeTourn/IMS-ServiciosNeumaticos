import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge'; // Asumiendo que existe

const RepairOrdersPage = () => {
    const navigate = useNavigate();

    // 1. ESTADO SIMULADO (Lo que vendrá del Backend)
    const mockOrders = [
        { id_orden_reparacion: 151, fecha_creacion: '2026-07-15T10:30:00', fecha_cierre: '-', cliente_nombre: 'Industrias Metalúrgicas S.A.', importe_total: 30000.00, estado_orden: 'Abierta' },
        { id_orden_reparacion: 150, fecha_creacion: '2026-07-14T14:20:00', fecha_cierre: '2026-07-15T10:30:00', cliente_nombre: 'Servicios Hidráulicos SRL', importe_total: 12500.50, estado_orden: 'Cerrada' },
        { id_orden_reparacion: 149, fecha_creacion: '2026-07-10T09:15:00', fecha_cierre: '2026-07-10T09:15:00', cliente_nombre: 'Válvulas del Litoral', importe_total: 45000.00, estado_orden: 'Cerrada' },
    ];

    // 2. ESTADOS DE CONTROL (UI)
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todas');
    const [sortConfig, setSortConfig] = useState({ key: 'id_orden_reparacion', direction: 'desc' });

    // 3. ESTADO DERIVADO: Lógica de Filtrado y Ordenamiento en Memoria (Client-Side)
    const filteredAndSortedOrders = useMemo(() => {
        let result = [...mockOrders];

        // A. Filtrado por Búsqueda (Número de orden o Cliente)
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(order => 
                order.id_orden_reparacion.toString().includes(lowerSearch) ||
                order.cliente_nombre.toLowerCase().includes(lowerSearch)
            );
        }

        // B. Filtrado por Estado
        if (statusFilter !== 'Todas') {
            result = result.filter(order => order.estado_orden === statusFilter);
        }

        // C. Ordenamiento Dinámico
        result.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [mockOrders, searchTerm, statusFilter, sortConfig]);

    // Función para manejar clics en las cabeceras de la tabla
    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
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
                                placeholder="Ej. 00151"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border border-gray-300 rounded-lg p-2 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                            />
                        </div>

                        {/* Filtro por Cliente Específico (Selector) */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-xs font-semibold text-gray-600">Filtrar por Cliente</label>
                            <select 
                                name="id_cliente"
                                className="border border-gray-300 rounded-lg p-2 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Todos los clientes...</option>
                                
                            </select>
                        </div>

                        {/* Fecha Cierre */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-xs font-semibold text-gray-600">Fecha Cierre</label>
                            <input 
                                type="date"
                                name="fecha_cierre"
                                className="border border-gray-300 rounded-lg p-2 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            />
                        </div>

                        {/* Filtro por Estado */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-xs font-semibold text-gray-600">Filtrar por Estado</label>
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="border border-gray-300 rounded-lg p-2 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Todas">Todos los Estados</option>
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

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3.5 text-left"
                                    onClick={() => requestSort('id_orden_reparacion')}
                                >
                                    N° Orden {sortConfig.key === 'id_orden_reparacion' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-3.5 text-left"
                                    onClick={() => requestSort('fecha_creacion')}
                                >
                                    Fecha Creación {sortConfig.key === 'fecha_creacion' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-3.5 text-left"
                                    onClick={() => requestSort('fecha_cierre')}
                                >
                                    Fecha Cierre {sortConfig.key === 'fecha_cierre' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-3.5 text-left"
                                    onClick={() => requestSort('cliente_nombre')}
                                >
                                    Cliente {sortConfig.key === 'cliente_nombre' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-3.5 text-left"
                                    onClick={() => requestSort('importe_total')}
                                >
                                    Importe ($) {sortConfig.key === 'importe_total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-3.5 text-center"
                                    onClick={() => requestSort('estado_orden')}>
                                    Estado {sortConfig.key === 'estado_orden' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-gray-700 font-medium">

                            {filteredAndSortedOrders.length > 0 ? (
                                    filteredAndSortedOrders.map((orden) => (
                                        <tr key={orden.id_orden_reparacion} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-blue-600 font-bold">
                                                #ORD-{orden.id_orden_reparacion.toString().padStart(4, '0')}
                                            </td>
                                            <td className="px-6 py-3 font-mono text-slate-600">
                                                {new Date(orden.fecha_creacion).toLocaleDateString('es-AR')}
                                            </td>
                                            <td className="px-6 py-3 font-mono text-slate-600">
                                                {new Date(orden.fecha_cierre).toLocaleDateString('es-AR')}
                                            </td>
                                            <td className="px-6 py-3 font-bold text-slate-700">
                                                {orden.cliente_nombre}
                                            </td>
                                            <td className="px-6 py-3 font-mono font-black text-left text-slate-800">
                                                {orden.importe_total.toFixed(2)}
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
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-gray-400 font-medium border-2 border-dashed border-gray-100">
                                            No se encontraron órdenes que coincidan con los filtros.
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>

                {/* Pie de tabla */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">
                        Mostrando {filteredAndSortedOrders.length} comprobante{filteredAndSortedOrders.length !== 1 && 's'} listado{filteredAndSortedOrders.length !== 1 && 's'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default RepairOrdersPage;