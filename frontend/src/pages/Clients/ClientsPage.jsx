import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClients } from '../../services/client.service';

const SEARCH_FIELDS = [
    { value: 'todos', label: 'Todos los campos' },
    { value: 'nombre', label: 'Nombre' },
    { value: 'cuit', label: 'CUIT' },
    { value: 'email', label: 'Email' },
];

const ClientsPage = () => {
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const [query, setQuery] = useState({ 
        orderBy: 'nombre', 
        sortOrder: 'ASC',
        searchField: 'todos', 
        searchTerm: ''        
    });

    useEffect(() => {
        const loadClients = async () => {
            setIsLoading(true);
            try {
                const data = await fetchClients(query); 
                setClients(data);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        loadClients();
    }, [query]);

    const handleSort = (column) => {
        setQuery(prev => ({
            ...prev,
            orderBy: column,
            sortOrder: prev.orderBy === column && prev.sortOrder === 'ASC' ? 'DESC' : 'ASC'
        }));
    };

    const getSortIndicator = (column) => {
        if (query.orderBy !== column) return <span className="text-gray-300">↕</span>;
        return query.sortOrder === 'ASC' ? <span className="text-emerald-500">▲</span> : <span className="text-emerald-500">▼</span>;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* --- CABECERA Y ACCIONES --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-1 items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <select
                            value={query.searchField}
                            onChange={(e) => setQuery(prev => ({ ...prev, searchField: e.target.value }))}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-transparent text-xs font-bold text-gray-500 uppercase tracking-wider border-none focus:ring-0 cursor-pointer"
                        >
                            {SEARCH_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label.split(' ')[0]}</option>)}
                        </select>
                        <input 
                            type="text" 
                            placeholder="Buscar cliente..." 
                            value={query.searchTerm}
                            onChange={(e) => setQuery(prev => ({ ...prev, searchTerm: e.target.value }))}
                            className="w-full pl-24 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                        />
                    </div>
                </div>

                <button 
                    onClick={() => navigate('/crear-cliente')} 
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200 active:scale-95"
                >
                    <span>➕</span> Agregar Cliente
                </button>
            </div>

            {/* --- TABLA DE DATOS --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-20 text-center text-gray-500 animate-pulse font-medium">Cargando base de datos...</div>
                ) : error ? (
                    <div className="p-10 text-center text-red-500 bg-red-50 font-medium">{error}</div>
                ) : clients.length === 0 ? (
                    <div className="p-20 text-center text-gray-400 italic">No se encontraron clientes con esos criterios.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <Th label="Nombre" sortKey="nombre" currentQuery={query} onSort={handleSort} indicator={getSortIndicator} />
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Dirección</th>
                                    <Th label="CUIT" sortKey="cuit" currentQuery={query} onSort={handleSort} indicator={getSortIndicator} />
                                    <Th label="Categoría" sortKey="categoria" currentQuery={query} onSort={handleSort} indicator={getSortIndicator} />
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Teléfonos</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {clients.map((client) => (
                                    <tr key={client.id_cliente} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-800">{client.nombre}</div>
                                            <div className="text-xs text-gray-400">{client.email || 'Sin email'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{client.direccion}</td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-600">{client.cuit}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded border border-blue-100">
                                                {client.nombre_categoria}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 italic">
                                            {client.telefonos?.length > 0 
                                                ? client.telefonos.map(t => `${t.numero}`).join(' / ') 
                                                : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => navigate(`/modificar-cliente/${client.id_cliente}`)}
                                                className="px-3 py-1.5 text-xs font-bold text-emerald-600 hover:text-white hover:bg-emerald-600 border border-emerald-600 rounded-md transition-all"
                                            >
                                                Editar
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

/* Sub-componente para encabezados clickeables */
const Th = ({ label, sortKey, onSort, indicator }) => (
    <th 
        className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => onSort(sortKey)}
    >
        <div className="flex items-center gap-2">
            {label} {indicator(sortKey)}
        </div>
    </th>
);

export default ClientsPage;