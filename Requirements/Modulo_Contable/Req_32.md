**Requerimiento 32: Modificación pago**

### Resumen del Requerimiento

El objetivo central es permitir la edición y eliminación de un pago registrado previamente por un cliente dentro del módulo administrativo y contable. La funcionalidad debe operar con una política de defensa estricta basada en el ciclo de vida del comprobante: si el pago se encuentra en estado "Borrador", el usuario puede ajustar libremente los importes, el medio de cobro, los comprobantes de respaldo o descartar el registro por completo; si el pago se encuentra en estado "Aceptado", el sistema debe adoptar una postura defensiva, bloqueando cualquier intento de edición o eliminación para proteger la integridad del saldo y la consistencia contable del cliente.

### Backend (Capa de Datos, Servicio y Exposición)

* **Model (`Payment.js`):** La capa de acceso a datos sobre la base de datos relacional MySQL debe ser capaz de consultar el registro actual mediante `findById` (incluyendo el estado operativo actual), ejecutar la mutación de atributos permitidos a través de un método `update` parametrizado, y ejecutar la baja del registro mediante un método `delete`. Ambos métodos de mutación deben admitir de forma opcional una conexión (`connection`) para operar dentro de un contexto transaccional en caso de ser requerido.


* **Service (`payment.service.js`):** A través de los métodos `updatePayment(id, updateData)` y `deletePayment(id)`, esta capa orquesta la operación y centraliza las reglas de negocio. Su principal responsabilidad es consultar previamente el estado de la entidad mediante `findById(id)` e implementar una cláusula de guarda (Fail-Fast): si el pago no existe, interrumpe el flujo; si el estado es distinto de "Borrador", aborta inmediatamente arrojando una excepción de negocio semántica para impedir la alteración contable. Asimismo, valida que los montos modificados permanezcan como valores estrictamente positivos (`monto > 0`).


* **Controller (`payment.controller.js`):** Debe exponer los endpoints `PUT /api/payments/:id` y `DELETE /api/payments/:id` construidos sobre Express.js. Su tarea es atrapar las peticiones HTTP, validar la sintaxis básica de los parámetros de ruta (`id`) y cuerpo (`req.body`), delegar el procesamiento a la capa de servicios y devolver una respuesta semántica uniforme (`200 OK`, `400 Bad Request`, `403 Forbidden` / `409 Conflict`, `404 Not Found`, `500 Internal Server Error`).



### Frontend (Capa de Integración y Presentación)

* **Integración API (`payment.service.js`):** Se deben implementar las funciones cliente asíncronas `apiUpdatePayment(id, updateData)` y `apiDeletePayment(id)` para despachar las peticiones HTTP (PUT y DELETE respectivamente) hacia el backend utilizando `fetch`, resolviendo las promesas y controlando los estados de error mediante la propiedad `res.ok`.


* **UI (integración en `PaymentList.jsx`):** El componente visual desarrollado en React.js con clases de TailwindCSS debe responder al ciclo de vida del pago. Si el registro está en estado "Aceptado" o "Rechazado", la interfaz debe deshabilitar o no renderizar los botones de acción para editar o eliminar, e inyectar avisos de solo lectura. Si el estado es "Borrador", debe desplegar un formulario interactivo que permita modificar los datos o confirmar la eliminación definitiva mediante un diálogo de confirmación.



### Reglas de Negocio Clave

* **Inmutabilidad por Estado Aceptado:** El backend debe abortar cualquier intento de modificación o baja si el pago está en estado "Aceptado", garantizando que los fondos formalizados no se alteren de manera unilateral.


* **Inmutabilidad por Estado Rechazado:** El backend debe abortar cualquier intento de modificación o baja si el pago está en estado "Rechazado", garantizando que los pagos no acentados permanezcan visibles para control futuro.


* **Consistencia Monetaria en Modificación:** En caso de alterarse el importe monetario en estado "Borrador", el nuevo valor debe ser un escalar numérico mayor a cero (`monto > 0`).


* **Restricción de Cliente:** Al modificar un pago, el identificador del cliente (`id_cliente`) no puede ser transferido ni reasignado hacia otro cliente; la mutación se acota a importe, medio de pago, fecha, observaciones, número de comprobante y estado.



---

### Desglose Atómico de Tareas (WBS) por Componente Arquitectónico

#### 0. Base de Datos

* *(Sin tareas nuevas)*. Se utiliza la estructura relacional existente de las tablas `Pago`, `EstadoPago` y `MedioPago` con sus respectivos índices de optimización.



#### 1. Capa de Datos (`backend/src/models/Payment.js`)

* **Tarea 1.1:** En `Payment.js`, implementar el método `findById(id, connection = null)` que ejecute una consulta relacional con JOIN hacia `EstadoPago` y `MedioPago` para retornar el registro hidratado con la descripción de su estado.


