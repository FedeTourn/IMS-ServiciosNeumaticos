import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProducts } from '../../services/product.service';
import StatusBadge from '../../components/common/StatusBadge';

const SEARCH_FIELDS = [
    { value: 'todos', label: 'Todos los campos' },
    { value: 'cliente', label: 'Cliente' },
    { value: 'modelo', label: 'Modelo' },
    { value: 'estado', label: 'Estado' },
    { value: 'recepcion', label: 'Fecha de Recepción' },
];

/**
 * Página de Trazabilidad de Productos.
 * Permite la gestión, filtrado y seguimiento de válvulas en el taller.
 */
const ProductsPage = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    const [query, setQuery] = useState({ 
        orderBy: 'fecha_recepcion', 
        sortOrder: 'DESC',
        searchField: 'todos', 
        searchTerm: ''
    });

    useEffect(() => {
        const loadProducts = async () => {
            setIsLoading(true);
            try {
                const data = await fetchProducts(query); 
                setProducts(data);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        loadProducts();
    }, [query]);

    const handleSort = (column) => {
        setQuery(prev => ({
            ...prev,
            orderBy: column,
            sortOrder: prev.orderBy === column && prev.sortOrder === 'ASC' ? 'DESC' : 'ASC'
        }));
    };

    const handleSearchSubmit = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            e.preventDefault(); 
            setIsSearching(true);
            // El useEffect se encarga de la carga real al detectar cambios en el estado 'query'
            setTimeout(() => setIsSearching(false), 400);
        }
    };

    const getSortIndicator = (column) => {
        if (query.orderBy !== column) return <span className="text-gray-300 ml-1">↕</span>;
        return query.sortOrder === 'ASC' 
            ? <span className="text-emerald-500 ml-1">▲</span> 
            : <span className="text-emerald-500 ml-1">▼</span>;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* --- CABECERA Y FILTROS --- */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-1 flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-md flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
                        <select
                            value={query.searchField}
                            onChange={(e) => setQuery(prev => ({ ...prev, searchField: e.target.value }))}
                            className="bg-transparent text-[10px] font-black text-gray-500 uppercase tracking-widest px-3 border-r border-gray-200 outline-none cursor-pointer h-full"
                        >
                            {SEARCH_FIELDS.map(f => (
                                <option key={f.value} value={f.value}>{f.label.split(' ')[0]}</option>
                            ))}
                        </select>
                        <input 
                            type="text" 
                            placeholder="Buscar producto o cliente..." 
                            value={query.searchTerm}
                            onChange={(e) => setQuery(prev => ({ ...prev, searchTerm: e.target.value }))}
                            onKeyDown={handleSearchSubmit}
                            className="w-full bg-transparent px-4 py-2.5 text-sm outline-none"
                        />
                        <button 
                            onClick={handleSearchSubmit}
                            disabled={isSearching}
                            className="px-4 text-emerald-600 hover:text-emerald-700 disabled:opacity-50 transition-colors"
                        >
                            {isSearching ? '...' : '🔍'}
                        </button>
                    </div>
                </div>

                <button 
                    onClick={() => navigate('/registrar-recepcion')} 
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-lg font-bold hover:bg-black transition-all shadow-md active:scale-95 text-sm"
                >
                    Registrar Recepción
                </button>
            </div>

            {/* --- LISTADO DE PRODUCTOS --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-20 text-center text-gray-400 animate-pulse">Sincronizando trazabilidad...</div>
                ) : error ? (
                    <div className="p-10 text-center text-red-600 bg-red-50 font-medium">{error}</div>
                ) : products.length === 0 ? (
                    <div className="p-20 text-center text-gray-400 italic">No se registran productos con los criterios seleccionados.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-gray-100 font-mono">
                                    <Th label="Tipo" sortKey="tipo" onSort={handleSort} indicator={getSortIndicator} />
                                    <Th label="Modelo" sortKey="modelo" onSort={handleSort} indicator={getSortIndicator} />
                                    <Th label="Cliente" sortKey="cliente" onSort={handleSort} indicator={getSortIndicator} />
                                    <Th label="Recepción" sortKey="fecha_recepcion" onSort={handleSort} indicator={getSortIndicator} />
                                    <Th label="Estado" sortKey="estado" onSort={handleSort} indicator={getSortIndicator} />
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {products.map((p) => (
                                    <tr key={p.id_producto} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-xs font-bold text-slate-700 uppercase">{p.tipo_nombre}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{p.modelo_nombre}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-emerald-700">{p.cliente_nombre}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-gray-500">
                                            {new Date(p.fecha_recepcion).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={p.estado_nombre} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => navigate(`/producto/${p.id_producto}`)}
                                                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 border border-transparent hover:border-emerald-200 rounded transition-all"
                                            >
                                                Detalles
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};


/**
 * Sub-componente para celdas de encabezado (Th) con capacidad de ordenamiento.
 * @param {string} label - Texto a mostrar.
 * @param {string} sortKey - Clave de la columna para el ordenamiento.
 * @param {function} onSort - Función manejadora del evento click.
 * @param {function} indicator - Función que retorna el ícono de dirección.
 */
const Th = ({ label, sortKey, onSort, indicator }) => (
    <th 
        className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-slate-600 transition-colors"
        onClick={() => onSort(sortKey)}
    >
        <div className="flex items-center">
            {label} {indicator(sortKey)}
        </div>
    </th>
);

export default ProductsPage;