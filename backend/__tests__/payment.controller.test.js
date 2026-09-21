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
            fecha_pago: '2026-09-20'
        };

        it('Debe retornar 201 y el data devuelto por PaymentService.createPayment cuando el payload es válido', async () => {
            const mockResult = { id_pago: 1, estado_pago_nombre: 'Borrador' };
            PaymentService.createPayment.mockResolvedValue(mockResult);

            const res = await request(app).post('/api/payment').send(validPayload);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(mockResult);
        });

        it.each(['id_cliente', 'id_medio_pago', 'fecha_pago'])('Debe retornar 400 si falta %s, sin invocar al servicio', async (campo) => {
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

    describe('GET /api/payment/methods', () => {
        it('Debe retornar 200 con el arreglo devuelto por el servicio', async () => {
            const mockMethods = [{ id_medio_pago: 1, nombre: 'Efectivo', es_diferido: 0 }];
            PaymentService.getAllPaymentMethods.mockResolvedValue(mockMethods);

            const res = await request(app).get('/api/payment/methods');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(mockMethods);
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
    });
});
