**Requerimiento 32: Modificación pago**

### Resumen del Requerimiento

El objetivo central es permitir la edición y el descarte de un pago registrado previamente por un cliente dentro del módulo administrativo y contable. La funcionalidad debe operar con una política de defensa estricta basada en el ciclo de vida del comprobante: si el pago se encuentra en estado "Borrador", el usuario puede ajustar libremente el importe, el medio de cobro, la fecha, los datos de respaldo y el estado operativo, o bien descartar el registro por completo. Si el pago ya abandonó el estado "Borrador" ("Pendiente de acreditación", "Aceptado" o "Rechazado"), el sistema debe adoptar una postura defensiva, bloqueando cualquier intento de edición o baja para proteger la integridad del saldo y la consistencia contable del cliente.

Todo pago nace en el sistema en estado "Borrador", con independencia del medio de cobro utilizado. Por lo tanto, esta modificación es también el mecanismo por el cual el registro adquiere su **estado operativo definitivo**: "Pendiente de acreditación", "Aceptado" o "Rechazado". Al asignar ese estado debe respetarse la naturaleza del instrumento de cobro: un medio con acreditación diferida (marcado con `es_diferido = true` en el catálogo de medios de pago, por ejemplo un cheque) no puede pasar directamente a "Aceptado", porque los fondos aún no están acreditados; debe atravesar "Pendiente de acreditación" o permanecer en "Borrador". La resolución posterior de un cobro diferido ya "Pendiente de acreditación" hacia "Aceptado" o "Rechazado" constituye un flujo de transición propio y queda fuera del alcance de este requerimiento.

El ciclo de vida completo del pago, tipificado en la tabla maestra `EstadoPago`, comprende únicamente los estados "Borrador", "Pendiente de acreditación", "Aceptado" y "Rechazado". De ellos, solo "Aceptado" computa sobre el saldo consolidado de la cuenta corriente del cliente.

### Backend (Capa de Datos, Servicio y Exposición)

* **Model (`Payment.js`):** La capa de acceso a datos sobre MySQL debe incorporar el método `findById(id)`, que recupera el registro de `Pago` hidratado mediante `INNER JOIN` hacia `Cliente`, `EstadoPago` y `MedioPago`, de modo que la capa de servicio pueda evaluar el nombre del estado actual y la bandera `es_diferido` del medio de cobro sin consultas adicionales. Debe además exponer `update(id, updateData, ...)` con una cláusula `SET` fija sobre las columnas mutables autorizadas —recibiendo desde la capa de servicio el registro completo ya resuelto, tal como lo hacen los métodos de actualización del resto de los modelos del proyecto— y `delete(id, ...)`. Ambos métodos de mutación admiten de forma opcional una conexión (`connection`) para operar dentro de un contexto transaccional y, en su ausencia, recaen sobre el pool general de conexiones. No se estampa manualmente la fecha de última mutación: la columna `fecha_actualizacion` de la tabla `Pago` se actualiza sola por `ON UPDATE CURRENT_TIMESTAMP`.


* **Service (`payment.service.js`):** A través de los métodos estáticos `updatePayment(id, updateData)` y `deletePayment(id)` de la clase `PaymentService`, esta capa orquesta la operación y centraliza las reglas de negocio. Su principal responsabilidad es consultar previamente la entidad mediante `Payment.findById(id)` e implementar una cláusula de guarda (Fail-Fast): si el pago no existe, interrumpe el flujo; si el nombre del estado actual es distinto de "Borrador", aborta inmediatamente arrojando una excepción de negocio semántica para impedir la alteración contable. Asimismo valida que el importe modificado permanezca estrictamente positivo (`monto > 0`), que el medio de pago informado exista en el catálogo, y que la combinación resultante entre medio de cobro y estado solicitado sea legítima (un medio diferido no puede quedar "Aceptado"). Los estados se referencian siempre por su nombre semántico a través del diccionario de constantes `ESTADOS_PAGO` definido en el módulo, resolviendo sus identificadores contra el catálogo en tiempo de ejecución, nunca por número fijo.