* **Tarea 1.2:** Implementar el método `update(id, updateData, connection = null)` ejecutando la sentencia SQL parametrizada `UPDATE Pago SET ... WHERE id_pago = ?`, operando de manera agnóstica sobre la conexión inyectada o el pool general.


* **Tarea 1.3:** Implementar el método `delete(id, connection = null)` ejecutando la baja correspondiente sobre la tabla `Pago` mediante `DELETE FROM Pago WHERE id_pago = ?` y retornando las filas afectadas (`affectedRows`).



#### 2. Capa de Lógica de Negocio (`backend/src/services/payment.service.js`)

* **Tarea 2.1:** Implementar la función `updatePayment(id, updateData)`.


* **Tarea 2.2 (Regla de Negocio Crítica - Guarda de Modificación):** Invocar a `Payment.findById(id)`. Si el registro no existe, arrojar error de negocio `HTTP 404`. Si el nombre del estado asociado es distinto de "Borrador", interrumpir inmediatamente el flujo (Fail-Fast) arrojando una excepción de negocio `HTTP 409 Conflict` o `HTTP 403 Forbidden` informando que el comprobante no es mutable.


* **Tarea 2.3 (Validación de Importe):** Validar que, si se provee el campo `monto`, este sea estrictamente positivo (`monto > 0`); de lo contrario, lanzar un error `HTTP 400 Bad Request`.


* **Tarea 2.4:** Implementar la función `deletePayment(id)`.


* **Tarea 2.5 (Regla de Negocio Crítica - Guarda de Baja):** Consultar el estado del pago mediante `Payment.findById(id)`. Si el estado no es estrictamente "Borrador", abortar la eliminación con error de dominio `HTTP 409 Conflict` o `HTTP 403 Forbidden`. En caso afirmativo, delegar a `Payment.delete(id)`.



#### 3. Capa de Exposición (`backend/src/controllers/payment.controller.js` y `backend/src/routes/payment.routes.js`)

* **Tarea 3.1:** En `payment.controller.js`, implementar el método `handleUpdatePayment(req, res)` extrayendo `req.params.id` y `req.body`, aplicando bloques `try/catch` para mapear los errores a respuestas HTTP semánticas.


* **Tarea 3.2:** En `payment.controller.js`, implementar el método `handleDeletePayment(req, res)` extrayendo `req.params.id` y retornando `200 OK` con un mensaje descriptivo ante la baja exitosa.


* **Tarea 3.3:** En `payment.routes.js`, declarar y exponer los endpoints `PUT /api/payments/:id` y `DELETE /api/payments/:id` asociándolos a sus respectivos métodos de controlador.



#### 4. Capa de Integración Frontend (`frontend/src/services/payment.service.js`)

* **Tarea 4.1:** Implementar la función asíncrona `apiUpdatePayment(id, updateData)` consumiendo mediante `fetch` el endpoint `PUT /api/payments/:id` con cabeceras `application/json`.


* **Tarea 4.2:** Implementar la función asíncrona `apiDeletePayment(id)` consumiendo mediante `fetch` el endpoint `DELETE /api/payments/:id` y controlando las excepciones de respuesta (`!res.ok`).



#### 5. Capa de Presentación (`frontend/src/components/PaymentList.jsx` y vistas asociadas)

* **Tarea 5.1:** Modificar la interfaz `PaymentList.jsx` con TailwindCSS, para la edición de los pagos habilitados.


* **Tarea 5.2:** En la tabla de listado de pagos, condicionar reactivamente los botones de acción: renderizar o habilitar los botones "Editar" y "Eliminar" únicamente si el estado de la fila es "Borrador"; para pagos "Aceptados", pasivar los controles o mostrar indicadores visuales de bloqueo contable.


* **Tarea 5.3:** Implementar un modal de advertencia y confirmación antes de disparar la acción de baja definitiva invocando a `apiDeletePayment`.


* **Tarea 5.4:** Gestionar el estado de guardado (`isSaving`), capturar errores del servidor y refrescar la grilla tras una modificación o descarte exitoso.



---

##### ⚠️ Gestión de Riesgos y Advertencias de Arquitectura

1. **Riesgo de Condiciones de Carrera en Concurrencia:** Si un usuario intenta modificar o borrar un pago en borrador mientras otro operador lo formaliza concurrentemente, la consulta previa en memoria no basta. La cláusula de guarda en la capa de servicio debe resolverse justo antes de ejecutar la mutación o asegurar que la instrucción SQL incorpore la condición `WHERE id_pago = ? AND id_estado_pago = [ID_BORRADOR]` para garantizar que no se alteren filas en estado aceptado por concurrencia.


2. **Exclusión de Reversiones Automáticas de Saldo:** Dado que los pagos en estado "Borrador", "Pendiente de Acreditación" y "Rechazado" no computan en el saldo consolidado de la cuenta corriente, su modificación o eliminación no debe generar contraasientos ni alteraciones en movimientos contables definitivos.