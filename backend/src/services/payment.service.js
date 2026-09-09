const Payment = require('../models/Payment');

/**
 * Claves semánticas de los nombres de estado de pago, para evitar el acoplamiento
 * por identificadores numéricos fijos (hardcoding) entre entornos.
 */
const ESTADOS_PAGO = {
    BORRADOR: 'Borrador',
    PENDIENTE_ACREDITACION: 'Pendiente de acreditación',
    ACEPTADO: 'Aceptado',
    RECHAZADO: 'Rechazado',
};

class PaymentService {

    /**
     * Obtiene el catálogo completo de estados de pago parametrizados en el sistema.
     * Resuelve el Requerimiento 32.1 de exposición de catálogos.
     * @returns {Promise<Array<Object>>} Listado de estados de pago disponibles.
     */
    static async getAllPaymentStates() {
        const states = await Payment.findAllStates();
        return states;
    }

    /**
     * Obtiene el catálogo completo de medios de pago parametrizados, incluyendo su
     * bandera de acreditación diferida.
     * @returns {Promise<Array<Object>>} Listado de medios de pago disponibles.
     */
    static async getAllPaymentMethods() {
        const methods = await Payment.findAllMethods();
        return methods;
    }

    /**
     * Valida la correspondencia entre el medio de cobro seleccionado y el estado de pago solicitado. 
     * Un medio diferido (ej. cheque) no puede asignarse directamente al estado "Aceptado": 
     * debe atravesar "Pendiente de acreditación" o nacer en "Borrador" como estado preliminar de edición.
     * @param {number} idMedioPago - Identificador del medio de pago seleccionado.
     * @param {number} idEstadoPago - Identificador del estado de pago solicitado.
     * @returns {Promise<Object>} El registro de EstadoPago validado como asignación permitida.
     */
    static async validatePaymentStatusAssignment(idMedioPago, idEstadoPago) {
        if (!idMedioPago || !idEstadoPago) {
            const error = new Error('El medio de pago y el estado de pago son obligatorios para validar la asignación.');
            error.statusCode = 400;
            throw error;
        }

        const medio = await Payment.findMethodById(idMedioPago);
        if (!medio) {
            const error = new Error(`No se encontró un medio de pago registrado bajo el identificador #${idMedioPago}.`);
            error.statusCode = 404;
            throw error;
        }

        const estadoSolicitado = await Payment.findStateById(idEstadoPago);
        if (!estadoSolicitado) {
            const error = new Error(`No se encontró un estado de pago registrado bajo el identificador #${idEstadoPago}.`);
            error.statusCode = 404;
            throw error;
        }

        const esDiferido = !!medio.es_diferido;
        const esAceptado = estadoSolicitado.nombre === ESTADOS_PAGO.ACEPTADO;

        if (esDiferido && esAceptado) {
            const error = new Error(`El medio de pago "${medio.nombre}" admite acreditación diferida: no puede registrarse directamente en estado "Aceptado". Debe atravesar "Pendiente de acreditación" o nacer en "Borrador".`);
            error.statusCode = 409;
            throw error;
        }

        return estadoSolicitado;
    }

}

module.exports = PaymentService;