* **Controller (`payment.controller.js`):** Debe exponer los endpoints `PUT /api/payment/:id` y `DELETE /api/payment/:id` construidos sobre Express.js, respetando el prefijo bajo el que está montado el enrutador de pagos en `app.js` (`/api/payment`, en singular). Su tarea es atrapar las peticiones HTTP, validar la sintaxis básica del parámetro de ruta (`id`) y del cuerpo (`req.body`), delegar el procesamiento a la capa de servicios y devolver la respuesta con el sobre JSON uniforme del módulo (`{ success, data }` o `{ success, message }`) junto al código semántico correspondiente (`200 OK`, `400 Bad Request`, `404 Not Found`, `409 Conflict`, `500 Internal Server Error`), propagando el `statusCode` que adjunta la excepción de negocio.



### Frontend (Capa de Integración y Presentación)

* **Integración API (`payment.service.js`):** Se deben implementar las funciones cliente asíncronas `apiUpdatePayment(id, paymentData)` y `apiDeletePayment(id)` para despachar las peticiones HTTP (PUT y DELETE respectivamente) hacia `${API_URL}/:id` reutilizando el helper `getAuthHeaders()` del archivo, resolviendo las promesas, controlando `!response.ok` y elevando errores enriquecidos con `error.statusCode` para su manejo diferenciado en la interfaz.


* **UI (`UpdatePaymentPage.jsx`):** Página de edición desarrollada en React.js y estilizada con clases de utilidad de TailwindCSS, alcanzable desde el botón de detalle de cada fila de la grilla de pagos mediante la ruta `/pagos/:id_pago`. Debe responder al ciclo de vida del pago: si el registro no está en "Borrador", renderiza los datos en modo solo lectura con un aviso explícito de bloqueo contable y sin botones de guardado ni de descarte; si está en "Borrador", despliega el formulario editable (importe, medio de cobro, estado, fecha, número de comprobante y observaciones, con los selectores poblados desde los catálogos de medios y estados) y habilita el descarte definitivo mediante un diálogo modal de confirmación. El estado operativo se identifica visualmente en todo momento con el componente de badge de estado de pago.



### Reglas de Negocio Clave

* **Inmutabilidad fuera del estado "Borrador":** El backend debe abortar cualquier intento de modificación o baja si el pago no se encuentra en estado "Borrador". Esto cubre los tres estados definitivos: "Aceptado" (los fondos formalizados no se alteran unilateralmente), "Rechazado" (los cobros rebotados permanecen visibles para control futuro) y "Pendiente de acreditación" (su evolución se resuelve exclusivamente por el flujo de transición de cobros diferidos, no por edición libre).


* **Asignación del Estado Definitivo:** Dado que todo pago nace en "Borrador", la edición es el único mecanismo por el cual el registro adquiere su estado operativo definitivo. Es una operación de una sola vía: una vez abandonado el "Borrador", el pago ya no vuelve a ser editable.


* **Correspondencia con Cobros Diferidos:** Si el medio de pago resultante de la edición posee `es_diferido = true`, no puede asignarse el estado "Aceptado"; el destino legítimo es "Pendiente de acreditación" o la permanencia en "Borrador". La validación aplica tanto si se cambia el estado como si se cambia el medio de pago, y se resuelve con `HTTP 409 Conflict`.


* **Consistencia de Estados del Autómata:** Solo son asignables los estados predefinidos en la tabla maestra `EstadoPago` ("Borrador", "Pendiente de acreditación", "Aceptado" y "Rechazado"). Se rechaza con `HTTP 404` cualquier identificador de estado fuera de catálogo.


* **Consistencia Monetaria en Modificación:** En caso de alterarse el importe monetario, el nuevo valor debe ser un escalar numérico mayor a cero (`monto > 0`).


* **Restricción de Cliente:** Al modificar un pago, el identificador del cliente (`id_cliente`) no puede ser transferido ni reasignado hacia otro cliente; la mutación se acota a importe, medio de pago, estado, fecha, observaciones y número de comprobante.


* **Baja Acotada al Borrador:** La eliminación física del registro se admite **únicamente** mientras el pago permanece en estado "Borrador". Un borrador nunca impactó el saldo consolidado del cliente, por lo que su descarte no deja huecos ni inconsistencias contables. Alcanzado cualquier estado definitivo, el pago deja de ser eliminable de forma física o lógica y las correcciones dejan de estar disponibles, precisamente para preservar la trazabilidad del libro de movimientos.



---

