import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClients } from '../../services/client.service';
//import StatusBadge from '../../components/common/StatusBadge';
import { fetchPaymentMethods, apiCreatePayment } from '../../services/payment.service';

const CreatePaymentPage = () => {
    const navigate = useNavigate();

    // Clientes
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState("");
    const [selectedClient, setSelectedClient] = useState("");

    // Metodo de Pago
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedMethodId, setSelectedMethodId] = useState("");

    // Datos del pago
    const [monto, setMonto] = useState("");
    const [fechaPago, setFechaPago] = useState("");
    const [comprobanteExterno, setComprobanteExterno] = useState("");
    const [observaciones, setObservaciones] = useState("");

    // Manejo
    const [message, setMessage] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Cargar los clientes y metodos de pago al select
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const clientData = await fetchClients();
                setClients(clientData);
                
                const paymentMethodData = await fetchPaymentMethods();
                setPaymentMethods(paymentMethodData);
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

    // Seleccion de un metodo de pago
    const handlePaymentMethodChange = async (e) => {
        const id = e.target.value;
        setSelectedMethodId(id);
    }

    // Solo permite dígitos y un único separador decimal
    const handleMontoChange = (e) => {
        const value = e.target.value;
        if (value === "" || /^\d*\.?\d*$/.test(value)) {
            setMonto(value);
        }
    };

    // Seleccion de la fecha de pago
    const handleFechaPagoChange = (e) => {
        setFechaPago(e.target.value);
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

        setIsSaving(true);
        setMessage(false);

        try {
            const payload = {
                id_cliente: parseInt(selectedClientId),
                id_medio_pago: parseInt(selectedMethodId),
                monto: Number(monto),
                fecha_pago: fechaPago || null,
                numero_comprobante: comprobanteExterno || null,
                observaciones: observaciones || null,
            };

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
        setMonto("");
        setFechaPago("");
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
                                    name="id_cliente"
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
                                <label className="pay-field-label">Fecha de recepción del pago</label>
                                <input
                                    type="date"
                                    name="fecha_pago"
                                    value={fechaPago}
                                    onChange={handleFechaPagoChange}
                                    className="pay-input"
                                />
                                <span className="pay-field-hint">Cargar solo si el pago fue recibido</span>
                            </div>
                        </div>
                    </div>

                    <div className="pay-section">
                        <div className="pay-grid">
                            <div>
                                <label className="pay-field-label">Identificacion de comprobante (externo)</label>
                                <input
                                    type="text"
                                    name="comprobante_externo"
                                    value={comprobanteExterno}
                                    onChange={handleComprobanteExternoChange}
                                    className="pay-text-input"
                                />
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
                            disabled={isSaving}
                            onClick={() => handleSave(false)}
                            className={`pay-btn-draft ${isSaving ? 'pay-btn-draft--disabled' : ''}`}
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