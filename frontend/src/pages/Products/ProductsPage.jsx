// frontend/src/pages/Products/ProductsPage.jsx (Modificación Completa)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProducts } from '../../services/product.service';

// Componente para las secciones y botones
const ConfigSection = ({ title, children }) => (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '30px', backgroundColor: '#fff' }}>
        <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '1px', marginBottom: '15px' }}>{title}</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            {children}
        </div>
    </div>
);

// Opciones disponibles para el dropdown de búsqueda
const SEARCH_FIELDS = [
    { value: 'todos', label: 'Todos los campos' },
    { value: 'cliente', label: 'Cliente' },
    { value: 'modelo', label: 'Modelo' },
    { value: 'estado', label: 'Estado' },
    { value: 'recepcion', label: 'Fecha de Recepción' },
];

const ProductsPage = () => {
    const navigate = useNavigate();
    
    // --- ESTADO DE LA CONSULTA ---
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estado de la consulta
    const [query, setQuery] = useState({ 
        orderBy: 'fecha_recepcion', 
        sortOrder: 'DESC',
        searchField: 'todos', // Campo seleccionado para buscar
        searchTerm: ''        // Término ingresado en el campo de texto
    });

    // Estado de carga específico para la tabla (sin recargar todo el componente)
    const [isSearching, setIsSearching] = useState(false);

    // --- 2. EFECTO DE CARGA DE DATOS (Basado en el estado de consulta) ---
    useEffect(() => {
        const loadProducts = async () => {
            setIsLoading(true);
            try {
                // Envía todos los parámetros de query
                const data = await fetchProducts(query); 
                setProducts(data);
                setIsLoading(false);
            } catch (err) {
                setError(err.message);
                setIsLoading(false);
            }
        };
        loadProducts();
    }, [query]); // Recarga cada vez que cambia query (orden, filtro, búsqueda)


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
    
    // 4. Activa la búsqueda al presionar ENTER o al hacer clic en un botón de búsqueda (Simulación)
    const handleSearchSubmit = (e) => {
        // Por ahora, el useEffect se encarga de la recarga. 
        // Si quieres que el ENTER dispare solo la búsqueda, puedes descomentar y modificar
        // if (e.key === 'Enter') { /* ... */ }
        // Para simular el efecto de un botón de búsqueda o ENTER:
        setIsSearching(true);
        // Aquí podrías añadir una pausa si el useEffect no se dispara inmediatamente.
        setTimeout(() => setIsSearching(false), 500); 
    };


    // Renderiza el indicador de dirección de ordenamiento
    const getSortIndicator = (column) => {
        if (query.orderBy !== column) return '';
        return query.sortOrder === 'ASC' ? ' ▲' : ' ▼';
    };


    // --- RENDERIZADO DE LA TABLA ---
    const renderProductList = () => (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
                <tr style={{ backgroundColor: '#ccc' }}>
                    
                    {/* Columnas Modificadas para Ordenamiento */}
                    <th style={{ padding: '10px', border: '1px solid #ddd', cursor: 'pointer' }} onClick={() => handleSort('tipo')}>Tipo {getSortIndicator('tipo')}</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', cursor: 'pointer' }} onClick={() => handleSort('modelo')}>Modelo {getSortIndicator('modelo')}</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', cursor: 'pointer' }} onClick={() => handleSort('cliente')}>Cliente {getSortIndicator('cliente')}</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', cursor: 'pointer' }} onClick={() => handleSort('fecha_recepcion')}>Recepción {getSortIndicator('fecha_recepcion')}</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', cursor: 'pointer' }} onClick={() => handleSort('estado')}>Estado {getSortIndicator('estado')}</th>
                    
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {products.map((p) => (
                    <tr key={p.id_producto}>
                        {/* Se muestran Tipo y Modelo en columnas separadas */}
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{p.tipo_nombre}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{p.modelo_nombre}</td>
                        
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{p.cliente_nombre}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{new Date(p.fecha_recepcion).toLocaleDateString()}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{p.estado_nombre}</td>
                        
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                            <button onClick={() => navigate(`/producto/${p.id_producto}`)}>Ver Detalle</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div style={{ padding: '20px' }}>
            
            {/* --- SECCIÓN SUPERIOR --- */}

            {/* Título de la página */}
            <h1 style={{ margin: 0 }}>🛠️ Trazabilidad de Productos</h1>

            <ConfigSection title="Acciones">
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

                    {/* Campo de Texto (Ahora Habilitado) */}
                    <input 
                        type="text" 
                        placeholder={`Buscar por ${SEARCH_FIELDS.find(f => f.value === query.searchField)?.label}...`} 
                        value={query.searchTerm}
                        onChange={handleSearchTermChange}
                        onKeyDown={handleSearchSubmit} // Dispara la búsqueda al presionar Enter (simulado)
                        style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px', minWidth: '250px' }}
                    />

                </div>
                
                
                {/* Botón de Alta */}
                <button 
                    onClick={() => navigate('/registrar-recepcion')} 
                    style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                    ➕ Registrar Recepción
                </button>
                
            </ConfigSection>
            
            {/* --- CONTENIDO PRINCIPAL --- */}
            {isLoading && <p>Cargando productos...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            
            {!isLoading && !error && products.length > 0 && renderProductList()}
            {!isLoading && !error && products.length === 0 && <p>No se encontraron productos registrados.</p>}
        </div>
    );
};

export default ProductsPage;