import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClients } from '../../services/client.service'; // Necesitamos la lista de clientes
import { fetchProductTypes, fetchProductModels, registerProductReception } from '../../services/product.service';

const RegisterReceptionPage = () => {
    const navigate = useNavigate();
    
    // Listas de datos de referencia
    const [clients, setClients] = useState([]);
    const [productTypes, setProductTypes] = useState([]);
    const [productModels, setProductModels] = useState([]);
    
    // Estado del formulario
    const [formData, setFormData] = useState({
        id_cliente: '',
        tipo_seleccionado: '', // Usado solo para filtrar modelos
        modelo: '',
        observaciones: '',
        fecha_recepcion: new Date().toISOString().substring(0, 10), // Fecha de hoy
    });

    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // --- Carga de Datos Iniciales (Clientes y Tipos) ---
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [clientData, typeData] = await Promise.all([
                    fetchClients(),
                    fetchProductTypes(),
                ]);
                
                // Filtra clientes activos si es necesario. Por ahora, cargamos todos.
                setClients(clientData);
                setProductTypes(typeData);
            } catch (err) {
                setMessage(`Error al cargar datos iniciales: ${err.message}`);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);

    // --- Efecto para cargar Modelos al seleccionar un Tipo ---
    useEffect(() => {
        const loadModels = async () => {
            if (formData.tipo_seleccionado) {
                try {
                    const models = await fetchProductModels(formData.tipo_seleccionado);
                    setProductModels(models);
                    // Resetear el modelo si el tipo cambia
                    setFormData(prev => ({ ...prev, modelo: '' })); 
                } catch (err) {
                    setMessage(`Error al cargar modelos: ${err.message}`);
                    setIsError(true);
                }
            } else {
                 setProductModels([]);
            }
        };
        loadModels();
    }, [formData.tipo_seleccionado]);


    // Maneja el cambio de estado en los inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setMessage('');
    };

    // Maneja el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsLoading(true);

        // Validación de campos requeridos
        if (!formData.id_cliente || !formData.modelo) {
            setMessage('El Cliente, el Tipo y el Modelo son obligatorios.');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        try {
            // Datos a enviar al backend
            const productToSend = {
                id_cliente: formData.id_cliente,
                modelo: formData.modelo,
                observaciones: formData.observaciones,
                fecha_recepcion: formData.fecha_recepcion,
                // Nota: fecha_entrega_pactada y Comprobante de Recepción se agregarían en un paso posterior.
            };
            
            await registerProductReception(productToSend);

            setMessage(`✅ Producto registrado y marcado como 'Recibida'.`);
            
            // Opcional: Redirigir o limpiar
            setTimeout(() => {
                 navigate('/productos-reparar'); // Volver al listado
            }, 2000);

        } catch (err) {
            setMessage(`❌ Error al registrar recepción: ${err.message}`);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle = { width: '100%', padding: '10px', margin: '5px 0 15px 0', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold' };

    if (isLoading) {
        return <div style={{padding: '20px', textAlign: 'center'}}>Cargando formulario...</div>;
    }

    return (
        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>📦 Registrar Recepción de Producto</h1>
            <p>Registre aquí la entrada de una válvula o componente para reparación.</p>
            
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                    
                    {/* Cliente */}
                    <div style={{ flex: '1 1 45%' }}>
                        <label htmlFor="id_cliente" style={labelStyle}>Cliente *</label>
                        <select id="id_cliente" name="id_cliente" value={formData.id_cliente} onChange={handleChange} required style={inputStyle}>
                            <option value="">Seleccione Cliente</option>
                            {clients.map(client => (
                                <option key={client.id_cliente} value={client.id_cliente}>
                                    {client.nombre} ({client.cuit})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Fecha de Recepción */}
                    <div style={{ flex: '1 1 45%' }}>
                        <label htmlFor="fecha_recepcion" style={labelStyle}>Fecha de Recepción *</label>
                        <input type="date" id="fecha_recepcion" name="fecha_recepcion" value={formData.fecha_recepcion} onChange={handleChange} required style={inputStyle} />
                    </div>

                    {/* Tipo de Producto (Solo para filtrar) */}
                    <div style={{ flex: '1 1 45%' }}>
                        <label htmlFor="tipo_seleccionado" style={labelStyle}>Tipo de Producto</label>
                        <select id="tipo_seleccionado" name="tipo_seleccionado" value={formData.tipo_seleccionado} onChange={handleChange} style={inputStyle}>
                            <option value="">Seleccione Tipo</option>
                            {productTypes.map(type => (
                                <option key={type.id_tipo} value={type.id_tipo}>
                                    {type.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Modelo de Producto */}
                    <div style={{ flex: '1 1 45%' }}>
                        <label htmlFor="modelo" style={labelStyle}>Modelo de Producto *</label>
                        <select id="modelo" name="modelo" value={formData.modelo} onChange={handleChange} required style={inputStyle} disabled={!formData.tipo_seleccionado}>
                            <option value="">{formData.tipo_seleccionado ? 'Seleccione Modelo' : 'Seleccione Tipo primero'}</option>
                            {productModels.map(model => (
                                <option key={model.id_modelo} value={model.id_modelo}>
                                    {model.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Observaciones */}
                    <div style={{ flex: '1 1 100%' }}>
                        <label htmlFor="observaciones" style={labelStyle}>Observaciones</label>
                        <textarea id="observaciones" name="observaciones" value={formData.observaciones} onChange={handleChange} style={{ ...inputStyle, minHeight: '80px' }}></textarea>
                    </div>
                    
                </div>

                <div style={{ marginTop: '30px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', opacity: isLoading ? 0.6 : 1 }}>
                        {isLoading ? 'Registrando...' : 'Registrar Producto'}
                    </button>
                    <button type="button" onClick={() => navigate('/productos-reparar')} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
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

export default RegisterReceptionPage;