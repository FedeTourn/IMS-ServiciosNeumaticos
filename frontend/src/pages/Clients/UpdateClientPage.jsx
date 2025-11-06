import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchClientById, updateClient, fetchClientCategories, disableClient, reactivateClient } from '../../services/client.service';

const UpdateClientPage = () => {
    const navigate = useNavigate();
    const { id_cliente } = useParams(); // Obtiene el ID de la URL
    
    const [categories, setCategories] = useState([]);
    const [clientName, setClientName] = useState(''); // Para mostrar en el título
    const [clientCUIT, setClientCUIT] = useState('');
    
    // Inicializa el estado para la dirección, email, categoría y teléfonos
    const [formData, setFormData] = useState({
        // Dirección (dividida para la edición, se concatena al guardar)
        provincia: '', ciudad: '', calle: '', numero: '',
        email: '', 
        categoria: '',
        telefonos: [{ numero: '', descripcion: '' }] ,
        is_active: true
    });
    
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    

    // --- Carga Inicial de Datos (Cliente y Categorías) ---
    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Cargar Categorías
                const categoriesData = await fetchClientCategories();
                setCategories(categoriesData);

                // 2. Cargar Datos del Cliente
                const clientData = await fetchClientById(id_cliente);
                setClientName(clientData.nombre);
                setClientCUIT(clientData.cuit);
                
                // Desglosar la dirección para rellenar los campos
                const [provincia, ciudad, ...rest] = clientData.direccion.split(',').map(s => s.trim());
                let calle = '', numero = '';
                
                if (rest.length > 0) {
                    // Asumimos que el último es el número si hay más de 1 parte en 'rest'
                    // Esto es heurístico y depende de la convención de la DB.
                    if (rest.length > 1) {
                         numero = rest.pop();
                         calle = rest.join(', ');
                    } else {
                         calle = rest[0];
                    }
                }
                
                // Si el cliente no tiene teléfonos, añadimos un campo vacío para empezar
                const initialPhones = clientData.telefonos.length > 0 ? clientData.telefonos : [{ numero: '', descripcion: '' }];

                setFormData({
                    provincia: provincia || '',
                    ciudad: ciudad || '',
                    calle: calle || '',
                    numero: numero || '',
                    email: clientData.email || '',
                    categoria: clientData.id_categoria.toString(),
                    telefonos: initialPhones,
                    is_active: clientData.is_active,
                });

            } catch (err) {
                setMessage(`❌ Error al cargar los datos: ${err.message}`);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [id_cliente]);

    // Maneja cambios en campos normales
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setMessage('');
    };

    // Maneja cambios en la sección de Teléfonos
    const handlePhoneChange = (index, e) => {
        const { name, value } = e.target;
        const newPhones = [...formData.telefonos];
        newPhones[index][name] = value;
        setFormData(prev => ({ ...prev, telefonos: newPhones }));
    };

    // Botón para agregar más campos de teléfono
    const addPhoneField = () => {
        setFormData(prev => ({
            ...prev,
            telefonos: [...prev.telefonos, { numero: '', descripcion: '' }]
        }));
    };

    // Botón para eliminar un campo de teléfono del frontend
    const removePhoneField = (index) => {
        const newPhones = formData.telefonos.filter((_, i) => i !== index);
        // Asegurarse de que siempre haya al menos un campo vacío si no hay otros
        if (newPhones.length === 0) {
            newPhones.push({ numero: '', descripcion: '' });
        }
        setFormData(prev => ({ ...prev, telefonos: newPhones }));
    };


    // Maneja el envío del formulario de actualización
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsSaving(true);

        // Validaciones
        if (!formData.provincia || !formData.ciudad || !formData.categoria) {
            setMessage('Debe completar Provincia, Ciudad y Categoría.');
            setIsError(true);
            setIsSaving(false);
            return;
        }

        // Filtrar teléfonos válidos (solo los que tienen número)
        const validPhones = formData.telefonos
            .filter(p => p.numero && p.numero.trim() !== '')
            .map(p => ({
                numero: p.numero.trim(),
                descripcion: p.descripcion.trim()
            }));

        try {
            const dataToSend = {
                provincia: formData.provincia,
                ciudad: formData.ciudad,
                calle: formData.calle,
                numero: formData.numero,
                email: formData.email,
                categoria: parseInt(formData.categoria),
                telefonos: validPhones
            };
            
            await updateClient(id_cliente, dataToSend);

            setMessage('✅ Cliente actualizado exitosamente.');
            setTimeout(() => {
                 navigate('/clientes'); 
            }, 2000);
            
        } catch (err) {
            setMessage(`❌ Error al actualizar cliente: ${err.message}`);
            setIsError(true);
        } finally {
            setIsSaving(false);
        }
    };

    const inputStyle = { width: '100%', padding: '10px', margin: '5px 0 15px 0', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold' };
    const sectionStyle = { border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginBottom: '30px', backgroundColor: 'white' };
    const readOnlyStyle = { backgroundColor: '#eee', cursor: 'not-allowed' };


    if (isLoading) {
        return <div style={{padding: '20px', textAlign: 'center'}}>Cargando datos del cliente...</div>;
    }
    // --- FUNCIÓN PARA DESHABILITAR/REHABILITAR CLIENTE ---
    const handleToggleActive = async () => {
        const newState = !formData.is_active;
        const action = newState ? 'habilitar' : 'deshabilitar';

        if (!window.confirm(`¿Está seguro de ${action} al cliente ${clientName}?`)) {
            return;
        }

        setIsSaving(true);
        setMessage('');
        setIsError(false);

        try {
            if (newState) {
                // HABILITAR (Reactivate)
                await reactivateClient(id_cliente);
                setMessage('✅ Cliente habilitado exitosamente.');
            } else {
                // DESHABILITAR (Soft Delete)
                await disableClient(id_cliente);
                setMessage('✅ Cliente deshabilitado exitosamente.');
            }
            
            // Actualiza el estado local de la interfaz
            setFormData(prev => ({ ...prev, is_active: newState })); 

        } catch (err) {
            setMessage(`❌ Error al ${action} cliente: ${err.message}`);
            setIsError(true);
        } finally {
            setIsSaving(false);
        }
    };

/*     // --- FUNCIÓN PARA DESHABILITAR/REHABILITAR CLIENTE ---
    const handleToggleActive = async () => {
        const newState = !formData.is_active;
        const action = newState ? 'rehabilitar' : 'deshabilitar';

        if (!window.confirm(`¿Está seguro de ${action} al cliente ${clientName}?`)) {
            return;
        }

        setIsSaving(true);
        setMessage('');
        setIsError(false);

        try {
            // Asumiendo que el endpoint DELETE /api/clients/:id_cliente es para deshabilitar
            // y que la rehabilitación debe hacerse con un endpoint PUT /api/clients/:id_cliente/activate
            
            // Dado que solo implementamos "disableClient" (DELETE), nos enfocaremos en eso.
            // Si el cliente está activo, lo deshabilitamos (usando el endpoint existente).
            if (formData.is_active) {
                await disableClient(id_cliente);
                setMessage('✅ Cliente deshabilitado exitosamente.');
                setFormData(prev => ({ ...prev, is_active: false })); 
            } else {
                // Dado que no implementamos la lógica de 'rehabilitación' en el backend (PUT),
                // daremos un mensaje temporal o forzaremos la acción si el PUT general lo permite.
                // Por ahora, solo habilitaremos la deshabilitación para seguir el flujo.
                // Para rehabilitación, se necesitaría un nuevo endpoint o lógica en el PUT general.
                setMessage(`⚠️ Función de rehabilitación no implementada en el backend. Use el endpoint PUT general si aplica.`);
                
                // Para evitar confusiones, solo permitiremos la deshabilitación.
                return;
            }
        } catch (err) {
             setMessage(`❌ Error al ${action} cliente: ${err.message}`);
             setIsError(true);
        } finally {
            setIsSaving(false);
        }
    }; */
    
    return (
        <div style={{ padding: '20px', backgroundColor: '#f4f7f6', borderRadius: '8px', maxWidth: '1000px', margin: '0 auto' }}>
            <h1>✍️ Modificar Cliente: {clientName}</h1>
            
            {/* --- RECTÁNGULO DE ESTADO (NUEVO) --- */}
            <div style={{ 
                padding: '10px 20px',
                marginBottom: '20px',
                borderRadius: '5px',
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: formData.is_active ? '#d4edda' : '#f8d7da',
                color: formData.is_active ? '#155724' : '#721c24',
                border: `1px solid ${formData.is_active ? '#c3e6cb' : '#f5c6cb'}`
            }}>
                ESTADO ACTUAL: {formData.is_active ? 'ACTIVO' : 'INACTIVO'}
            </div>
            <form onSubmit={handleSubmit}>

                {/* --- SECCIÓN 1: IDENTIFICACIÓN (Solo Lectura) --- */}
                <div style={sectionStyle}>
                    <h2>Identificación (No Modificable)</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                        
                        {/* Nombre Completo */}
                        <div style={{ flex: '1 1 45%' }}>
                            <label style={labelStyle}>Nombre Completo</label>
                            <input type="text" value={clientName} disabled style={{ ...inputStyle, ...readOnlyStyle }} />
                        </div>
                        
                        {/* CUIT */}
                        <div style={{ flex: '1 1 45%' }}>
                            <label style={labelStyle}>CUIT</label>
                            <input type="text" value={clientCUIT} disabled style={{ ...inputStyle, ...readOnlyStyle }} />
                        </div>
                    </div>
                </div>

                {/* --- SECCIÓN 2: DIRECCIÓN (Modificable) --- */}
                <div style={sectionStyle}>
                    <h2>Dirección</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                        
                        {/* Provincia */}
                        <div style={{ flex: '1 1 45%' }}>
                            <label htmlFor="provincia" style={labelStyle}>Provincia *</label>
                            <input type="text" id="provincia" name="provincia" value={formData.provincia} onChange={handleChange} required style={inputStyle} />
                        </div>

                        {/* Ciudad */}
                        <div style={{ flex: '1 1 45%' }}>
                            <label htmlFor="ciudad" style={labelStyle}>Ciudad *</label>
                            <input type="text" id="ciudad" name="ciudad" value={formData.ciudad} onChange={handleChange} required style={inputStyle} />
                        </div>

                        {/* Calle */}
                        <div style={{ flex: '1 1 45%' }}>
                            <label htmlFor="calle" style={labelStyle}>Calle (Opcional)</label>
                            <input type="text" id="calle" name="calle" value={formData.calle} onChange={handleChange} style={inputStyle} />
                        </div>

                        {/* Número */}
                        <div style={{ flex: '1 1 45%' }}>
                            <label htmlFor="numero" style={labelStyle}>Número (Opcional)</label>
                            <input type="text" id="numero" name="numero" value={formData.numero} onChange={handleChange} style={inputStyle} />
                        </div>
                    </div>
                </div>

                {/* --- SECCIÓN 3: EMAIL Y CATEGORÍA (Modificable) --- */}
                <div style={sectionStyle}>
                    <h2>Contacto y Categoría</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                        
                        {/* Email */}
                        <div style={{ flex: '1 1 45%' }}>
                            <label htmlFor="email" style={labelStyle}>Email (Opcional)</label>
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} />
                        </div>

                        {/* Categoría */}
                        <div style={{ flex: '1 1 45%' }}>
                            <label htmlFor="categoria" style={labelStyle}>Categoría *</label>
                            <select id="categoria" name="categoria" value={formData.categoria} onChange={handleChange} required style={inputStyle}>
                                {categories.map(cat => (
                                    <option key={cat.id_categoria} value={cat.id_categoria}>
                                        {cat.nombre_categoria}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* --- SECCIÓN 4: TELÉFONOS (Modificable) --- */}
                <div style={sectionStyle}>
                    <h2>Teléfonos</h2>
                    {formData.telefonos.map((phone, index) => (
                        <div key={index} style={{ display: 'flex', gap: '20px', marginBottom: '15px', alignItems: 'flex-end' }}>
                            
                            {/* Número de Teléfono */}
                            <div style={{ flex: '1 1 35%' }}>
                                <label htmlFor={`numero-${index}`} style={labelStyle}>Número de Teléfono</label>
                                <input 
                                    type="text" 
                                    id={`numero-${index}`} 
                                    name="numero" 
                                    value={phone.numero} 
                                    onChange={(e) => handlePhoneChange(index, e)} 
                                    style={inputStyle} 
                                />
                            </div>

                            {/* Descripción */}
                            <div style={{ flex: '1 1 35%' }}>
                                <label htmlFor={`descripcion-${index}`} style={labelStyle}>Descripción</label>
                                <input 
                                    type="text" 
                                    id={`descripcion-${index}`} 
                                    name="descripcion" 
                                    value={phone.descripcion} 
                                    onChange={(e) => handlePhoneChange(index, e)} 
                                    disabled={!phone.numero} 
                                    style={{ ...inputStyle, backgroundColor: !phone.numero ? '#eee' : 'white' }}
                                />
                            </div>
                            
                            {/* Botón de Eliminar (Muestra si hay más de un campo o si el campo tiene datos) */}
                            <div style={{ flex: '0 0 10%' }}>
                                <button 
                                    type="button" 
                                    onClick={() => removePhoneField(index)} 
                                    style={{ padding: '10px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '15px' }}
                                    title="Eliminar este teléfono"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    <button type="button" onClick={addPhoneField} style={{ padding: '8px 15px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        ➕ Agregar Otro Teléfono
                    </button>
                </div>
                

                {/* --- BOTONES FINALES --- */}
                <div style={{ marginTop: '30px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {/* Botón Guardar Cambios */}
                    <button type="submit" disabled={isSaving} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', opacity: isSaving ? 0.6 : 1 }}>
                        {isSaving ? 'Actualizando...' : 'Actualizar Cliente'}
                    </button>

                    {/* Botón Deshabilitar/Rehabilitar */}
                    <button 
                        type="button" 
                        onClick={handleToggleActive} 
                        disabled={isSaving} 
                        style={{ 
                            padding: '10px 20px', 
                            backgroundColor: formData.is_active ? '#dc3545' : '#28a745', // Rojo si está activo, Verde si está inactivo
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '5px', 
                            cursor: 'pointer', 
                            opacity: isSaving ? 0.6 : 1 
                        }}
                    >
                        {isSaving ? 'Procesando...' : (formData.is_active ? '❌ Deshabilitar Cliente' : '✅ Habilitar Cliente')}
                    </button>

                    {/* Botón Cancelar */}
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

export default UpdateClientPage;