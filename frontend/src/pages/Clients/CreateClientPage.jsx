import React, { useState, useEffect, useRef } from 'react';
import { createClient, fetchClientCategories } from '../../services/client.service';
import { useNavigate } from 'react-router-dom';
import { isValidCUIT, isValidEmail } from '../../utils/validation';

const CreateClientPage = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const cuitRef = useRef(null);
    const emailRef = useRef(null);
    
    const [formData, setFormData] = useState({
        apellido: '', nombre: '', segundo_nombre: '', cuit: '',
        provincia: '', ciudad: '', calle: '', numero: '',
        email: '', categoria: '',
        telefonos: [{ numero: '', descripcion: '' }]
    });
    
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setMessage('');
    };

    const handlePhoneChange = (index, e) => {
        const { name, value } = e.target;
        const newPhones = [...formData.telefonos];
        newPhones[index][name] = value;
        setFormData(prev => ({ ...prev, telefonos: newPhones }));
    };

    const addPhoneField = () => {
        setFormData(prev => ({
            ...prev,
            telefonos: [...prev.telefonos, { numero: '', descripcion: '' }]
        }));
    };

    const removePhoneField = (index) => {
        if (formData.telefonos.length > 1) {
            const newPhones = formData.telefonos.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, telefonos: newPhones }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsSaving(true);

        // Validaciones CUIT y Email con Scroll dinámico
        if (!isValidCUIT(formData.cuit)) {
            setMessage('❌ El CUIT ingresado no es válido.');
            setIsError(true);
            setIsSaving(false);
            cuitRef.current?.focus();
            return;
        }
        
        if (formData.email && !isValidEmail(formData.email)) {
            setMessage('❌ El formato del email es incorrecto.');
            setIsError(true);
            setIsSaving(false);
            emailRef.current?.focus();
            return;
        }

        try {
            const validPhones = formData.telefonos.filter(p => p.numero.trim() !== '');
            await createClient({ ...formData, telefonos: validPhones });
            setMessage('✅ Cliente registrado exitosamente.');
            setTimeout(() => navigate('/clientes'), 1500);
        } catch (err) {
            setMessage(`❌ Error: ${err.message}`);
            setIsError(true);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-10 text-center animate-pulse text-gray-500">Preparando formulario...</div>;

    return (
        <div className="max-w-4xl mx-auto pb-10 animate-fade-in">
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                
                {/* Header del Formulario */}
                <div className="bg-slate-800 p-6">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>👤</span> Registrar Nuevo Cliente
                    </h1>
                    <p className="text-slate-400 text-sm">Complete la información para dar de alta al cliente en el sistema.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    
                    {/* SECCIÓN 1: IDENTIFICACIÓN */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                            <span className="text-emerald-500 font-bold">01.</span>
                            <h2 className="font-semibold text-gray-700 uppercase tracking-wider text-sm">Identificación Personal</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Field label="Apellido *" name="apellido" value={formData.apellido} onChange={handleChange} required />
                            <Field label="Nombre *" name="nombre" value={formData.nombre} onChange={handleChange} required />
                            <Field label="Segundo Nombre" name="segundo_nombre" value={formData.segundo_nombre} onChange={handleChange} />
                            <Field label="CUIT / CUIL *" name="cuit" value={formData.cuit} onChange={handleChange} required inputRef={cuitRef} placeholder="20-XXXXXXXX-9" />
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría de IVA *</label>
                                <select 
                                    name="categoria" 
                                    value={formData.categoria} 
                                    onChange={handleChange}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                >
                                    {categories.map(cat => (
                                        <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre_categoria}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* SECCIÓN 2: UBICACIÓN */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                            <span className="text-emerald-500 font-bold">02.</span>
                            <h2 className="font-semibold text-gray-700 uppercase tracking-wider text-sm">Ubicación y Contacto</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Provincia *" name="provincia" value={formData.provincia} onChange={handleChange} required />
                            <Field label="Ciudad *" name="ciudad" value={formData.ciudad} onChange={handleChange} required />
                            <Field label="Calle" name="calle" value={formData.calle} onChange={handleChange} />
                            <Field label="Altura / Piso / Dpto" name="numero" value={formData.numero} onChange={handleChange} />
                            <div className="md:col-span-2">
                                <Field label="Correo Electrónico" name="email" type="email" value={formData.email} onChange={handleChange} inputRef={emailRef} placeholder="ejemplo@correo.com" />
                            </div>
                        </div>
                    </section>

                    {/* SECCIÓN 3: TELÉFONOS DINÁMICOS */}
                    <section className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <div className="flex justify-between items-center">
                            <h2 className="font-semibold text-gray-700 uppercase tracking-wider text-sm flex items-center gap-2">
                                📞 Teléfonos de Contacto
                            </h2>
                            <button type="button" onClick={addPhoneField} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase">
                                + Agregar Teléfono
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {formData.telefonos.map((phone, index) => (
                                <div key={index} className="flex gap-2 items-end group">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <Field label="Número" name="numero" value={phone.numero} onChange={(e) => handlePhoneChange(index, e)} placeholder="342 4XXXXXX" />
                                        <Field label="Referencia (Ej: Ventas)" name="descripcion" value={phone.descripcion} onChange={(e) => handlePhoneChange(index, e)} disabled={!phone.numero} />
                                    </div>
                                    {formData.telefonos.length > 1 && (
                                        <button 
                                            type="button" 
                                            onClick={() => removePhoneField(index)}
                                            className="p-2.5 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* BOTONERA Y MENSAJES */}
                    <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className={`w-full md:w-auto px-10 py-3 rounded-xl font-bold text-white shadow-lg transition-all
                                ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-200'}`}
                        >
                            {isSaving ? 'Procesando...' : 'Guardar Cliente'}
                        </button>
                        <button type="button" onClick={() => navigate('/clientes')} className="text-gray-500 hover:text-gray-700 font-medium text-sm">
                            Cancelar y volver
                        </button>

                        {message && (
                            <div className={`flex-1 p-3 rounded-lg text-sm font-medium animate-bounce-short ${isError ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-emerald-700 border border-green-100'}`}>
                                {message}
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

/* Componente Auxiliar para Inputs */
const Field = ({ label, name, value, onChange, required = false, type = "text", inputRef, placeholder, disabled = false }) => (
    <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">{label}</label>
        <input 
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            ref={inputRef}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all text-sm
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
    </div>
);

export default CreateClientPage;