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

    describe('createPayment()', () => {

        const validPaymentDTO = {
            id_cliente: 1,
            id_medio_pago: 1,
            monto: 1500,
            fecha_pago: '2026-09-20',
            numero_comprobante: 'A-0001',
            observaciones: 'Pago de prueba'
        };

        const clienteActivo = { id_cliente: 1, nombre: 'Cliente Test', is_active: true };
        const medioInmediato = { id_medio_pago: 1, nombre: 'Efectivo', es_diferido: 0 };
        const medioDiferido = { id_medio_pago: 2, nombre: 'Cheque', es_diferido: 1 };
        const estadosCatalogo = [
            { id_estado_pago: 1, nombre: 'Borrador' },
            { id_estado_pago: 2, nombre: 'Pendiente de acreditación' },
            { id_estado_pago: 3, nombre: 'Aceptado' },
            { id_estado_pago: 4, nombre: 'Rechazado' }
        ];

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
            Payment.findAllStates.mockResolvedValue(estadosCatalogo);
            Payment.create.mockResolvedValue(11);

            const result = await PaymentService.createPayment({ ...validPaymentDTO, id_medio_pago: 2 });

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

        it.each(['id_cliente', 'id_medio_pago', 'fecha_pago'])('Debe lanzar 400 si falta el campo %s', async (campo) => {
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
        const medioDiferido = { id_medio_pago: 2, nombre: 'Cheque', es_diferido: 1 };
        const medioInmediato = { id_medio_pago: 1, nombre: 'Efectivo', es_diferido: 0 };
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