### Desglose Atómico de Tareas (WBS) por Componente Arquitectónico

#### 0. Base de Datos

* *(Sin tareas nuevas)*. Se utiliza la estructura relacional existente de las tablas `Pago`, `EstadoPago` y `MedioPago` con sus índices de claves foráneas (`fk_pago_cliente`, `fk_pago_estado`, `fk_pago_medio`). La columna `fecha_actualizacion` ya está declarada como `timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP`, por lo que la trazabilidad de la última mutación se obtiene sin trabajo adicional en la capa de datos.



#### 1. Capa de Datos (`backend/src/models/Payment.js`)

* **Tarea 1.1:** Implementar el método `findById(id)` con una consulta relacional que cruce mediante `INNER JOIN` las tablas `Cliente`, `EstadoPago` y `MedioPago`, filtrando por `WHERE P.id_pago = ? LIMIT 1`, y retornando el registro hidratado (incluyendo `cliente_nombre`, `estado_pago_nombre`, `medio_pago_nombre` y `es_diferido`) o `null` si no existe. Se lo nombra `findById` para distinguirlo de los métodos `findStateById` y `findMethodById`, que operan sobre las tablas maestras.


* **Tarea 1.2:** Implementar el método `update(id, updateData, idEstadoActual, connection = null)` con una sentencia parametrizada de cláusula `SET` fija sobre las columnas mutables autorizadas (`monto`, `id_medio_pago`, `id_estado_pago`, `fecha_pago`, `numero_comprobante`, `observaciones`), acotada por `WHERE id_pago = ? AND id_estado_pago = ?`, operando de manera agnóstica sobre la conexión inyectada o el pool general y retornando las filas afectadas (`affectedRows`). El método no inspecciona qué campos cambiaron: recibe el registro completo ya resuelto por la capa de servicio, de modo que la lista de columnas actualizables quede declarada de forma explícita y auditable en una única sentencia, en línea con los métodos de actualización de los demás modelos del proyecto.


* **Tarea 1.3:** Implementar el método `delete(id, idEstadoActual, connection = null)` ejecutando la baja sobre la tabla `Pago` mediante `DELETE FROM Pago WHERE id_pago = ? AND id_estado_pago = ?` y retornando las filas afectadas (`affectedRows`).


* **Tarea 1.4:** En ambos métodos de mutación, incorporar el identificador del estado "Borrador" como condición de la cláusula `WHERE`, recibido por parámetro desde la capa de servicio y nunca quemado en el modelo, de modo que la propia sentencia SQL constituya la última barrera atómica contra condiciones de carrera.



#### 2. Capa de Lógica de Negocio (`backend/src/services/payment.service.js`)

* **Tarea 2.1:** Implementar el método estático `updatePayment(id, updateData)` en la clase `PaymentService`.


* **Tarea 2.2 (Regla de Negocio Crítica - Guarda de Modificación):** Invocar a `Payment.findById(id)`. Si el registro no existe, arrojar error de negocio `HTTP 404`. Si el nombre del estado asociado es distinto de "Borrador", interrumpir inmediatamente el flujo (Fail-Fast) arrojando una excepción `HTTP 409 Conflict` que informe que el comprobante ya no es mutable.


* **Tarea 2.3 (Validación de Importe):** Validar que, si se provee el campo `monto`, sea un número estrictamente positivo (`monto > 0`); de lo contrario, lanzar un error `HTTP 400 Bad Request`.


* **Tarea 2.4 (Validación de Integridad Referencial):** Si se informa un nuevo `id_medio_pago`, verificar su existencia mediante `Payment.findMethodById` y elevar `HTTP 404` si no pertenece al catálogo. Descartar explícitamente del objeto de mutación cualquier `id_cliente` recibido, para materializar la restricción de no reasignación de cliente.


* **Tarea 2.5 (Regla de Negocio Crítica - Correspondencia Diferida):** Si se informa un nuevo `id_estado_pago`, resolverlo contra el catálogo (`Payment.findStateById`) elevando `HTTP 404` si no existe, y validar la combinación con el medio de cobro resultante de la edición (el nuevo si se cambió, el vigente si no): cuando el medio posee `es_diferido = true` y el estado solicitado es "Aceptado", abortar con `HTTP 409 Conflict` indicando que el instrumento debe atravesar "Pendiente de acreditación".


