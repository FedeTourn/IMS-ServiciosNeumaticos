import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { fetchRepairOrderById, fetchProductsByClient, updateRepairOrder } from '../../services/repairOrder.service';

const UpdateRepairOrderPage = () => {
    const navigate = useNavigate();
    const { id_orden } = useParams();

    const [selectedClient, setSelectedClient] = useState(null);
    const [observaciones, setObservaciones] = useState('');

    // Válvulas ya vinculadas a la orden (origen: detalle de la orden)
    const [linkedProducts, setLinkedProducts] = useState([]);
    // Válvulas libres del cliente, candidatas a agregarse (origen: catálogo por cliente)
    const [availableProducts, setAvailableProducts] = useState([]);

    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const [customPrices, setCustomPrices] = useState({});

    // Manejo de UI
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(false);
    const [isError, setIsError] = useState(false);
    const [esCerrada, setEsCerrada] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const loadOrderData = async () => {
        setIsLoading(true);
        setMessage(false);
        setIsError(false);

        try {
            const response = await fetchRepairOrderById(id_orden);
            const orderData = response.data ? response.data : response;

            setSelectedClient(orderData.cliente);
            setObservaciones(orderData.observaciones || '');

            const cerrada = orderData.estado_nombre === 'Cerrada';
            setEsCerrada(cerrada);

            const normalizedLinked = (orderData.productos || []).map(p => ({
                id_producto: p.id_producto,
                id_modelo: p.id_modelo,
                tipo_nombre: p.tipo_nombre,
                modelo_nombre: p.modelo_nombre,
                estado_nombre: p.estado_nombre,
                fecha_recepcion: p.fecha_recepcion,
                precio_sugerido: p.precio_final
            }));

            setLinkedProducts(normalizedLinked);
            setSelectedProductIds(normalizedLinked.map(p => p.id_producto));

            if (cerrada) {
                setAvailableProducts([]);
                setCustomPrices({});
                return;
            }

            // Orden Abierta: se completa el catálogo con las válvulas disponibles del cliente
            const linkedIds = normalizedLinked.map(p => p.id_producto);
            const clientProducts = orderData.cliente
                ? await fetchProductsByClient(orderData.cliente.id_cliente)
                : [];

            setAvailableProducts(clientProducts.filter(p => !linkedIds.includes(p.id_producto)));

            const initialPrices = {};
            normalizedLinked.forEach(p => {
                initialPrices[p.id_modelo] = p.precio_sugerido;
            });
            setCustomPrices(initialPrices);

        } catch (err) {
            setMessage(`Error al cargar la orden: ${err.message}`);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id_orden) {
            loadOrderData(); // eslint-disable-line
        }
    }, [id_orden]);

    // Catálogo unificado únicamente para renderizar/consultar, nunca se persiste en estado
    const displayProducts = [...linkedProducts, ...availableProducts];

    const handleProductSelected = (productId) => {
        setSelectedProductIds(prevSelected => {
            if (prevSelected.includes(productId)) {
                return prevSelected.filter(id => id !== productId);
            } else {
                return [...prevSelected, productId];
            }
        });
    };

    const handlePriceChange = (id_modelo, newPrice) => {
        setCustomPrices(prev => ({
            ...prev,
            [id_modelo]: parseFloat(newPrice) || 0
        }));
    };

    const selectedProducts = displayProducts.filter(p => selectedProductIds.includes(p.id_producto));

    const groupedProducts = Object.values(
        selectedProducts.reduce((accumulator, product) => {
            const { id_modelo, modelo_nombre, tipo_nombre, precio_sugerido } = product;

            if (!accumulator[id_modelo]) {
                const currentPrice = customPrices[id_modelo] !== undefined
                    ? customPrices[id_modelo]
                    : (precio_sugerido || 0);

                accumulator[id_modelo] = {
                    id_modelo,
                    descripcion: `${tipo_nombre} ${modelo_nombre}`,
                    cantidad: 0,
                    precioSugerido: currentPrice,
                    subtotal: 0
                };
            }

            accumulator[id_modelo].cantidad += 1;
            accumulator[id_modelo].subtotal = accumulator[id_modelo].cantidad * accumulator[id_modelo].precioSugerido;

            return accumulator;
        }, {})
    );

    const orderTotal = groupedProducts.reduce((sum, item) => sum + item.subtotal, 0);

    const handleSaveIntent = (esCerradaIntent) => {
        if (selectedProductIds.length === 0) {
            setMessage("Debe seleccionar al menos una válvula para la orden.");
            setIsError(true);
            return;
        }

        setMessage(false);

        if (esCerradaIntent) {
            setIsConfirmOpen(true);
        } else {
            executeSave(false);
        }
    };

    const executeSave = async (esCerradaIntent) => {
        setIsSaving(true);
        setMessage(false);

        try {
            const itemsToSubmit = selectedProductIds.map(id => {
                const product = displayProducts.find(p => p.id_producto === id);
                return {
                    id_producto: id,
                    precio_final: customPrices[product.id_modelo] !== undefined
                        ? customPrices[product.id_modelo]
                        : product.precio_sugerido
                };
            });

            const payload = {
                id_cliente: selectedClient?.id_cliente,
                es_cerrada: esCerradaIntent,
                observaciones,
                items: itemsToSubmit
            };

            const result = await updateRepairOrder(id_orden, payload);

            setMessage(esCerradaIntent
                ? ("Orden NRO " + result.id_orden_reparacion + " cerrada y actualizada con éxito.")
                : ("Orden NRO " + result.id_orden_reparacion + " actualizada con éxito."));
            setIsError(false);

            await loadOrderData();

        } catch (error) {
            setMessage(`Error al actualizar la orden: ${error.message}`);
            setIsError(true);
        } finally {
            setIsSaving(false);
        }
    };


    if (isLoading) return <div className="p-10 text-center animate-pulse text-gray-400">Cargando protocolo de recepción...</div>;

    return (
        <div className={`ro-page animate-fade-in ${!esCerrada ? 'ro-page--no-print' : ''}`}>

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

                {esCerrada && (
                    <div className="mx-6 mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl print:hidden">
                        <p className="text-[10px] text-blue-600 leading-relaxed uppercase font-bold text-center">
                            Aviso: La Orden de reparación se encuentra CERRADA, no se puede modificar.
                        </p>
                    </div>
                )}



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

                    {/* Valvulas Asignadas y Disponibles */}
                    <div className="space-y-4 print:hidden">
                        <h2 className="ro-section-title">
                            {esCerrada ? 'Válvulas Asignadas a esta Orden' : 'Válvulas de la Orden y Disponibles del Cliente'}
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
                                        {displayProducts.map((p) => (
                                            <tr key={p.id_producto} className="ro-table-row">
                                                {!esCerrada && <td className="px-4 py-3 text-center">
                                                    <input
                                                        className="ro-table-checkbox ro-table-checkbox--editable"
                                                        type="checkbox"
                                                        checked={selectedProductIds.includes(p.id_producto)}
                                                        onChange={() => handleProductSelected(p.id_producto)}
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
                                    Seleccionadas: {selectedProductIds.length}
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
                                                : <>
                                                    <input
                                                        type="number"
                                                        value={item.precioSugerido}
                                                        onChange={(e) => handlePriceChange(item.id_modelo, e.target.value)}
                                                        className="ro-price-input ro-price-input--editable print:hidden"
                                                    />
                                                    <span className="hidden print:inline">{item.precioSugerido}</span>
                                                </>
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
                        <div className={`ro-message animate-fade-in print:hidden ${isError ? 'ro-message--error' : 'ro-message--success'}`}>
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

                        <button
                            type="button"
                            disabled={!esCerrada}
                            onClick={() => esCerrada && window.print()}
                            title={!esCerrada ? "Solo se puede imprimir una orden Cerrada." : undefined}
                            className={`ro-btn-print ${!esCerrada ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Imprimir Órden
                        </button>

                        {!esCerrada && (
                            <>
                                <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => handleSaveIntent(false)}
                                    className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest text-slate-700 border-2 border-slate-200 transition-all
                                        ${isSaving ? 'opacity-50 cursor-not-allowed' : 'bg-white hover:bg-slate-50 hover:border-slate-300 active:scale-95'}`}
                                >
                                    Guardar Cambios
                                </button>

                                <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => handleSaveIntent(true)}
                                    className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest text-white shadow-lg transition-all
                                        ${isSaving ? 'bg-gray-300 shadow-none cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-100'}`}
                                >
                                    Guardar y Cerrar
                                </button>
                            </>
                        )}
                    </div>

                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={() => {
                    setIsConfirmOpen(false);
                    executeSave(true);
                }}
                title="¿Confirmar Cierre de Orden?"
                message="Esta acción guarda las válvulas en su estado final y cierra la orden de reparación. Una vez cerrada, no admitirá modificaciones."
                isDanger={false}
            />
        </div>
    );
};

export default UpdateRepairOrderPage;
