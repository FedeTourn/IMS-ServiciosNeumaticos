import React from 'react';

// Nombre semantico del estado destino que acredita el cobro; cualquier otro destino lo rechaza
const ESTADO_ACEPTADO = 'Aceptado';

/**
 * Presenta una fecha ISO del backend como DD/MM/YYYY.
 * @param {string|null} isoString - Fecha normalizada por el DTO del backend.
 * @returns {string} Fecha legible o un guion si no esta informada.
 */
const formatDate = (isoString) => (isoString ? new Date(isoString).toLocaleDateString('es-AR') : '-');

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

/**
 * Modal de confirmacion para resolver un cobro diferido (cheque) hacia "Aceptado" o "Rechazado".
 * Identifica inequivocamente el instrumento (banco emisor, comprobante y vencimiento) y advierte
 * que la accion es definitiva. Lo comparten la grilla de pagos y la vista de detalle del pago.
 * @param {Object} props - Propiedades del componente.
 * @param {boolean} props.isOpen - Controla la visibilidad del modal.
 * @param {Object|null} props.payment - Pago a resolver, con cliente, banco, comprobante, vencimiento e importe.
 * @param {string|null} props.targetStatus - Estado destino de la resolucion: "Aceptado" o "Rechazado".
 * @param {boolean} props.isUpdating - Indica que la operacion esta en curso; pasiva los controles.
 * @param {function} props.onConfirm - Ejecuta la resolucion tras la aceptacion.
 * @param {function} props.onClose - Cancela y cierra el modal.
 */
const DeferredActionModal = ({ isOpen, payment, targetStatus, isUpdating, onConfirm, onClose }) => {
    if (!isOpen || !payment) return null;

    const esAcreditacion = targetStatus === ESTADO_ACEPTADO;

    return (
        <div className="deferred-modal-overlay">
            <div className="deferred-modal-backdrop" onClick={isUpdating ? undefined : onClose} />

            <div className="deferred-modal-card">
                <h3 className={esAcreditacion ? 'deferred-modal-title--accept' : 'deferred-modal-title--reject'}>
                    {esAcreditacion ? 'Acreditar cheque' : 'Rechazar cheque'}
                </h3>

                <dl className="deferred-modal-details">
                    <div className="deferred-modal-detail">
                        <dt className="deferred-modal-detail-label">Cliente</dt>
                        <dd className="deferred-modal-detail-value">{payment.cliente_nombre}</dd>
                    </div>
                    <div className="deferred-modal-detail">
                        <dt className="deferred-modal-detail-label">Banco emisor</dt>
                        <dd className="deferred-modal-detail-value">{payment.banco_nombre || '-'}</dd>
                    </div>
                    <div className="deferred-modal-detail">
                        <dt className="deferred-modal-detail-label">N° de comprobante</dt>
                        <dd className="deferred-modal-detail-value">{payment.numero_comprobante || '-'}</dd>
                    </div>
                    <div className="deferred-modal-detail">
                        <dt className="deferred-modal-detail-label">Vencimiento</dt>
                        <dd className="deferred-modal-detail-value">{formatDate(payment.fecha_vencimiento)}</dd>
                    </div>
                    <div className="deferred-modal-detail">
                        <dt className="deferred-modal-detail-label">Importe</dt>
                        <dd className="deferred-modal-detail-value">$ {formatCurrency(payment.monto)}</dd>
                    </div>
                </dl>

                <p className="deferred-modal-warning">
                    {esAcreditacion
                        ? 'Al confirmar, el cobro quedará acreditado de forma definitiva y el importe pasará a computar como fondos a favor del cliente. Esta acción no se puede revertir.'
                        : 'Al confirmar, el cheque se marcará como rechazado y no computará como fondos del cliente. Esta acción no se puede revertir.'}
                </p>

                <div className="deferred-modal-actions">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isUpdating}
                        className="deferred-modal-btn-cancel"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isUpdating}
                        className={esAcreditacion ? 'deferred-modal-btn-accept' : 'deferred-modal-btn-reject'}
                    >
                        {isUpdating ? 'Procesando...' : (esAcreditacion ? 'Confirmar acreditación' : 'Confirmar rechazo')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeferredActionModal;
