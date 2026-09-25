import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { fetchClients } from '../../services/client.service';
import PaymentStatusBadge from '../../components/common/PaymentStatusBadge';
import AmountRangeSlider from '../../components/common/AmountRangeSlider';
import { fetchPayments, fetchPaymentMethods, fetchPaymentStates } from '../../services/payment.service';

// Calendarios en español para toda la página
registerLocale('es', es);

// Criterios de búsqueda en su estado neutro, reutilizados por la carga inicial y por la limpieza del panel.
const FILTROS_INICIALES = {
    id_pago: '',
    id_cliente: '',
    id_medio_pago: '',
    id_estado_pago: '',
    numero_comprobante: '',
    monto_min: '',
    monto_max: '',
    fecha_desde: '',
    fecha_hasta: '',
    creacion_desde: '',
    creacion_hasta: '',
    sort_by: 'fecha_pago',
    sort_order: 'DESC'
};

// Ventana de retardo (ms) aplicada antes de despachar la consulta al backend.
const RETARDO_CONSULTA_MS = 400;

// Granularidad del deslizador de importes y tope mínimo cuando aún no hay pagos registrados.
const PASO_MONTO = 100;
const TOPE_MONTO_POR_DEFECTO = 1000;

/**
 * Convierte un objeto Date del calendario al formato YYYY-MM-DD que espera el backend,
 * tomando los componentes locales para evitar el corrimiento de un día que introduciría
 * `toISOString()` al normalizar a UTC.
 */
const toBackendDate = (fecha) => {
    if (!fecha) return '';
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
};

/**
 * Reconstruye un objeto Date a partir del formato YYYY-MM-DD almacenado en los filtros,
 * para alimentar al calendario sin que interprete la cadena como UTC.
 */
const fromBackendDate = (texto) => {
    if (!texto) return null;
    const [anio, mes, dia] = texto.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
};

/**
 * Redondea el importe máximo observado hacia una cifra superior.
 */
const calcularTopeMonto = (montoMaximo) => {
    if (!montoMaximo || montoMaximo <= 0) return TOPE_MONTO_POR_DEFECTO;
    // La magnitud del importe define el escalón de redondeo
    const magnitud = Math.pow(10, Math.floor(Math.log10(montoMaximo)));
    return Math.ceil(montoMaximo / magnitud) * magnitud;
};



