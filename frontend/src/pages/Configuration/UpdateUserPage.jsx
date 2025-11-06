import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUserById, fetchAllRoles, updateUserData } from '../../services/auth.service';

const UpdateUserPage = () => {
    const { id_user } = useParams();
    const navigate = useNavigate();
    
    const [roles, setRoles] = useState([]);
    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        id_role: '',
        is_active: true,
        password: '', // Opcional: solo si se desea cambiar
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    // --- Carga de Datos Iniciales (Usuario y Roles) ---
    useEffect(() => {
        const loadData = async () => {
            try {
                const [userData, rolesData] = await Promise.all([
                    fetchUserById(id_user),
                    fetchAllRoles(),
                ]);
                
                setRoles(rolesData);
                
                // Configurar formulario con datos existentes
                setFormData(prev => ({
                    ...prev,
                    full_name: userData.full_name || '',
                    username: userData.username || '',
                    id_role: userData.id_role.toString() || '', // Asegurar que sea string para el select
                    is_active: userData.is_active,
                }));

            } catch (err) {
                setMessage(`❌ Error al cargar los datos del usuario: ${err.message}`);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [id_user]);

    // Maneja el cambio de estado en los inputs
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
        setMessage('');
    };

    // Maneja el envío del formulario de actualización
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsSaving(true);

        const dataToSend = {
            full_name: formData.full_name,
            id_role: parseInt(formData.id_role),
            is_active: formData.is_active,
        };
        
        // Incluir contraseña solo si se ha ingresado algo
        if (formData.password) {
            dataToSend.password = formData.password;
        }

        try {
            await updateUserData(id_user, dataToSend);
            setMessage('✅ Usuario actualizado exitosamente. ');
            setIsError(false);
            // Limpiar campo de contraseña después de guardar
            setFormData(prev => ({ ...prev, password: '' })); 
            
        } catch (err) {
            setMessage(`❌ Error al actualizar usuario: ${err.message}`);
            setIsError(true);
        } finally {
            setIsSaving(false);
        }
    };

    const inputStyle = { width: '100%', padding: '10px', margin: '5px 0 15px 0', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold' };

    if (isLoading) {
        return <div style={{padding: '20px', textAlign: 'center'}}>Cargando datos del usuario...</div>;
    }

    return (
        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', maxWidth: '600px', margin: '0 auto' }}>
            <h1>✍️ Modificar Usuario ID {id_user}</h1>
            <p>Ajuste el nombre, el rol y el estado del usuario. Deje el campo de contraseña vacío para no modificarla.</p>
            
            <form onSubmit={handleSubmit}>
                
                {/* Nombre Completo */}
                <div>
                    <label htmlFor="full_name" style={labelStyle}>Nombre Completo *</label>
                    <input type="text" id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} required style={inputStyle} />
                </div>

                {/* Nombre de Usuario (Solo Lectura) */}
                <div>
                    <label htmlFor="username" style={labelStyle}>Nombre de Usuario (Login)</label>
                    <input type="text" id="username" name="username" value={formData.username} style={inputStyle} readOnly disabled />
                </div>

                {/* Rol */}
                <div>
                    <label htmlFor="id_role" style={labelStyle}>Rol *</label>
                    <select id="id_role" name="id_role" value={formData.id_role} onChange={handleChange} required style={inputStyle}>
                        <option value="">Seleccione Rol</option>
                        {roles.map(role => (
                            <option key={role.id_role} value={role.id_role}>
                                {role.name}
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* Contraseña */}
                <div>
                    <label htmlFor="password" style={labelStyle}>Contraseña (Dejar vacío para no cambiar)</label>
                    <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} style={inputStyle} placeholder="********" />
                </div>

                {/* Activo/Inactivo */}
                <div style={{ margin: '15px 0' }}>
                    <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleChange} style={{ marginRight: '10px' }} />
                    <label htmlFor="is_active" style={{ ...labelStyle, display: 'inline' }}>Usuario Activo</label>
                </div>
                
                <div style={{ marginTop: '30px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <button type="submit" disabled={isSaving} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', opacity: isSaving ? 0.6 : 1 }}>
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                    <button type="button" onClick={() => navigate('/configuracion/usuarios')} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        Volver al Listado
                    </button>
                </div>
            </form>

            {message && (
                <p style={{ marginTop: '20px', padding: '10px', backgroundColor: isError ? '#f8d7da' : '#d4edda', color: isError ? '#721c24' : '#155724', border: `1px solid ${isError ? '#f5c6cb' : '#c3e6cb'}`, borderRadius: '4px' }}>
                    {message}
                </p>
            )}
        </div>
    );
};

export default UpdateUserPage;