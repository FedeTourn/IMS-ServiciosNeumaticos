const PaymentService = require('../src/services/payment.service');
const Payment = require('../src/models/Payment');
const Client = require('../src/models/Client');

// Mockeamos completamente la capa de datos
jest.mock('../src/models/Payment');
jest.mock('../src/models/Client');

describe('PaymentService - Pruebas Unitarias', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const clienteActivo = { id_cliente: 1, nombre: 'Cliente Test', is_active: true };
    const medioInmediato = { id_medio_pago: 1, nombre: 'Efectivo', es_diferido: 0 };
    const medioDiferido = { id_medio_pago: 2, nombre: 'Cheque', es_diferido: 1 };
    const bancoNacion = { id_banco: 5, nombre: 'Banco Nación' };
    const estadosCatalogo = [
        { id_estado_pago: 1, nombre: 'Borrador' },
        { id_estado_pago: 2, nombre: 'Pendiente de acreditación' },
        { id_estado_pago: 3, nombre: 'Aceptado' },
        { id_estado_pago: 4, nombre: 'Rechazado' }
    ];

    describe('createPayment()', () => {

        const validPaymentDTO = {
            id_cliente: 1,
            id_medio_pago: 1,
            monto: 1500,
            fecha_recepcion: '2026-09-20',
            numero_comprobante: 'A-0001',
            observaciones: 'Pago de prueba'
        };

        const validChequeDTO = {
            id_cliente: 1,
            id_medio_pago: 2,
            id_banco: 5,
            monto: 2500,
            fecha_recepcion: '2026-09-20',
            fecha_vencimiento: '2026-10-20',
            numero_comprobante: 'CH-0001'
        };

        it('Debe resolver siempre el estado "Borrador" con un medio de pago inmediato', async () => {
            Client.findById.mockResolvedValue(clienteActivo);
            Payment.findMethodById.mockResolvedValue(medioInmediato);
            Payment.findAllStates.mockResolvedValue(estadosCatalogo);
            Payment.create.mockResolvedValue(10);

            const result = await PaymentService.createPayment(validPaymentDTO);

            expect(Payment.create).toHaveBeenCalledWith(
                expect.objectContaining({ id_estado_pago: 1 })
            );
            expect(result.estado_pago_nombre).toBe('Borrador');
        });

        it('Debe resolver siempre el estado "Borrador" con un medio de pago diferido', async () => {
            Client.findById.mockResolvedValue(clienteActivo);
            Payment.findMethodById.mockResolvedValue(medioDiferido);
            Payment.findBankById.mockResolvedValue(bancoNacion);
            Payment.findAllStates.mockResolvedValue(estadosCatalogo);
            Payment.create.mockResolvedValue(11);

            const result = await PaymentService.createPayment(validChequeDTO);

            expect(Payment.create).toHaveBeenCalledWith(
                expect.objectContaining({ id_estado_pago: 1 })
            );
            expect(result.estado_pago_nombre).toBe('Borrador');
        });

        it('Debe lanzar 404 si Client.findById no encuentra al cliente', async () => {
            Client.findById.mockResolvedValue(null);

            await expect(PaymentService.createPayment(validPaymentDTO))
                .rejects.toEqual(expect.objectContaining({ statusCode: 404 }));

            expect(Payment.create).not.toHaveBeenCalled();
        });

        it('Debe lanzar 404 si el cliente existe pero está inactivo (is_active false)', async () => {
            Client.findById.mockResolvedValue({ ...clienteActivo, is_active: false });

            await expect(PaymentService.createPayment(validPaymentDTO))
                .rejects.toEqual(expect.objectContaining({ statusCode: 404 }));

            expect(Payment.create).not.toHaveBeenCalled();
        });

        it('Debe lanzar 404 si Payment.findMethodById no encuentra el medio de pago', async () => {
            Client.findById.mockResolvedValue(clienteActivo);
            Payment.findMethodById.mockResolvedValue(null);

            await expect(PaymentService.createPayment(validPaymentDTO))
                .rejects.toEqual(expect.objectContaining({ statusCode: 404 }));

            expect(Payment.create).not.toHaveBeenCalled();
        });

        it.each([0, -100, NaN, undefined])('Debe lanzar 400 si monto es inválido (%p)', async (monto) => {
            await expect(PaymentService.createPayment({ ...validPaymentDTO, monto }))
                .rejects.toEqual(expect.objectContaining({ statusCode: 400 }));

            expect(Client.findById).not.toHaveBeenCalled();
            expect(Payment.create).not.toHaveBeenCalled();
        });

        it.each(['id_cliente', 'id_medio_pago', 'fecha_recepcion'])('Debe lanzar 400 si falta el campo %s', async (campo) => {
            const dtoInvalido = { ...validPaymentDTO };
            delete dtoInvalido[campo];

            await expect(PaymentService.createPayment(dtoInvalido))
                .rejects.toEqual(expect.objectContaining({ statusCode: 400 }));

            expect(Payment.create).not.toHaveBeenCalled();
        });

        it('Debe lanzar 500 si el catálogo de estados no tiene configurado "Borrador"', async () => {
            Client.findById.mockResolvedValue(clienteActivo);
            Payment.findMethodById.mockResolvedValue(medioInmediato);
            Payment.findAllStates.mockResolvedValue([
                { id_estado_pago: 2, nombre: 'Pendiente de acreditación' },
                { id_estado_pago: 3, nombre: 'Aceptado' }
            ]);

            await expect(PaymentService.createPayment(validPaymentDTO))
                .rejects.toEqual(expect.objectContaining({ statusCode: 500 }));

            expect(Payment.create).not.toHaveBeenCalled();
        });

        describe('Datos del instrumento con medio de pago diferido', () => {

            beforeEach(() => {
                Client.findById.mockResolvedValue(clienteActivo);
                Payment.findMethodById.mockResolvedValue(medioDiferido);
                Payment.findBankById.mockResolvedValue(bancoNacion);
                Payment.findAllStates.mockResolvedValue(estadosCatalogo);
                Payment.create.mockResolvedValue(20);
            });

            it('Debe persistir el banco, el vencimiento y el comprobante recortado de espacios', async () => {
                const result = await PaymentService.createPayment({ ...validChequeDTO, numero_comprobante: '  CH-0001  ' });

                expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({
                    id_banco: 5,
                    fecha_vencimiento: '2026-10-20',
                    numero_comprobante: 'CH-0001'
                }));
                expect(result.banco_nombre).toBe('Banco Nación');
            });

            it.each([
                ['id_banco', null],
                ['fecha_vencimiento', null],
                ['numero_comprobante', undefined],
                ['numero_comprobante', ''],
                ['numero_comprobante', '   ']
            ])('Debe lanzar 400 si %s es %p', async (campo, valor) => {
                await expect(PaymentService.createPayment({ ...validChequeDTO, [campo]: valor }))
                    .rejects.toEqual(expect.objectContaining({ statusCode: 400 }));

                expect(Payment.create).not.toHaveBeenCalled();
            });

            it.each(['2026-02-31', '20-10-2026', 'mañana'])('Debe lanzar 400 si el vencimiento no es una fecha real (%p)', async (fecha_vencimiento) => {
                await expect(PaymentService.createPayment({ ...validChequeDTO, fecha_vencimiento }))
                    .rejects.toEqual(expect.objectContaining({ statusCode: 400 }));

                expect(Payment.create).not.toHaveBeenCalled();
            });

            it('Debe lanzar 400 si el vencimiento es anterior a la fecha de recepción', async () => {
                await expect(PaymentService.createPayment({ ...validChequeDTO, fecha_vencimiento: '2026-09-19' }))
                    .rejects.toEqual(expect.objectContaining({ statusCode: 400 }));

                expect(Payment.create).not.toHaveBeenCalled();
            });

            it('Debe aceptar un vencimiento igual a la fecha de recepción', async () => {
                await PaymentService.createPayment({ ...validChequeDTO, fecha_vencimiento: '2026-09-20' });

                expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({ fecha_vencimiento: '2026-09-20' }));
            });

            it('Debe aceptar un vencimiento ya pasado siempre que no sea anterior a la recepción', async () => {
                await PaymentService.createPayment({ ...validChequeDTO, fecha_recepcion: '2020-01-10', fecha_vencimiento: '2020-02-10' });

                expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({ fecha_vencimiento: '2020-02-10' }));
            });

            it('Debe lanzar 404 si el banco informado no existe', async () => {
                Payment.findBankById.mockResolvedValue(null);

                await expect(PaymentService.createPayment(validChequeDTO))
                    .rejects.toEqual(expect.objectContaining({ statusCode: 404 }));

                expect(Payment.create).not.toHaveBeenCalled();
            });
        });

        describe('Datos del instrumento con medio de pago inmediato', () => {

            beforeEach(() => {
                Client.findById.mockResolvedValue(clienteActivo);
                Payment.findMethodById.mockResolvedValue(medioInmediato);
                Payment.findAllStates.mockResolvedValue(estadosCatalogo);
                Payment.create.mockResolvedValue(30);
            });

            it('Debe persistir el banco y el vencimiento en null', async () => {
                const result = await PaymentService.createPayment(validPaymentDTO);

                expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({
                    id_banco: null,
                    fecha_vencimiento: null
                }));
                expect(result.banco_nombre).toBeNull();
                expect(Payment.findBankById).not.toHaveBeenCalled();
            });

            it('Debe persistir el comprobante en null cuando se informa vacío o solo con espacios', async () => {
                await PaymentService.createPayment({ ...validPaymentDTO, numero_comprobante: '   ' });

                expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({ numero_comprobante: null }));
            });

            it.each([
                ['id_banco', 5],
                ['fecha_vencimiento', '2026-10-20']
            ])('Debe lanzar 400 si se informa %s', async (campo, valor) => {
                await expect(PaymentService.createPayment({ ...validPaymentDTO, [campo]: valor }))
                    .rejects.toEqual(expect.objectContaining({ statusCode: 400 }));

                expect(Payment.create).not.toHaveBeenCalled();
            });
        });
    });

    describe('createBank()', () => {

        it('Debe normalizar los espacios del nombre antes de verificar duplicados e insertar', async () => {
            Payment.findBankByName.mockResolvedValue(null);
            Payment.createBank.mockResolvedValue(8);

            const result = await PaymentService.createBank({ nombre: '  Banco   Galicia  ' });

            expect(Payment.findBankByName).toHaveBeenCalledWith('Banco Galicia');
            expect(Payment.createBank).toHaveBeenCalledWith('Banco Galicia');
            expect(result).toEqual({ id_banco: 8, nombre: 'Banco Galicia' });
        });

        it('Debe aceptar un nombre de exactamente 50 caracteres', async () => {
            Payment.findBankByName.mockResolvedValue(null);
            Payment.createBank.mockResolvedValue(9);

            await PaymentService.createBank({ nombre: 'B'.repeat(50) });

            expect(Payment.createBank).toHaveBeenCalledWith('B'.repeat(50));
        });

        it.each(['', '   ', undefined, 'B'.repeat(51)])('Debe lanzar 400 si el nombre es inválido (%p)', async (nombre) => {
            await expect(PaymentService.createBank({ nombre }))
                .rejects.toEqual(expect.objectContaining({ statusCode: 400 }));

            expect(Payment.findBankByName).not.toHaveBeenCalled();
            expect(Payment.createBank).not.toHaveBeenCalled();
        });

        it('Debe lanzar 409 si ya existe un banco homónimo', async () => {
            Payment.findBankByName.mockResolvedValue({ id_banco: 1, nombre: 'Banco Galicia' });

            await expect(PaymentService.createBank({ nombre: 'banco galicia' }))
                .rejects.toEqual(expect.objectContaining({ statusCode: 409 }));

            expect(Payment.createBank).not.toHaveBeenCalled();
        });
    });

    describe('getBanks()', () => {
        it('Debe delegar directamente en Payment.findAllBanks y retornar su resultado', async () => {
            const mockBanks = [{ id_banco: 1, nombre: 'Banco Galicia' }];
            Payment.findAllBanks.mockResolvedValue(mockBanks);

            const result = await PaymentService.getBanks();

            expect(Payment.findAllBanks).toHaveBeenCalledTimes(1);
            expect(result).toBe(mockBanks);
        });
    });

    describe('getPayments()', () => {

        it('Debe invocar a Payment.findAll sin los criterios nulos, indefinidos o vacíos', async () => {
            Payment.findAll.mockResolvedValue([]);

            await PaymentService.getPayments({
                id_cliente: 3,
                id_banco: null,
                id_estado_pago: undefined,
                numero_comprobante: '',
                fecha_desde: '2026-01-01',
                sort_by: 'monto',
                sort_order: 'ASC'
            });

            expect(Payment.findAll).toHaveBeenCalledWith({
                id_cliente: 3,
                fecha_desde: '2026-01-01',
                sort_by: 'monto',
                sort_order: 'ASC'
            });
        });

        it('Debe trasladar el criterio id_banco a Payment.findAll cuando se informa', async () => {
            Payment.findAll.mockResolvedValue([]);

            await PaymentService.getPayments({ id_banco: 2 });

            expect(Payment.findAll).toHaveBeenCalledWith(expect.objectContaining({ id_banco: 2 }));
        });

        it('Debe forzar fecha_recepcion DESC ante un ordenamiento fuera de la lista blanca', async () => {
            Payment.findAll.mockResolvedValue([]);

            await PaymentService.getPayments({ sort_by: 'P.monto; DROP TABLE Pago', sort_order: 'LATERAL' });

            expect(Payment.findAll).toHaveBeenCalledWith(expect.objectContaining({
                sort_by: 'fecha_recepcion',
                sort_order: 'DESC'
            }));
        });

        it('Debe forzar fecha_recepcion DESC cuando no se informa ordenamiento', async () => {
            Payment.findAll.mockResolvedValue([]);

            await PaymentService.getPayments({});

            expect(Payment.findAll).toHaveBeenCalledWith({ sort_by: 'fecha_recepcion', sort_order: 'DESC' });
        });

        it('Debe normalizar el DTO, conservando banco y vencimiento en null para los cobros inmediatos', async () => {
            const fechaRecepcion = new Date(2026, 8, 20);
            const fechaCreacion = new Date('2026-09-20T15:30:00Z');
            Payment.findAll.mockResolvedValue([{
                id_pago: 1,
                monto: '1500.5',
                id_banco: null,
                banco_nombre: null,
                fecha_recepcion: fechaRecepcion,
                fecha_vencimiento: null,
                fecha_creacion: fechaCreacion,
                fecha_actualizacion: null
            }]);

            const [dto] = await PaymentService.getPayments({});

            expect(dto.monto).toBe('1500.50');
            expect(dto.fecha_recepcion).toBe(fechaRecepcion.toISOString());
            expect(dto.fecha_creacion).toBe(fechaCreacion.toISOString());
            expect(dto.id_banco).toBeNull();
            expect(dto.banco_nombre).toBeNull();
            expect(dto.fecha_vencimiento).toBeNull();
            expect(dto.fecha_actualizacion).toBeNull();
        });

        it.each([
            [{ id_banco: 1.5 }],
            [{ id_banco: -1 }],
            [{ id_cliente: 0 }],
            [{ monto: -1 }],
            [{ monto_min: NaN }],
            [{ fecha_desde: '2026/01/01' }],
            [{ fecha_hasta: '2026-02-31' }],
            [{ vencimiento_desde: '2026-13-01' }],
            [{ fecha_desde: '2026-05-01', fecha_hasta: '2026-04-01' }],
            [{ vencimiento_desde: '2026-05-01', vencimiento_hasta: '2026-04-01' }],
            [{ monto_min: 500, monto_max: 100 }]
        ])('Debe lanzar 400 ante criterios inválidos %p, sin invocar a Payment.findAll', async (filters) => {
            await expect(PaymentService.getPayments(filters))
                .rejects.toEqual(expect.objectContaining({ statusCode: 400 }));

            expect(Payment.findAll).not.toHaveBeenCalled();
        });

        it('Debe propagar el error de la capa de datos', async () => {
            Payment.findAll.mockRejectedValue(new Error('Error en la capa de datos al consultar los pagos.'));

            await expect(PaymentService.getPayments({}))
                .rejects.toThrow('Error en la capa de datos al consultar los pagos.');
        });
    });

    describe('updatePayment()', () => {

        const pagoBorradorInmediato = {
            id_pago: 7,
            id_cliente: 1,
            id_estado_pago: 1,
            estado_pago_nombre: 'Borrador',
            id_medio_pago: 1,
            medio_pago_nombre: 'Efectivo',
            es_diferido: 0,
            id_banco: null,
            banco_nombre: null,
            monto: '1000.00',
            fecha_recepcion: new Date(2026, 8, 20),
            fecha_vencimiento: null,
            numero_comprobante: null,
            observaciones: null,
            fecha_creacion: new Date(2026, 8, 20),
            fecha_actualizacion: null
        };

        const pagoBorradorCheque = {
            ...pagoBorradorInmediato,
            id_medio_pago: 2,
            medio_pago_nombre: 'Cheque',
            es_diferido: 1,
            id_banco: 5,
            banco_nombre: 'Banco Nación',
            fecha_vencimiento: new Date(2026, 9, 20),
            numero_comprobante: 'CH-0001'
        };

        it('Debe lanzar 404 si el pago no existe', async () => {
            Payment.findById.mockResolvedValue(null);

            await expect(PaymentService.updatePayment(99, { monto: 100 }))
                .rejects.toEqual(expect.objectContaining({ statusCode: 404 }));

            expect(Payment.update).not.toHaveBeenCalled();
        });

        it.each(['Pendiente de acreditación', 'Aceptado', 'Rechazado'])('Debe lanzar 409 si el pago está en estado "%s"', async (estado) => {
            Payment.findById.mockResolvedValue({ ...pagoBorradorInmediato, estado_pago_nombre: estado });

            await expect(PaymentService.updatePayment(7, { monto: 100 }))
                .rejects.toEqual(expect.objectContaining({ statusCode: 409 }));

            expect(Payment.update).not.toHaveBeenCalled();
        });

        it.each([0, -5, 'abc', null])('Debe lanzar 400 si el importe es inválido (%p)', async (monto) => {
            Payment.findById.mockResolvedValue(pagoBorradorInmediato);

            await expect(PaymentService.updatePayment(7, { monto }))
                .rejects.toEqual(expect.objectContaining({ statusCode: 400 }));

            expect(Payment.update).not.toHaveBeenCalled();
        });

        it('Debe lanzar 400 si la fecha de recepción se informa vacía', async () => {
            Payment.findById.mockResolvedValue(pagoBorradorInmediato);

            await expect(PaymentService.updatePayment(7, { fecha_recepcion: '' }))
                .rejects.toEqual(expect.objectContaining({ statusCode: 400 }));

            expect(Payment.update).not.toHaveBeenCalled();
        });

        it('Debe lanzar 404 si el nuevo medio de pago no existe', async () => {
            Payment.findById.mockResolvedValue(pagoBorradorInmediato);
            Payment.findMethodById.mockResolvedValue(null);

            await expect(PaymentService.updatePayment(7, { id_medio_pago: 99 }))
                .rejects.toEqual(expect.objectContaining({ statusCode: 404 }));

            expect(Payment.update).not.toHaveBeenCalled();
        });

        it('Debe consolidar el registro completo, descartar id_cliente y exigir el estado vigente en la guarda', async () => {
            Payment.findById
                .mockResolvedValueOnce(pagoBorradorInmediato)
                .mockResolvedValueOnce({ ...pagoBorradorInmediato, monto: '1500.00', observaciones: 'Corregido' });
            Payment.update.mockResolvedValue(1);

            const result = await PaymentService.updatePayment(7, { id_cliente: 2, monto: 1500, observaciones: 'Corregido' });

            expect(Payment.update).toHaveBeenCalledWith(7, {
                monto: 1500,
                id_medio_pago: 1,
                id_banco: null,
                id_estado_pago: 1,
                fecha_recepcion: '2026-09-20',
                fecha_vencimiento: null,
                numero_comprobante: null,
                observaciones: 'Corregido'
            }, 1);
            expect(Payment.update.mock.calls[0][1]).not.toHaveProperty('id_cliente');
            expect(result.monto).toBe('1500.00');
        });

        it('Debe lanzar 409 si la actualización no afecta filas (formalización concurrente)', async () => {
            Payment.findById.mockResolvedValue(pagoBorradorInmediato);
            Payment.update.mockResolvedValue(0);

            await expect(PaymentService.updatePayment(7, { monto: 1500 }))
                .rejects.toEqual(expect.objectContaining({ statusCode: 409 }));
        });

        it('Debe lanzar 409 al asignar "Aceptado" a un pago con medio diferido', async () => {
            Payment.findById.mockResolvedValue(pagoBorradorCheque);
            Payment.findMethodById.mockResolvedValue(medioDiferido);
            Payment.findStateById.mockResolvedValue({ id_estado_pago: 3, nombre: 'Aceptado' });

            await expect(PaymentService.updatePayment(7, { id_estado_pago: 3 }))
                .rejects.toEqual(expect.objectContaining({ statusCode: 409 }));

            expect(Payment.update).not.toHaveBeenCalled();
        });

        it('Debe permitir promover a "Aceptado" un pago con medio inmediato', async () => {
            Payment.findById.mockResolvedValue(pagoBorradorInmediato);
            Payment.findMethodById.mockResolvedValue(medioInmediato);
            Payment.findStateById.mockResolvedValue({ id_estado_pago: 3, nombre: 'Aceptado' });
            Payment.update.mockResolvedValue(1);

            await PaymentService.updatePayment(7, { id_estado_pago: 3 });

            expect(Payment.update).toHaveBeenCalledWith(7, expect.objectContaining({ id_estado_pago: 3 }), 1);
        });

        it('Debe limpiar el banco y el vencimiento al convertir un cheque en un medio inmediato', async () => {
            Payment.findById.mockResolvedValue(pagoBorradorCheque);
            Payment.findMethodById.mockResolvedValue(medioInmediato);
            Payment.update.mockResolvedValue(1);

            await PaymentService.updatePayment(7, { id_medio_pago: 1 });

            expect(Payment.update).toHaveBeenCalledWith(7, expect.objectContaining({
                id_medio_pago: 1,
                id_banco: null,
                fecha_vencimiento: null,
                numero_comprobante: 'CH-0001'
            }), 1);
        });

        it('Debe lanzar 400 si al convertir a medio inmediato se informa explícitamente un banco', async () => {
            Payment.findById.mockResolvedValue(pagoBorradorCheque);
            Payment.findMethodById.mockResolvedValue(medioInmediato);

            await expect(PaymentService.updatePayment(7, { id_medio_pago: 1, id_banco: 5 }))
                .rejects.toEqual(expect.objectContaining({ statusCode: 400 }));

            expect(Payment.update).not.toHaveBeenCalled();
        });

        it('Debe lanzar 400 al convertir un medio inmediato en diferido sin los datos del cheque', async () => {
            Payment.findById.mockResolvedValue(pagoBorradorInmediato);
            Payment.findMethodById.mockResolvedValue(medioDiferido);

            await expect(PaymentService.updatePayment(7, { id_medio_pago: 2 }))
                .rejects.toEqual(expect.objectContaining({ statusCode: 400 }));

            expect(Payment.update).not.toHaveBeenCalled();
        });

        it('Debe convertir un medio inmediato en diferido cuando se informan los tres datos del cheque', async () => {
            Payment.findById.mockResolvedValue(pagoBorradorInmediato);
            Payment.findMethodById.mockResolvedValue(medioDiferido);
            Payment.findBankById.mockResolvedValue(bancoNacion);
            Payment.update.mockResolvedValue(1);

            await PaymentService.updatePayment(7, {
                id_medio_pago: 2,
                id_banco: 5,
                numero_comprobante: 'CH-0002',
                fecha_vencimiento: '2026-10-20'
            });

            expect(Payment.update).toHaveBeenCalledWith(7, expect.objectContaining({
                id_medio_pago: 2,
                id_banco: 5,
                numero_comprobante: 'CH-0002',
                fecha_vencimiento: '2026-10-20'
            }), 1);
        });

        it('Debe lanzar 400 si la nueva fecha de recepción es posterior al vencimiento vigente del cheque', async () => {
            Payment.findById.mockResolvedValue(pagoBorradorCheque);
            Payment.findBankById.mockResolvedValue(bancoNacion);

            await expect(PaymentService.updatePayment(7, { fecha_recepcion: '2026-11-01' }))
                .rejects.toEqual(expect.objectContaining({ statusCode: 400 }));

            expect(Payment.update).not.toHaveBeenCalled();
        });
    });

    describe('deletePayment()', () => {

        const pagoBorrador = { id_pago: 7, id_estado_pago: 1, estado_pago_nombre: 'Borrador' };

        it('Debe eliminar un pago en "Borrador", exigiendo el estado vigente en la guarda', async () => {
            Payment.findById.mockResolvedValue(pagoBorrador);
            Payment.delete.mockResolvedValue(1);

            const result = await PaymentService.deletePayment(7);

            expect(Payment.delete).toHaveBeenCalledWith(7, 1);
            expect(result).toEqual({ id_pago: 7 });
        });

        it('Debe lanzar 404 si el pago no existe', async () => {
            Payment.findById.mockResolvedValue(null);

            await expect(PaymentService.deletePayment(99))
                .rejects.toEqual(expect.objectContaining({ statusCode: 404 }));

            expect(Payment.delete).not.toHaveBeenCalled();
        });

        it.each(['Pendiente de acreditación', 'Aceptado', 'Rechazado'])('Debe lanzar 409 si el pago está en estado "%s"', async (estado) => {
            Payment.findById.mockResolvedValue({ ...pagoBorrador, estado_pago_nombre: estado });

            await expect(PaymentService.deletePayment(7))
                .rejects.toEqual(expect.objectContaining({ statusCode: 409 }));

            expect(Payment.delete).not.toHaveBeenCalled();
        });

        it('Debe lanzar 409 si la baja no afecta filas (formalización concurrente)', async () => {
            Payment.findById.mockResolvedValue(pagoBorrador);
            Payment.delete.mockResolvedValue(0);

            await expect(PaymentService.deletePayment(7))
                .rejects.toEqual(expect.objectContaining({ statusCode: 409 }));
        });
    });

    describe('getAllPaymentStates()', () => {
        it('Debe delegar directamente en Payment.findAllStates y retornar su resultado', async () => {
            const mockStates = [{ id_estado_pago: 1, nombre: 'Borrador' }];
            Payment.findAllStates.mockResolvedValue(mockStates);

            const result = await PaymentService.getAllPaymentStates();

            expect(Payment.findAllStates).toHaveBeenCalledTimes(1);
            expect(result).toBe(mockStates);
        });
    });

    describe('getAllPaymentMethods()', () => {
        it('Debe delegar directamente en Payment.findAllMethods y retornar su resultado', async () => {
            const mockMethods = [{ id_medio_pago: 1, nombre: 'Efectivo', es_diferido: 0 }];
            Payment.findAllMethods.mockResolvedValue(mockMethods);

            const result = await PaymentService.getAllPaymentMethods();

            expect(Payment.findAllMethods).toHaveBeenCalledTimes(1);
            expect(result).toBe(mockMethods);
        });
    });

    describe('validatePaymentStatusAssignment()', () => {
        const estadoAceptado = { id_estado_pago: 3, nombre: 'Aceptado' };
        const estadoBorrador = { id_estado_pago: 1, nombre: 'Borrador' };

        it('Debe lanzar 409 si se intenta asignar "Aceptado" a un medio diferido', async () => {
            Payment.findMethodById.mockResolvedValue(medioDiferido);
            Payment.findStateById.mockResolvedValue(estadoAceptado);

            await expect(PaymentService.validatePaymentStatusAssignment(2, 3))
                .rejects.toEqual(expect.objectContaining({ statusCode: 409 }));
        });

        it('Debe resolver sin error al asignar "Borrador" a un medio diferido', async () => {
            Payment.findMethodById.mockResolvedValue(medioDiferido);
            Payment.findStateById.mockResolvedValue(estadoBorrador);

            await expect(PaymentService.validatePaymentStatusAssignment(2, 1))
                .resolves.toEqual(estadoBorrador);
        });

        it('Debe resolver sin error al asignar "Aceptado" a un medio inmediato', async () => {
            Payment.findMethodById.mockResolvedValue(medioInmediato);
            Payment.findStateById.mockResolvedValue(estadoAceptado);

            await expect(PaymentService.validatePaymentStatusAssignment(1, 3))
                .resolves.toEqual(estadoAceptado);
        });

        it('Debe lanzar 400 si falta id_medio_pago o id_estado_pago', async () => {
            await expect(PaymentService.validatePaymentStatusAssignment(null, 1))
                .rejects.toEqual(expect.objectContaining({ statusCode: 400 }));

            expect(Payment.findMethodById).not.toHaveBeenCalled();
        });

        it('Debe lanzar 404 si el medio de pago no existe', async () => {
            Payment.findMethodById.mockResolvedValue(null);

            await expect(PaymentService.validatePaymentStatusAssignment(99, 1))
                .rejects.toEqual(expect.objectContaining({ statusCode: 404 }));
        });

        it('Debe lanzar 404 si el estado de pago no existe', async () => {
            Payment.findMethodById.mockResolvedValue(medioInmediato);
            Payment.findStateById.mockResolvedValue(null);

            await expect(PaymentService.validatePaymentStatusAssignment(1, 99))
                .rejects.toEqual(expect.objectContaining({ statusCode: 404 }));
        });
    });
});
