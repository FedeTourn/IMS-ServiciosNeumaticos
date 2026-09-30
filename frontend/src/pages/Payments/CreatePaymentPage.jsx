import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClients } from '../../services/client.service';
//import StatusBadge from '../../components/common/StatusBadge';
import { fetchPaymentMethods, fetchBanks, apiCreatePayment } from '../../services/payment.service';
import BankSelector from '../../components/common/BankSelector';

const CreatePaymentPage = () => {
    const navigate = useNavigate();

    // Clientes
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState("");
    const [selectedClient, setSelectedClient] = useState("");

    // Metodo de Pago
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedMethodId, setSelectedMethodId] = useState("");

    // Bancos
    const [banks, setBanks] = useState([]);
    const [selectedBankId, setSelectedBankId] = useState("");

    // Datos del pago
    const [monto, setMonto] = useState("");
    const [fechaRecepcion, setFechaRecepcion] = useState("");
    const [fechaVencimiento, setFechaVencimiento] = useState("");
    const [comprobanteExterno, setComprobanteExterno] = useState("");
    const [observaciones, setObservaciones] = useState("");

    // Manejo
    const [message, setMessage] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Los datos del cheque (banco, comprobante y vencimiento) solo aplican a los medios diferidos
    const selectedMethod = paymentMethods.find(method => method.id_medio_pago === parseInt(selectedMethodId));
    const esDiferido = !!(selectedMethod && selectedMethod.es_diferido);
    const vencimientoInvalido = esDiferido && fechaRecepcion && fechaVencimiento && fechaVencimiento < fechaRecepcion;
    const chequeIncompleto = esDiferido && (!selectedBankId || !comprobanteExterno.trim() || !fechaVencimiento);

    // Cargar los clientes, metodos de pago y bancos a los selectores
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const clientData = await fetchClients();
                setClients(clientData);

                const paymentMethodData = await fetchPaymentMethods();
                setPaymentMethods(paymentMethodData);

                const bankData = await fetchBanks();
                setBanks(bankData);
            } catch (err) {
                setMessage(`Error al cargar datos: ${err.message}`);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);

    // Seleccion de un cliente
    const handleClientChange = async (e) => {
        const id = e.target.value;
        setSelectedClientId(id);
        setSelectedClient(
            clients.find(client => client.id_cliente === parseInt(id))
        );
    }

    // Seleccion de un metodo de pago: al pasar a un medio inmediato se descartan banco y vencimiento
    const handlePaymentMethodChange = async (e) => {
        const id = e.target.value;
        setSelectedMethodId(id);

        const method = paymentMethods.find(m => m.id_medio_pago === parseInt(id));
        if (!method || !method.es_diferido) {
            setSelectedBankId("");
            setFechaVencimiento("");
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

    // Seleccion de la fecha de recepcion del pago
    const handleFechaRecepcionChange = (e) => {
        setFechaRecepcion(e.target.value);
    };

    // Seleccion de la fecha de vencimiento del cheque
    const handleFechaVencimientoChange = (e) => {
        setFechaVencimiento(e.target.value);
    };

    // Edicion del numero de comprobante externo
    const handleComprobanteExternoChange = (e) => {
        setComprobanteExterno(e.target.value);
    };

    // Edicion de las observaciones del pago
    const handleObservacionesChange = (e) => {
        setObservaciones(e.target.value);
    };

    const handleSave = async () => {
        // Evita disparar un nuevo guardado mientras uno anterior sigue en curso
        if (isSaving) {
            return;
        }

        if (!selectedClientId) {
            setMessage("Por favor, seleccione un cliente antes de guardar.");
            setIsError(true);
            return;
        }

        if (!selectedMethodId) {
            setMessage("Por favor, seleccione un método de pago antes de guardar.");
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

        setIsSaving(true);
        setMessage(false);

        try {
            const payload = {
                id_cliente: parseInt(selectedClientId),
                id_medio_pago: parseInt(selectedMethodId),
                monto: Number(monto),
                fecha_recepcion: fechaRecepcion,
                numero_comprobante: comprobanteExterno.trim() || null,
                observaciones: observaciones || null,
            };

            // El banco y el vencimiento solo viajan en los medios diferidos
            if (esDiferido) {
                payload.id_banco = parseInt(selectedBankId);
                payload.fecha_vencimiento = fechaVencimiento;
            }

            const result = await apiCreatePayment(payload);

            setMessage("Pago NRO " + result.id_pago + " registrado con éxito.");
            setIsError(false);

            setTimeout(() => handleClearScreen(), 2000);

        } catch (error) {
            setMessage(`Error al registrar el pago: ${error.message}`);
            setIsError(true);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClearScreen = async () => {
        // Recargamos todo de nuevo
        setSelectedClientId("");
        setSelectedClient("");
        setSelectedMethodId("");
        setSelectedBankId("");
        setMonto("");
        setFechaRecepcion("");
        setFechaVencimiento("");
        setComprobanteExterno("");
        setObservaciones("");
        setMessage(false);
    }


    if (isLoading) return <div className="p-10 text-center animate-pulse text-gray-400">Cargando protocolo de recepción...</div>;

    return (
        <div className="pay-page animate-fade-in">
            <div className="pay-card">

                {/* Header Institucional */}
                <div className="pay-header">
                    <div>
                        <h1 className="pay-header-title">Registrar Pago</h1>
                        <p className="pay-header-subtitle">Módulo Administrativo y Contable</p>
                    </div>
                    <div className="pay-header-badges">
                        <span className="pay-info-badge pay-info-badge--date">
                            Fecha: {new Date().toLocaleDateString('es-AR')}
                        </span>
                        <span className="pay-info-badge pay-info-badge--id">
                            N° Pago: #AUTOGENERADO
                        </span>
                    </div>
                </div>

                <div className="pay-body">
                    <div className="pay-section">
                        <div className="pay-grid">
                            <div>
                                <label className="pay-field-label">Cliente Asociado *</label>
                                <select
                                    name="id_cliente"
                                    value={selectedClientId} // Controlamos el select con React
                                    onChange={handleClientChange} // Disparamos la función al cambiar
                                    required
                                    className="pay-select"
                                >
                                    <option value="">Seleccione el cliente para asignarle el pago...</option>
                                    {clients.map((client) => (
                                        <option key={client.id_cliente} value={client.id_cliente}>
                                            {client.nombre} ({client.cuit})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="pay-field-label">Datos del cliente</label>
                                {selectedClient ? (
                                    <div className="pay-client-info">
                                        <div className="pay-client-field">
                                            <span className="pay-client-field-label">Cliente:</span> {selectedClient.nombre}
                                        </div>
                                        <div className="pay-client-field">
                                            <span className="pay-client-field-label">CUIT:</span> {selectedClient.cuit}
                                        </div>
                                        <div className="pay-client-field">
                                            <span className="pay-client-field-label">Domicilio:</span> {selectedClient.direccion || 'No especificado'}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="pay-client-placeholder">
                                        Esperando selección de cliente...
                                    </div>
                                )}
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
                                    className="pay-input"
                                />
                            </div>
                            <div>
                                <label className="pay-field-label">Método de Pago *</label>
                                <select
                                    name="id_medio_pago"
                                    value={selectedMethodId} // Controlamos el select con React
                                    onChange={handlePaymentMethodChange} // Disparamos la función al cambiar
                                    required
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
                                    className="pay-text-input"
                                />
                            </div>
                        </div>
                    </div>

                    
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <p className="text-[10px] text-blue-600 leading-relaxed uppercase font-bold text-center">
                            Aviso: Por seguridad todos los pagos se generan en borrador. Puede cambiar su estado al modificarlos.
                        </p>
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

                        <button
                            type="button"
                            disabled={isSaving || chequeIncompleto || vencimientoInvalido}
                            onClick={() => handleSave(false)}
                            className={`pay-btn-draft ${isSaving || chequeIncompleto || vencimientoInvalido ? 'pay-btn-draft--disabled' : ''}`}
                        >
                            Crear Pago en Borrador
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CreatePaymentPage;