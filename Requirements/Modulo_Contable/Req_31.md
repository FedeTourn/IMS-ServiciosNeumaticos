**Requerimiento 31: Registro de nuevo pago**

### Resumen del Requerimiento

El objetivo de este requerimiento es permitir la captura y persistencia formal de pagos realizados por los clientes dentro del módulo administrativo y contable. La funcionalidad debe permitir registrar el importe, la fecha de recepción del cobro, el medio de pago utilizado y los datos de respaldo (número de comprobante externo y observaciones). A nivel de dominio, el sistema debe garantizar la integridad transaccional validando la existencia y vigencia del cliente, la pertenencia del medio de pago al catálogo, y asegurando que el importe sea estrictamente positivo antes de impactar la base de datos relacional MySQL.

Todo pago se registra siempre en estado "Borrador", con independencia de la naturaleza del medio de cobro seleccionado. El ciclo de vida del pago, tipificado en la tabla maestra `EstadoPago`, comprende los estados "Borrador", "Pendiente de acreditación", "Aceptado" y "Rechazado", de los cuales solo "Aceptado" computa sobre el saldo consolidado de la cuenta corriente del cliente. Un pago recién creado es, por lo tanto, un asiento preliminar: no incide sobre el balance y admite corrección o descarte mientras permanece en "Borrador". La asignación de un estado operativo definitivo constituye una operación posterior y explícita de modificación, fuera del alcance de este requerimiento.

### Backend (Capa de Datos, Servicio y Exposición)

* **Model (`Payment.js`):** Gestiona la persistencia sobre la tabla relacional `Pago`. Implementa el método `create(paymentData, connection = null)`, diseñado para soportar transacciones atómicas mediante la inyección explícita de la conexión (`connection`) a fin de garantizar propiedades ACID en operaciones compuestas; en su ausencia, recae sobre el pool general de conexiones y retorna el `insertId` generado. Las marcas temporales de auditoría no se informan desde la aplicación: la columna `fecha_creacion` de la tabla `Pago` se estampa sola por `DEFAULT CURRENT_TIMESTAMP`.


* **Service (`payment.service.js`):** Orquesta la lógica del negocio mediante el método estático `createPayment(paymentData)` de la clase `PaymentService`. Valida la presencia de los campos obligatorios, la existencia y vigencia del cliente, la pertenencia del medio de pago al catálogo y la consistencia del importe monetario. Por razones de seguridad contable, resuelve siempre el estado operativo inicial "Borrador" para el registro, sin excepción, previo a su inserción en la capa de datos. El estado se referencia por su nombre semántico a través del diccionario de constantes `ESTADOS_PAGO` definido en el módulo, resolviendo su identificador contra el catálogo en tiempo de ejecución y nunca por número fijo.


* **Controller (`payment.controller.js`):** Expone el endpoint `POST /api/payment` a través de Express.js, respetando el prefijo bajo el que está montado el enrutador de pagos en `app.js` (`/api/payment`, en singular). Intercepta el payload de la petición HTTP (`req.body`), ejecuta una validación sintáctica preliminar de los campos obligatorios, delega la ejecución a la capa de servicios y efectúa el mapeo semántico de errores a códigos de estado HTTP estandarizados (`201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`) devolviendo el sobre JSON uniforme del módulo (`{ success, data }` o `{ success, message }`).



### Frontend (Capa de Integración y Presentación)

* **Integración API (`payment.service.js`):** Implementa la función asíncrona cliente `apiCreatePayment(paymentData)` que realiza el despacho de la petición HTTP POST hacia el servidor mediante la API nativa `fetch`, reutilizando el helper `getAuthHeaders()` del archivo para adjuntar el token de sesión, gestionando la serialización JSON y capturando fallos de red o respuestas no satisfactorias (`!response.ok`), que eleva como excepciones enriquecidas con `error.statusCode` para su manejo diferenciado en la interfaz.


