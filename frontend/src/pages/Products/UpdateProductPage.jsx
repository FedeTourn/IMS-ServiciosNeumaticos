import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProductById, updateProduct, fetchProductStates } from '../../services/product.service';


// Mapeo de IDs de estado del Frontend (Debe coincidir con el Backend)
const FRONTEND_STATE_IDS = {
    RECIBIDO: 1,
    EN_REPARACION: 2,
    REPARADO: 3,
    ENTREGADO: 4,
    NO_REPARABLE: 5,
    LIBRE: 6
};

// Reglas de Transición (Copiadas del Backend para filtrado en UI)
const FRONTEND_TRANSITION_RULES = {
    [FRONTEND_STATE_IDS.RECIBIDO]: [2, 3, 4, 5, 6], 
    [FRONTEND_STATE_IDS.EN_REPARACION]: [3, 4, 5, 6], 
    [FRONTEND_STATE_IDS.REPARADO]: [4, 6],
    [FRONTEND_STATE_IDS.ENTREGADO]: [], 
    [FRONTEND_STATE_IDS.NO_REPARABLE]: [4, 6],
    [FRONTEND_STATE_IDS.LIBRE]: [2, 3, 4, 5]
};

const UpdateProductPage = () => {
    const { id_producto } = useParams();
    const navigate = useNavigate();
    
    const [productStates, setProductStates] = useState([]);
    const [originalData, setOriginalData] = useState({});
    const [formData, setFormData] = useState({
        observaciones: '',
        estado: '',
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    // --- Carga de Datos Iniciales (Producto y Estados) ---
    useEffect(() => {
        const loadData = async () => {
            try {
                const [productData, statesData] = await Promise.all([
                    fetchProductById(id_producto),
                    fetchProductStates(),
                ]);
                
                // Guardar datos originales y configurar formulario
                setOriginalData(productData);
                setFormData({
                    observaciones: productData.observaciones || '',
                    estado: productData.estado.toString(), // ID de estado
                });
                setProductStates(statesData);

            } catch (err) {
                setMessage(`❌ Error al cargar los datos: ${err.message}`);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [id_producto]);

    // --- Función de Renderizado ---
    const getFilteredStates = () => {
        const currentStateId = originalData.estado; // El ID de estado actual que trajimos del backend
        const allowedIds = FRONTEND_TRANSITION_RULES[currentStateId];
        
        // Si no hay reglas definidas (ej. Entregado) o si es el estado actual, solo muestra el estado actual.
        if (!allowedIds || currentStateId === FRONTEND_STATE_IDS.ENTREGADA) {
            return productStates.filter(s => s.id_estado === currentStateId);
        }

        // Siempre permite seleccionar el estado actual para guardar solo observaciones
        // Filtra los estados que están en la lista de permitidos, más el estado actual.
        return productStates.filter(s => 
            allowedIds.includes(s.id_estado) || s.id_estado === currentStateId
        );
    };

    // Maneja el cambio de estado en los inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setMessage('');
    };

    // Maneja el envío del formulario de actualización
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsSaving(true);

        const dataToSend = {
            observaciones: formData.observaciones,
            estado: formData.estado 
        };

        try {
            await updateProduct(id_producto, dataToSend);
            setMessage('✅ Producto actualizado exitosamente.');
            setIsError(false);
            
        } catch (err) {
            setMessage(`❌ Error al actualizar producto: ${err.message}`);
            setIsError(true);
        } finally {
            setIsSaving(false);
        }
    };

    const infoStyle = { padding: '10px', backgroundColor: '#f9f9f9', border: '1px solid #eee', borderRadius: '4px', marginBottom: '10px' };
    const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold' };
    const inputStyle = { width: '100%', padding: '10px', margin: '5px 0 15px 0', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };


    if (isLoading) {
        return <div style={{padding: '20px', textAlign: 'center'}}>Cargando datos del producto...</div>;
    }

    // Encuentra el nombre del estado actual
    const currentStatus = productStates.find(s => s.id_estado.toString() === formData.estado);

    return (
        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', maxWidth: '1000px', margin: '0 auto' }}>
            <h1>🔍 Detalle y Seguimiento: Producto ID {originalData.id_producto}</h1>
            
            <h2 style={{ color: '#007bff' }}>{originalData.tipo_nombre} - {originalData.modelo_nombre}</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '20px' }}>
                {/* Columna de Información Fija (Detalle) */}
                <div>
                    <h2>Información de Trazabilidad</h2>
                    
                    <div style={infoStyle}>
                        <strong style={{ color: '#6c757d' }}>Cliente:</strong> {originalData.cliente_nombre} (ID: {originalData.id_cliente})
                    </div>
                    
                    <div style={infoStyle}>
                        <strong style={{ color: '#6c757d' }}>Fecha Recepción:</strong> {new Date(originalData.fecha_recepcion).toLocaleDateString()}
                    </div>
                    
                    <div style={infoStyle}>
                        <strong style={{ color: '#6c757d' }}>Última Modificación (Reparación):</strong> {originalData.fecha_reparacion ? new Date(originalData.fecha_reparacion).toLocaleString() : 'N/A'}
                    </div>

                    <div style={infoStyle}>
                        <strong style={{ color: '#6c757d' }}>ID Orden Reparación:</strong> {originalData.id_orden_reparacion || 'Pendiente'}
                    </div>

                    {/* Más secciones: Historial de Estados, Repuestos utilizados, etc. */}
                </div>

                {/* Columna de Modificación (Formulario) */}
                <div>
                    <h2>Modificación y Estado</h2>
                    <form onSubmit={handleSubmit}>
                        
                        {/* Estado Actual */}
                        <div style={infoStyle}>
                             <strong style={{ color: currentStatus?.id_estado <= 2 ? 'orange' : currentStatus?.id_estado === 3 ? 'green' : 'red' }}>
                                ESTADO ACTUAL: {currentStatus?.nombre}
                             </strong>
                        </div>

                        {/* Cambio de Estado */}
                        <div>
                            <label htmlFor="estado" style={labelStyle}>Cambiar Estado *</label>
                            <select id="estado" name="estado" value={formData.estado} onChange={handleChange} required style={inputStyle}>
                                {getFilteredStates().map(state => ( // <-- APLICACIÓN DEL FILTRO
                                    <option key={state.id_estado} value={state.id_estado}>
                                        {state.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Observaciones */}
                        <div style={{ marginTop: '10px' }}>
                            <label htmlFor="observaciones" style={labelStyle}>Observaciones del Técnico/Administrativo</label>
                            <textarea id="observaciones" name="observaciones" value={formData.observaciones} onChange={handleChange} style={{ ...inputStyle, minHeight: '100px' }}></textarea>
                        </div>

                        <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
                            <button type="submit" disabled={isSaving} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', opacity: isSaving ? 0.6 : 1 }}>
                                {isSaving ? 'Guardando...' : 'Guardar Modificaciones'}
                            </button>
                            <button type="button" onClick={() => navigate('/productos-reparar')} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                                Volver al Listado
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {message && (
                <p style={{ marginTop: '20px', padding: '10px', backgroundColor: isError ? '#f8d7da' : '#d4edda', color: isError ? '#721c24' : '#155724', border: `1px solid ${isError ? '#f5c6cb' : '#c3e6cb'}`, borderRadius: '4px' }}>
                    {message}
                </p>
            )}
        </div>
        
    );
};

export default UpdateProductPage;