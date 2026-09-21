**Requerimiento 31: Registro de nuevo pago**

### Resumen del Requerimiento

El objetivo de este requerimiento es permitir la captura y persistencia formal de pagos realizados por los clientes dentro del módulo administrativo y contable. La funcionalidad debe permitir registrar el importe, la fecha de la transacción, el medio de pago utilizado y los datos de respaldo (número de comprobante y observaciones). A nivel de dominio, el sistema debe garantizar la integridad transaccional validando la existencia del cliente y asegurando que el importe sea estrictamente positivo antes de impactar la base de datos relacional MySQL.

### Backend (Capa de Datos, Servicio y Exposición)

* **Model (`Payment.js`):** Gestiona la persistencia sobre la tabla relacional `Pago`. Implementa el método `create(paymentData, connection)`, diseñado para soportar transacciones atómicas mediante la inyección explícita de la conexión (`connection`) a fin de garantizar propiedades ACID en operaciones compuestas.


* **Service (`payment.service.js`):** Orquesta la lógica del negocio mediante el método `createPayment(paymentData)`. Valida la existencia del cliente, la validez del medio de pago y la consistencia del importe monetario. Por razones de seguridad, establece siempre el estado operativo inicial "Borrador" para el registro de pago, sin excepción, previo a su inserción en la capa de datos.


* **Controller (`payment.controller.js`):** Expone el endpoint `POST /api/payments` a través de Express.js. Intercepta el payload de la petición HTTP (`req.body`), ejecuta una validación sintáctica preliminar, delega la ejecución a la capa de servicios y efectúa el mapeo semántico de errores a códigos de estado HTTP estandarizados (`201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`).



### Frontend (Capa de Integración y Presentación)

* **Integración API (`payment.service.js`):** Implementa la función asíncrona cliente `apiCreatePayment(paymentData)` que realiza el despacho de la petición HTTP POST hacia el servidor mediante la API nativa `fetch`, gestionando la serialización JSON y capturando fallos de red o respuestas no satisfactorias.


* **UI (`PaymentForm.jsx` o `CreatePaymentPage.jsx`):** Componente reactivo desarrollado en React.js y estilizado con clases de utilidad de TailwindCSS. Proporciona una interfaz estructurada con controles para la selección de cliente, selector de medio de pago, campo numérico de importe, selector de fecha y campos de texto para observaciones y comprobantes. Maneja el estado local (`useState`), previene el envío múltiple por pulsación concurrente (*double-submit*) y provee retroalimentación visual al usuario.



### Reglas de Negocio Clave

* **Validación de Entidad Cliente:** La operación se aborta de forma inmediata (Fail-Fast) si el identificador del cliente provisto no corresponde a una entidad existente y activa en el sistema.


* **Consistencia Monetaria:** El monto registrado debe ser un escalar numérico estrictamente positivo (`monto > 0`); se rechazan transacciones nulas o valores negativos.


* **Inmutabilidad y Trazabilidad:** Todo registro de pago debe asociarse a su correspondiente medio de pago y fecha de emisión para alimentar de forma consistente el libro de movimientos y el balance contable del cliente.


* **Estado Inicial "Borrador" Obligatorio (Regla de Seguridad):** Dado que los registros de pago no admiten eliminación física ni lógica dentro del sistema, todo pago debe crearse siempre en estado "Borrador", independientemente de la naturaleza del medio de pago seleccionado (inmediato o diferido). El estado operativo definitivo (`Aceptado`, `Pendiente de acreditación`, `Rechazado`) solo puede asignarse mediante una edición posterior y explícita del registro, lo que permite corregir errores de carga sin necesidad de borrar información.



---

### Desglose Atómico de Tareas (WBS) por Componente Arquitectónico



#### 0. Base de Datos



* **Tarea 0.1:** Crear la tabla `Pago` en MySQL siguiendo la convención de PascalCase para tablas y snake_case para columnas:


