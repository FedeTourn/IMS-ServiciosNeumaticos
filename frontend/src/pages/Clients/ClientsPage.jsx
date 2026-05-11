// frontend/src/pages/Clients/ClientsPage.jsx (Modificación Completa)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClients } from '../../services/client.service';

// Opciones disponibles para el dropdown de búsqueda
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

    // Estado de la consulta (Orden, Búsqueda)
    const [query, setQuery] = useState({ 
        orderBy: 'nombre', 
        sortOrder: 'ASC',
        searchField: 'todos', 
        searchTerm: ''        
    });

    // --- EFECTO DE CARGA DE DATOS (Basado en el estado de consulta) ---
    useEffect(() => {
        const loadClients = async () => {
            setIsLoading(true);
            try {
                // Envía todos los parámetros de query
                const data = await fetchClients(query); 
                setClients(data);
                setIsLoading(false);
            } catch (err) {
                setError(err.message);
                setIsLoading(false);
            }
        };
        loadClients();
    }, [query]); // Recarga cada vez que cambia query


    // --- MANEJADORES DE CAMBIO ---
    
    // 1. Maneja el clic en los encabezados de la tabla (Ordenamiento)
    const handleSort = (column) => {
        setQuery(prevQuery => ({
            ...prevQuery,
            orderBy: column,
            sortOrder: prevQuery.orderBy === column && prevQuery.sortOrder === 'ASC' ? 'DESC' : 'ASC'
        }));
    };
    
    // 2. Maneja el cambio en el campo de búsqueda de texto
    const handleSearchTermChange = (e) => {
        setQuery(prevQuery => ({
            ...prevQuery,
            searchTerm: e.target.value
        }));
    };

    // 3. Maneja el cambio en el dropdown de campo de búsqueda
    const handleSearchFieldChange = (e) => {
        setQuery(prevQuery => ({
            ...prevQuery,
            searchField: e.target.value
        }));
    };
    
    // 4. Renderiza el indicador de dirección de ordenamiento
    const getSortIndicator = (column) => {
        if (query.orderBy !== column) return '';
        return query.sortOrder === 'ASC' ? ' ▲' : ' ▼';
    };


    // --- RENDERIZADO DE LA TABLA ---
    const renderClientList = () => (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
                <tr style={{ backgroundColor: '#ccc' }}>
                    {/* Columnas con Ordenamiento */}
                    <th style={{ padding: '10px', border: '1px solid #ddd', cursor: 'pointer' }} onClick={() => handleSort('nombre')}>Nombre {getSortIndicator('nombre')}</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Dirección</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', cursor: 'pointer' }} onClick={() => handleSort('cuit')}>CUIT {getSortIndicator('cuit')}</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', cursor: 'pointer' }} onClick={() => handleSort('categoria')}>Categoría {getSortIndicator('categoria')}</th>
                    {/* Nueva Columna de Teléfonos */}
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Teléfonos</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {clients.map((client) => (
                    <tr key={client.id_cliente}>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{client.nombre}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{client.direccion}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{client.cuit}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{client.nombre_categoria}</td>
                        {/* Columna de Teléfonos */}
                        <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '0.85em' }}>
                            {/* APLICAMOS EL MAPEO PARA TRANSFORMAR EL ARRAY DE OBJETOS A UNA CADENA */}
                            {client.telefonos && Array.isArray(client.telefonos) && client.telefonos.length > 0
                                ? client.telefonos.map(p => `${p.numero} (${p.descripcion || 'N/A'})`).join(', ')
                                : 'Sin registrar'}
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                            <button onClick={() => navigate(`/modificar-cliente/${client.id_cliente}`)}>Modificar</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div style={{ padding: '20px' }}>
            
            {/* Título de la Página */}
            <h1 style={{ margin: '0 0 20px 0' }}>👥 Gestión de Clientes</h1>

            {/* --- SECCIÓN SUPERIOR DE ACCIONES (RECUADRO) --- */}
            <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#fff' }}>
                <h2 style={{ margin: '0 0 15px 0', fontSize: '1.2em', borderBottom: '1px solid #eee' }}>Acciones</h2>
                
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', justifyContent:'space-between' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {/* Dropdown de Columna */}
                        <select
                            value={query.searchField}
                            onChange={handleSearchFieldChange}
                            style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                        >
                            {SEARCH_FIELDS.map(field => (
                                <option key={field.value} value={field.value}>{field.label}</option>
                            ))}
                        </select>

                        {/* Campo de Texto (Búsqueda) */}
                        <input 
                            type="text" 
                            placeholder={`Buscar por ${SEARCH_FIELDS.find(f => f.value === query.searchField)?.label}...`} 
                            value={query.searchTerm}
                            onChange={handleSearchTermChange}
                            style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px', minWidth: '250px' }}
                        />
                    </div>
                    
                    {/* Botón de Alta */}
                    <button 
                        onClick={() => navigate('/crear-cliente')} 
                        style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    >
                        ➕ Agregar Cliente
                    </button>
                </div>
            </div>

            {/* --- SECCIÓN INFERIOR DE TABLA --- */}
            {isLoading ? <p>Cargando clientes...</p> : 
            error ? <p style={{ color: 'red' }}>Error: {error}</p> :
            clients.length > 0 ? renderClientList() :
            <p>No se encontraron clientes registrados.</p>
            }
        </div>
    );
};

export default ClientsPage;