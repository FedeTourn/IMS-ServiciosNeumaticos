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
     * Valida la consistencia sintáctica de los criterios numéricos y temporales de búsqueda de pagos.
     * Rechaza identificadores no enteros, importes negativos, fechas mal formadas o inexistentes
     * (ej. 2026-02-31) y rangos incoherentes (extremo inferior superior al extremo superior).
     * @param {Object} filters - Criterios de búsqueda ya tipados por el controlador.
     * @throws {Error} Excepción HTTP 400 ante cualquier inconsistencia detectada.
     */
    static validateSearchFilters(filters) {
        const identificadores = ['id_pago', 'id_cliente', 'id_estado_pago', 'id_medio_pago'];
        const importes = ['monto', 'monto_min', 'monto_max'];
        const fechas = ['fecha_desde', 'fecha_hasta', 'creacion_desde', 'creacion_hasta', 'actualizacion_desde', 'actualizacion_hasta'];

        // Pares de campos que conforman un rango y deben respetar el orden desde <= hasta
        const rangos = [
            ['monto_min', 'monto_max'],
            ['fecha_desde', 'fecha_hasta'],
            ['creacion_desde', 'creacion_hasta'],
            ['actualizacion_desde', 'actualizacion_hasta']
        ];

        // Validación de identificadores: enteros estrictamente positivos
        for (const campo of identificadores) {
            const valor = filters[campo];
            if (valor === null || valor === undefined) continue;

            if (!Number.isInteger(valor) || valor <= 0) {
                const error = new Error(`El criterio de búsqueda '${campo}' debe ser un identificador numérico entero y positivo.`);
                error.statusCode = 400;
                throw error;
            }
        }

        // Validación de importes: valores numéricos finitos y nunca negativos
        for (const campo of importes) {
            const valor = filters[campo];
            if (valor === null || valor === undefined) continue;

            if (!Number.isFinite(valor) || valor < 0) {
                const error = new Error(`El criterio de búsqueda '${campo}' debe ser un importe numérico no negativo.`);
                error.statusCode = 400;
                throw error;
            }
        }

        // Validación de fechas: formato YYYY-MM-DD correspondiente a una fecha real de calendario
        for (const campo of fechas) {
            const valor = filters[campo];
            if (!valor) continue;

            const fecha = new Date(`${valor}T00:00:00Z`);
            const esFormatoValido = /^\d{4}-\d{2}-\d{2}$/.test(valor);
            const esFechaReal = !isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;

            if (!esFormatoValido || !esFechaReal) {
                const error = new Error(`El criterio de búsqueda '${campo}' debe expresar una fecha válida en formato YYYY-MM-DD.`);
                error.statusCode = 400;
                throw error;
            }
        }

        // Validación de coherencia operativa de los rangos declarados
        for (const [desde, hasta] of rangos) {
            const limiteInferior = filters[desde];
            const limiteSuperior = filters[hasta];
            if (limiteInferior === null || limiteInferior === undefined) continue;
            if (limiteSuperior === null || limiteSuperior === undefined) continue;

            if (limiteInferior > limiteSuperior) {
                const error = new Error(`El límite '${desde}' no puede ser posterior o superior al límite '${hasta}'.`);
                error.statusCode = 400;
                throw error;
            }
        }
    }

    /**
     * Recupera y procesa el historial de pagos registrados aplicando criterios de filtrado
     * acumulativos (lógica AND): valida la consistencia de los parámetros recibidos, descarta los
     * criterios no informados para que su omisión no invalide a los demás, y normaliza la salida
     * hacia una colección de DTOs planos (importes a dos decimales y fechas en formato ISO).
     * Resuelve el Requerimiento 31.1 de consulta y auditoría de pagos.
     * @param {Object} [filters={}] - Criterios opcionales de búsqueda provenientes del controlador.
     * @param {number|null} [filters.id_pago] - Número interno del pago.
     * @param {number|null} [filters.id_cliente] - Identificador del cliente asociado.
     * @param {number|null} [filters.id_estado_pago] - Identificador del estado de pago.
     * @param {number|null} [filters.id_medio_pago] - Identificador del medio de pago.
     * @param {number|null} [filters.monto] - Importe exacto del pago.
     * @param {number|null} [filters.monto_min] - Límite inferior del rango de importes.
     * @param {number|null} [filters.monto_max] - Límite superior del rango de importes.
     * @param {string|null} [filters.fecha_desde] - Límite inferior de la fecha de cobro (YYYY-MM-DD).
     * @param {string|null} [filters.fecha_hasta] - Límite superior de la fecha de cobro (YYYY-MM-DD).
     * @param {string|null} [filters.numero_comprobante] - Comprobante externo (coincidencia parcial).
     * @param {string|null} [filters.creacion_desde] - Límite inferior de la fecha de creación.
     * @param {string|null} [filters.creacion_hasta] - Límite superior de la fecha de creación.
     * @param {string|null} [filters.actualizacion_desde] - Límite inferior de la última actualización.
     * @param {string|null} [filters.actualizacion_hasta] - Límite superior de la última actualización.
     * @returns {Promise<Array<Object>>} Listado de pagos normalizados, del más reciente al más antiguo.
     * @throws {Error} Excepción HTTP 400 ante criterios inconsistentes, o errores propagados de la capa de datos.
     */
    static async getPayments(filters = {}) {

        // Validación de dominio previa a la consulta (Fail-Fast)
        this.validateSearchFilters(filters);

        // Depuración de criterios no informados, para no arrastrar claves vacías a la capa de datos
        const queryCriteria = {};
        Object.entries(filters).forEach(([campo, valor]) => {
            if (valor === null || valor === undefined || valor === '') return;
            queryCriteria[campo] = valor;
        });

        try {
            const payments = await Payment.findAll(queryCriteria);

            // Normalización hacia un DTO plano optimizado para el consumo del cliente web
            return payments.map(payment => ({
                ...payment,
                monto: Number(payment.monto).toFixed(2),
                fecha_pago: payment.fecha_pago ? new Date(payment.fecha_pago).toISOString() : null,
                fecha_creacion: payment.fecha_creacion ? new Date(payment.fecha_creacion).toISOString() : null,
                fecha_actualizacion: payment.fecha_actualizacion ? new Date(payment.fecha_actualizacion).toISOString() : null
            }));

        } catch (error) {
            console.error(`[PaymentService Error] Falla en subproceso getPayments: ${error.message}`);
            // Propagación limpia hacia el controlador REST
            throw error;
        }
    }

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
     * cliente, la validez del medio de pago y la consistencia del importe, y delega la
     * persistencia a la capa de datos. Por seguridad, todo pago se crea en estado "Borrador"
     * sin excepción (los pagos no son eliminables), aislado del balance computable del cliente
     * hasta que sea editado y confirmado explícitamente.
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

        // Regla de negocio: por seguridad, todo pago nace en estado "Borrador" sin excepción,
        // dado que los pagos no pueden eliminarse. Su confirmación (Aceptado/Pendiente de
        // acreditación/Rechazado) requiere una edición posterior explícita.
        const estados = await Payment.findAllStates();
        const estadoInicial = estados.find(e => e.nombre === ESTADOS_PAGO.BORRADOR);
        if (!estadoInicial) {
            const error = new Error(`El catálogo de estados de pago no posee configurado el estado "${ESTADOS_PAGO.BORRADOR}".`);
            error.statusCode = 500;
            throw error;
        }

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