* **Tarea 2.6 (Consolidación del Registro a Persistir):** Fusionar el registro vigente recuperado por `Payment.findById` con los campos efectivamente informados, campo por campo, para construir el objeto completo que espera el modelo. La presencia de cada campo se evalúa contra `undefined`, de modo que un valor vacío enviado deliberadamente (por ejemplo, para borrar las observaciones o el número de comprobante) se distinga de un campo ausente y se persista como `null` en lugar de conservar el valor anterior.


* **Tarea 2.7 (Persistencia):** Delegar en `Payment.update(id, dataToPersist, idEstadoVigente, ...)` pasando como guarda de la cláusula `WHERE` el identificador de estado del registro ya leído, que la guarda de mutación verificó que corresponde a "Borrador". No se requiere una consulta adicional al catálogo de estados: el identificador proviene del propio pago, hidratado con el nombre de su estado por el cruzamiento relacional. Si `affectedRows` resulta `0`, interpretar que el pago fue formalizado concurrentemente y elevar `HTTP 409 Conflict`. Retornar el registro actualizado releído con `Payment.findById(id)`, normalizado con el mismo criterio de DTO plano que el resto del módulo (importe a dos decimales y fechas en formato ISO).


* **Tarea 2.8:** Implementar el método estático `deletePayment(id)`.


* **Tarea 2.9 (Regla de Negocio Crítica - Guarda de Baja):** Consultar el pago mediante `Payment.findById(id)`; si no existe, elevar `HTTP 404`. Si el nombre del estado no es estrictamente "Borrador", abortar la eliminación con `HTTP 409 Conflict`. En caso afirmativo, delegar en `Payment.delete(id, ...)` con la guarda de estado y tratar `affectedRows === 0` como conflicto de concurrencia (`HTTP 409`).



#### 3. Capa de Exposición (`backend/src/controllers/payment.controller.js` y `backend/src/routes/payment.routes.js`)

* **Tarea 3.1:** En `payment.controller.js`, implementar `handleUpdatePayment(req, res)` extrayendo `req.params.id` y `req.body`, rechazando con `400` un identificador no numérico o un cuerpo vacío, y aplicando el bloque `try/catch` con lectura de `error.statusCode` para el mapeo semántico de errores.


* **Tarea 3.2:** En `payment.controller.js`, implementar `handleDeletePayment(req, res)` extrayendo `req.params.id` y retornando `200 OK` con un mensaje descriptivo ante la baja exitosa.


* **Tarea 3.3:** En `payment.routes.js`, declarar `PUT /:id` y `DELETE /:id` asociados a sus respectivos métodos de controlador, manteniéndolos por debajo de las rutas literales de catálogo (`/methods`, `/states`) para preservar el orden de resolución de Express. Los endpoints resultantes son `PUT /api/payment/:id` y `DELETE /api/payment/:id`. No se requieren cambios en `app.js`, dado que el enrutador de pagos ya está registrado bajo el prefijo `/api/payment`.



#### 4. Capa de Integración Frontend (`frontend/src/services/payment.service.js`)

* **Tarea 4.1:** Implementar la función asíncrona `apiUpdatePayment(id, paymentData)` consumiendo mediante `fetch` el endpoint `PUT /api/payment/:id` con las cabeceras de `getAuthHeaders()` y el cuerpo serializado en JSON.


* **Tarea 4.2:** Implementar la función asíncrona `apiDeletePayment(id)` consumiendo mediante `fetch` el endpoint `DELETE /api/payment/:id`, controlando `!response.ok` y propagando el `statusCode` en la excepción.


* **Tarea 4.3:** Implementar la función asíncrona de lectura puntual `fetchPaymentById(id)`, requerida por la página de edición para hidratar el formulario a partir del identificador de la URL, resolviéndola contra la consulta de pagos filtrada por número interno y tomando el único elemento del resultado.



#### 5. Capa de Presentación (`frontend/src/pages/Payments/UpdatePaymentPage.jsx` y `App.js`)

