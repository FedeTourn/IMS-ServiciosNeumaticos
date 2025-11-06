import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllRoles, register } from '../../services/auth.service';

const CreateUserPage = () => {
    const navigate = useNavigate();
    
    const [roles, setRoles] = useState([]);
    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        id_role: '',
        password: '',
        password_confirm: '', // Campo de confirmación solo para el frontend
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    // --- Carga de Datos Iniciales (Roles) ---
    useEffect(() => {
        const loadRoles = async () => {
            try {
                const rolesData = await fetchAllRoles();
                setRoles(rolesData);
            } catch (err) {
                setMessage(`❌ Error al cargar los roles: ${err.message}`);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadRoles();
    }, []);

    // Maneja el cambio de estado en los inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setMessage('');
    };

    // Maneja el envío del formulario de alta
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);

        // Validaciones en Frontend
        if (formData.password !== formData.password_confirm) {
            setMessage('Las contraseñas no coinciden.');
            setIsError(true);
            return;
        }
        if (formData.password.length < 8) {
             setMessage('La contraseña debe tener al menos 8 caracteres.');
             setIsError(true);
             return;
        }

        setIsSaving(true);
        
        const dataToSend = {
            full_name: formData.full_name,
            username: formData.username,
            id_role: parseInt(formData.id_role),
            password: formData.password,
        };

        try {
            await register(dataToSend);
            setMessage('✅ Usuario creado exitosamente.');
            setIsError(false);
            
            // Opcional: Redirigir o limpiar el formulario
            setTimeout(() => {
                 navigate('/configuracion/usuarios'); 
            }, 2000);
            
        } catch (err) {
            // Maneja errores de backend (ej. nombre de usuario duplicado)
            setMessage(`❌ Error al crear usuario: ${err.message}`);
            setIsError(true);
        } finally {
            setIsSaving(false);
        }
    };

    const inputStyle = { width: '100%', padding: '10px', margin: '5px 0 15px 0', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold' };

    if (isLoading) {
        return <div style={{padding: '20px', textAlign: 'center'}}>Cargando formulario...</div>;
    }
    
    return (
        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', maxWidth: '600px', margin: '0 auto' }}>
            <h1>➕ Dar de Alta Nuevo Usuario</h1>
            <p>Registre al nuevo personal asignándole un rol y una contraseña.</p>
            
            <form onSubmit={handleSubmit}>
                
                {/* Nombre Completo */}
                <div>
                    <label htmlFor="full_name" style={labelStyle}>Nombre Completo *</label>
                    <input type="text" id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} required style={inputStyle} />
                </div>

                {/* Nombre de Usuario */}
                <div>
                    <label htmlFor="username" style={labelStyle}>Nombre de Usuario (Login) *</label>
                    <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required style={inputStyle} />
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
                    <label htmlFor="password" style={labelStyle}>Contraseña * (Mínimo 8 caracteres)</label>
                    <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required style={inputStyle} />
                </div>

                {/* Confirmar Contraseña */}
                <div>
                    <label htmlFor="password_confirm" style={labelStyle}>Confirmar Contraseña *</label>
                    <input type="password" id="password_confirm" name="password_confirm" value={formData.password_confirm} onChange={handleChange} required style={inputStyle} />
                </div>
                
                <div style={{ marginTop: '30px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <button type="submit" disabled={isSaving} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', opacity: isSaving ? 0.6 : 1 }}>
                        {isSaving ? 'Registrando...' : 'Crear Usuario'}
                    </button>
                    <button type="button" onClick={() => navigate('/configuracion/usuarios')} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        Cancelar
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

export default CreateUserPage;