* **UI (`CreatePaymentPage.jsx`):** Página reactiva desarrollada en React.js y estilizada con clases de utilidad de TailwindCSS, alcanzable desde la ruta `/crear-pago`. Proporciona una interfaz estructurada con selector de cliente, panel informativo con los datos del cliente seleccionado (nombre, CUIT y domicilio), campo numérico de importe, selector de medio de pago poblado dinámicamente desde el catálogo, selector de fecha de recepción y campos de texto para número de comprobante externo y observaciones. Maneja el estado local con `useState`, previene el envío múltiple por pulsación concurrente (*double-submit*) mediante la bandera `isSaving` y provee retroalimentación visual al usuario. El carácter preliminar del asiento debe ser explícito en la propia acción de guardado, rotulada como creación del pago en estado "Borrador".



### Reglas de Negocio Clave

* **Validación de Entidad Cliente:** La operación se aborta de forma inmediata (Fail-Fast) con `HTTP 404` si el identificador del cliente provisto no corresponde a una entidad existente y activa (`is_active`) en el sistema.


* **Validación del Medio de Cobro:** El medio de pago informado debe pertenecer al catálogo de la tabla maestra `MedioPago`; en caso contrario, la operación se aborta con `HTTP 404`.


* **Consistencia Monetaria:** El monto registrado debe ser un escalar numérico estrictamente positivo (`monto > 0`); se rechazan con `HTTP 400` las transacciones nulas, no numéricas o de valor negativo.


* **Trazabilidad:** Todo registro de pago debe asociarse a su correspondiente cliente, medio de pago y fecha de recepción del cobro, para alimentar de forma consistente el libro de movimientos y el balance contable del cliente.


* **Estado Inicial "Borrador" Obligatorio (Regla de Seguridad):** Todo pago debe crearse siempre en estado "Borrador", con independencia de la naturaleza del medio de cobro seleccionado (inmediato o diferido). El estado operativo definitivo ("Aceptado", "Pendiente de acreditación" o "Rechazado") solo puede asignarse mediante una edición posterior y explícita del registro. La razón es doble: por un lado, un asiento recién cargado no debe impactar el saldo consolidado del cliente antes de ser revisado; por el otro, el "Borrador" constituye la única ventana en la que el registro admite corrección o descarte, ya que una vez formalizado en un estado definitivo el pago deja de ser modificable y eliminable para preservar la trazabilidad contable.



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


* **Tarea 0.2:** Declarar las claves foráneas con la política `ON DELETE RESTRICT ON UPDATE CASCADE` (`fk_pago_cliente`, `fk_pago_estado`, `fk_pago_medio`), de modo que la base de datos impida la baja de un cliente, un estado o un medio de pago que tenga cobros imputados.


#### 1. Capa de Datos (`backend/src/models/Payment.js`)

* **Tarea 1.1:** Implementar la función `create(paymentData, connection = null)`. Construir la sentencia parametrizada `INSERT INTO Pago (...) VALUES (...)` sobre las columnas `id_cliente`, `id_estado_pago`, `id_medio_pago`, `monto`, `fecha_pago`, `numero_comprobante` y `observaciones`, permitiendo el uso de una conexión transaccional inyectada o el pool general del sistema, normalizando a `null` los campos de respaldo no informados y retornando el `insertId` generado.



#### 2. Capa de Lógica de Negocio (`backend/src/services/payment.service.js`)



* **Tarea 2.1:** Implementar el método estático `createPayment(paymentData)` en la clase `PaymentService`.


* **Tarea 2.2 (Validación de Forma):** Verificar la presencia de los campos obligatorios `id_cliente`, `id_medio_pago` y `fecha_pago`, arrojando una excepción de validación (`HTTP 400`) ante su ausencia.


* **Tarea 2.3 (Regla de Negocio Crítica - Validación de Entidad):** Consultar la existencia del cliente mediante la capa de datos de clientes (`Client.findById`); si no existe o su bandera `is_active` es falsa, interrumpir el flujo elevando una excepción de negocio tipificada (`HTTP 404`).


