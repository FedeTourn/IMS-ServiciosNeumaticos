import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProductById, updateProduct, fetchProductStates } from '../../services/product.service';
import StatusBadge from '../../components/common/StatusBadge';

// Reglas de Transición
const TRANSITION_RULES = {
    1: [2, 3, 4, 5, 6], // Recibido -> [En Reparación, Reparado, Entregado, No Reparable, Libre]
    2: [3, 4, 5, 6],    // En Reparación -> [...]
    3: [4, 6],          // Reparado -> [Entregado, Libre]
    4: [],              // Entregado -> []
    5: [4, 6],          // No Reparable -> [Entregado, Libre]
    6: [2, 3, 4, 5]     // Libre -> [...]
};

const UpdateProductPage = () => {
    const { id_producto } = useParams();
    const navigate = useNavigate();
    
    const [productStates, setProductStates] = useState([]);
    const [originalData, setOriginalData] = useState({});
    const [formData, setFormData] = useState({ observaciones: '', estado: '' });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [productData, statesData] = await Promise.all([
                    fetchProductById(id_producto),
                    fetchProductStates(),
                ]);
                setOriginalData(productData);
                setFormData({
                    observaciones: productData.observaciones || '',
                    estado: productData.estado.toString(),
                });
                setProductStates(statesData);
            } catch (err) {
                setMessage(`Error: ${err.message}`);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [id_producto]);

    const getFilteredStates = () => {
        const current = parseInt(originalData.estado);
        const allowed = TRANSITION_RULES[current] || [];
        return productStates.filter(s => allowed.includes(s.id_estado) || s.id_estado === current);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateProduct(id_producto, { 
                observaciones: formData.observaciones, 
                estado: formData.estado 
            });
            setMessage('✅ Cambios aplicados correctamente.');
            setIsError(false);
        } catch (err) {
            setMessage(`❌ Error al actualizar: ${err.message}`);
            setIsError(true);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-10 text-center text-gray-400 animate-pulse">Cargando detalles...</div>;

    const currentStatus = productStates.find(s => s.id_estado.toString() === originalData.estado.toString());
    //const selectedStatus = productStates.find(s => s.id_estado.toString() === formData.estado);
    return (
        <div className="max-w-4xl mx-auto pb-10 animate-fade-in">
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                
                {/* Header */}
                <div className="bg-slate-800 p-6">
                    <h1 className="text-xl font-bold text-white uppercase tracking-tight">Seguimiento de Producto #{id_producto}</h1>
                    <p className="text-slate-400 text-sm mt-1 font-mono">{originalData.tipo_nombre} - {originalData.modelo_nombre}</p>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Trazabilidad */}
                    <div className="space-y-6">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Datos de Trazabilidad</h2>
                        <DetailRow label="Cliente" value={originalData.cliente_nombre} />
                        <DetailRow label="Recepción" value={new Date(originalData.fecha_recepcion).toLocaleDateString()} />
                        <DetailRow label="Última Reparación" value={originalData.fecha_reparacion ? new Date(originalData.fecha_reparacion).toLocaleString() : 'N/A'} />
                        <DetailRow label="ID Orden" value={originalData.id_orden_reparacion || 'Pendiente'} />
                    </div>

                    {/* Modificación */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Control de Estado</h2>
                        
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Estado Actual</label>
                            <StatusBadge status={currentStatus?.nombre} />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cambiar Estado</label>
                            <select 
                                name="estado" value={formData.estado} onChange={handleChange} required
                                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-sm"
                            >
                                {getFilteredStates().map(s => (
                                    <option key={s.id_estado} value={s.id_estado}>
                                    {s.nombre} {parseInt(formData.estado) === s.id_estado ? '(Seleccionado)' : ''}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Observaciones</label>
                            <textarea 
                                name="observaciones" value={formData.observaciones} onChange={handleChange}
                                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-h-[100px] text-sm"
                            />
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button 
                                type="submit" disabled={isSaving}
                                className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg transition-all ${isSaving ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'}`}
                            >
                                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                            <button 
                                type="button" onClick={() => navigate('/productos-reparar')}
                                className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-gray-600 uppercase text-xs tracking-widest"
                            >
                                Volver
                            </button>
                        </div>
                    </form>
                </div>
                
                {message && (
                    <div className={`mx-8 mb-8 p-4 rounded-xl text-center text-xs font-bold ${isError ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

const DetailRow = ({ label, value }) => (
    <div className="flex flex-col">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
);

export default UpdateProductPage;