* `id_pago` (INT, PK, AUTO_INCREMENT)
* `id_cliente` (INT, NOT NULL, FK referenciando a `Cliente(id_cliente)`)
* `id_estado_pago` (INT, NOT NULL, FK referenciando a `EstadoPago(id_estado_pago)`)
* `id_medio_pago` (INT, NOT NULL, FK referenciando a `MedioPago(id_medio_pago)`)
* `monto` (DECIMAL(10,2), NOT NULL)
* `fecha_pago` (DATETIME, NOT NULL)
* `numero_comprobante` (VARCHAR(100), NULL)
* `observaciones` (TEXT, NULL)
* `fecha_creacion` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
* `fecha_actualizacion` (TIMESTAMP, NULL ON UPDATE CURRENT_TIMESTAMP)


#### 1. Capa de Datos (`backend/src/models/Payment.js`)

* **Tarea 1.1:** Implementar la función `create(paymentData, connection = null)`. Construir la sentencia parametrizada `INSERT INTO Pago (...) VALUES (...)`, permitiendo el uso de una conexión transaccional inyectada o el pool general del sistema, retornando el `insertId` generado.



#### 2. Capa de Lógica de Negocio (`backend/src/services/payment.service.js`)



* **Tarea 2.1:** Implementar la función principal `createPayment(paymentData)`.


* **Tarea 2.2 (Regla de Negocio Crítica - Validación de Entidad):** Consultar la existencia del cliente mediante la capa de datos de clientes (`Client.findById`); si no existe, interrumpir el flujo elevando una excepción de negocio tipificada (`HTTP 404`).


* **Tarea 2.3 (Validación de Importe):** Validar que el campo `monto` sea mayor a cero (`monto > 0`). En caso contrario, arrojar una excepción de validación (`HTTP 400`).


* **Tarea 2.4 (Regla de Negocio Crítica - Estado Inicial):** Resolver el estado operativo inicial del pago como "Borrador" en todos los casos, sin excepción, con independencia del medio de pago seleccionado, dado que los pagos no son eliminables del sistema.


* **Tarea 2.5 (Persistencia):** Consolidar los atributos de auditoría y delegar la inserción a `Payment.create`, retornando el objeto resultante.



#### 3. Capa de Exposición (`backend/src/controllers/payment.controller.js` y `backend/src/routes/payment.routes.js`)



* **Tarea 3.1:** Crear `payment.controller.js` e implementar el método `handleCreatePayment(req, res)` extrayendo el `req.body` y manejando las excepciones con bloques `try/catch` para devolver códigos HTTP semánticos (`201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`).


* **Tarea 3.2:** Crear `payment.routes.js` y exponer el endpoint `POST /api/payments` asociándolo al método del controlador.


* **Tarea 3.3:** Registrar el enrutador de pagos en `app.js` bajo el prefijo `/api/payments`.



#### 4. Capa de Integración Frontend (`frontend/src/services/payment.service.js`)



* **Tarea 4.1:** Crear el archivo `frontend/src/services/payment.service.js`.


* **Tarea 4.2:** Implementar la función asíncrona `apiCreatePayment(paymentData)` utilizando `fetch` para enviar la carga útil JSON al endpoint `POST /api/payments`, gestionando cabeceras y controlando respuestas no satisfactorias (`!res.ok`).



#### 5. Capa de Presentación (`frontend/src/pages/CreatePaymentPage.jsx` o `frontend/src/components/PaymentForm.jsx`)



* **Tarea 5.1:** Diseñar la interfaz con React y TailwindCSS conteniendo el formulario de carga: selector de cliente, selector de medio de pago, campo numérico para monto, selector de fecha y áreas de texto para comprobante y notas.


* **Tarea 5.2:** Implementar el control del formulario mediante estados de React (`useState`), controlando la bandera de procesamiento (`isSaving`) para prevenir ejecuciones concurrentes o envíos duplicados.


* **Tarea 5.3:** Conectar el envío del formulario con la función `apiCreatePayment`, desplegando notificaciones visuales (mensajes o banners) ante confirmaciones de guardado o errores de validación.



---

##### ⚠️ Gestión de Riesgos y Advertencias de Arquitectura



1. **Afectación Prematura de Saldo (Riesgo de Consistencia Contable):** Un pago recién registrado no debe consolidar saldo de forma irreversible. Dado que todo pago nace como "Borrador", la capa de servicios debe aislarlo del balance computable para evitar saldos distorsionados en la cuenta corriente del cliente hasta que sea editado y confirmado en un estado operativo definitivo.


