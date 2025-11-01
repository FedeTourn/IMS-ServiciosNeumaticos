import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClients } from '../../services/client.service';

const ClientsPage = () => {
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadClients = async () => {
            try {
                const data = await fetchClients();
                setClients(data);
                setIsLoading(false);
            } catch (err) {
                setError(err.message);
                setIsLoading(false);
            }
        };
        loadClients();
    }, []);

    const renderClientList = () => (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
                <tr style={{ backgroundColor: '#ccc' }}>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Nombre</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>CUIT</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Email</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Categoría</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {clients.map((client) => (
                    <tr key={client.id_cliente}>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{client.nombre}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{client.cuit}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{client.email}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{client.nombre_categoria}</td>
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
            <h1>👥 Gestión de Clientes</h1>
            <button 
                onClick={() => navigate('/crear-cliente')} 
                style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}
            >
                ➕ Crear Nuevo Cliente
            </button>
            
            {isLoading && <p>Cargando clientes...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            
            {!isLoading && !error && clients.length > 0 && renderClientList()}
            {!isLoading && !error && clients.length === 0 && <p>No se encontraron clientes.</p>}
        </div>
    );
};

export default ClientsPage;