* **Tarea 2.4 (Validación del Medio de Cobro):** Verificar mediante `Payment.findMethodById` que el medio de pago informado pertenezca al catálogo; en caso contrario, elevar `HTTP 404`.


* **Tarea 2.5 (Validación de Importe):** Validar que el campo `monto` sea un número mayor a cero (`monto > 0`). En caso contrario, arrojar una excepción de validación (`HTTP 400`).


* **Tarea 2.6 (Regla de Negocio Crítica - Estado Inicial):** Resolver el estado operativo inicial del pago como "Borrador" en todos los casos, sin excepción y con independencia del medio de pago seleccionado, buscándolo por nombre semántico dentro del catálogo de estados (`Payment.findAllStates`). Si el catálogo no tuviera configurado ese estado, elevar `HTTP 500` por inconsistencia de parametrización del entorno.


* **Tarea 2.7 (Persistencia):** Consolidar el objeto de atributos a persistir con el importe ya normalizado a tipo numérico y el identificador del estado resuelto, delegar la inserción a `Payment.create`, y retornar el registro creado incluyendo su identificador y el nombre del estado inicial.



#### 3. Capa de Exposición (`backend/src/controllers/payment.controller.js` y `backend/src/routes/payment.routes.js`)



* **Tarea 3.1:** Crear `payment.controller.js` e implementar el método `handleCreatePayment(req, res)` extrayendo el `req.body`, rechazando con `400` la ausencia de `id_cliente`, `id_medio_pago`, `monto` o `fecha_pago` antes de invocar al servicio, y manejando las excepciones con bloques `try/catch` que lean `error.statusCode` para devolver códigos HTTP semánticos (`201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`).


* **Tarea 3.2:** Crear `payment.routes.js` y exponer el endpoint `POST /` asociándolo al método del controlador.


* **Tarea 3.3:** Registrar el enrutador de pagos en `app.js` bajo el prefijo `/api/payment`, con lo que el endpoint resultante es `POST /api/payment`.



#### 4. Capa de Integración Frontend (`frontend/src/services/payment.service.js`)



* **Tarea 4.1:** Crear el archivo `frontend/src/services/payment.service.js` con el helper `getAuthHeaders()`, que construye las cabeceras `application/json` y adjunta el token de sesión (`Authorization: Bearer`) recuperado de `localStorage`.


* **Tarea 4.2:** Implementar la función asíncrona `apiCreatePayment(paymentData)` utilizando `fetch` para enviar la carga útil JSON al endpoint `POST /api/payment`, controlando las respuestas no satisfactorias (`!response.ok`) y propagando el `statusCode` en la excepción elevada hacia la interfaz.



#### 5. Capa de Presentación (`frontend/src/pages/Payments/CreatePaymentPage.jsx`)



* **Tarea 5.1:** Diseñar la interfaz con React y TailwindCSS conteniendo el formulario de carga: selector de cliente, panel informativo con los datos del cliente seleccionado, campo numérico para el monto, selector de medio de pago, selector de fecha de recepción y campos de texto para el número de comprobante externo y las observaciones.


* **Tarea 5.2:** Poblar dinámicamente el selector de medios de pago mediante un gancho de ciclo de vida (`useEffect`) que consulte el catálogo al montar la página, junto con el listado de clientes.


* **Tarea 5.3:** Implementar el control del formulario mediante estados de React (`useState`), controlando la bandera de procesamiento (`isSaving`) para prevenir ejecuciones concurrentes o envíos duplicados, y rotulando la acción de guardado de modo que explicite que el pago se crea en estado "Borrador".


* **Tarea 5.4:** Conectar el envío del formulario con la función `apiCreatePayment`, desplegando notificaciones visuales (mensajes o banners) ante confirmaciones de guardado o errores de validación provenientes del backend.


* **Tarea 5.5:** Registrar la ruta `/crear-pago` en `App.js` dentro del bloque de PAGOS, bajo la protección de `PrivateRoute` y el chrome compartido de `Layout`.



---

##### ⚠️ Gestión de Riesgos y Advertencias de Arquitectura



