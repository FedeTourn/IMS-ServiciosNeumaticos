const request = require('supertest');
const express = require('express');
const paymentRoutes = require('../src/routes/payment.routes');
const PaymentService = require('../src/services/payment.service');

jest.mock('../src/services/payment.service');

const app = express();
app.use(express.json());
app.use('/api/payment', paymentRoutes);

describe('PaymentController - API REST Endpoints', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/payment', () => {
        const validPayload = {
            id_cliente: 1,
            id_medio_pago: 1,
            monto: 1500,
            fecha_recepcion: '2026-09-20'
        };

        it('Debe retornar 201 y el data devuelto por PaymentService.createPayment cuando el payload es válido', async () => {
            const mockResult = { id_pago: 1, estado_pago_nombre: 'Borrador' };
            PaymentService.createPayment.mockResolvedValue(mockResult);

            const res = await request(app).post('/api/payment').send(validPayload);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(mockResult);
        });

        it.each(['id_cliente', 'id_medio_pago', 'fecha_recepcion'])('Debe retornar 400 si falta %s, sin invocar al servicio', async (campo) => {
            const invalidPayload = { ...validPayload };
            delete invalidPayload[campo];

            const res = await request(app).post('/api/payment').send(invalidPayload);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(PaymentService.createPayment).not.toHaveBeenCalled();
        });

        it('Debe retornar 400 si falta monto, sin invocar al servicio', async () => {
            const invalidPayload = { ...validPayload, monto: undefined };

            const res = await request(app).post('/api/payment').send(invalidPayload);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(PaymentService.createPayment).not.toHaveBeenCalled();
        });

        it.each([404, 400, 409])('Debe propagar el statusCode %i de la excepción del servicio', async (statusCode) => {
            const error = new Error('Error de negocio simulado');
            error.statusCode = statusCode;
            PaymentService.createPayment.mockRejectedValue(error);

            const res = await request(app).post('/api/payment').send(validPayload);

            expect(res.statusCode).toBe(statusCode);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Error de negocio simulado');
        });
    });

    describe('GET /api/payment', () => {

        it('Debe retornar 200 con la colección devuelta por PaymentService.getPayments', async () => {
            const mockPayments = [{ id_pago: 1, banco_nombre: null }];
            PaymentService.getPayments.mockResolvedValue(mockPayments);

            const res = await request(app).get('/api/payment');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(mockPayments);
        });

        it('Debe tipar los parámetros de la Query String y resolver a null los ausentes', async () => {
            PaymentService.getPayments.mockResolvedValue([]);

            await request(app).get('/api/payment').query({
                id_cliente: '3',
                id_banco: '2',
                monto_min: '100.5',
                numero_comprobante: '  CH-01  ',
                vencimiento_desde: '2026-01-01',
                vencimiento_hasta: '2026-12-31',
                sort_by: 'fecha_vencimiento',
                sort_order: 'ASC'
            });

            expect(PaymentService.getPayments).toHaveBeenCalledWith(expect.objectContaining({
                id_cliente: 3,
                id_banco: 2,
                monto_min: 100.5,
                numero_comprobante: 'CH-01',
                vencimiento_desde: '2026-01-01',
                vencimiento_hasta: '2026-12-31',
                sort_by: 'fecha_vencimiento',
                sort_order: 'ASC',
                id_pago: null,
                id_estado_pago: null,
                monto_max: null,
                fecha_desde: null,
                creacion_desde: null
            }));
        });

        it('Debe propagar el 400 de la excepción de validación del servicio', async () => {
            const error = new Error("El criterio de búsqueda 'id_banco' debe ser un identificador numérico entero y positivo.");
            error.statusCode = 400;
            PaymentService.getPayments.mockRejectedValue(error);

            const res = await request(app).get('/api/payment?id_banco=abc');

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe(error.message);
        });

        it('Debe responder 500 ante un error no tipificado', async () => {
            PaymentService.getPayments.mockRejectedValue(new Error('Error en la capa de datos al consultar los pagos.'));

            const res = await request(app).get('/api/payment');

            expect(res.statusCode).toBe(500);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/payment/:id', () => {

        it('Debe retornar 200 con el pago devuelto por el servicio, delegando el identificador numérico', async () => {
            const mockPayment = { id_pago: 5, monto: '1500.00', cliente_direccion: 'Calle Falsa 123' };
            PaymentService.getPaymentById.mockResolvedValue(mockPayment);

            const res = await request(app).get('/api/payment/5');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(mockPayment);
            expect(PaymentService.getPaymentById).toHaveBeenCalledWith(5);
        });

        it.each(['abc', '0', '-3'])('Debe retornar 400 si el identificador es inválido (%p), sin invocar al servicio', async (id) => {
            const res = await request(app).get(`/api/payment/${id}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(PaymentService.getPaymentById).not.toHaveBeenCalled();
        });

        it('Debe propagar el statusCode 404 de la excepción del servicio', async () => {
            const error = new Error('Pago inexistente simulado');
            error.statusCode = 404;
            PaymentService.getPaymentById.mockRejectedValue(error);

            const res = await request(app).get('/api/payment/5');

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Pago inexistente simulado');
        });

        it('Debe retornar 500 ante un error no controlado del servicio', async () => {
            PaymentService.getPaymentById.mockRejectedValue(new Error('Falla inesperada'));

            const res = await request(app).get('/api/payment/5');

            expect(res.statusCode).toBe(500);
            expect(res.body.success).toBe(false);
        });
    });

    describe('PUT /api/payment/:id', () => {

        it('Debe retornar 200 con el pago actualizado, delegando el identificador numérico y el cuerpo', async () => {
            const mockResult = { id_pago: 5, monto: '1500.00' };
            PaymentService.updatePayment.mockResolvedValue(mockResult);

            const res = await request(app).put('/api/payment/5').send({ monto: 1500 });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(mockResult);
            expect(PaymentService.updatePayment).toHaveBeenCalledWith(5, { monto: 1500 });
        });

        it.each(['abc', '0', '-3'])('Debe retornar 400 si el identificador es inválido (%p), sin invocar al servicio', async (id) => {
            const res = await request(app).put(`/api/payment/${id}`).send({ monto: 1500 });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(PaymentService.updatePayment).not.toHaveBeenCalled();
        });

        it.each([
            ['un cuerpo vacío', {}],
            ['solo campos no modificables', { id_cliente: 2 }]
        ])('Debe retornar 400 ante %s, sin invocar al servicio', async (_caso, body) => {
            const res = await request(app).put('/api/payment/5').send(body);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(PaymentService.updatePayment).not.toHaveBeenCalled();
        });

        it.each([400, 404, 409])('Debe propagar el statusCode %i de la excepción del servicio', async (statusCode) => {
            const error = new Error('Error de negocio simulado');
            error.statusCode = statusCode;
            PaymentService.updatePayment.mockRejectedValue(error);

            const res = await request(app).put('/api/payment/5').send({ monto: 1500 });

            expect(res.statusCode).toBe(statusCode);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Error de negocio simulado');
        });
    });

    describe('DELETE /api/payment/:id', () => {

        it('Debe retornar 200 con el mensaje de confirmación, delegando el identificador numérico', async () => {
            PaymentService.deletePayment.mockResolvedValue({ id_pago: 5 });

            const res = await request(app).delete('/api/payment/5');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toMatch(/#5/);
            expect(PaymentService.deletePayment).toHaveBeenCalledWith(5);
        });

        it('Debe retornar 400 si el identificador no es numérico, sin invocar al servicio', async () => {
            const res = await request(app).delete('/api/payment/abc');

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(PaymentService.deletePayment).not.toHaveBeenCalled();
        });

        it.each([404, 409])('Debe propagar el statusCode %i de la excepción del servicio', async (statusCode) => {
            const error = new Error('Error de negocio simulado');
            error.statusCode = statusCode;
            PaymentService.deletePayment.mockRejectedValue(error);

            const res = await request(app).delete('/api/payment/5');

            expect(res.statusCode).toBe(statusCode);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Error de negocio simulado');
        });
    });

    describe('GET /api/payment/methods', () => {
        it('Debe retornar 200 con el arreglo devuelto por el servicio', async () => {
            const mockMethods = [{ id_medio_pago: 1, nombre: 'Efectivo', es_diferido: 0 }];
            PaymentService.getAllPaymentMethods.mockResolvedValue(mockMethods);

            const res = await request(app).get('/api/payment/methods');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(mockMethods);
        });

        it('Debe retornar 500 con el sobre de error uniforme cuando el servicio falla', async () => {
            PaymentService.getAllPaymentMethods.mockRejectedValue(new Error('Falla simulada'));

            const res = await request(app).get('/api/payment/methods');

            expect(res.statusCode).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBeDefined();
        });
    });

    describe('GET /api/payment/states', () => {
        it('Debe retornar 200 con el arreglo devuelto por el servicio', async () => {
            const mockStates = [{ id_estado_pago: 1, nombre: 'Borrador' }];
            PaymentService.getAllPaymentStates.mockResolvedValue(mockStates);

            const res = await request(app).get('/api/payment/states');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(mockStates);
        });

        it('Debe retornar 500 con el sobre de error uniforme cuando el servicio falla', async () => {
            PaymentService.getAllPaymentStates.mockRejectedValue(new Error('Falla simulada'));

            const res = await request(app).get('/api/payment/states');

            expect(res.statusCode).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBeDefined();
        });
    });

    describe('GET /api/payment/banks', () => {
        it('Debe retornar 200 con el arreglo devuelto por el servicio', async () => {
            const mockBanks = [{ id_banco: 1, nombre: 'Banco Galicia' }];
            PaymentService.getBanks.mockResolvedValue(mockBanks);

            const res = await request(app).get('/api/payment/banks');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(mockBanks);
        });

        it('Debe retornar 500 con el sobre de error uniforme cuando el servicio falla', async () => {
            PaymentService.getBanks.mockRejectedValue(new Error('Falla simulada'));

            const res = await request(app).get('/api/payment/banks');

            expect(res.statusCode).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBeDefined();
        });
    });

    describe('POST /api/payment/banks', () => {
        it('Debe retornar 201 con el banco devuelto por PaymentService.createBank', async () => {
            const mockBank = { id_banco: 3, nombre: 'Banco Provincia' };
            PaymentService.createBank.mockResolvedValue(mockBank);

            const res = await request(app).post('/api/payment/banks').send({ nombre: 'Banco Provincia' });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(mockBank);
        });

        it('Debe retornar 400 si falta el nombre, sin invocar al servicio', async () => {
            const res = await request(app).post('/api/payment/banks').send({});

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(PaymentService.createBank).not.toHaveBeenCalled();
        });

        it('Debe propagar el 409 de un nombre duplicado', async () => {
            const error = new Error('Ya existe un banco registrado bajo el nombre "Banco Provincia".');
            error.statusCode = 409;
            PaymentService.createBank.mockRejectedValue(error);

            const res = await request(app).post('/api/payment/banks').send({ nombre: 'banco provincia' });

            expect(res.statusCode).toBe(409);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe(error.message);
        });
    });
});
