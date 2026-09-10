const Payment = require('../models/Payment');
const Client = require('../models/Client');

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

    /**
     * Orquesta la creación de un nuevo registro de pago: valida la existencia y vigencia del
     * cliente, la validez del medio de pago y la consistencia del importe, resuelve
     * el estado operativo inicial según la naturaleza (diferida o inmediata) del medio de pago
     * y delega la persistencia a la capa de datos.
     * @param {Object} paymentData - Datos del pago provenientes del controlador.
     * @param {number} paymentData.id_cliente - Identificador del cliente asociado al pago.
     * @param {number} paymentData.id_medio_pago - Identificador del medio de pago utilizado.
     * @param {number|string} paymentData.monto - Importe del pago (estrictamente positivo).
     * @param {Date|string} paymentData.fecha_pago - Fecha y hora de la transacción.
     * @param {string} [paymentData.numero_comprobante] - Número de comprobante de respaldo (opcional).
     * @param {string} [paymentData.observaciones] - Observaciones adicionales (opcional).
     * @returns {Promise<Object>} El registro de pago creado, incluyendo su identificador y estado inicial.
     */
    static async createPayment(paymentData) {
        const { id_cliente, id_medio_pago, monto, fecha_pago, numero_comprobante, observaciones } = paymentData;

        if (!id_cliente || !id_medio_pago || !fecha_pago) {
            const error = new Error('El cliente, el medio de pago y la fecha de pago son obligatorios para registrar el pago.');
            error.statusCode = 400;
            throw error;
        }

        const montoNumerico = Number(monto);
        if (!monto || Number.isNaN(montoNumerico) || montoNumerico <= 0) {
            const error = new Error('El importe del pago debe ser un número positivo.');
            error.statusCode = 400;
            throw error;
        }

        // Regla de negocio: Validación de Entidad Cliente (Fail-Fast, existente y activo)
        const cliente = await Client.findById(id_cliente);
        if (!cliente || !cliente.is_active) {
            const error = new Error(`No se encontró un cliente activo registrado bajo el identificador #${id_cliente}.`);
            error.statusCode = 404;
            throw error;
        }

        // Validación de la existencia del medio de pago
        const medio = await Payment.findMethodById(id_medio_pago);
        if (!medio) {
            const error = new Error(`No se encontró un medio de pago registrado bajo el identificador #${id_medio_pago}.`);
            error.statusCode = 404;
            throw error;
        }

        // Resolución del estado operativo inicial: los medios diferidos (ej. cheque) nacen
        // "Pendiente de acreditación" para aislarlos del balance computable del cliente;
        // el resto se registra directamente como "Aceptado".
        const nombreEstadoInicial = medio.es_diferido
            ? ESTADOS_PAGO.PENDIENTE_ACREDITACION
            : ESTADOS_PAGO.ACEPTADO;

        const estados = await Payment.findAllStates();
        const estadoInicial = estados.find(e => e.nombre === nombreEstadoInicial);
        if (!estadoInicial) {
            const error = new Error(`El catálogo de estados de pago no posee configurado el estado "${nombreEstadoInicial}".`);
            error.statusCode = 500;
            throw error;
        }

        // Validación para garantizar que el estado resuelto sea una asignación permitida para el medio elegido.
        await PaymentService.validatePaymentStatusAssignment(id_medio_pago, estadoInicial.id_estado_pago);

        const dataToPersist = {
            id_cliente,
            id_estado_pago: estadoInicial.id_estado_pago,
            id_medio_pago,
            monto: montoNumerico,
            fecha_pago,
            numero_comprobante,
            observaciones
        };

        const insertId = await Payment.create(dataToPersist);

        return {
            id_pago: insertId,
            ...dataToPersist,
            estado_pago_nombre: estadoInicial.nombre
        };
    }

}

module.exports = PaymentService;