1. **Afectación Prematura de Saldo (Riesgo de Consistencia Contable):** Un pago recién registrado no debe consolidar saldo de forma irreversible. Dado que todo pago nace como "Borrador", la capa de servicios debe aislarlo del balance computable para evitar saldos distorsionados en la cuenta corriente del cliente hasta que sea editado y confirmado en un estado operativo definitivo.


2. **Dependencia de Transaccionalidad en Métodos de Pago Diferidos:** Si a futuro el registro del pago dispara la emisión simultánea de un recibo o la afectación de documentos, el método del modelo debe conservar la capacidad de recibir un objeto `connection` externo para no comprometer la atomicidad relacional en MySQL.


3. **Acoplamiento por Identificadores Fijos (Hardcoding):** El identificador numérico del estado "Borrador" no debe quemarse en el código. Se resuelve en la capa de servicio a partir del nombre semántico y del catálogo consultado en tiempo de ejecución, para prevenir discrepancias entre los entornos de desarrollo, test y producción, donde las claves primarias de las tablas maestras pueden no coincidir.



---

### Estrategia de Tests (Backend)

Siguiendo las dos modalidades de prueba establecidas en `backend/__tests__/` (pruebas unitarias de servicio con mocks vía `jest.mock`, y pruebas de integración con `supertest` contra la base de datos real `DB_NAME_TEST`), se cubren los siguientes casos para el registro de pagos.

* **`payment.service.test.js` (unitario, mockeando `Payment` y `Client` con `jest.mock`):**
  * `createPayment` debe resolver siempre el `id_estado_pago` correspondiente a "Borrador", tanto para medios de pago inmediatos como diferidos (`es_diferido` en `false` o `true`), verificando que `Payment.create` sea invocado con ese estado sin importar el medio.
  * `createPayment` debe lanzar `404` si `Client.findById` no encuentra al cliente, o si el cliente existe pero `is_active` es `false`, sin invocar `Payment.create`.
  * `createPayment` debe lanzar `404` si `Payment.findMethodById` no encuentra el medio de pago indicado.
  * `createPayment` debe lanzar `400` si `monto` es `0`, negativo, `NaN` o está ausente.
  * `createPayment` debe lanzar `400` si falta `id_cliente`, `id_medio_pago` o `fecha_pago`.
  * `createPayment` debe lanzar `500` si el catálogo de estados (`Payment.findAllStates`) no tiene configurado el estado "Borrador" (catálogo mal parametrizado).

* **`payment.controller.test.js` (integración REST con `supertest`, mockeando `PaymentService`):**
  * `POST /api/payment` debe retornar `201` y el `data` devuelto por `PaymentService.createPayment` cuando el payload es válido.
  * `POST /api/payment` debe retornar `400` si falta `id_cliente`, `id_medio_pago`, `monto` o `fecha_pago`, sin invocar al servicio.
  * `POST /api/payment` debe propagar el `statusCode` de la excepción del servicio (`404`, `400`) en la respuesta HTTP.

* **`payment.api.test.js` (integración end-to-end contra `DB_NAME_TEST`, sin mocks):**
  * `beforeAll` trunca `Pago`, `Cliente`, `EstadoPago` y `MedioPago`, y siembra un cliente activo, el catálogo de estados y al menos dos medios de pago (uno con `es_diferido = 0` y otro con `es_diferido = 1`).
  * Registrar un pago con un medio de pago **inmediato** (`es_diferido = 0`) y verificar en la fila insertada que `id_estado_pago` corresponde a "Borrador" (no "Aceptado").
  * Registrar un pago con un medio de pago **diferido** (`es_diferido = 1`) y verificar igualmente que `id_estado_pago` corresponde a "Borrador" (no "Pendiente de acreditación").
  * Verificar que un pago con `id_cliente` inexistente retorna `404` y no inserta fila en `Pago`.
  * Verificar que un pago con `monto <= 0` retorna `400` y no inserta fila en `Pago`.
  * Verificar que la respuesta `201` incluye `estado_pago_nombre: 'Borrador'` en el DTO devuelto.
