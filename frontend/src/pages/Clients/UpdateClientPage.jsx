import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    fetchClientById, 
    updateClient, 
    fetchClientCategories, 
    disableClient, 
    reactivateClient 
} from '../../services/client.service';
import { isValidEmail } from '../../utils/validation';

/**
 * Página de Modificación de Clientes.
 * Permite la edición de datos de contacto, ubicación y gestión de estado (Activo/Inactivo).
 */
const UpdateClientPage = () => {
    const navigate = useNavigate();
    const { id_cliente } = useParams();
    
    const [categories, setCategories] = useState([]);
    const [clientName, setClientName] = useState('');
    const [clientCUIT, setClientCUIT] = useState('');
    
    const [formData, setFormData] = useState({
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

    useEffect(() => {
        const loadData = async () => {
            try {
                const categoriesData = await fetchClientCategories();
                setCategories(categoriesData);

                const clientData = await fetchClientById(id_cliente);
                setClientName(clientData.nombre);
                setClientCUIT(clientData.cuit);
                
                // Desglose de dirección (Heurística de visualización)
                const parts = clientData.direccion.split(',').map(s => s.trim());
                const provincia = parts[0] || '';
                const ciudad = parts[1] || '';
                let calle = '', numero = '';
                
                if (parts.length > 2) {
                    if (parts.length > 3) {
                        numero = parts.pop();
                        calle = parts.slice(2).join(', ');
                    } else {
                        calle = parts[2];
                    }
                }
                
                const initialPhones = clientData.telefonos.length > 0 
                    ? clientData.telefonos 
                    : [{ numero: '', descripcion: '' }];

                setFormData({
                    provincia,
                    ciudad,
                    calle,
                    numero,
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
        const newPhones = formData.telefonos.filter((_, i) => i !== index);
        if (newPhones.length === 0) newPhones.push({ numero: '', descripcion: '' });
        setFormData(prev => ({ ...prev, telefonos: newPhones }));
    };

    const handleToggleActive = async () => {
        const newState = !formData.is_active;
        const actionLabel = newState ? 'habilitar' : 'deshabilitar';

        if (!window.confirm(`¿Está seguro de ${actionLabel} al cliente ${clientName}?`)) return;

        setIsSaving(true);
        try {
            if (newState) await reactivateClient(id_cliente);
            else await disableClient(id_cliente);
            
            setFormData(prev => ({ ...prev, is_active: newState }));
            setMessage(`✅ Cliente ${actionLabel} exitosamente.`);
            setIsError(false);
        } catch (err) {
            setMessage(`❌ Error: ${err.message}`);
            setIsError(true);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsSaving(true);

        if (formData.email && !isValidEmail(formData.email)) {
            setMessage('❌ El formato del email es incorrecto.');
            setIsError(true);
            setIsSaving(false);
            return;
        }

        try {
            const validPhones = formData.telefonos.filter(p => p.numero.trim() !== '');
            const dataToSend = {
                ...formData,
                categoria: parseInt(formData.categoria),
                telefonos: validPhones
            };
            
            await updateClient(id_cliente, dataToSend);
            setMessage('✅ Cliente actualizado correctamente.');
            setTimeout(() => navigate('/clientes'), 1500);
        } catch (err) {
            setMessage(`❌ Error: ${err.message}`);
            setIsError(true);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-10 text-center text-gray-500 animate-pulse">Cargando perfil del cliente...</div>;

    return (
        <div className="max-w-4xl mx-auto pb-10 animate-fade-in">
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                
                {/* Header de Edición */}
                <div className="bg-slate-800 p-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-white">✍️ Editar Cliente</h1>
                        <p className="text-slate-400 text-sm">{clientName} | CUIT: {clientCUIT}</p>
                    </div>
                    {/* Badge de Estado Dinámico */}
                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${formData.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {formData.is_active ? 'CUENTA ACTIVA' : 'CUENTA INACTIVA'}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    
                    {/* SECCIÓN 1: IDENTIFICACIÓN (Solo Lectura) */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 opacity-80">
                        <Field label="Nombre Registrado" value={clientName} disabled />
                        <Field label="CUIT/CUIL" value={clientCUIT} disabled />
                    </section>

                    {/* SECCIÓN 2: LOCALIZACIÓN */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                            <span className="text-emerald-500 font-bold">01.</span>
                            <h2 className="font-semibold text-gray-700 uppercase tracking-wider text-sm">Actualizar Domicilio</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Provincia" name="provincia" value={formData.provincia} onChange={handleChange} required />
                            <Field label="Ciudad" name="ciudad" value={formData.ciudad} onChange={handleChange} required />
                            <Field label="Calle" name="calle" value={formData.calle} onChange={handleChange} />
                            <Field label="Número / Depto" name="numero" value={formData.numero} onChange={handleChange} />
                        </div>
                    </section>

                    {/* SECCIÓN 3: CONTACTO Y CATEGORÍA */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                            <span className="text-emerald-500 font-bold">02.</span>
                            <h2 className="font-semibold text-gray-700 uppercase tracking-wider text-sm">Información Fiscal y Email</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Categoría IVA</label>
                                <select 
                                    name="categoria" 
                                    value={formData.categoria} 
                                    onChange={handleChange}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                                >
                                    {categories.map(cat => (
                                        <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre_categoria}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* SECCIÓN 4: TELÉFONOS */}
                    <section className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <div className="flex justify-between items-center">
                            <h2 className="font-semibold text-gray-700 uppercase tracking-wider text-sm flex items-center gap-2">📞 Teléfonos</h2>
                            <button type="button" onClick={addPhoneField} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase">+ Agregar</button>
                        </div>
                        <div className="space-y-3">
                            {formData.telefonos.map((phone, index) => (
                                <div key={index} className="flex gap-2 items-end">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <Field label="Número" name="numero" value={phone.numero} onChange={(e) => handlePhoneChange(index, e)} />
                                        <Field label="Descripción" name="descripcion" value={phone.descripcion} onChange={(e) => handlePhoneChange(index, e)} disabled={!phone.numero} />
                                    </div>
                                    <button type="button" onClick={() => removePhoneField(index)} className="p-2.5 text-gray-400 hover:text-red-500">🗑️</button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ACCIONES FINALES */}
                    <div className="pt-6 border-t border-gray-100 flex flex-wrap gap-4 items-center">
                        <button type="submit" disabled={isSaving} className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${isSaving ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'}`}>
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>

                        <button type="button" onClick={handleToggleActive} disabled={isSaving} className={`px-6 py-3 rounded-xl font-bold border transition-all ${formData.is_active ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}>
                            {formData.is_active ? '🚫 Deshabilitar Cliente' : '✅ Rehabilitar Cliente'}
                        </button>

                        <button type="button" onClick={() => navigate('/clientes')} className="text-gray-500 hover:text-gray-700 font-medium text-sm ml-auto">Cancelar</button>

                        {message && (
                            <div className={`w-full p-3 rounded-lg text-sm font-medium ${isError ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-emerald-700 border border-green-100'}`}>
                                {message}
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

const Field = ({ label, name, value, onChange, required = false, type = "text", disabled = false }) => (
    <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">{label}</label>
        <input 
            type={type} name={name} value={value} onChange={onChange} required={required} disabled={disabled}
            className={`w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'focus:bg-white'}`}
        />
    </div>
);

export default UpdateClientPage;