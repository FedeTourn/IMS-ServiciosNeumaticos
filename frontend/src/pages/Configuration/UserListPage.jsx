import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Asegúrate de importar desde la ruta correcta (podría ser un nuevo archivo)
import { fetchAllUsers } from '../../services/auth.service'; 

const UserListPage = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const data = await fetchAllUsers();
                setUsers(data);
                setIsLoading(false);
            } catch (err) {
                setError(err.message);
                setIsLoading(false);
            }
        };
        loadUsers();
    }, []);

    const renderUserList = () => (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
                <tr style={{ backgroundColor: '#ccc' }}>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Nombre Completo</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Usuario (Login)</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Rol</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Activo</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {users.map((user) => (
                    <tr key={user.id_user}>
                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>{user.id_user}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.full_name}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.username}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>{user.role_name}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                            {user.is_active ? '✅ Sí' : '❌ No'}
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                            <button 
                                onClick={() => navigate(`/configuracion/modificar-usuario/${user.id_user}`)}
                                style={{ padding: '8px 15px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                            >
                                Modificar
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div style={{ padding: '20px', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
            <h1>👥 Consulta y Gestión de Usuarios</h1>
            
            <div style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
                <button 
                    onClick={() => navigate('/configuracion/alta-usuario')} 
                    style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                    ➕ Alta de Usuario
                </button>
                <button 
                    onClick={() => navigate('/configuracion')} 
                    style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                    Volver a Configuración
                </button>
            </div>
            
            {isLoading && <p>Cargando lista de usuarios...</p>}
            {error && <p style={{ color: 'red' }}>Error al cargar usuarios: {error}</p>}
            
            {!isLoading && !error && users.length > 0 && renderUserList()}
            {!isLoading && !error && users.length === 0 && <p>No se encontraron usuarios registrados.</p>}
        </div>
    );
};

export default UserListPage;