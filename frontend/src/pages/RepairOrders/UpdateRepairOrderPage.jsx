import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import { fetchRepairOrderById } from '../../services/repairOrder.service';

const UpdateRepairOrderPage = () => {
    const navigate = useNavigate();
    const { id_orden } = useParams();

    const [selectedClient, setSelectedClient] = useState(null);
    const [products, setProducts] = useState([]);
    
    // Manejo de UI
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState(false);
    const [isError, setIsError] = useState(false);
    const [esCerrada, setEsCerrada] = useState(false);

    useEffect(() => {
        const loadOrderData = async () => {
            setIsLoading(true);
            setMessage(false);
            setIsError(false);

            try {
                const response = await fetchRepairOrderById(id_orden);
                const orderData = response.data ? response.data : response;

                setSelectedClient(orderData.cliente);
                
                setProducts(orderData.productos || []);
                
                setEsCerrada(orderData.estado_nombre === 'Cerrada');

            } catch (err) {
                setMessage(`Error al cargar la orden: ${err.message}`);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };

        if (id_orden) {
            loadOrderData();
        }
    }, [id_orden]);

    const groupedProducts = Object.values(
        products.reduce((accumulator, product) => {
            const { id_modelo, modelo_nombre, tipo_nombre, precio_final } = product;

            if (!accumulator[id_modelo]) {
                accumulator[id_modelo] = {
                    id_modelo,
                    descripcion: `${tipo_nombre} ${modelo_nombre}`,
                    cantidad: 0,
                    precioSugerido: precio_final || 0,
                    subtotal: 0
                };
            }

            accumulator[id_modelo].cantidad += 1;
            accumulator[id_modelo].subtotal = accumulator[id_modelo].cantidad * accumulator[id_modelo].precioSugerido;

            return accumulator;
        }, {})
    );

    const orderTotal = groupedProducts.reduce((sum, item) => sum + item.subtotal, 0);


    if (isLoading) return <div className="p-10 text-center animate-pulse text-gray-400">Cargando protocolo de recepción...</div>;

    return (
        <div className="ro-page animate-fade-in">

            <div className="ro-card">
                {/* Header Institucional */}
                <div className="ro-header">
                    <div className="ro-header-main">
                        <h1 className="ro-header-title">Orden de Reparación</h1>
                        <p className="ro-header-subtitle" > Módulo Administrativo y Contable </p>
                        <div className="ro-print-order-info">
                            <p className='ro-header-disclaimer'> (Documento No Válido Como Factura) </p>
                            <span>
                                Fecha: {new Date().toLocaleDateString('es-AR')}
                            </span>

                            <span>
                                N° Orden: {id_orden || '1024'}
                            </span>
                        </div>
                    </div>
                    <div className="ro-header-badges">
                        <span className={`ro-status-badge ${esCerrada ? 'ro-status-badge--closed' : 'ro-status-badge--open'}`}>
                            {esCerrada ? 'CERRADA' : 'ABIERTA'}
                        </span>
                        <span className="ro-info-badge ro-info-badge--date">
                            Fecha: {new Date().toLocaleDateString('es-AR')}
                        </span>
                        <span className="ro-info-badge ro-info-badge--id">
                            N° Órden: {id_orden || '1024'}
                        </span>
                    </div>
                    <div className="ro-print-generator">
                        <strong>SERVICIOS NEUMÁTICOS</strong>
                        
                        <span>Ing. Mauricio Tourn - CUIT: 20-23240839-2</span>
                        <span>CEL. 0342 155 422425 - Email: ingmtourn@yahoo.com.ar</span>
                        <span>IVA RESPONSABLE INSCRIPTO - Inicio de Act.: 01/03/2008</span>
                    </div>
                </div>

                <div className="ro-body">

                    <div className="ro-section">
                        <h2 className="ro-section-title">
                            Datos del Cliente
                        </h2>
                        <div >
                            {selectedClient && (
                                <div className="ro-client-info">
                                    <div className="ro-client-field">
                                        <span className="ro-client-field-label">Cliente:</span> {selectedClient.nombre}
                                    </div>
                                    <div className="ro-client-field">
                                        <span className="ro-client-field-label">CUIT:</span> {selectedClient.cuit}
                                    </div>
                                    <div className="ro-client-field">
                                        <span className="ro-client-field-label">Domicilio:</span> {selectedClient.direccion || 'No especificado'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Valvulas Asignadas a la Orden */}
                    <div className="space-y-4 print:hidden">
                        <h2 className="ro-section-title">
                            Válvulas Asignadas a esta Orden
                        </h2>
                        <div className="ro-panel">
                            <div className="ro-table-wrapper">
                                <table className="ro-table">
                                    <thead className="ro-table-head">
                                        <tr>
                                            {!esCerrada && <th className="ro-table-th-center">Inc.</th>}
                                            <th className="ro-table-th">ID</th>
                                            <th className="ro-table-th">Descripción</th>
                                            <th className="ro-table-th">Estado Actual</th>
                                            <th className="ro-table-th">Fecha Recepción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="ro-table-body">
                                        {products.map((p) => (
                                            <tr key={p.id_producto} className="ro-table-row">
                                                {!esCerrada && <td className="px-4 py-3 text-center">
                                                    <input
                                                        className="ro-table-checkbox"
                                                        type="checkbox"
                                                        checked={true}
                                                        readOnly
                                                    />
                                                </td>
                                                }
                                                <td className="px-4 py-3 font-mono text-slate-600">{p.id_producto}</td>
                                                <td className="px-4 py-3 font-bold text-slate-800">{p.tipo_nombre} {p.modelo_nombre}</td>
                                                <td className="px-4 py-3">
                                                    <StatusBadge status={p.estado_nombre} />
                                                </td >
                                                <td className="px-4 py-3 font-mono text-slate-600">
                                                    {new Date(p.fecha_recepcion).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div>
                                <span className="ro-total-tag">
                                    Total: {products.length}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="ro-section-title">
                            Detalle y Cotización
                        </h2>
                        <div className="ro-quote-table-wrapper">
                            <table className="ro-table">
                                <thead className="ro-quote-table-head">
                                    <tr>
                                        <th className="px-4 py-3 text-center">Cant. Seleccionada</th>
                                        <th className="ro-table-th">Detalle</th>
                                        <th className="px-4 py-3 text-right">Precio Unitario ($)</th>
                                        <th className="px-4 py-3 text-right">IMPORTE ($)</th>
                                    </tr>
                                </thead>
                                <tbody className="ro-table-body">
                                    {groupedProducts.map((item, idx) => (
                                        <tr key={idx} className="ro-quote-row">
                                            <td className="px-4 py-4 text-center font-mono text-slate-600">{item.cantidad}</td>
                                            <td className="px-4 py-4 font-bold text-slate-800">{item.descripcion}</td>
                                            <td className="px-4 py-4 text-right font-bold">
                                                { esCerrada ?
                                                    item.precioSugerido
                                                : <input
                                                    type="number"
                                                    value={item.precioSugerido}
                                                    readOnly
                                                    className="ro-price-input"
                                                />
                                                }

                                            </td>
                                            <td className="px-4 py-4 text-right font-black text-slate-800 font-mono">
                                                {item.subtotal}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Banner de Total */}
                        <div className="ro-total-banner-wrapper">
                            <div className="ro-total-banner">
                                <span className="ro-total-banner-label">Importe Total</span>
                                <span className="ro-total-banner-value">$ {orderTotal}</span>
                            </div>
                        </div>
                    </div>

                    {message && (
                        <div className={`ro-message animate-fade-in ${isError ? 'ro-message--error' : 'ro-message--success'}`}>
                            {message}
                        </div>
                    )}

                    {/* BOTONERA DE ACCIONES */}
                    <div className="ro-actions">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="ro-btn-back"
                        >
                            Volver al Listado
                        </button>

                        {/* Botón de Impresión - Requerimiento 27 */}
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="ro-btn-print"
                        >
                            Imprimir Remito
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default UpdateRepairOrderPage;