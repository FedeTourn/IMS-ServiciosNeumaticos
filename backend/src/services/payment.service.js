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
        const identificadores = ['id_pago', 'id_cliente', 'id_estado_pago', 'id_medio_pago', 'id_banco'];
        const importes = ['monto', 'monto_min', 'monto_max'];
        const fechas = ['fecha_desde', 'fecha_hasta', 'vencimiento_desde', 'vencimiento_hasta', 'creacion_desde', 'creacion_hasta', 'actualizacion_desde', 'actualizacion_hasta'];

        // Pares de campos que conforman un rango y deben respetar el orden desde <= hasta
        const rangos = [
            ['monto_min', 'monto_max'],
            ['fecha_desde', 'fecha_hasta'],
            ['vencimiento_desde', 'vencimiento_hasta'],
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
     * @param {number|null} [filters.id_banco] - Identificador del banco emisor.
     * @param {number|null} [filters.monto] - Importe exacto del pago.
     * @param {number|null} [filters.monto_min] - Límite inferior del rango de importes.
     * @param {number|null} [filters.monto_max] - Límite superior del rango de importes.
     * @param {string|null} [filters.fecha_desde] - Límite inferior de la fecha de recepción (YYYY-MM-DD).
     * @param {string|null} [filters.fecha_hasta] - Límite superior de la fecha de recepción (YYYY-MM-DD).
     * @param {string|null} [filters.vencimiento_desde] - Límite inferior de la fecha de vencimiento (YYYY-MM-DD).
     * @param {string|null} [filters.vencimiento_hasta] - Límite superior de la fecha de vencimiento (YYYY-MM-DD).
     * @param {string|null} [filters.numero_comprobante] - Comprobante externo (coincidencia parcial).
     * @param {string|null} [filters.creacion_desde] - Límite inferior de la fecha de creación.
     * @param {string|null} [filters.creacion_hasta] - Límite superior de la fecha de creación.
     * @param {string|null} [filters.actualizacion_desde] - Límite inferior de la última actualización.
     * @param {string|null} [filters.actualizacion_hasta] - Límite superior de la última actualización.
     * @param {string} [filters.sort_by='fecha_recepcion'] - Concepto base para ordenar la grilla de datos.
     * @param {string} [filters.sort_order='DESC'] - Sentido del ordenamiento ('ASC' o 'DESC').
     * @returns {Promise<Array<Object>>} Listado de pagos normalizados, del más reciente al más antiguo.
     * @throws {Error} Excepción HTTP 400 ante criterios inconsistentes, o errores propagados de la capa de datos.
     */
    static async getPayments(filters = {}) {

        // Validación de dominio previa a la consulta (Fail-Fast)
        this.validateSearchFilters(filters);

        const { sort_by = null, sort_order = 'DESC' } = filters;

        const allowedSortColumns = [
            'id_pago',
            'cliente_nombre',
            'monto',
            'medio_pago_nombre',
            'banco_nombre',
            'numero_comprobante',
            'estado_pago_nombre',
            'fecha_recepcion',
            'fecha_vencimiento',
            'fecha_creacion',
            'fecha_actualizacion'
        ];
        const allowedSortOrders = ['ASC', 'DESC'];

        // Validación de Lista Blanca (Whitelisting) para sanitizar el ordenamiento
        const validatedSortBy = allowedSortColumns.includes(sort_by) ? sort_by : 'fecha_recepcion';
        // Se previene un posible error si sort_order viene como null o undefined evaluando con fallback
        const validatedSortOrder = allowedSortOrders.includes(sort_order?.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

        // Depuración de criterios no informados, para no arrastrar claves vacías a la capa de datos
        const queryCriteria = {};
        Object.entries(filters).forEach(([campo, valor]) => {
            if (valor === null || valor === undefined || valor === '') return;
            queryCriteria[campo] = valor;
        });

        // El ordenamiento ya saneado prevalece sobre lo recibido desde la capa de presentación
        queryCriteria.sort_by = validatedSortBy;
        queryCriteria.sort_order = validatedSortOrder;

        try {
            const payments = await Payment.findAll(queryCriteria);

            // Normalización hacia un DTO plano optimizado para el consumo del cliente web. El banco
            // y el vencimiento viajan en null en los cobros inmediatos: su representación es de la UI.
            return payments.map(payment => ({
                ...payment,
                monto: Number(payment.monto).toFixed(2),
                fecha_recepcion: payment.fecha_recepcion ? new Date(payment.fecha_recepcion).toISOString() : null,
                fecha_vencimiento: payment.fecha_vencimiento ? new Date(payment.fecha_vencimiento).toISOString() : null,
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
     * Obtiene el catálogo completo de entidades bancarias, ordenado alfabéticamente.
     * Resuelve el Requerimiento 31 de exposición del catálogo de bancos.
     * @returns {Promise<Array<Object>>} Listado de bancos disponibles.
     */
    static async getBanks() {
        const banks = await Payment.findAllBanks();
        return banks;
    }

    /**
     * Orquesta el alta de una nueva entidad bancaria: normaliza el nombre recibido (recorte de
     * espacios en los extremos y colapso de los internos) y rechaza los homónimos antes de delegar
     * la inserción, para que el catálogo no se fragmente en variantes del mismo banco.
     * Resuelve el Requerimiento 31 de alta de bancos desde el formulario de pagos.
     * @param {Object} bankData - Datos del banco provenientes del controlador.
     * @param {string} bankData.nombre - Nombre de la entidad bancaria.
     * @returns {Promise<Object>} El banco creado, con su identificador y su nombre normalizado.
     * @throws {Error} Excepción HTTP 400 ante un nombre vacío o demasiado extenso, o 409 si ya existe.
     */
    static async createBank(bankData) {
        const nombre = typeof bankData.nombre === 'string' ? bankData.nombre.trim().replace(/\s+/g, ' ') : '';

        if (!nombre || nombre.length > 50) {
            const error = new Error('El nombre del banco es obligatorio y no puede superar los 50 caracteres.');
            error.statusCode = 400;
            throw error;
        }

        // Regla de negocio: unicidad del catálogo (la colación ignora mayúsculas y acentos)
        const bancoExistente = await Payment.findBankByName(nombre);
        if (bancoExistente) {
            const error = new Error(`Ya existe un banco registrado bajo el nombre "${bancoExistente.nombre}".`);
            error.statusCode = 409;
            throw error;
        }

        const insertId = await Payment.createBank(nombre);

        return { id_banco: insertId, nombre };
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
     * Expresa una fecha de calendario en formato YYYY-MM-DD. Las columnas DATE llegan desde la capa
     * de datos como objetos Date a la medianoche local, por lo que se toman sus componentes locales
     * para no correr el día; las fechas recibidas como texto se devuelven sin alterar.
     * @param {Date|string} fecha - Fecha a normalizar.
     * @returns {string} La fecha en formato YYYY-MM-DD.
     */
    static formatCalendarDate(fecha) {
        if (!(fecha instanceof Date)) return fecha;

        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        return `${anio}-${mes}-${dia}`;
    }

    /**
     * Resuelve de forma conjunta los atributos propios de un instrumento diferido (banco emisor,
     * número de comprobante y fecha de vencimiento) según la bandera `es_diferido` del medio de
     * cobro, y nunca según su nombre ni su identificador. En un medio diferido los tres son
     * obligatorios; en uno inmediato el banco y el vencimiento son inadmisibles y el comprobante
     * es optativo. Concentra la regla para que el registro y la modificación la apliquen por igual.
     * @param {Object} medio - Registro de MedioPago resultante, con su bandera `es_diferido`.
     * @param {Object} instrumentData - Atributos del instrumento a validar.
     * @param {number|null} [instrumentData.id_banco] - Banco emisor informado.
     * @param {string|null} [instrumentData.numero_comprobante] - Número de comprobante externo.
     * @param {Date|string|null} [instrumentData.fecha_vencimiento] - Fecha de presentación al cobro.
     * @param {Date|string} instrumentData.fecha_recepcion - Fecha de recepción del cobro.
     * @returns {Promise<Object>} Atributos resueltos a persistir (`id_banco`, `banco_nombre`,
     * `numero_comprobante`, `fecha_vencimiento`), en null cuando no corresponden.
     * @throws {Error} Excepción HTTP 400 ante datos faltantes, inadmisibles o incoherentes, o 404 si el banco no existe.
     */
    static async resolveDeferredInstrument(medio, instrumentData) {
        const { id_banco, numero_comprobante, fecha_vencimiento, fecha_recepcion } = instrumentData;

        // El comprobante se persiste recortado; vacío o solo espacios equivale a no informado
        const comprobante = (numero_comprobante === null || numero_comprobante === undefined) ? '' : String(numero_comprobante).trim();
        const comprobanteResuelto = comprobante || null;

        // Medio inmediato: banco y vencimiento no corresponden y se rechazan si se informan
        if (!medio.es_diferido) {
            if ((id_banco !== null && id_banco !== undefined) || (fecha_vencimiento !== null && fecha_vencimiento !== undefined)) {
                const error = new Error(`El medio de pago "${medio.nombre}" no es diferido: no admite banco emisor ni fecha de vencimiento.`);
                error.statusCode = 400;
                throw error;
            }
            return { id_banco: null, banco_nombre: null, numero_comprobante: comprobanteResuelto, fecha_vencimiento: null };
        }

        // Medio diferido: los tres datos que identifican al cheque son obligatorios
        if (!id_banco || !comprobanteResuelto || !fecha_vencimiento) {
            const error = new Error(`El medio de pago "${medio.nombre}" es diferido: el banco emisor, el número de comprobante y la fecha de vencimiento son obligatorios.`);
            error.statusCode = 400;
            throw error;
        }

        // Validación temporal: fecha real de calendario y no anterior a la recepción del cobro
        const vencimiento = this.formatCalendarDate(fecha_vencimiento);
        const fecha = new Date(`${vencimiento}T00:00:00Z`);
        const esFormatoValido = /^\d{4}-\d{2}-\d{2}$/.test(vencimiento);
        const esFechaReal = !isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === vencimiento;

        if (!esFormatoValido || !esFechaReal) {
            const error = new Error('La fecha de vencimiento debe expresar una fecha válida en formato YYYY-MM-DD.');
            error.statusCode = 400;
            throw error;
        }

        if (vencimiento < this.formatCalendarDate(fecha_recepcion)) {
            const error = new Error('La fecha de vencimiento no puede ser anterior a la fecha de recepción del cobro.');
            error.statusCode = 400;
            throw error;
        }

        // Validación de la existencia del banco emisor en el catálogo
        const banco = await Payment.findBankById(id_banco);
        if (!banco) {
            const error = new Error(`No se encontró un banco registrado bajo el identificador #${id_banco}.`);
            error.statusCode = 404;
            throw error;
        }

        return { id_banco: banco.id_banco, banco_nombre: banco.nombre, numero_comprobante: comprobanteResuelto, fecha_vencimiento: vencimiento };
    }

    /**
     * Orquesta la creación de un nuevo registro de pago: valida la existencia y vigencia del
     * cliente, la validez del medio de pago, la coherencia de los datos del instrumento diferido
     * y la consistencia del importe, y delega la persistencia a la capa de datos. Por seguridad,
     * todo pago se crea en estado "Borrador" sin excepción, aislado del balance computable del
     * cliente hasta que sea editado y confirmado explícitamente.
     * @param {Object} paymentData - Datos del pago provenientes del controlador.
     * @param {number} paymentData.id_cliente - Identificador del cliente asociado al pago.
     * @param {number} paymentData.id_medio_pago - Identificador del medio de pago utilizado.
     * @param {number|null} [paymentData.id_banco] - Banco emisor (obligatorio en medios diferidos).
     * @param {number|string} paymentData.monto - Importe del pago (estrictamente positivo).
     * @param {string} paymentData.fecha_recepcion - Fecha en que el taller recibió el cobro (YYYY-MM-DD).
     * @param {string|null} [paymentData.fecha_vencimiento] - Fecha de presentación al cobro (obligatoria en medios diferidos).
     * @param {string} [paymentData.numero_comprobante] - Número de comprobante externo (obligatorio en medios diferidos).
     * @param {string} [paymentData.observaciones] - Observaciones adicionales (opcional).
     * @returns {Promise<Object>} El registro de pago creado, incluyendo su identificador, estado inicial y banco emisor.
     */
    static async createPayment(paymentData) {
        const { id_cliente, id_medio_pago, id_banco, monto, fecha_recepcion, fecha_vencimiento, numero_comprobante, observaciones } = paymentData;

        if (!id_cliente || !id_medio_pago || !fecha_recepcion) {
            const error = new Error('El cliente, el medio de pago y la fecha de recepción son obligatorios para registrar el pago.');
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

        // Regla de negocio: coherencia entre el medio de cobro y los datos del instrumento diferido
        const instrumento = await this.resolveDeferredInstrument(medio, { id_banco, numero_comprobante, fecha_vencimiento, fecha_recepcion });

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
            id_banco: instrumento.id_banco,
            monto: montoNumerico,
            fecha_recepcion,
            fecha_vencimiento: instrumento.fecha_vencimiento,
            numero_comprobante: instrumento.numero_comprobante,
            observaciones
        };

        const insertId = await Payment.create(dataToPersist);

        return {
            id_pago: insertId,
            ...dataToPersist,
            estado_pago_nombre: estadoInicial.nombre,
            banco_nombre: instrumento.banco_nombre
        };
    }

    /**
     * Orquesta la modificación de un pago existente. Solo admite la mutación mientras el registro
     * permanece en estado "Borrador": alcanzado cualquier estado definitivo, el pago se vuelve
     * inmutable para preservar la consistencia contable del cliente. Valida el importe, la
     * existencia del medio de pago, la correspondencia entre el medio de cobro resultante y el
     * estado solicitado, y la coherencia de los datos del instrumento diferido sobre el registro
     * resultante, consolidando el registro completo a persistir a partir del pago vigente.
     * Resuelve el Requerimiento 32 de modificación de pagos.
     * @param {number|string} id - Identificador del pago a modificar.
     * @param {Object} updateData - Campos mutables provenientes del controlador.
     * @param {number|string} [updateData.monto] - Nuevo importe del pago (estrictamente positivo).
     * @param {number} [updateData.id_medio_pago] - Nuevo medio de pago utilizado.
     * @param {number|null} [updateData.id_banco] - Nuevo banco emisor (solo en medios diferidos).
     * @param {number} [updateData.id_estado_pago] - Estado operativo destino del pago.
     * @param {string} [updateData.fecha_recepcion] - Nueva fecha de recepción del cobro (YYYY-MM-DD).
     * @param {string|null} [updateData.fecha_vencimiento] - Nueva fecha de vencimiento (solo en medios diferidos).
     * @param {string|null} [updateData.numero_comprobante] - Nuevo comprobante de respaldo.
     * @param {string|null} [updateData.observaciones] - Nuevas observaciones del pago.
     * @returns {Promise<Object>} El pago actualizado y normalizado, con sus entidades relacionadas.
     * @throws {Error} Excepción HTTP 404 si el pago o las entidades referidas no existen, 400 ante
     * datos inconsistentes, o 409 si el pago ya no es mutable.
     */
    static async updatePayment(id, updateData) {
        const pagoVigente = await Payment.findById(id);
        if (!pagoVigente) {
            const error = new Error(`No se encontró un pago registrado bajo el identificador #${id}.`);
            error.statusCode = 404;
            throw error;
        }

        // Regla de negocio: Inmutabilidad fuera del estado "Borrador" (Fail-Fast)
        if (pagoVigente.estado_pago_nombre !== ESTADOS_PAGO.BORRADOR) {
            const error = new Error(`El pago #${id} se encuentra en estado "${pagoVigente.estado_pago_nombre}" y ya no admite modificaciones.`);
            error.statusCode = 409;
            throw error;
        }

        // El cliente asociado se omite deliberadamente: un pago no puede reasignarse a otro cliente
        const { monto, id_medio_pago, id_banco, id_estado_pago, fecha_recepcion, fecha_vencimiento, numero_comprobante, observaciones } = updateData;

        // Cada campo se evalúa contra undefined para distinguir un criterio ausente de un valor
        // vacío enviado a propósito, que debe llegar a la base de datos como tal.
        let montoResuelto = Number(pagoVigente.monto);
        if (monto !== undefined) {
            const montoNumerico = Number(monto);
            if (!monto || Number.isNaN(montoNumerico) || montoNumerico <= 0) {
                const error = new Error('El importe del pago debe ser un número positivo.');
                error.statusCode = 400;
                throw error;
            }
            montoResuelto = montoNumerico;
        }

        let fechaResuelta = this.formatCalendarDate(pagoVigente.fecha_recepcion);
        if (fecha_recepcion !== undefined) {
            if (!fecha_recepcion) {
                const error = new Error('La fecha de recepción no puede quedar vacía.');
                error.statusCode = 400;
                throw error;
            }
            fechaResuelta = fecha_recepcion;
        }

        // Validación de la existencia del medio de pago informado. El medio resultante (el nuevo
        // si se cambió, el vigente si no) gobierna la exigibilidad de los datos del cheque.
        let medioResuelto = {
            id_medio_pago: pagoVigente.id_medio_pago,
            nombre: pagoVigente.medio_pago_nombre,
            es_diferido: pagoVigente.es_diferido
        };
        if (id_medio_pago !== undefined) {
            const medio = await Payment.findMethodById(id_medio_pago);
            if (!medio) {
                const error = new Error(`No se encontró un medio de pago registrado bajo el identificador #${id_medio_pago}.`);
                error.statusCode = 404;
                throw error;
            }
            medioResuelto = medio;
        }

        // Regla de negocio: un medio de acreditación diferida no puede quedar "Aceptado" de forma
        // directa. La guarda se evalúa sobre el medio de cobro resultante de esta edición.
        let idEstadoResuelto = pagoVigente.id_estado_pago;
        if (id_estado_pago !== undefined) {
            const estadoValidado = await this.validatePaymentStatusAssignment(medioResuelto.id_medio_pago, id_estado_pago);
            idEstadoResuelto = estadoValidado.id_estado_pago;
        }

        // Regla de negocio: coherencia del instrumento resultante. El banco y el vencimiento vigentes
        // solo se heredan si el medio resultante es diferido; si la edición convierte un cheque en un
        // cobro inmediato, se descartan y solo se rechaza lo informado explícitamente en la edición.
        const heredaInstrumento = !!medioResuelto.es_diferido;
        const instrumento = await this.resolveDeferredInstrument(medioResuelto, {
            id_banco: id_banco !== undefined ? id_banco : (heredaInstrumento ? pagoVigente.id_banco : null),
            numero_comprobante: numero_comprobante !== undefined ? numero_comprobante : pagoVigente.numero_comprobante,
            fecha_vencimiento: fecha_vencimiento !== undefined ? fecha_vencimiento : (heredaInstrumento ? pagoVigente.fecha_vencimiento : null),
            fecha_recepcion: fechaResuelta
        });

        const dataToPersist = {
            monto: montoResuelto,
            id_medio_pago: medioResuelto.id_medio_pago,
            id_banco: instrumento.id_banco,
            id_estado_pago: idEstadoResuelto,
            fecha_recepcion: fechaResuelta,
            fecha_vencimiento: instrumento.fecha_vencimiento,
            numero_comprobante: instrumento.numero_comprobante,
            observaciones: observaciones !== undefined ? observaciones : pagoVigente.observaciones
        };

        // El estado vigente oficia de guarda dentro de la propia sentencia SQL: si otro operador
        // formalizó el pago entre la lectura y la escritura, ninguna fila resulta afectada.
        const affectedRows = await Payment.update(id, dataToPersist, pagoVigente.id_estado_pago);
        if (affectedRows === 0) {
            const error = new Error(`El pago #${id} fue formalizado por otra operación y ya no admite modificaciones.`);
            error.statusCode = 409;
            throw error;
        }

        const pagoActualizado = await Payment.findById(id);

        // Normalización hacia un DTO plano optimizado para el consumo del cliente web
        return {
            ...pagoActualizado,
            monto: Number(pagoActualizado.monto).toFixed(2),
            fecha_recepcion: pagoActualizado.fecha_recepcion ? new Date(pagoActualizado.fecha_recepcion).toISOString() : null,
            fecha_vencimiento: pagoActualizado.fecha_vencimiento ? new Date(pagoActualizado.fecha_vencimiento).toISOString() : null,
            fecha_creacion: pagoActualizado.fecha_creacion ? new Date(pagoActualizado.fecha_creacion).toISOString() : null,
            fecha_actualizacion: pagoActualizado.fecha_actualizacion ? new Date(pagoActualizado.fecha_actualizacion).toISOString() : null
        };
    }

    /**
     * Orquesta la baja de un pago. La eliminación se admite únicamente mientras el registro
     * permanece en estado "Borrador", dado que un borrador nunca impactó el saldo consolidado del
     * cliente y su descarte no deja inconsistencias contables.
     * Resuelve el Requerimiento 32 de descarte de pagos.
     * @param {number|string} id - Identificador del pago a eliminar.
     * @returns {Promise<Object>} Identificador del pago dado de baja.
     * @throws {Error} Excepción HTTP 404 si el pago no existe, o 409 si ya no admite la baja.
     */
    static async deletePayment(id) {
        const pagoVigente = await Payment.findById(id);
        if (!pagoVigente) {
            const error = new Error(`No se encontró un pago registrado bajo el identificador #${id}.`);
            error.statusCode = 404;
            throw error;
        }

        // Regla de negocio: Baja acotada al estado "Borrador" (Fail-Fast)
        if (pagoVigente.estado_pago_nombre !== ESTADOS_PAGO.BORRADOR) {
            const error = new Error(`El pago #${id} se encuentra en estado "${pagoVigente.estado_pago_nombre}" y ya no admite ser eliminado.`);
            error.statusCode = 409;
            throw error;
        }

        const affectedRows = await Payment.delete(id, pagoVigente.id_estado_pago);
        if (affectedRows === 0) {
            const error = new Error(`El pago #${id} fue formalizado por otra operación y ya no admite ser eliminado.`);
            error.statusCode = 409;
            throw error;
        }

        return { id_pago: pagoVigente.id_pago };
    }

}

module.exports = PaymentService;
