// src/pages/Clients/CreateClientPage.jsx (Modificación Completa)

import React, { useState, useEffect, useRef } from 'react';
import { createClient, fetchClientCategories } from '../../services/client.service';
import { useNavigate } from 'react-router-dom';
import { isValidCUIT, isValidEmail } from '../../utils/validation';

const CreateClientPage = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const cuitRef = useRef(null);
    const emailRef = useRef(null);
    
    // Estado inicial con todos los nuevos campos
    const [formData, setFormData] = useState({
        // Sección Nombre
        apellido: '', nombre: '', segundo_nombre: '', cuit: '',
        // Sección Dirección
        provincia: '', ciudad: '', calle: '', numero: '',
        // Otros
        email: '', categoria: '',
        telefonos: [{ numero: '', descripcion: '' }] // Inicializa con un campo de teléfono
    });
    
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);


    // --- Carga de Categorías al Iniciar ---
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data = await fetchClientCategories();
                setCategories(data);
                if (data.length > 0) {
                    setFormData(prev => ({ ...prev, categoria: data[0].id_categoria.toString() }));
                }
            } catch (err) {
                setMessage(`Error al cargar categorías: ${err.message}`);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadCategories();
    }, []);

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

    // Maneja el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsSaving(true);

        // 1. Validaciones mínimas de Frontend
        if (!formData.apellido || !formData.nombre || !formData.cuit || !formData.provincia || !formData.ciudad || !formData.categoria) {
            setMessage('Debe completar todos los campos obligatorios (*).');
            setIsError(true);
            setIsSaving(false);
            return;
        }

        // 2. Filtrar teléfonos válidos (Número de teléfono debe existir)
        const validPhones = formData.telefonos
            .filter(p => p.numero && p.numero.trim() !== '')
            .map(p => ({
                numero: p.numero.trim(),
                descripcion: p.descripcion.trim() // La descripción puede ser vacía
            }));
        
        // 3. Validar cuit
        if (!isValidCUIT(formData.cuit)) {
            setMessage('❌ El CUIT ingresado no es válido.');
            setIsError(true);
            setIsSaving(false);
            cuitRef.current.focus();
            cuitRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        
        // 4. Validar email
        if (!isValidEmail(formData.email)) {
            setMessage('❌ El formato del email es incorrecto.');
            setIsError(true);
            setIsSaving(false);
            emailRef.current.focus();
            emailRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        try {
            // Envía todos los datos, el backend se encarga de la normalización
            const dataToSend = { ...formData, telefonos: validPhones };
            await createClient(dataToSend);

            setMessage('✅ Cliente y teléfonos agregados exitosamente.');
            
            setTimeout(() => {
                 navigate('/clientes'); 
            }, 2000);

        } catch (err) {
            setMessage(`❌ Error al crear cliente: ${err.message}`);
            setIsError(true);
        } finally {
            setIsSaving(false);
        }
    };

    const inputStyle = { width: '100%', padding: '10px', margin: '5px 0 15px 0', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold' };
    const sectionStyle = { border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginBottom: '30px' };

    if (isLoading) {
        return <div style={{padding: '20px', textAlign: 'center'}}>Cargando formulario...</div>;
    }

    return (
        <div style={{ padding: '20px', backgroundColor: '#f4f7f6', borderRadius: '8px', maxWidth: '1000px', margin: '0 auto', border: '1px solid #ccc' }}>
            <h1>➕ Registrar Nuevo Cliente</h1>
            
            <form onSubmit={handleSubmit}>

                {/* --- SECCIÓN 1: NOMBRE E IDENTIFICACIÓN --- */}
                <div style={sectionStyle}>
                    <h2>Identificación</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                        
                        {/* Apellido */}
                        <div style={{ flex: '1 1 30%' }}>
                            <label htmlFor="apellido" style={labelStyle}>Apellido *</label>
                            <input type="text" id="apellido" name="apellido" value={formData.apellido} onChange={handleChange} required style={inputStyle} />
                        </div>

                        {/* Nombre */}
                        <div style={{ flex: '1 1 30%' }}>
                            <label htmlFor="nombre" style={labelStyle}>Nombre *</label>
                            <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required style={inputStyle} />
                        </div>

                        {/* Segundo Nombre */}
                        <div style={{ flex: '1 1 30%' }}>
                            <label htmlFor="segundo_nombre" style={labelStyle}>Segundo Nombre (Opcional)</label>
                            <input type="text" id="segundo_nombre" name="segundo_nombre" value={formData.segundo_nombre} onChange={handleChange} style={inputStyle} />
                        </div>
                        
                        {/* CUIT */}
                        <div style={{ flex: '1 1 45%' }}>
                            <label htmlFor="cuit" style={labelStyle}>CUIT *</label>
                            <input type="text" id="cuit" name="cuit" ref={cuitRef} value={formData.cuit} onChange={handleChange} required style={inputStyle} />
                        </div>
                    </div>
                </div>

                {/* --- SECCIÓN 2: DIRECCIÓN --- */}
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

                {/* --- SECCIÓN 3: OTROS DATOS Y CATEGORÍA --- */}
                <div style={sectionStyle}>
                    <h2>Otros Datos</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                        
                        {/* Email */}
                        <div style={{ flex: '1 1 45%' }}>
                            <label htmlFor="email" style={labelStyle}>Email (Opcional)</label>
                            <input type="email" id="email" name="email" ref={emailRef} value={formData.email} onChange={handleChange} style={inputStyle} />
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

                {/* --- SECCIÓN 4: TELÉFONOS --- */}
                <div style={sectionStyle}>
                    <h2>Teléfonos</h2>
                    {formData.telefonos.map((phone, index) => (
                        <div key={index} style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                            {/* Número de Teléfono */}
                            <div style={{ flex: '1 1 45%' }}>
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
                            <div style={{ flex: '1 1 45%' }}>
                                <label htmlFor={`descripcion-${index}`} style={labelStyle}>Descripción</label>
                                <input 
                                    type="text" 
                                    id={`descripcion-${index}`} 
                                    name="descripcion" 
                                    value={phone.descripcion} 
                                    onChange={(e) => handlePhoneChange(index, e)} 
                                    // RESTRICCIÓN: No editable si no hay número
                                    disabled={!phone.numero} 
                                    style={{ ...inputStyle, backgroundColor: !phone.numero ? '#eee' : 'white' }}
                                />
                            </div>
                        </div>
                    ))}
                    
                    <button type="button" onClick={addPhoneField} style={{ padding: '8px 15px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        ➕ Agregar Otro Teléfono
                    </button>
                </div>
                

                {/* --- BOTONES FINALES --- */}
                <div style={{ marginTop: '30px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <button type="submit" disabled={isSaving} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', opacity: isSaving ? 0.6 : 1 }}>
                        {isSaving ? 'Guardando...' : 'Guardar Cliente'}
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