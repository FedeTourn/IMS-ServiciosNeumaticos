import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProducts } from '../../services/product.service';

const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await fetchProducts();
                setProducts(data);
                setIsLoading(false);
            } catch (err) {
                setError(err.message);
                setIsLoading(false);
            }
        };
        loadProducts();
    }, []);

    const renderProductList = () => (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
                <tr style={{ backgroundColor: '#ccc' }}>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Cliente</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Tipo/Modelo</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Estado</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Recepción</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {products.map((p) => (
                    <tr key={p.id_producto}>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{p.id_producto}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{p.cliente_nombre}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{p.tipo_nombre} / {p.modelo_nombre}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{p.estado_nombre}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{new Date(p.fecha_recepcion).toLocaleDateString()}</td>
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
            <h1>🛠️ Consulta y Trazabilidad de Productos</h1>
            <button 
                onClick={() => navigate('/registrar-recepcion')} 
                style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}
            >
                ➕ Registrar Recepción de Válvula
            </button>
            
            {isLoading && <p>Cargando productos...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            
            {!isLoading && !error && products.length > 0 && renderProductList()}
            {!isLoading && !error && products.length === 0 && <p>No se encontraron productos registrados.</p>}
        </div>
    );
};

export default ProductsPage;