const PaymentsPage = () => {
    const navigate = useNavigate();

    const [payments, setPayments] = useState([]);
    const [clients, setClients] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [paymentStates, setPaymentStates] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Visibilidad del panel de filtros completo
    const [showFilters, setShowFilters] = useState(true);

    // Tope del deslizador de importes, derivado una única vez de la primera consulta sin filtrar
    const [montoTope, setMontoTope] = useState(null);

    const [filters, setFilters] = useState(FILTROS_INICIALES);

    useEffect(() => {
        const loadClients = async () => {
            try {
                const data = await fetchClients();
                setClients(data);
            } catch (err) {
                console.error("[PaymentsPage] Error al cargar clientes:", err);
            }
        };
        loadClients();
    }, []);

    useEffect(() => {
        const loadPaymentMethods = async () => {
            try {
                const data = await fetchPaymentMethods();
                setPaymentMethods(data);
            } catch (err) {
                console.error("[PaymentsPage] Error al cargar medios de pago:", err);
            }
        };
        loadPaymentMethods();
    }, []);

    useEffect(() => {
        const loadPaymentStates = async () => {
            try {
                const data = await fetchPaymentStates();
                setPaymentStates(data);
            } catch (err) {
                console.error("[PaymentsPage] Error al cargar estados disponibles:", err);
            }
        };
        loadPaymentStates();
    }, []);

    // Carga nuevamente los pagos cada vez que los filtros cambien. La consulta se despacha con un
    // retardo (Debounce) y el temporizador se cancela ante cada nueva pulsación.
    // Escribir en los campos de texto libre genera una única petición al backend.
    useEffect(() => {
        const loadPayments = async () => {
            setIsLoading(true);
            setError('');
            try {
                const data = await fetchPayments(filters);
                setPayments(data || []);

                // El tope del deslizador se fija una sola vez, sobre la primera respuesta
                setMontoTope(prev => {
                    if (prev !== null) return prev;
                    const importes = (data || []).map(p => Number(p.monto));
                    return calcularTopeMonto(importes.length > 0 ? Math.max(...importes) : 0);
                });
            } catch (err) {
                setError(`Error al recuperar los pagos registrados: ${err.message}`);
                setPayments([]);
            } finally {
                setIsLoading(false);
            }
        };

        const temporizador = setTimeout(loadPayments, RETARDO_CONSULTA_MS);
        return () => clearTimeout(temporizador);
    }, [filters]);

    // Manejador centralizado para actualizar el estado de los filtros
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    /**
     * Traslada la selección de un calendario de rango a los dos criterios de fecha correspondientes.
     * @param {string} campoDesde - Nombre del filtro que recibe el límite inferior.
     * @param {string} campoHasta - Nombre del filtro que recibe el límite superior.
     * @returns {Function} Manejador del evento de cambio del calendario.
     */
    const handleDateRangeChange = (campoDesde, campoHasta) => ([desde, hasta]) => {
        setFilters(prev => ({
            ...prev,
            [campoDesde]: toBackendDate(desde),
            [campoHasta]: toBackendDate(hasta)
        }));
    };

    /**
     * Traslada la selección del deslizador al par de criterios de importe. Cuando alguno de los
     * extremos coincide con el límite absoluto del rango, el criterio se informa como vacío para
     * que no viaje en la Query String y la búsqueda no quede innecesariamente acotada.
     * @param {number} nuevoMin - Importe mínimo seleccionado.
     * @param {number} nuevoMax - Importe máximo seleccionado.
     */
    const handleAmountRangeChange = (nuevoMin, nuevoMax) => {
        setFilters(prev => ({
            ...prev,
            monto_min: nuevoMin <= 0 ? '' : String(nuevoMin),
            monto_max: nuevoMax >= (montoTope ?? TOPE_MONTO_POR_DEFECTO) ? '' : String(nuevoMax)
        }));
    };

    // Restablece todos los criterios, incluido el ordenamiento, a su estado neutro
    const handleClearFilters = () => {
        setFilters(FILTROS_INICIALES);
    };

    const handleSort = (columnKey) => {
        setFilters(prev => {
            // Si el usuario hace clic en la misma columna, invertimos el sentido (ASC/DESC)
            if (prev.sort_by === columnKey) {
                return { ...prev, sort_order: prev.sort_order === 'DESC' ? 'ASC' : 'DESC' };
            }
            // Si hace clic en una columna nueva, el valor por defecto será descendente
            return { ...prev, sort_by: columnKey, sort_order: 'DESC' };
        });
    };

    const getSortIndicator = (columnKey) => {
        if (filters.sort_by !== columnKey) return <span className="pay-list-sort-indicator">↕</span>;
        return filters.sort_order === 'ASC'
            ? <span className="pay-list-sort-indicator--active">▲</span>
            : <span className="pay-list-sort-indicator--active">▼</span>;
    };

    const formatDate = (isoString) => {
        if (!isoString || isoString === '-') return 'Pendiente'; // O 'N/A' según prefiera el usuario
        const date = new Date(isoString);
        // Retorna formato DD/MM/YYYY
        return date.toLocaleDateString('es-AR');
    };

    /**
     * Presenta el importe del pago con separadores de miles y dos decimales.
     * @param {string|number} monto - Importe normalizado por el DTO del backend.
     * @returns {string} Importe legible en formato local (ej. 1.250,00).
     */
    const formatCurrency = (monto) => {
        const importe = Number(monto);
        if (Number.isNaN(importe)) return '-';
        return importe.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Límite superior efectivo del deslizador mientras no se haya derivado el tope real
    const topeEfectivo = montoTope ?? TOPE_MONTO_POR_DEFECTO;

    return (
        <div className="pay-list-page animate-fade-in">
            <div className="pay-list-panel">
                {/* --- CABECERA Y ACCIONES --- */}
                <div className="pay-list-header">
                    <div>
                        <h1 className="pay-list-header-title">Gestión de Pagos</h1>
                        <p className="pay-list-header-subtitle">Historial de Pagos recibidos.</p>
                    </div>

                    <button
                        onClick={() => navigate('/crear-pago')}
                        className="pay-list-btn-create">
                        Registrar Nuevo Pago
                    </button>
                </div>

                {/* Panel de Filtros y Barras de Búsqueda */}
                <div className="pay-list-filters">
                    <div className="pay-list-filters-bar">
                        <button
                            type="button"
                            onClick={() => setShowFilters(prev => !prev)}
                            className="pay-list-filters-toggle"
                        >
                            <span className="pay-list-filters-toggle-icon">{showFilters ? '−' : '+'}</span>
                            Filtros de Búsqueda
                        </button>

                        {showFilters && (
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="pay-list-filters-clear"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>

                    {showFilters && (
                        <div className="pay-list-filters-grid">
                            {/* Búsqueda por Nro interno de Pago */}
                            <div className="pay-list-filter-field">
                                <label className="pay-list-filter-label">N° de Pago Interno</label>
                                <input
                                    type="text"
                                    placeholder="Ej. 151"
                                    value={filters.id_pago}
                                    name="id_pago"
                                    onChange={handleFilterChange}
                                    className="pay-list-filter-input"
                                />
                            </div>

                            {/* Filtro por Cliente */}
                            <div className="pay-list-filter-field">
                                <label className="pay-list-filter-label">Cliente</label>
                                <select
                                    value={filters.id_cliente}
                                    name="id_cliente"
                                    onChange={handleFilterChange}
                                    className="pay-list-filter-select"
                                >
                                    <option value="">Todos los clientes</option>
                                    {clients.map(c =>
                                        <option key={c.id_cliente} value={c.id_cliente}>
                                            {c.nombre}
                                        </option>
                                    )}

                                </select>
                            </div>

                            {/* Filtro por Medio de pago */}
                            <div className="pay-list-filter-field">
                                <label className="pay-list-filter-label">Medio de Pago</label>
                                <select
                                    value={filters.id_medio_pago}
                                    name="id_medio_pago"
                                    onChange={handleFilterChange}
                                    className="pay-list-filter-select"
                                >
                                    <option value="">Todos los medios de pago</option>
                                    {paymentMethods.map(mp =>
                                        <option key={mp.id_medio_pago} value={mp.id_medio_pago}>
                                            {mp.nombre}
                                        </option>
                                    )}

                                </select>
                            </div>

                            {/* Filtro por Estado de pago */}
                            <div className="pay-list-filter-field">
                                <label className="pay-list-filter-label">Estado</label>
                                <select
                                    value={filters.id_estado_pago}
                                    name="id_estado_pago"
                                    onChange={handleFilterChange}
                                    className="pay-list-filter-select"
                                >
                                    <option value="">Todos los estados</option>
                                    {paymentStates.map(ep =>
                                        <option key={ep.id_estado_pago} value={ep.id_estado_pago}>
                                            {ep.nombre}
                                        </option>
                                    )}

                                </select>
                            </div>

                            {/* Comprobante externo (coincidencia parcial) */}
                            <div className="pay-list-filter-field">
                                <label className="pay-list-filter-label">N° de Comprobante</label>
                                <input
                                    type="text"
                                    placeholder="Ej. 0001-00012345"
                                    name="numero_comprobante"
                                    value={filters.numero_comprobante}
                                    onChange={handleFilterChange}
                                    className="pay-list-filter-input"
                                />
                            </div>

                            {/* Rango de Fecha de Recepción del cobro, resuelto en un único calendario */}
                            <div className="pay-list-filter-field">
                                <label className="pay-list-filter-label">Fecha de Recepción</label>
                                <DatePicker
                                    selectsRange
                                    locale="es"
                                    dateFormat="dd/MM/yyyy"
                                    startDate={fromBackendDate(filters.fecha_desde)}
                                    endDate={fromBackendDate(filters.fecha_hasta)}
                                    onChange={handleDateRangeChange('fecha_desde', 'fecha_hasta')}
                                    isClearable
                                    placeholderText="Todo el período"
                                    className="pay-list-filter-datepicker"
                                    wrapperClassName="pay-list-filter-datepicker-wrapper"
                                />
                            </div>

                            {/* Rango de Fecha de Creación del registro, resuelto en un único calendario */}
                            <div className="pay-list-filter-field">
                                <label className="pay-list-filter-label">Fecha de Creación</label>
                                <DatePicker
                                    selectsRange
                                    locale="es"
                                    dateFormat="dd/MM/yyyy"
                                    startDate={fromBackendDate(filters.creacion_desde)}
                                    endDate={fromBackendDate(filters.creacion_hasta)}
                                    onChange={handleDateRangeChange('creacion_desde', 'creacion_hasta')}
                                    isClearable
                                    placeholderText="Todo el período"
                                    className="pay-list-filter-datepicker"
                                    wrapperClassName="pay-list-filter-datepicker-wrapper"
                                />
                            </div>

                            {/* Rango de Importes, resuelto en un único deslizador de doble control */}
                            <div className="pay-list-filter-field">
                                <label className="pay-list-filter-label">Monto ($)</label>
                                <AmountRangeSlider
                                    min={0}
                                    max={topeEfectivo}
                                    step={PASO_MONTO}
                                    valueMin={filters.monto_min === '' ? 0 : Number(filters.monto_min)}
                                    valueMax={filters.monto_max === '' ? topeEfectivo : Number(filters.monto_max)}
                                    onChange={handleAmountRangeChange}
                                    disabled={montoTope === null}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>


            {/* Contenedor de la Tabla Principal */}
            <div className="pay-list-table-card">

                {/*Manejo de errores*/}
                {error && (
                    <div className="pay-list-message--error">
                        {error}
                    </div>
                )}

                <div className="pay-list-table-wrapper">
                    <table className="pay-list-table">
                        {/*Nº Pago interno, Fecha, Cliente, Medio de pago, Monto, Estado (integrando el componente `PaymentStatusBadge`), Acciones. */}
                        <thead className="pay-list-table-head">
                            <tr>
                                <th className="pay-list-table-th" onClick={() => handleSort('id_pago')}>
                                    N° Pago {getSortIndicator('id_pago')}
                                </th>
                                <th className="pay-list-table-th" onClick={() => handleSort('cliente_nombre')}>
                                    Cliente {getSortIndicator('cliente_nombre')}
                                </th>
                                <th className="pay-list-table-th" onClick={() => handleSort('monto')}>
                                    Monto ($) {getSortIndicator('monto')}
                                </th>
                                <th className="pay-list-table-th--center" onClick={() => handleSort('medio_pago_nombre')}>
                                    Medio de Pago {getSortIndicator('medio_pago_nombre')}
                                </th>
                                <th className="pay-list-table-th--center" onClick={() => handleSort('estado_pago_nombre')}>
                                    Estado {getSortIndicator('estado_pago_nombre')}
                                </th>
                                <th className="pay-list-table-th" onClick={() => handleSort('fecha_creacion')}>
                                    Fecha Creación {getSortIndicator('fecha_creacion')}
                                </th>
                                <th className="pay-list-table-th" onClick={() => handleSort('fecha_pago')}>
                                    Fecha Recepción {getSortIndicator('fecha_pago')}
                                </th>
                                <th className="pay-list-table-th--actions">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="pay-list-table-body">

                            {isLoading ? (
                                <tr>
                                    <td colSpan="8" className="pay-list-table-loading">
                                        Cargando Pagos ...
                                    </td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="pay-list-table-empty">
                                        No se encontraron pagos que coincidan con los filtros seleccionados.
                                    </td>
                                </tr>
                            ) : (
                                payments.map((pago) => (
                                    <tr key={pago.id_pago} className="pay-list-table-row">
                                        <td className="pay-list-cell-id">
                                            #PAGO-{pago.id_pago.toString().padStart(4, '0')}
                                        </td>
                                        <td className="pay-list-cell-client">
                                            {pago.cliente_nombre}
                                        </td>
                                        <td className="pay-list-cell-amount">
                                            {formatCurrency(pago.monto)}
                                        </td>
                                        <td className="pay-list-cell-method">
                                            {pago.medio_pago_nombre}
                                        </td>
                                        <td className="pay-list-cell-status">
                                            <PaymentStatusBadge status={pago.estado_pago_nombre} />
                                        </td>
                                        <td className="pay-list-cell-date">
                                            {formatDate(pago.fecha_creacion)}
                                        </td>
                                        <td className="pay-list-cell-date">
                                            {formatDate(pago.fecha_pago)}
                                        </td>
                                        <td className="pay-list-cell-actions">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/pagos/${pago.id_pago}`)}
                                                className="pay-list-btn-detail"
                                            >
                                                Ver Detalle
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pie de tabla */}
                <div className="pay-list-footer">
                    <span className="pay-list-footer-text">
                        Mostrando {payments.length} pago{payments.length !== 1 && 's'} listado{payments.length !== 1 && 's'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PaymentsPage;
