import React, { useState } from 'react';
import { createClient } from '../../services/client.service';
import { useNavigate } from 'react-router-dom';

const CreateClientPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        cuit: '',
        email: '',
        categoria: 1, //Asumimos que la categoria es 1 por el momento para todos
    });
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Maneja el cambio de estado en los inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Maneja el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsLoading(true);

        // Validación básica de campos requeridos (Nombre y CUIT)
        if (!formData.nombre || !formData.cuit) {
            setMessage('El Nombre y el CUIT son obligatorios.');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        try {
            // Llama al servicio de creación de clientes
            await createClient(formData);

            setMessage('✅ Cliente agregado exitosamente.');
            setIsError(false);
            
            // Opcional: Limpiar el formulario o redirigir
            setTimeout(() => {
                 navigate('/clientes'); // Redirige a la lista de clientes después de 2 segundos
            }, 2000);

        } catch (err) {
            // Maneja errores de backend (ej. CUIT duplicado)
            setMessage(`❌ Error al crear cliente: ${err.message}`);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle = { width: '100%', padding: '10px', margin: '5px 0 15px 0', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold' };

    return (
        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>➕ Registrar Nuevo Cliente</h1>
            <p>Complete los datos del cliente, recordando que el CUIT debe ser único.</p>
            
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                    
                    {/* Nombre */}
                    <div style={{ flex: '1 1 45%' }}>
                        <label htmlFor="nombre" style={labelStyle}>Nombre Completo / Razón Social *</label>
                        <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required style={inputStyle} />
                    </div>

                    {/* CUIT */}
                    <div style={{ flex: '1 1 45%' }}>
                        <label htmlFor="cuit" style={labelStyle}>CUIT *</label>
                        <input type="text" id="cuit" name="cuit" value={formData.cuit} onChange={handleChange} required style={inputStyle} />
                    </div>

                    {/* Dirección */}
                    <div style={{ flex: '1 1 45%' }}>
                        <label htmlFor="direccion" style={labelStyle}>Dirección</label>
                        <input type="text" id="direccion" name="direccion" value={formData.direccion} onChange={handleChange} style={inputStyle} />
                    </div>

                    {/* Email */}
                    <div style={{ flex: '1 1 45%' }}>
                        <label htmlFor="email" style={labelStyle}>Email</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} />
                    </div>
                    
                    {/* Nota: La selección de Categoría es un paso posterior que requiere consultar la tabla CategoriaCliente */}
                    <div style={{ flex: '1 1 45%' }}>
                        <label htmlFor="categoria" style={labelStyle}>Categoría de Cliente (Default: 1)</label>
                        <input type="number" id="categoria" name="categoria" value={formData.categoria} onChange={handleChange} style={inputStyle} readOnly />
                    </div>

                </div>

                <div style={{ marginTop: '30px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', opacity: isLoading ? 0.6 : 1 }}>
                        {isLoading ? 'Guardando...' : 'Guardar Cliente'}
                    </button>
                    <button type="button" onClick={() => navigate('/clientes')} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
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

export default CreateClientPage;