* **Tarea 5.1:** Crear la página `UpdatePaymentPage.jsx` estilizada con TailwindCSS, siguiendo la estructura de las páginas de modificación ya existentes en el proyecto (`UpdateReceiptPage.jsx`, `UpdateRepairOrderPage.jsx`): lectura del identificador con `useParams`, carga inicial del pago y de los catálogos de medios y estados mediante `useEffect`, y formulario con los campos mutables (importe, medio de cobro, estado, fecha, número de comprobante y observaciones).


* **Tarea 5.2:** Registrar la ruta `/pagos/:id_pago` en `App.js` dentro del bloque de PAGOS, de modo que el botón de detalle ya presente en cada fila de la grilla de pagos resuelva contra la nueva página de edición.


* **Tarea 5.3:** Condicionar reactivamente la interfaz según el estado del pago: para registros en "Borrador", habilitar el formulario, el botón de guardado y el de descarte; para "Pendiente de acreditación", "Aceptado" o "Rechazado", renderizar la vista en modo solo lectura con un aviso de bloqueo contable, sin controles de mutación ni posibilidad de forzarla desde el navegador.


* **Tarea 5.4:** Reutilizar el componente modal de confirmación disponible en `frontend/src/components/common/` para exigir confirmación explícita antes de disparar la baja definitiva invocando a `apiDeletePayment`, y redirigir a la grilla de pagos tras el descarte exitoso.


* **Tarea 5.5:** Reflejar en la interfaz la regla de cobros diferidos: al seleccionar un medio con `es_diferido = true`, advertir visualmente que el registro no puede pasar directamente a "Aceptado" y ofrecer "Pendiente de acreditación" como destino, evitando que el operador reciba el `409` del backend como única retroalimentación.


* **Tarea 5.6:** Gestionar el estado de guardado (`isSaving`) para prevenir envíos duplicados, capturar y mostrar los errores del servidor, y refrescar la grilla tras una modificación o descarte exitoso.



---

##### ⚠️ Gestión de Riesgos y Advertencias de Arquitectura

1. **Riesgo de Condiciones de Carrera en Concurrencia:** Si un usuario intenta modificar o borrar un pago en borrador mientras otro operador lo formaliza concurrentemente, la consulta previa en memoria no basta. La cláusula de guarda de la capa de servicio debe complementarse obligatoriamente con la condición `WHERE id_pago = ? AND id_estado_pago = [ID_BORRADOR]` en la sentencia de mutación, verificando luego `affectedRows` para no reportar como exitosa una operación que la base de datos rechazó.


2. **Exclusión de Reversiones Automáticas de Saldo:** Dado que los pagos en estado "Borrador", "Pendiente de acreditación" y "Rechazado" no computan en el saldo consolidado de la cuenta corriente, la modificación o eliminación de un borrador no debe generar contraasientos ni alteraciones sobre movimientos contables definitivos. El punto de impacto real sobre el saldo es la promoción al estado "Aceptado", que esta edición habilita por primera vez, por lo que dicha transición debe tratarse con la validación más estricta del flujo.


3. **Acoplamiento por Identificadores Fijos (Hardcoding):** El identificador numérico del estado "Borrador" no debe quemarse en el modelo ni en el controlador. Se resuelve en la capa de servicio a partir del diccionario de nombres semánticos y del catálogo consultado en tiempo de ejecución, para prevenir discrepancias entre los entornos de desarrollo, test y producción.


4. **Irreversibilidad de la Promoción de Estado:** Como la edición es de una sola vía, un error de carga advertido después de haber promovido el pago a "Aceptado" ya no puede corregirse ni descartarse por este flujo. La interfaz debe hacer evidente ese carácter definitivo antes de confirmar el guardado, para que el personal administrativo no pierda la última oportunidad de corrección.



---

##### Nota de Mejora Futura: Construcción Dinámica de la Cláusula `SET`

La actualización se implementa con una cláusula `SET` fija que reescribe las seis columnas mutables en cada operación, recibiendo desde la capa de servicio el registro completo ya fusionado. Se adopta este esquema por uniformidad con los métodos de actualización preexistentes del proyecto (`Client.update`, `Receipt.updateReceipt`, `RepairOrder.update`) y porque la interfaz de edición envía siempre el formulario completo, con lo cual "actualizar solo lo que cambió" no representaría una diferencia efectiva.