2. **Dependencia de Transaccionalidad en Métodos de Pago Diferidos:** Si a futuro el registro del pago dispara la emisión simultánea de un recibo o la afectación de documentos, el método del modelo debe conservar la capacidad de recibir un objeto `connection` externo para no comprometer la atomicidad relacional en MySQL.



---

### Estrategia de Tests (Propuesta — Backend)

Siguiendo las dos modalidades de prueba ya establecidas en `backend/__tests__/` (pruebas unitarias de servicio con mocks vía `jest.mock`, y pruebas de integración con `supertest` contra la base de datos real `DB_NAME_TEST`), se proponen los siguientes archivos y casos para el módulo de pagos. **Esta sección es solo documentación de la propuesta; los tests no se implementan en esta etapa.**

* **`payment.service.test.js` (unitario, mockeando `Payment` y `Client` con `jest.mock`):**
  * `createPayment` debe resolver siempre el `id_estado_pago` correspondiente a "Borrador", tanto para medios de pago inmediatos como diferidos (`medio.es_diferido` en `true` o `false`), verificando que `Payment.create` sea invocado con ese estado sin importar el medio.
  * `createPayment` debe lanzar `404` si `Client.findById` no encuentra al cliente, o si el cliente existe pero `is_active` es `false`, sin invocar `Payment.create`.
  * `createPayment` debe lanzar `404` si `Payment.findMethodById` no encuentra el medio de pago indicado.
  * `createPayment` debe lanzar `400` si `monto` es `0`, negativo, `NaN` o está ausente.
  * `createPayment` debe lanzar `400` si falta `id_cliente`, `id_medio_pago` o `fecha_pago`.
  * `createPayment` debe lanzar `500` si el catálogo de estados (`Payment.findAllStates`) no tiene configurado el estado "Borrador" (catálogo mal seeded).
  * `getAllPaymentStates` y `getAllPaymentMethods` deben delegar directamente en `Payment.findAllStates` / `Payment.findAllMethods` y retornar su resultado sin transformarlo.
  * `validatePaymentStatusAssignment` debe lanzar `409` si se intenta asignar el estado "Aceptado" a un medio diferido, y debe resolver sin error para el resto de combinaciones válidas (incluido "Borrador", que siempre es una asignación permitida).

* **`payment.controller.test.js` (integración REST con `supertest`, mockeando `PaymentService`):**
  * `POST /api/payments` debe retornar `201` y el `data` devuelto por `PaymentService.createPayment` cuando el payload es válido.
  * `POST /api/payments` debe retornar `400` si falta `id_cliente`, `id_medio_pago`, `monto` o `fecha_pago`, sin invocar al servicio.
  * `POST /api/payments` debe propagar el `statusCode` de la excepción del servicio (`404`, `400`, `409`) en la respuesta HTTP.
  * `GET /api/payments/methods` y `GET /api/payments/states` deben retornar `200` con el arreglo devuelto por el servicio correspondiente.

* **`payment.api.test.js` (integración end-to-end contra `DB_NAME_TEST`, sin mocks):**
  * `beforeAll` trunca `Pago`, `Cliente`, `EstadoPago` y `MedioPago`, y siembra un cliente activo, un estado "Borrador" y al menos dos medios de pago (uno con `es_diferido = 0` y otro con `es_diferido = 1`).
  * Registrar un pago con un medio de pago **inmediato** (`es_diferido = 0`) y verificar en la fila insertada que `id_estado_pago` corresponde a "Borrador" (no "Aceptado").
  * Registrar un pago con un medio de pago **diferido** (`es_diferido = 1`) y verificar igualmente que `id_estado_pago` corresponde a "Borrador" (no "Pendiente de acreditación").
  * Verificar que un pago con `id_cliente` inexistente retorna `404` y no inserta fila en `Pago`.
  * Verificar que un pago con `monto <= 0` retorna `400` y no inserta fila en `Pago`.
  * Verificar que la respuesta `201` incluye `estado_pago_nombre: 'Borrador'` en el DTO devuelto.
