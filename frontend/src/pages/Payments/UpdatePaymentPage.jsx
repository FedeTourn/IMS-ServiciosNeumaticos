import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchPaymentMethods, fetchPaymentStates, fetchPaymentById, fetchBanks, apiUpdatePayment, apiDeletePayment } from '../../services/payment.service';
import BankSelector from '../../components/common/BankSelector';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import PaymentStatusBadge from '../../components/common/PaymentStatusBadge';

// Nombre semantico del unico estado en el que un pago admite modificacion o baja
const ESTADO_BORRADOR = 'Borrador';
// Nombre semantico del estado que un medio de pago diferido no puede asumir directamente
const ESTADO_ACEPTADO = 'Aceptado';

// Convierte una fecha ISO del backend (YYYY-MM-DDTHH:mm:ss.sssZ) al formato YYYY-MM-DD que usan los input date
const toDateInputValue = (isoDate) => (isoDate ? isoDate.split('T')[0] : '');

const UpdatePaymentPage = () => {
    const { id_pago } = useParams();
    const navigate = useNavigate();

    // Metodo de Pago
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedMethodId, setSelectedMethodId] = useState("");

    // Estados de pago
    const [paymentStates, setPaymentStates] = useState([]);

    // Bancos
    const [banks, setBanks] = useState([]);
    const [selectedBankId, setSelectedBankId] = useState("");

    // Datos del pago
    const [payment, setPayment] = useState("");
    const [monto, setMonto] = useState("");
    const [fechaRecepcion, setFechaRecepcion] = useState("");
    const [fechaVencimiento, setFechaVencimiento] = useState("");
    const [comprobanteExterno, setComprobanteExterno] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [estado, setEstado] = useState("");

    // Manejo
    const [message, setMessage] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const loadPaymentData = async () => {
        setIsLoading(true);
        setMessage(false);
        setIsError(false);

        try {
            // Catalogos y pago en paralelo: la pantalla se muestra recien cuando esta todo disponible
            const [paymentData, paymentMethodData, paymentStateData, banksData] = await Promise.all([
                fetchPaymentById(id_pago),
                fetchPaymentMethods(),
                fetchPaymentStates(),
                fetchBanks()
            ]);

            setPaymentMethods(paymentMethodData);
            setPaymentStates(paymentStateData);
            setBanks(banksData);

            // Cargamos todo lo que venga de la BDD y que sea editable
            // Si no es editable, sale de payment.field
            // El banco y el vencimiento llegan en null en los medios inmediatos: quedan vacios
            setPayment(paymentData);
            setMonto(paymentData.monto);
            setSelectedMethodId(paymentData.id_medio_pago);
            setSelectedBankId(paymentData.id_banco || '');
            setEstado(paymentData.id_estado_pago);
            setFechaRecepcion(toDateInputValue(paymentData.fecha_recepcion));
            setFechaVencimiento(toDateInputValue(paymentData.fecha_vencimiento));
            setComprobanteExterno(paymentData.numero_comprobante || '');
            setObservaciones(paymentData.observaciones || '');

        } catch (err) {
            setMessage(`Error al cargar el pago: ${err.message}`);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id_pago) {
            loadPaymentData(); // eslint-disable-line
        }
    }, [id_pago]);


    // Solo un pago en Borrador admite modificaciones: se evalua contra el estado guardado, no contra el seleccionado en el formulario
    const esBorrador = payment.estado_pago_nombre === ESTADO_BORRADOR;
    const selectedState = paymentStates.find(state => String(state.id_estado_pago) === String(estado));
    // Elegir un estado distinto de Borrador sobre un pago editable lo vuelve inmutable al guardar
    const esPromocionDefinitiva = esBorrador && !!selectedState && selectedState.nombre !== ESTADO_BORRADOR;
    const selectedMethod = paymentMethods.find(method => method.id_medio_pago === parseInt(selectedMethodId));
    const esDiferido = !!(selectedMethod && selectedMethod.es_diferido);
    const vencimientoInvalido = esDiferido && fechaRecepcion && fechaVencimiento && fechaVencimiento < fechaRecepcion;
    const chequeIncompleto = esDiferido && (!selectedBankId || !comprobanteExterno.trim() || !fechaVencimiento);

    // Seleccion de un metodo de pago
    const handlePaymentMethodChange = async (e) => {
        const id = e.target.value;
        setSelectedMethodId(id);

        // El banco y el vencimiento cargados se conservan al alternar de medio: con un medio inmediato
        // no se envian y el backend los persiste en null
        const method = paymentMethods.find(m => m.id_medio_pago === parseInt(id));
        if (method && method.es_diferido && selectedState && selectedState.nombre === ESTADO_ACEPTADO) {
            // Un medio diferido no puede quedar Aceptado: el estado vuelve a Borrador
            const borrador = paymentStates.find(s => s.nombre === ESTADO_BORRADOR);
            setEstado(borrador ? borrador.id_estado_pago : "");
        }
    }

    // Incorpora al catalogo en memoria el banco dado de alta desde el selector, respetando el orden por nombre
    const handleBankCreated = (bank) => {
        setBanks(prevBanks => [...prevBanks, bank].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    };

    // Solo permite dígitos y un único separador decimal
    const handleMontoChange = (e) => {
        const value = e.target.value;
        if (value === "" || /^\d*\.?\d*$/.test(value)) {
            setMonto(value);
        }
    };

    // Edicion del numero de comprobante externo
    const handleComprobanteExternoChange = (e) => {
        setComprobanteExterno(e.target.value);
    };

    // Seleccion del estado operativo del pago
    const handleEstadoChange = (e) => {
        setEstado(e.target.value);
    };

    // Edicion de las observaciones del pago
    const handleObservacionesChange = (e) => {
        setObservaciones(e.target.value);
    };

    // Seleccion de la fecha de recepcion del pago
    const handleFechaRecepcionChange = (e) => {
        setFechaRecepcion(e.target.value);
    };

    // Seleccion de la fecha de vencimiento del cheque
    const handleFechaVencimientoChange = (e) => {
        setFechaVencimiento(e.target.value);
    };

    // Valida el formulario antes de guardar; ante el primer incumplimiento informa el motivo y no despacha
    const handleSaveIntent = () => {
        // Evita disparar un nuevo guardado mientras uno anterior sigue en curso
        if (isSaving) {
            return;
        }

        if (!selectedMethodId) {
            setMessage("Por favor, seleccione un método de pago antes de guardar.");
            setIsError(true);
            return;
        }

        if (!estado) {
            setMessage("Por favor, seleccione el estado del pago antes de guardar.");
            setIsError(true);
            return;
        }

        if (!monto || Number(monto) <= 0) {
            setMessage("El monto debe ser un número positivo mayor a cero.");
            setIsError(true);
            return;
        }

        if (!fechaRecepcion) {
            setMessage("Por favor, indique la fecha de recepción del pago antes de guardar.");
            setIsError(true);
            return;
        }

        if (chequeIncompleto) {
            setMessage("Para un medio de pago diferido debe indicar el banco emisor, el número de comprobante y la fecha de vencimiento.");
            setIsError(true);
            return;
        }

        if (vencimientoInvalido) {
            setMessage("La fecha de vencimiento no puede ser anterior a la fecha de recepción.");
            setIsError(true);
            return;
        }

        setMessage(false);

        // Promover el pago a un estado definitivo es irreversible: exige confirmacion explicita
        if (esPromocionDefinitiva) {
            setIsConfirmOpen(true);
        } else {
            executeSave();
        }
    };

    // Da de baja el pago en Borrador y vuelve al listado; ante un error (ej. formalizado por otro operador) permanece en la pantalla
    const executeDelete = async () => {
        setIsSaving(true);
        setMessage(false);

        try {
            await apiDeletePayment(id_pago);
            navigate('/pagos');

        } catch (error) {
            setMessage(`Error al eliminar el pago: ${error.message}`);
            setIsError(true);
            setIsSaving(false);
        }
    };

    // Despacha la modificacion y recarga el pago: si se promovio a un estado definitivo, la vista pasa a solo lectura
    const executeSave = async () => {
        setIsSaving(true);
        setMessage(false);

        try {
            const payload = {
                id_medio_pago: parseInt(selectedMethodId),
                id_estado_pago: parseInt(estado),
                monto: Number(monto),
                fecha_recepcion: fechaRecepcion,
                numero_comprobante: comprobanteExterno.trim() || null,
                observaciones: observaciones || null,
            };

            // El banco y el vencimiento solo viajan en los medios diferidos: en un medio inmediato el
            // backend los persiste en null y rechaza que se los informe
            if (esDiferido) {
                payload.id_banco = parseInt(selectedBankId);
                payload.fecha_vencimiento = fechaVencimiento;
            }

            const result = await apiUpdatePayment(id_pago, payload);

            await loadPaymentData();

            setMessage("Pago NRO " + result.id_pago + " actualizado con éxito.");
            setIsError(false);

        } catch (error) {
            setMessage(`Error al actualizar el pago: ${error.message}`);
            setIsError(true);
        } finally {
            setIsSaving(false);
        }
    };


    if (isLoading) return <div className="p-10 text-center animate-pulse text-gray-400">Cargando protocolo de recepción...</div>;

    return (
        <div className="pay-page animate-fade-in">
            <div className="pay-card">

                {/* Header Institucional */}
                <div className="pay-header">
                    <div>
                        <h1 className="pay-header-title">Modificar Pago</h1>
                        <p className="pay-header-subtitle">Módulo Administrativo y Contable</p>
                    </div>
                    <div className="pay-header-badges">
                        <PaymentStatusBadge status={payment.estado_pago_nombre} variant="header" />
                        <span className="pay-info-badge pay-info-badge--date">
                            Fecha: {new Date(payment.fecha_creacion).toLocaleDateString('es-AR')}
                        </span>
                        <span className="pay-info-badge pay-info-badge--id">
                            N° Pago: {payment.id_pago}
                        </span>
                    </div>
                </div>

                {!esBorrador && (
                    <div className="pay-notice">
                        <p className="pay-notice-text">
                            Aviso: El pago se encuentra en estado {payment.estado_pago_nombre}, no se puede modificar ni eliminar.
                        </p>
                    </div>
                )}

                {/* Datos del cliente */}
                <div className="pay-body">
                    <div className="pay-section">
                        <h2 className="pay-section-title">
                            Datos del Cliente
                        </h2>
                        <div className="pay-client-info pay-client-info--row">
                            <div className="pay-client-field">
                                <span className="pay-client-field-label">Cliente:</span> {payment.cliente_nombre}
                            </div>
                            <div className="pay-client-field">
                                <span className="pay-client-field-label">CUIT:</span> {payment.cliente_cuit}
                            </div>
                            <div className="pay-client-field">
                                <span className="pay-client-field-label">Domicilio:</span> {payment.cliente_direccion || 'No especificado'}
                            </div>
                        </div>
                    </div>

                    {/* DATOS DEL PAGO*/}
                    <div className="pay-section">
                        <div className="pay-grid-3">
                            <div>
                                <label className="pay-field-label">Monto *</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    name="monto"
                                    value={monto}
                                    onChange={handleMontoChange}
                                    placeholder="0.00"
                                    required
                                    disabled={!esBorrador}
                                    className="pay-input"
                                />
                            </div>
                            <div>
                                <label className="pay-field-label">Método de Pago *</label>
                                <select
                                    name="id_cliente"
                                    value={selectedMethodId} // Controlamos el select con React
                                    onChange={handlePaymentMethodChange} // Disparamos la función al cambiar
                                    required
                                    disabled={!esBorrador}
                                    className="pay-select"
                                >
                                    <option value="">Seleccione el método de pago...</option>
                                    {paymentMethods.map((method) => (
                                        <option key={method.id_medio_pago} value={method.id_medio_pago}>
                                            {method.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="pay-field-label">Fecha de recepción del pago *</label>
                                <input
                                    type="date"
                                    name="fecha_recepcion"
                                    value={fechaRecepcion}
                                    onChange={handleFechaRecepcionChange}
                                    required
                                    disabled={!esBorrador}
                                    className="pay-input"
                                />
                                <span className="pay-field-hint">Fecha en que el taller recibió el pago (en cheques, la entrega del cheque)</span>
                            </div>
                        </div>
                    </div>

                    {/* DATOS DEL CHEQUE: solo para medios de pago diferidos */}
                    {esDiferido && (
                        <div className="pay-section">
                            <div className="pay-grid">
                                <div>
                                    <label className="pay-field-label">Banco Emisor *</label>
                                    
                                    <BankSelector
                                        banks={banks}
                                        value={selectedBankId}
                                        onChange={setSelectedBankId}
                                        onBankCreated={handleBankCreated}
                                        disabled={!esBorrador}
                                    />
                                </div>
                                <div>
                                    <label className="pay-field-label">Fecha de vencimiento *</label>
                                    <input
                                        type="date"
                                        name="fecha_vencimiento"
                                        value={fechaVencimiento}
                                        onChange={handleFechaVencimientoChange}
                                        min={fechaRecepcion || undefined}
                                        required
                                        disabled={!esBorrador}
                                        className="pay-input"
                                    />
                                    {vencimientoInvalido ? (
                                        <span className="pay-field-error">No puede ser anterior a la fecha de recepción</span>
                                    ) : (
                                        <span className="pay-field-hint">Fecha a partir de la cual el cheque puede presentarse al cobro</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pay-section">
                        <div className="pay-grid">
                            <div>
                                <label className="pay-field-label">
                                    Identificacion de comprobante (externo){esDiferido ? ' *' : ''}
                                </label>
                                <input
                                    type="text"
                                    name="comprobante_externo"
                                    value={comprobanteExterno}
                                    onChange={handleComprobanteExternoChange}
                                    required={esDiferido}
                                    disabled={!esBorrador}
                                    className="pay-text-input"
                                />
                                {esDiferido && (
                                    <span className="pay-field-hint">Número impreso del cheque</span>
                                )}
                            </div>
                            <div>
                                <label className="pay-field-label">Observaciones sobre el pago</label>
                                <input
                                    type="text"
                                    name="observaciones"
                                    value={observaciones}
                                    onChange={handleObservacionesChange}
                                    placeholder="Ej. Entregado por pepito, retirado de oficinas por Juan, etc."
                                    disabled={!esBorrador}
                                    className="pay-text-input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ESTADO OPERATIVO DEL PAGO */}
                    <div className="pay-section">
                        <div className="pay-grid">
                            <div>
                                <label className="pay-field-label">Estado del Pago *</label>
                                <select
                                    name="id_estado_pago"
                                    value={estado}
                                    onChange={handleEstadoChange}
                                    required
                                    disabled={!esBorrador}
                                    className="pay-select"
                                >
                                    {paymentStates.map((state) => (
                                        <option
                                            key={state.id_estado_pago}
                                            value={state.id_estado_pago}
                                            disabled={esDiferido && state.nombre === ESTADO_ACEPTADO}
                                        >
                                            {state.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="pay-field-notes">
                                {esDiferido && esBorrador && (
                                    <span className="pay-field-warning">
                                        Un medio de pago diferido no puede pasar directamente a Aceptado: utilice Pendiente de acreditación
                                    </span>
                                )}
                                {esPromocionDefinitiva && (
                                    <span className="pay-field-warning">
                                        Al guardar, el pago quedará en estado {selectedState.nombre} y ya no podrá modificarse ni eliminarse
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {message && (
                        <div className={`pay-message animate-fade-in ${isError ? 'pay-message--error' : 'pay-message--success'}`}>
                            {message}
                        </div>
                    )}

                    {/* BOTONERA DE ACCIONES */}
                    <div className="pay-actions">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="pay-btn-back"
                        >
                            Cancelar
                        </button>

                        {esBorrador && (
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => setIsDeleteOpen(true)}
                                className={`pay-btn-delete ${isSaving ? 'pay-btn-delete--disabled' : ''}`}
                            >
                                Descartar Pago
                            </button>
                        )}

                        {esBorrador && (
                            <button
                                type="button"
                                disabled={isSaving || chequeIncompleto || vencimientoInvalido}
                                onClick={handleSaveIntent}
                                className={`pay-btn-draft ${isSaving || chequeIncompleto || vencimientoInvalido ? 'pay-btn-draft--disabled' : ''}`}
                            >
                                Guardar Cambios
                            </button>
                        )}
                    </div>

                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={() => {
                    setIsConfirmOpen(false);
                    executeSave();
                }}
                title="¿Confirmar cambio de estado?"
                message={`El pago pasará al estado ${selectedState ? selectedState.nombre : ''}. Esta acción es definitiva: una vez guardado, el pago no admitirá modificaciones ni podrá eliminarse.`}
                isDanger={true}
            />

            <ConfirmationModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={() => {
                    setIsDeleteOpen(false);
                    executeDelete();
                }}
                title="¿Descartar el pago?"
                message={`Se eliminará definitivamente el pago NRO ${payment.id_pago}. Esta acción no se puede deshacer.`}
                isDanger={true}
            />
        </div>
    );
};

export default UpdatePaymentPage;