Queda documentada como mejora posible la alternativa de **armar la cláusula `SET` de forma dinámica**, acumulando únicamente las asignaciones de los campos efectivamente informados con sentencias preparadas, al modo en que este mismo modelo ya construye la cláusula `WHERE` dinámica de la consulta multicriterio. Sus ventajas son dos:

* **Eficiencia y precisión de la escritura:** la sentencia toca exclusivamente las columnas modificadas, en lugar de reescribir con su mismo valor aquellas que no cambiaron.
* **Prevención de sobrescrituras concurrentes (*lost update*):** dos ediciones simultáneas sobre campos distintos de un mismo borrador no se pisan entre sí, escenario que la cláusula `SET` fija no evita, dado que la guarda `AND id_estado_pago = ?` no discrimina entre dos operaciones que provienen ambas del estado "Borrador".

El costo es una mayor complejidad en la capa de datos (una rama condicional por columna, más superficie de test y la guarda adicional para el caso de un conjunto de asignaciones vacío, que produciría una sentencia SQL sintácticamente inválida). Por esa razón se considera un patrón más rentable en **entidades con una cantidad considerable de atributos mutables**, donde reescribir el registro completo en cada edición sí resulta costoso, o en escenarios de edición parcial real (por ejemplo, la mutación de un único campo desde la propia grilla de datos). Para el volumen de atributos de la entidad `Pago`, la simplicidad y la uniformidad del esquema fijo se consideran preferibles.



---

### Estrategia de Tests (Propuesta — Backend)

Siguiendo las dos modalidades de prueba establecidas en `backend/__tests__/` (pruebas unitarias de servicio con mocks vía `jest.mock`, y pruebas de integración con `supertest` contra la base de datos real `DB_NAME_TEST`), se proponen los siguientes casos, que extienden los archivos de prueba del módulo de pagos.

* **`payment.service.test.js` (unitario, mockeando `Payment` y `Client`):**
  * `updatePayment` debe lanzar `404` si `Payment.findById` no encuentra el registro, sin invocar `Payment.update`.
  * `updatePayment` debe lanzar `409` si el estado del pago es "Aceptado", "Rechazado" o "Pendiente de acreditación", sin invocar `Payment.update`.
  * `updatePayment` debe lanzar `400` si `monto` se informa como `0`, negativo o `NaN`.
  * `updatePayment` debe descartar `id_cliente` del payload persistido aunque se lo envíe explícitamente.
  * `updatePayment` debe lanzar `409` al intentar asignar "Aceptado" cuando el medio de cobro resultante es diferido, y resolver sin error cuando el destino es "Pendiente de acreditación".
  * `updatePayment` debe lanzar `409` si `Payment.update` retorna `affectedRows === 0` (formalización concurrente).
  * `deletePayment` debe lanzar `404` si el pago no existe y `409` si su estado no es "Borrador", invocando `Payment.delete` solo en el caso permitido.

* **`payment.controller.test.js` (integración REST con `supertest`, mockeando `PaymentService`):**
  * `PUT /api/payment/:id` debe retornar `200` con el `data` devuelto por `PaymentService.updatePayment` ante un payload válido.
  * `PUT /api/payment/:id` debe retornar `400` ante un `id` no numérico o un cuerpo vacío, sin invocar al servicio.
  * `PUT /api/payment/:id` y `DELETE /api/payment/:id` deben propagar el `statusCode` de la excepción del servicio (`404`, `409`, `400`).
  * `DELETE /api/payment/:id` debe retornar `200` con un mensaje descriptivo ante la baja exitosa.

* **`payment.api.test.js` (integración end-to-end contra `DB_NAME_TEST`, sin mocks):**
  * Modificar el importe y el número de comprobante de un pago en "Borrador" y verificar en la fila persistida los nuevos valores y que `fecha_actualizacion` quedó estampada.
  * Promover un pago en "Borrador" con medio inmediato (`es_diferido = 0`) al estado "Aceptado" y verificar la fila resultante.
  * Verificar que promover a "Aceptado" un pago con medio diferido (`es_diferido = 1`) retorna `409` y no altera la fila.
  * Verificar que modificar o eliminar un pago en estado "Aceptado" retorna `409` y deja la fila intacta.
  * Eliminar un pago en "Borrador" y verificar que la fila desaparece de `Pago`; repetir la baja sobre un pago "Rechazado" y verificar `409` con la fila subsistente.
