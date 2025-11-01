import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchClientById, updateClient, disableClient } from '../../services/client.service';

const UpdateClientPage = () => {
    const { id_cliente } = useParams(); // Hook para obtener el ID de la URL
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        cuit: '',
        email: '',
        nombre_categoria: '',
        is_active: true
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    
    const inputStyle = { width: '100%', padding: '10px', margin: '5px 0 15px 0', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold' };


    // 1. Efecto para cargar los datos del cliente al iniciar
    useEffect(() => {
        const loadClient = async () => {
            try {
                const data = await fetchClientById(id_cliente);
                // Carga los datos, pero solo los modificables serán editables
                setFormData({
                    nombre: data.nombre || '',
                    direccion: data.direccion || '',
                    cuit: data.cuit || '',
                    email: data.email || '',
                    nombre_categoria: data.nombre_categoria || '',
                    is_active: data.is_active !== 0 // Asume que 0 es inactivo
                });
            } catch (err) {
                setMessage(`❌ Error al cargar los datos del cliente: ${err.message}`);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadClient();
    }, [id_cliente]);


    // Maneja el cambio de estado en los inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setMessage('');
    };


    // 2. Maneja el envío del formulario de actualización
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsLoading(true);

        // Envía solo los datos que el controlador backend acepta para la modificación
        const dataToSend = {
            direccion: formData.direccion,
            email: formData.email
        };

        try {
            await updateClient(id_cliente, dataToSend);
            setMessage('✅ Cliente actualizado exitosamente.');
            setIsError(false);
            
        } catch (err) {
            setMessage(`❌ Error al actualizar cliente: ${err.message}`);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };


    // 3. Maneja la deshabilitación (Soft Delete)
    const handleDisable = async () => {
        if (!window.confirm(`¿Está seguro de deshabilitar el cliente ${formData.nombre}? Esta acción es reversible, pero desactiva la cuenta.`)) {
            return;
        }

        setIsLoading(true);
        setMessage('');
        setIsError(false);
        
        try {
            await disableClient(id_cliente);
            setMessage('✅ Cliente deshabilitado exitosamente.');
            setFormData(prev => ({ ...prev, is_active: false })); // Actualiza el estado local
        } catch (err) {
             setMessage(`❌ Error al deshabilitar cliente: ${err.message}`);
             setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div style={{padding: '20px', textAlign: 'center'}}>Cargando datos del cliente...</div>;
    }


    return (
        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>✏️ Modificar Cliente: {formData.nombre}</h1>
            
            {/* Mensaje de estado (Activo/Inactivo) */}
            <p style={{ fontWeight: 'bold', color: formData.is_active ? 'green' : 'red', padding: '10px', border: `1px solid ${formData.is_active ? 'green' : 'red'}`}}>
                Estado: {formData.is_active ? 'ACTIVO' : 'INACTIVO'}
            </p>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                    
                    {/* Nombre (Campo de solo lectura) */}
                    <div style={{ flex: '1 1 45%' }}>
                        <label style={labelStyle}>Nombre Completo / Razón Social</label>
                        <input type="text" value={formData.nombre} readOnly disabled style={{ ...inputStyle, backgroundColor: '#eee' }} />
                    </div>

                    {/* CUIT (Campo de solo lectura) */}
                    <div style={{ flex: '1 1 45%' }}>
                        <label style={labelStyle}>CUIT</label>
                        <input type="text" value={formData.cuit} readOnly disabled style={{ ...inputStyle, backgroundColor: '#eee' }} />
                    </div>

                    {/* Dirección (Campo editable) */}
                    <div style={{ flex: '1 1 45%' }}>
                        <label htmlFor="direccion" style={labelStyle}>Dirección</label>
                        <input type="text" id="direccion" name="direccion" value={formData.direccion} onChange={handleChange} style={inputStyle} />
                    </div>

                    {/* Email (Campo editable) */}
                    <div style={{ flex: '1 1 45%' }}>
                        <label htmlFor="email" style={labelStyle}>Email</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} />
                    </div>
                    
                    {/* Categoría (Campo de solo lectura) */}
                    <div style={{ flex: '1 1 45%' }}>
                        <label style={labelStyle}>Categoría</label>
                        <input type="text" value={formData.nombre_categoria} readOnly disabled style={{ ...inputStyle, backgroundColor: '#eee' }} />
                    </div>

                </div>

                <div style={{ marginTop: '30px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {/* Botón de Guardar Modificaciones */}
                    <button type="submit" disabled={isLoading || !formData.is_active} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', opacity: (isLoading || !formData.is_active) ? 0.6 : 1 }}>
                        {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                    
                    {/* Botón de Deshabilitar/Eliminar (Soft Delete) */}
                    {formData.is_active && (
                         <button type="button" onClick={handleDisable} disabled={isLoading} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', opacity: isLoading ? 0.6 : 1 }}>
                            {isLoading ? 'Deshabilitando...' : 'Deshabilitar Cliente'}
                        </button>
                    )}

                    <button type="button" onClick={() => navigate('/clientes')} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        Volver a Clientes
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

export default UpdateClientPage;