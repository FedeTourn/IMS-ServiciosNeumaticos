import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchReceipts } from '../../services/receipt.service';
import { fetchClients } from '../../services/client.service';

/**
 * @fileoverview Componente de presentación estático para la Consulta de Comprobantes de Recepción.
 * Renderiza los filtros visuales y la grilla de datos utilizando clases de utilidad de TailwindCSS.
 */
const ReceiptsPage = () => {
    const navigate = useNavigate();

    // Informacion que cargamos a la pagina (iniciados en vacio)
    const [receipts, setReceipts] = useState([]);
    const [clients, setClients] = useState([]);

    // Parametros de consulta (iniciados en vacio)
    const [filters, setFilters] = useState({
        search: '',
        id_cliente: '',
        fecha_desde: '',
        fecha_hasta: '',
        sort_by: 'fecha',
        sort_order: 'DESC'
    });

    // El estado inicial es loading y no hay errores guardados
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');


    // Carga inicial de clientes para el select
    useEffect(() => {
        const loadClients = async () => {
            try {
                const data = await fetchClients();
                setClients(data);
            } catch (err) {
                console.error("Error al cargar clientes:", err);
            }
        };
        loadClients();
    }, []);

    // Carga nuevamente los comprobantes cada vez que los filtros cambien
    useEffect(() => {
        const loadReceipts = async () => {
            setIsLoading(true);
            setError('');
            try {
                const data = await fetchReceipts(filters);
                setReceipts(data.data || []); 
            } catch (err) {
                setError(`Error al recuperar el historial: ${err.message}`);
                setReceipts([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadReceipts();
    }, [filters]); // El array de dependencias asegura que la tabla se actualice dinámicamente

    // Manejador centralizado para actualizar el estado de los filtros
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSort = (columnKey) => {
        setFilters(prev => {
            console.info(columnKey);
            // Si el usuario hace clic en la misma columna, invertimos el orden
            if (prev.sort_by === columnKey) {
                return { ...prev, sort_order: prev.sort_order === 'DESC' ? 'ASC' : 'DESC' };
            }
            // Si hace clic en una columna nueva, ordenamos por ella de forma descendente por defecto
            return { ...prev, sort_by: columnKey, sort_order: 'DESC' };
        });
    };

    const getSortIndicator = (columnKey) => {
        if (filters.sort_by !== columnKey) return <span className="text-gray-300">↕</span>;
        return filters.sort_order === 'ASC' ? <span className="text-emerald-500">▲</span> : <span className="text-emerald-500">▼</span>;
    };

    // Función auxiliar para formatear fechas legibles (DD/MM/YYYY)
    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleDateString('es-AR');
    };


    return (
        <div className="space-y-6 animate-fade-in">
            <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
                {/* --- CABECERA Y ACCIONES --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Gestión de Comprobantes de Recepción</h1>
                        <p className="text-sm text-gray-500">Historial de remitos y trazabilidad de ingresos al taller.</p>
                    </div>

                    <button
                        onClick={() => navigate('/registrar-recepcion')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95 text-sm">
                        + Registrar Nuevo Ingreso
                    </button>
                </div>

                {/* Panel de Filtros y Barras de Búsqueda */}
                <div className='pt-4'>
                    <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest pb-1">Filtros de Búsqueda</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Búsqueda por Texto (Cliente o ID) */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-xs font-semibold text-gray-600">Buscar por Cliente / CUIT</label>
                            <input 
                                type="text" 
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Ej. Tourn Mauricio..." 
                                className="border border-gray-300 rounded-lg p-2 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                            />
                        </div>

                        {/* Filtro por Cliente Específico (Selector) */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-xs font-semibold text-gray-600">Filtrar por Entidad</label>
                            <select 
                                value={filters.id_cliente}
                                name="id_cliente"
                                onChange={handleFilterChange}
                                className="border border-gray-300 rounded-lg p-2 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Todos los clientes...</option>
                                {clients.map(c =>
                                    <option key={c.id_cliente} value={c.id_cliente}>
                                        {c.nombre}
                                    </option>
                                )}
                            </select>
                        </div>

                        {/* Fecha Desde */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-xs font-semibold text-gray-600">Fecha Desde</label>
                            <input 
                                type="date"
                                name="fecha_desde"
                                value={filters.fecha_desde}
                                onChange={handleFilterChange}
                                className="border border-gray-300 rounded-lg p-2 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            />
                        </div>

                        {/* Fecha Hasta */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-xs font-semibold text-gray-600">Fecha Hasta</label>
                            <input 
                                type="date"
                                name="fecha_hasta"
                                value={filters.fecha_hasta}
                                onChange={handleFilterChange}
                                className="border border-gray-300 rounded-lg p-2 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            />
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
                                <th className="px-6 py-3.5 text-left"
                                    onClick={() => handleSort('id')}
                                >
                                    ID Comprobante {getSortIndicator('id')}
                                </th>
                                <th className="px-6 py-3.5 text-left"
                                    onClick={() => handleSort('fecha')}
                                >
                                    Fecha de Entrada {getSortIndicator('fecha')}
                                </th>
                                <th className="px-6 py-3.5 text-left"
                                    onClick={() => handleSort('cliente')}
                                >
                                    Cliente Responsable {getSortIndicator('cliente')}
                                </th>
                                <th className="px-6 py-3.5 text-left">Observaciones Generales</th>
                                <th className="px-6 py-3.5 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-gray-700 font-medium">

                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400 animate-pulse">
                                        Cargando registros...
                                    </td>
                                </tr>
                            ) : receipts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        No se encontraron comprobantes que coincidan con los filtros actuales.
                                    </td>
                                </tr>
                            ) : (
                                receipts.map((receipt) => (
                                    <tr key={receipt.id_comprobante} className="hover:bg-slate-100 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-blue-600 font-bold">
                                            #REC-{String(receipt.id_comprobante).padStart(5,0)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono">
                                            {formatDate(receipt.fecha_recepcion)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-slate-800">{receipt.cliente_nombre}</div>
                                            <div className="text-[11px] text-gray-400 font-mono">CUIT: {receipt.cliente_cuit}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 italic max-w-xs truncate">
                                            {receipt.descripcion || 'Sin Observaciones'}
                                        </td>
                                        <td className="px-6 py-2 text-center text-xs space-y-1">
                                            <div>
                                                {/* Funcionalidad de consulta */}
                                                <button 
                                                    type="button"
                                                    onClick={() => navigate(`/recepcion/${receipt.id_comprobante}`)}
                                                    className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-white hover:bg-blue-600 border border-slate-200 rounded-lg transition-all">
                                                    Ver Detalle
                                                </button>
                                            </div>
                                            
                                        </td>

                                    </tr>
                                ))
                            )}
                            {/* Registro Fijo de Muestra 1 */}
                            <tr className="hover:bg-slate-100 transition-colors">
                                
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Pie de tabla */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">
                        Mostrando {receipts.length} comprobante{receipts.length !== 1 && 's'} listado{receipts.length !== 1 && 's'}
                    </span>
                    <div className="flex space-x-1">
                        <button disabled type="button" className="px-3 py-1 bg-gray-200 text-gray-400 text-xs rounded-md font-bold cursor-not-allowed">Anterior</button>
                        <button disabled type="button" className="px-3 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs rounded-md font-bold transition-colors">Siguiente</button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ReceiptsPage;