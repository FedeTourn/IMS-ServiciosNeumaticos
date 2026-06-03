import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClients } from '../../services/client.service';
import { fetchProductTypes, fetchProductModels, registerProductReception } from '../../services/product.service';

const RegisterReceptionPage = () => {
    const navigate = useNavigate();
    
    const [clients, setClients] = useState([]);
    const [productTypes, setProductTypes] = useState([]);
    const [productModels, setProductModels] = useState([]);
    
    const [formData, setFormData] = useState({
        id_cliente: '',
        tipo_seleccionado: '', 
        modelo: '',
        observaciones: '',
        fecha_recepcion: new Date().toISOString().substring(0, 10),
    });

    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [clientData, typeData] = await Promise.all([
                    fetchClients(),
                    fetchProductTypes(),
                ]);
                setClients(clientData);
                setProductTypes(typeData);
            } catch (err) {
                setMessage(`Error al cargar datos: ${err.message}`);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        const loadModels = async () => {
            if (formData.tipo_seleccionado) {
                try {
                    const models = await fetchProductModels(formData.tipo_seleccionado);
                    setProductModels(models);
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsSaving(true);

        if (!formData.id_cliente || !formData.modelo) {
            setMessage('El Cliente y el Modelo son campos obligatorios.');
            setIsError(true);
            setIsSaving(false);
            return;
        }

        try {
            await registerProductReception({
                id_cliente: formData.id_cliente,
                modelo: formData.modelo,
                observaciones: formData.observaciones,
                fecha_recepcion: formData.fecha_recepcion,
            });

            setMessage(`✅ Recepción registrada exitosamente.`);
            setTimeout(() => navigate('/productos-reparar'), 1500);
        } catch (err) {
            setMessage(`❌ Error: ${err.message}`);
            setIsError(true);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-10 text-center animate-pulse text-gray-400">Cargando protocolo de recepción...</div>;

    return (
        <div className="max-w-3xl mx-auto pb-10 animate-fade-in">
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                
                {/* Header Dinámico */}
                <div className="bg-slate-800 p-6 text-white text-center sm:text-left">
                    <h1 className="text-xl font-bold uppercase tracking-tight">📦 Registro de Recepción</h1>
                    <p className="text-slate-400 text-xs mt-1 uppercase font-mono">Módulo de Seguimiento de Productos</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Selector de Cliente */}
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cliente Solicitante *</label>
                            <select 
                                name="id_cliente" 
                                value={formData.id_cliente} 
                                onChange={handleChange} 
                                required
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-gray-700"
                            >
                                <option value="">Seleccione el cliente responsable...</option>
                                {clients.map(client => (
                                    <option key={client.id_cliente} value={client.id_cliente}>
                                        {client.nombre} ({client.cuit})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Fecha */}
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Fecha de Ingreso al Taller</label>
                            <input 
                                type="date" 
                                name="fecha_recepcion" 
                                value={formData.fecha_recepcion} 
                                onChange={handleChange} 
                                required 
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono"
                            />
                        </div>

                        {/* Selector de Tipo (Filtro) */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tipo de Componente</label>
                            <select 
                                name="tipo_seleccionado" 
                                value={formData.tipo_seleccionado} 
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            >
                                <option value="">Filtrar por tipo...</option>
                                {productTypes.map(type => (
                                    <option key={type.id_tipo} value={type.id_tipo}>{type.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Selector de Modelo */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Modelo Específico *</label>
                            <select 
                                name="modelo" 
                                value={formData.modelo} 
                                onChange={handleChange} 
                                required 
                                disabled={!formData.tipo_seleccionado}
                                className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium
                                    ${!formData.tipo_seleccionado ? 'bg-gray-100 cursor-not-allowed border-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                            >
                                <option value="">{formData.tipo_seleccionado ? 'Seleccione el modelo...' : '← Seleccione tipo primero'}</option>
                                {productModels.map(model => (
                                    <option key={model.id_modelo} value={model.id_modelo}>{model.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Observaciones */}
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estado Visual / Observaciones Iniciales</label>
                            <textarea 
                                name="observaciones" 
                                value={formData.observaciones} 
                                onChange={handleChange} 
                                placeholder="Describa daños visibles, piezas faltantes o requerimientos del cliente..."
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-h-[120px] text-sm"
                            ></textarea>
                        </div>
                    </div>

                    {/* Botonera */}
                    <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-center">
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className={`w-full sm:w-auto px-10 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg transition-all
                                ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-200'}`}
                        >
                            {isSaving ? 'Registrando...' : 'Finalizar Recepción'}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => navigate('/productos-reparar')}
                            className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
                        >
                            Cancelar
                        </button>

                        {message && (
                            <div className={`flex-1 p-3 rounded-xl text-xs font-bold text-center animate-fade-in 
                                ${isError ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                {message}
                            </div>
                        )}
                    </div>
                </form>
            </div>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-[10px] text-blue-600 leading-relaxed uppercase font-bold text-center">
                    Aviso: En la próxima actualización podrá adjuntar fotografías del componente y generar el comprobante de recepción en PDF.
                </p>
            </div>
        </div>
    );
};

export default RegisterReceptionPage;