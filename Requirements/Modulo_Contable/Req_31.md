**Requerimiento 31: Registro de nuevo pago**

### Resumen del Requerimiento

El objetivo de este requerimiento es permitir la captura y persistencia formal de pagos realizados por los clientes dentro del módulo administrativo y contable. La funcionalidad debe permitir registrar el importe, la fecha de recepción del cobro, el medio de pago utilizado, el banco emisor y la fecha de vencimiento cuando el cobro se instrumenta mediante un medio diferido (cheque), y los datos de respaldo (número de comprobante externo y observaciones). A nivel de dominio, el sistema debe garantizar la integridad transaccional validando la existencia y vigencia del cliente, la pertenencia del medio de pago al catálogo, la pertenencia del banco emisor al catálogo de bancos, y asegurando que el importe sea estrictamente positivo antes de impactar la base de datos relacional MySQL.

El banco emisor constituye, en la operatoria real del taller, el dato con el que los empleados identifican cada cheque en cartera, por lo que su registro es obligatorio para los medios de pago marcados como diferidos (`es_diferido = 1`, actualmente solo "Cheque") y queda inhabilitado para los medios inmediatos. El catálogo de bancos se modela como una tabla maestra propia (`Banco`) que se alimenta de forma incremental: en lugar de precargar la nómina completa de entidades financieras del país, el sistema permite al empleado dar de alta el banco que necesita sin abandonar el formulario de carga del pago. Por la misma razón operativa, el número de comprobante externo —que en un cheque es su número impreso— deja de ser un dato de respaldo opcional y pasa a ser obligatorio para los medios diferidos, ya que junto con el banco emisor es lo que permite individualizar físicamente cada cheque en cartera; para los medios inmediatos conserva su carácter optativo.

### Modelo temporal del pago

El registro maneja tres fechas de naturaleza distinta, que no deben confundirse entre sí:

* **Fecha de creación (`fecha_creacion`):** marca temporal de auditoría que indica cuándo se cargó el asiento en el sistema. No la informa el usuario ni la aplicación: la estampa el motor por `DEFAULT CURRENT_TIMESTAMP`. Tiene valor de trazabilidad interna, no de negocio.


* **Fecha de recepción (`fecha_recepcion`):** fecha en la que el taller efectivamente recibió el cobro, cualquiera sea su instrumento (el efectivo entregado, la transferencia acreditada o el cheque recibido en mano). Es un dato de negocio obligatorio para todo pago, lo informa el usuario y es la fecha relevante para ubicar el movimiento en el tiempo. Sustituye a la anterior denominación `fecha_pago`, ambigua frente a la incorporación del vencimiento.


* **Fecha de vencimiento (`fecha_vencimiento`):** fecha a partir de la cual el cheque puede presentarse al cobro en el banco. Solo tiene sentido para los medios de pago diferidos, donde es obligatoria porque determina cuándo el taller debe ir a cobrarlo; para los medios inmediatos se persiste en `null`.

Todo pago se registra siempre en estado "Borrador", con independencia de la naturaleza del medio de cobro seleccionado. El ciclo de vida del pago, tipificado en la tabla maestra `EstadoPago`, comprende los estados "Borrador", "Pendiente de acreditación", "Aceptado" y "Rechazado", de los cuales solo "Aceptado" computa sobre el saldo consolidado de la cuenta corriente del cliente. Un pago recién creado es, por lo tanto, un asiento preliminar: no incide sobre el balance y admite corrección o descarte mientras permanece en "Borrador". La asignación de un estado operativo definitivo constituye una operación posterior y explícita de modificación, fuera del alcance de este requerimiento.

### Backend (Capa de Datos, Servicio y Exposición)

* **Model (`Payment.js`):** Gestiona la persistencia sobre la tabla relacional `Pago`. Implementa el método `create(paymentData, connection = null)`, diseñado para soportar transacciones atómicas mediante la inyección explícita de la conexión (`connection`) a fin de garantizar propiedades ACID en operaciones compuestas; en su ausencia, recae sobre el pool general de conexiones y retorna el `insertId` generado. La sentencia de inserción incorpora las columnas `id_banco` y `fecha_vencimiento`, ambas normalizadas a `null` cuando el medio de cobro no es diferido, y escribe la fecha de recepción sobre la columna `fecha_recepcion`. Las marcas temporales de auditoría no se informan desde la aplicación: la columna `fecha_creacion` de la tabla `Pago` se estampa sola por `DEFAULT CURRENT_TIMESTAMP`. El mismo archivo concentra el acceso al catálogo de bancos —`findAllBanks()`, `findBankById(idBanco)`, `findBankByName(nombre)` y `createBank(nombre, connection = null)`— siguiendo la convención ya adoptada para los catálogos de estados y medios de pago (`findAllStates`, `findAllMethods`, `findStateById`, `findMethodById`), que residen en este modelo en lugar de en archivos separados por tratarse de tablas maestras auxiliares del dominio de pagos.


* **Service (`payment.service.js`):** Orquesta la lógica del negocio mediante el método estático `createPayment(paymentData)` de la clase `PaymentService`. Valida la presencia de los campos obligatorios, la existencia y vigencia del cliente, la pertenencia del medio de pago al catálogo, la coherencia entre la naturaleza del medio de cobro y los datos propios del instrumento diferido (banco emisor, número de comprobante y fecha de vencimiento), y la consistencia del importe monetario. Por razones de seguridad contable, resuelve siempre el estado operativo inicial "Borrador" para el registro, sin excepción, previo a su inserción en la capa de datos. El estado se referencia por su nombre semántico a través del diccionario de constantes `ESTADOS_PAGO` definido en el módulo, resolviendo su identificador contra el catálogo en tiempo de ejecución y nunca por número fijo. El alta de entidades bancarias se resuelve en el método estático `createBank(bankData)`, que normaliza el nombre recibido y rechaza los duplicados lógicos antes de delegar la inserción.


* **Controller (`payment.controller.js`):** Expone el endpoint `POST /api/payment` a través de Express.js, respetando el prefijo bajo el que está montado el enrutador de pagos en `app.js` (`/api/payment`, en singular). Intercepta el payload de la petición HTTP (`req.body`), ejecuta una validación sintáctica preliminar de los campos obligatorios, delega la ejecución a la capa de servicios y efectúa el mapeo semántico de errores a códigos de estado HTTP estandarizados (`201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`) devolviendo el sobre JSON uniforme del módulo (`{ success, data }` o `{ success, message }`). Complementariamente expone los endpoints de catálogo de bancos `GET /api/payment/banks` y `POST /api/payment/banks`, declarados como rutas literales por encima de las rutas paramétricas del enrutador para preservar el orden de resolución de Express, tal como ya ocurre con `/methods` y `/states`.



### Frontend (Capa de Integración y Presentación)

* **Integración API (`payment.service.js`):** Implementa la función asíncrona cliente `apiCreatePayment(paymentData)` que realiza el despacho de la petición HTTP POST hacia el servidor mediante la API nativa `fetch`, reutilizando el helper `getAuthHeaders()` del archivo para adjuntar el token de sesión, gestionando la serialización JSON y capturando fallos de red o respuestas no satisfactorias (`!response.ok`), que eleva como excepciones enriquecidas con `error.statusCode` para su manejo diferenciado en la interfaz. Con la misma estructura se incorporan `fetchBanks()`, que recupera el catálogo de bancos, y `apiCreateBank(bankData)`, que da de alta una entidad bancaria nueva y retorna el registro creado para que la interfaz pueda seleccionarlo de inmediato sin recargar la página.


* **UI (`CreatePaymentPage.jsx`):** Página reactiva desarrollada en React.js y estilizada con clases de utilidad de TailwindCSS, alcanzable desde la ruta `/crear-pago`. Proporciona una interfaz estructurada con selector de cliente, panel informativo con los datos del cliente seleccionado (nombre, CUIT y domicilio), campo numérico de importe, selector de medio de pago poblado dinámicamente desde el catálogo, selector de banco emisor y selector de fecha de vencimiento condicionados a los medios diferidos, selector de fecha de recepción y campos de texto para número de comprobante externo y observaciones. Maneja el estado local con `useState`, previene el envío múltiple por pulsación concurrente (*double-submit*) mediante la bandera `isSaving` y provee retroalimentación visual al usuario. El carácter preliminar del asiento debe ser explícito en la propia acción de guardado, rotulada como creación del pago en estado "Borrador".


* **Selección del banco emisor (control de búsqueda con alta asistida):** El banco no se captura mediante un campo de texto libre —que trasladaría cada error de tipeo al catálogo y fragmentaría la misma entidad en múltiples variantes ("Banco Nación", "Bco Nacion", "BNA")— sino mediante un control de búsqueda (*combobox*) que filtra el catálogo a medida que el empleado escribe pero **solo persiste identificadores efectivamente seleccionados de la lista**: el texto tecleado actúa exclusivamente como criterio de filtrado y nunca como valor guardado. El filtrado se realiza por coincidencia parcial y de forma insensible a mayúsculas, acentos y espacios redundantes, de modo que escribir "nacion" alcance a "Banco de la Nación Argentina" sin necesidad de reproducir el nombre completo.

  Debajo del control, siempre visible e independientemente de si la búsqueda arrojó coincidencias, se ofrece la acción secundaria "Agregar nuevo banco", que abre un modal simple con un único campo de nombre, precargado con el texto que el empleado venía escribiendo. Se prefiere el botón fijo por sobre una opción emergente dentro de la lista desplegable porque esta última solo aparecería ante la ausencia de coincidencias, invitando al alta justamente en el escenario más propenso al error (el empleado escribió mal el nombre de un banco que ya existe). Antes de confirmar el alta, el modal exhibe las entidades ya registradas con nombre semejante y exige la confirmación explícita del usuario, de manera que el camino de menor esfuerzo sea siempre reutilizar un banco existente y no duplicarlo. Confirmada el alta, el banco recién creado se incorpora al catálogo en memoria y queda seleccionado automáticamente en el formulario, sin pérdida de los datos ya cargados del pago.



### Reglas de Negocio Clave

* **Validación de Entidad Cliente:** La operación se aborta de forma inmediata (Fail-Fast) con `HTTP 404` si el identificador del cliente provisto no corresponde a una entidad existente y activa (`is_active`) en el sistema.


* **Validación del Medio de Cobro:** El medio de pago informado debe pertenecer al catálogo de la tabla maestra `MedioPago`; en caso contrario, la operación se aborta con `HTTP 404`.


* **Consistencia Monetaria:** El monto registrado debe ser un escalar numérico estrictamente positivo (`monto > 0`); se rechazan con `HTTP 400` las transacciones nulas, no numéricas o de valor negativo.


* **Trazabilidad:** Todo registro de pago debe asociarse a su correspondiente cliente, medio de pago y fecha de recepción del cobro, para alimentar de forma consistente el libro de movimientos y el balance contable del cliente.


* **Banco Emisor Obligatorio en Medios Diferidos:** Si el medio de cobro seleccionado está marcado como diferido en el catálogo (`es_diferido = 1`, condición que hoy satisface únicamente el cheque), el identificador del banco emisor es obligatorio; su ausencia aborta la operación con `HTTP 400`. El banco informado debe pertenecer al catálogo de la tabla maestra `Banco`; en caso contrario, la operación se aborta con `HTTP 404`. La condición se evalúa siempre contra la bandera `es_diferido` del medio recuperado del catálogo y jamás contra el nombre del medio ni contra un identificador fijo, para que la incorporación futura de otros instrumentos diferidos (pagarés, cheques electrónicos) no requiera modificar la regla.


* **Comprobante Externo Obligatorio en Medios Diferidos:** Si el medio de cobro seleccionado es diferido, el número de comprobante externo —el número impreso del cheque— es obligatorio y se rechaza con `HTTP 400` su ausencia, su valor vacío o el compuesto solo por espacios. Para los medios inmediatos permanece optativo y se persiste como `null` cuando no se informa. El dato se almacena recortado de espacios en sus extremos.


* **Fecha de Vencimiento Obligatoria en Medios Diferidos:** Si el medio de cobro es diferido, la fecha de vencimiento es obligatoria, ya que es el dato que indica a partir de cuándo el cheque puede presentarse al cobro en el banco; su ausencia aborta la operación con `HTTP 400`. Debe corresponder a una fecha real de calendario en formato `YYYY-MM-DD` y no puede ser anterior a la fecha de recepción del cobro, combinación que se rechaza con `HTTP 400` por inconsistencia temporal. No se impone, en cambio, que sea posterior a la fecha actual: el sistema debe admitir la carga tardía de cheques ya vencidos.


* **Fecha de Vencimiento Inaplicable en Medios Inmediatos:** Si el medio de cobro no es diferido, la fecha de vencimiento se persiste como `null`. Informarla junto a un medio inmediato se rechaza con `HTTP 400`, por el mismo criterio con que se rechaza el banco emisor en ese escenario.


* **Banco Inaplicable en Medios Inmediatos:** Si el medio de cobro no es diferido (`es_diferido = 0`), el campo de banco emisor se persiste como `null`. Un banco informado junto a un medio inmediato se rechaza con `HTTP 400` en lugar de descartarse en silencio, ya que la combinación evidencia una inconsistencia en el origen de los datos que conviene hacer visible.


* **Normalización y Unicidad del Catálogo de Bancos:** El nombre de un banco se persiste recortado de espacios en sus extremos y con los espacios internos colapsados a uno solo. Antes de insertarlo, el sistema verifica que no exista ya una entidad con el mismo nombre comparado de forma insensible a mayúsculas, minúsculas y acentos; de existir, la operación se rechaza con `HTTP 409 Conflict` informando el nombre en conflicto. Se rechaza con `HTTP 400` el nombre vacío, compuesto solo por espacios o que exceda los 50 caracteres. La unicidad se refuerza además con una restricción `UNIQUE` en la base de datos, de modo que una condición de carrera entre dos altas simultáneas no pueda materializar el duplicado.


* **Preservación del Catálogo de Bancos:** Una entidad bancaria dada de alta no se elimina físicamente mientras tenga pagos imputados; la clave foránea con política `ON DELETE RESTRICT` impide la baja y preserva la trazabilidad de los cheques históricos.


* **Estado Inicial "Borrador" Obligatorio (Regla de Seguridad):** Todo pago debe crearse siempre en estado "Borrador", con independencia de la naturaleza del medio de cobro seleccionado (inmediato o diferido). El estado operativo definitivo ("Aceptado", "Pendiente de acreditación" o "Rechazado") solo puede asignarse mediante una edición posterior y explícita del registro. La razón es doble: por un lado, un asiento recién cargado no debe impactar el saldo consolidado del cliente antes de ser revisado; por el otro, el "Borrador" constituye la única ventana en la que el registro admite corrección o descarte, ya que una vez formalizado en un estado definitivo el pago deja de ser modificable y eliminable para preservar la trazabilidad contable.



---

### Desglose Atómico de Tareas (WBS) por Componente Arquitectónico



#### 0. Base de Datos



* **Tarea 0.1:** Crear la tabla `Pago` en MySQL siguiendo la convención de PascalCase para tablas y snake_case para columnas:


* `id_pago` (INT, PK, AUTO_INCREMENT)
* `id_cliente` (INT, NOT NULL, FK referenciando a `Cliente(id_cliente)`)
* `id_estado_pago` (INT, NOT NULL, FK referenciando a `EstadoPago(id_estado_pago)`)
* `id_medio_pago` (INT, NOT NULL, FK referenciando a `MedioPago(id_medio_pago)`)
* `id_banco` (INT, NULL, FK referenciando a `Banco(id_banco)`) — informado solo cuando el medio de cobro es diferido
* `monto` (DECIMAL(10,2), NOT NULL)
* `fecha_recepcion` (DATE, NOT NULL) — fecha en la que el taller recibió el cobro; se registra con granularidad de día, que es la que maneja la operatoria real, mientras que el instante exacto de la carga queda asentado en `fecha_creacion`
* `fecha_vencimiento` (DATE, NULL) — fecha de presentación al cobro; informada solo cuando el medio es diferido
* `numero_comprobante` (VARCHAR(100), NULL) — nulable a nivel de esquema, pero obligatorio por regla de negocio cuando el medio es diferido
* `observaciones` (TEXT, NULL)
* `fecha_creacion` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
* `fecha_actualizacion` (TIMESTAMP, NULL ON UPDATE CURRENT_TIMESTAMP)


* **Tarea 0.2:** Crear la tabla maestra `Banco` en MySQL con la misma convención de nomenclatura:


* `id_banco` (INT, PK, AUTO_INCREMENT)
* `nombre` (VARCHAR(50), NOT NULL, UNIQUE)
* `fecha_creacion` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)


  La restricción `UNIQUE` sobre `nombre` debe apoyarse en una colación insensible a mayúsculas, minúsculas y acentos (`utf8mb4_0900_ai_ci`, la ya utilizada por el resto del esquema), de modo que "Banco Nación", "BANCO NACIÓN" y "Banco Nacion" colisionen a nivel de motor y no solo por validación aplicativa.


* **Tarea 0.3:** Declarar las claves foráneas con la política `ON DELETE RESTRICT ON UPDATE CASCADE` (`fk_pago_cliente`, `fk_pago_estado`, `fk_pago_medio`, `fk_pago_banco`), de modo que la base de datos impida la baja de un cliente, un estado, un medio de pago o un banco que tenga cobros imputados. Declarar asimismo el índice de la clave foránea `id_banco` para sostener el filtrado y el cruzamiento relacional por entidad bancaria.


* **Tarea 0.4 (Migración del Esquema Vigente):** Sobre las bases ya desplegadas, renombrar la columna `Pago.fecha_pago` a `Pago.fecha_recepcion` mediante `ALTER TABLE Pago CHANGE COLUMN`, convirtiendo su tipo de `DATETIME NOT NULL` a `DATE NOT NULL` y preservando los datos existentes (la conversión descarta únicamente la componente horaria, que no tiene valor de negocio), y agregar `fecha_vencimiento` e `id_banco` como columnas nulables para no invalidar los registros históricos. El cambio debe replicarse en `migracion_taller.sql`, que es la fuente de verdad del esquema y la que alimenta tanto el servicio `mysql-taller` de Docker como la base de test `DB_NAME_TEST`. El renombrado alcanza a toda referencia a `fecha_pago` en el código: sentencias SQL del modelo, claves del DTO, criterios de filtrado y de ordenamiento, y campos del formulario y de la grilla en el frontend.


#### 1. Capa de Datos (`backend/src/models/Payment.js`)

* **Tarea 1.1:** Implementar la función `create(paymentData, connection = null)`. Construir la sentencia parametrizada `INSERT INTO Pago (...) VALUES (...)` sobre las columnas `id_cliente`, `id_estado_pago`, `id_medio_pago`, `id_banco`, `monto`, `fecha_recepcion`, `fecha_vencimiento`, `numero_comprobante` y `observaciones`, permitiendo el uso de una conexión transaccional inyectada o el pool general del sistema, normalizando a `null` los campos de respaldo no informados y el banco y el vencimiento cuando no corresponden, y retornando el `insertId` generado.


* **Tarea 1.2:** Implementar `findAllBanks()`, que recupera `id_banco` y `nombre` de la tabla `Banco` ordenados alfabéticamente por nombre, replicando la estructura de las funciones de catálogo ya existentes en el archivo (`findAllStates`, `findAllMethods`).


* **Tarea 1.3:** Implementar `findBankById(idBanco)`, que retorna la fila del banco solicitado o `null` si no existe, siguiendo la forma de `findMethodById` y `findStateById`.


* **Tarea 1.4:** Implementar `findBankByName(nombre)`, que busca una entidad por coincidencia exacta del nombre (la colación del esquema, insensible a la caja y a los acentos, resuelve la equivalencia de mayúsculas, minúsculas y vocales acentuadas) y retorna la fila hallada o `null`, para sostener la detección de duplicados en la capa de servicio.


* **Tarea 1.5:** Implementar `createBank(nombre, connection = null)`, que inserta la nueva entidad mediante una sentencia parametrizada admitiendo conexión transaccional inyectada o el pool general, y retorna el `insertId` generado.



#### 2. Capa de Lógica de Negocio (`backend/src/services/payment.service.js`)



* **Tarea 2.1:** Implementar el método estático `createPayment(paymentData)` en la clase `PaymentService`.


* **Tarea 2.2 (Validación de Forma):** Verificar la presencia de los campos obligatorios `id_cliente`, `id_medio_pago` y `fecha_recepcion`, arrojando una excepción de validación (`HTTP 400`) ante su ausencia.


* **Tarea 2.3 (Regla de Negocio Crítica - Validación de Entidad):** Consultar la existencia del cliente mediante la capa de datos de clientes (`Client.findById`); si no existe o su bandera `is_active` es falsa, interrumpir el flujo elevando una excepción de negocio tipificada (`HTTP 404`).


* **Tarea 2.4 (Validación del Medio de Cobro):** Verificar mediante `Payment.findMethodById` que el medio de pago informado pertenezca al catálogo; en caso contrario, elevar `HTTP 404`. Conservar la fila recuperada, ya que su bandera `es_diferido` gobierna la validación del banco emisor.


* **Tarea 2.5 (Regla de Negocio Crítica - Coherencia entre el Medio y los Atributos del Instrumento Diferido):** A partir de la bandera `es_diferido` del medio recuperado en la tarea anterior, y nunca a partir de su nombre ni de un identificador fijo, resolver de forma conjunta la obligatoriedad de los tres atributos propios del cheque —banco emisor, número de comprobante externo y fecha de vencimiento—, concentrando la decisión en un único punto del flujo:
* si el medio es diferido, elevar `HTTP 400` ante la ausencia de `id_banco`, ante un `numero_comprobante` ausente, vacío o compuesto solo por espacios, o ante la ausencia de `fecha_vencimiento`;
* si el medio no es diferido, elevar `HTTP 400` cuando se informe `id_banco` o `fecha_vencimiento`, por inconsistencia de la carga, y fijar ambos atributos en `null` para la persistencia;
* en todos los casos, persistir el `numero_comprobante` recortado de espacios en sus extremos, o `null` cuando no se informa en un medio inmediato.


* **Tarea 2.6 (Validación de la Entidad Bancaria):** Cuando corresponda informar banco, verificar mediante `Payment.findBankById` que el identificador pertenezca al catálogo de la tabla `Banco`; en caso contrario, elevar `HTTP 404`.


* **Tarea 2.7 (Validación Temporal del Vencimiento):** Cuando corresponda informar vencimiento, verificar que `fecha_vencimiento` respete el formato `YYYY-MM-DD` y corresponda a una fecha real de calendario, y que no sea anterior a `fecha_recepcion`; ante cualquiera de ambas inconsistencias, elevar `HTTP 400` identificando el criterio conflictivo. No se valida la relación con la fecha actual, ya que la carga tardía de cheques vencidos es una operatoria legítima.


* **Tarea 2.8 (Validación de Importe):** Validar que el campo `monto` sea un número mayor a cero (`monto > 0`). En caso contrario, arrojar una excepción de validación (`HTTP 400`).


* **Tarea 2.9 (Regla de Negocio Crítica - Estado Inicial):** Resolver el estado operativo inicial del pago como "Borrador" en todos los casos, sin excepción y con independencia del medio de pago seleccionado, buscándolo por nombre semántico dentro del catálogo de estados (`Payment.findAllStates`). Si el catálogo no tuviera configurado ese estado, elevar `HTTP 500` por inconsistencia de parametrización del entorno.


* **Tarea 2.10 (Persistencia):** Consolidar el objeto de atributos a persistir con el importe ya normalizado a tipo numérico, el número de comprobante recortado, el identificador del banco y la fecha de vencimiento resueltos (o `null`) y el identificador del estado resuelto, delegar la inserción a `Payment.create`, y retornar el registro creado incluyendo su identificador, el nombre del estado inicial, y el nombre del banco emisor y la fecha de vencimiento cuando existan.


* **Tarea 2.11 (Alta de Entidad Bancaria):** Implementar el método estático `createBank(bankData)` en la clase `PaymentService`, que recorta y colapsa los espacios del nombre recibido, rechaza con `HTTP 400` el nombre vacío o de más de 50 caracteres, consulta `Payment.findBankByName` y rechaza con `HTTP 409` la existencia de una entidad homónima informando el nombre en conflicto, delega la inserción en `Payment.createBank` y retorna el registro creado con su identificador y su nombre normalizado.


* **Tarea 2.12 (Exposición del Catálogo de Bancos):** Implementar el método estático `getBanks()` que delega en `Payment.findAllBanks` y retorna la colección de bancos, con la misma forma que los métodos ya existentes de exposición de los catálogos de estados y medios de pago.



#### 3. Capa de Exposición (`backend/src/controllers/payment.controller.js` y `backend/src/routes/payment.routes.js`)



* **Tarea 3.1:** Crear `payment.controller.js` e implementar el método `handleCreatePayment(req, res)` extrayendo el `req.body`, rechazando con `400` la ausencia de `id_cliente`, `id_medio_pago`, `monto` o `fecha_recepcion` antes de invocar al servicio —la obligatoriedad condicional del banco, el comprobante y el vencimiento no se evalúa aquí, ya que depende de la naturaleza del medio de cobro y es una regla de negocio de la capa de servicios—, y manejando las excepciones con bloques `try/catch` que lean `error.statusCode` para devolver códigos HTTP semánticos (`201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`).


* **Tarea 3.2:** Crear `payment.routes.js` y exponer el endpoint `POST /` asociándolo al método del controlador.


* **Tarea 3.3:** Registrar el enrutador de pagos en `app.js` bajo el prefijo `/api/payment`, con lo que el endpoint resultante es `POST /api/payment`.


* **Tarea 3.4:** Implementar en `payment.controller.js` el método `getBanks(req, res)` que delega en `PaymentService.getBanks` y devuelve `200 OK` con la colección de bancos en el sobre JSON uniforme del módulo, replicando la estructura de `getPaymentMethods` y `getPaymentStates`.


* **Tarea 3.5:** Implementar en `payment.controller.js` el método `handleCreateBank(req, res)` que extrae `nombre` de `req.body`, rechaza con `400` su ausencia antes de invocar al servicio, delega el alta y mapea las excepciones leyendo `error.statusCode` para devolver `201 Created`, `400 Bad Request`, `409 Conflict` o `500 Internal Server Error`.


* **Tarea 3.6:** Declarar en `payment.routes.js` las rutas literales `GET /banks` y `POST /banks` enlazadas a los métodos anteriores, ubicándolas junto a `/methods` y `/states` y por encima de las rutas paramétricas (`/:id`) para preservar el orden de resolución de Express. Los endpoints resultantes son `GET /api/payment/banks` y `POST /api/payment/banks`.



#### 4. Capa de Integración Frontend (`frontend/src/services/payment.service.js`)



* **Tarea 4.1:** Crear el archivo `frontend/src/services/payment.service.js` con el helper `getAuthHeaders()`, que construye las cabeceras `application/json` y adjunta el token de sesión (`Authorization: Bearer`) recuperado de `localStorage`.


* **Tarea 4.2:** Implementar la función asíncrona `apiCreatePayment(paymentData)` utilizando `fetch` para enviar la carga útil JSON al endpoint `POST /api/payment`, controlando las respuestas no satisfactorias (`!response.ok`) y propagando el `statusCode` en la excepción elevada hacia la interfaz. La carga útil incluye `id_banco` y `fecha_vencimiento` cuando el medio de cobro seleccionado es diferido, y los omite en caso contrario.


* **Tarea 4.3:** Implementar la función asíncrona `fetchBanks()` que consulta `GET /api/payment/banks` con las cabeceras de `getAuthHeaders()` y retorna la colección de bancos, siguiendo la estructura de `fetchPaymentMethods` y `fetchPaymentStates`.


* **Tarea 4.4:** Implementar la función asíncrona `apiCreateBank(bankData)` que despacha `POST /api/payment/banks`, propaga el `statusCode` de las respuestas no satisfactorias —en particular el `409` de nombre duplicado, que la interfaz debe poder distinguir de un error genérico— y retorna el banco creado con su identificador para su selección inmediata en el formulario.



#### 5. Capa de Presentación (`frontend/src/pages/Payments/CreatePaymentPage.jsx`)



* **Tarea 5.1:** Diseñar la interfaz con React y TailwindCSS conteniendo el formulario de carga: selector de cliente, panel informativo con los datos del cliente seleccionado, campo numérico para el monto, selector de medio de pago, control de selección del banco emisor, selector de fecha de recepción del cobro, selector de fecha de vencimiento y campos de texto para el número de comprobante externo y las observaciones. La fecha de creación no se incluye en el formulario: la estampa la base de datos y es un dato de auditoría, no de carga.


* **Tarea 5.2:** Poblar dinámicamente el selector de medios de pago mediante un gancho de ciclo de vida (`useEffect`) que consulte el catálogo al montar la página, junto con el listado de clientes y el catálogo de bancos obtenido con `fetchBanks`.


* **Tarea 5.3 (Condicionalidad de los Datos del Cheque):** Derivar del medio de pago seleccionado su bandera `es_diferido` y mostrar el control de banco emisor y el selector de fecha de vencimiento únicamente cuando sea verdadera, rotulando ambos como campos obligatorios junto con el número de comprobante externo, cuya etiqueta debe pasar de optativa a obligatoria en ese mismo escenario. Al cambiar de un medio diferido a uno inmediato, limpiar el banco y el vencimiento previamente cargados para que no viajen en la carga útil, y bloquear el envío del formulario mientras un medio diferido no tenga banco, comprobante y vencimiento asignados. Validar en la propia interfaz que el vencimiento no sea anterior a la fecha de recepción, anticipando el rechazo del backend con un mensaje junto al campo.


* **Tarea 5.4 (Control de Búsqueda de Bancos):** Implementar el control de selección como un *combobox* con filtrado incremental sobre el catálogo ya cargado en memoria: un campo de texto que despliega las coincidencias a medida que el usuario escribe, y cuya selección —por clic o por teclado— es lo único que fija el identificador `id_banco` en el estado del formulario. Normalizar el texto de búsqueda y los nombres del catálogo antes de comparar (recorte de espacios, minúsculas y supresión de diacríticos) de modo que la coincidencia parcial sea tolerante a la caja y a los acentos. Si el usuario abandona el campo sin haber seleccionado una opción de la lista, restaurar el texto visible al nombre del banco actualmente seleccionado o vaciarlo, para que jamás quede en pantalla un valor que no se corresponde con un registro real.


* **Tarea 5.5 (Alta de Banco desde el Formulario):** Disponer bajo el control de búsqueda la acción secundaria "Agregar nuevo banco", visible de forma permanente y no solo ante la ausencia de coincidencias. Al pulsarla, abrir un modal simple con un único campo de nombre precargado con el texto de búsqueda vigente. Antes de confirmar, el modal debe listar los bancos del catálogo con nombre semejante al ingresado (comparación normalizada y por coincidencia parcial) y requerir una confirmación explícita del usuario cuando existan candidatos, ofreciendo seleccionarlos en lugar de crear el duplicado. Confirmada el alta, invocar `apiCreateBank`, incorporar el registro devuelto al catálogo en memoria, seleccionarlo automáticamente en el formulario y cerrar el modal sin pérdida de los datos ya cargados del pago. Controlar el envío duplicado del modal con su propia bandera de procesamiento y traducir el `409` del backend a un mensaje de banco ya existente dentro del propio modal.


* **Tarea 5.6:** Implementar el control del formulario mediante estados de React (`useState`), controlando la bandera de procesamiento (`isSaving`) para prevenir ejecuciones concurrentes o envíos duplicados, y rotulando la acción de guardado de modo que explicite que el pago se crea en estado "Borrador".


* **Tarea 5.7:** Conectar el envío del formulario con la función `apiCreatePayment`, desplegando notificaciones visuales (mensajes o banners) ante confirmaciones de guardado o errores de validación provenientes del backend.


* **Tarea 5.8:** Registrar la ruta `/crear-pago` en `App.js` dentro del bloque de PAGOS, bajo la protección de `PrivateRoute` y el chrome compartido de `Layout`.



---

##### ⚠️ Gestión de Riesgos y Advertencias de Arquitectura



1. **Afectación Prematura de Saldo (Riesgo de Consistencia Contable):** Un pago recién registrado no debe consolidar saldo de forma irreversible. Dado que todo pago nace como "Borrador", la capa de servicios debe aislarlo del balance computable para evitar saldos distorsionados en la cuenta corriente del cliente hasta que sea editado y confirmado en un estado operativo definitivo.


2. **Dependencia de Transaccionalidad en Métodos de Pago Diferidos:** Si a futuro el registro del pago dispara la emisión simultánea de un recibo o la afectación de documentos, el método del modelo debe conservar la capacidad de recibir un objeto `connection` externo para no comprometer la atomicidad relacional en MySQL.


3. **Acoplamiento por Identificadores Fijos (Hardcoding):** El identificador numérico del estado "Borrador" no debe quemarse en el código. Se resuelve en la capa de servicio a partir del nombre semántico y del catálogo consultado en tiempo de ejecución, para prevenir discrepancias entre los entornos de desarrollo, test y producción, donde las claves primarias de las tablas maestras pueden no coincidir. El mismo criterio aplica a la identificación del cheque: la obligatoriedad del banco emisor se decide por la bandera `es_diferido` del medio de pago y nunca por su nombre ni por su identificador numérico, de modo que agregar otro instrumento diferido no exija tocar la regla de negocio.


4. **Contaminación del Catálogo de Bancos por Alta Libre (Riesgo de Calidad de Datos):** Habilitar al empleado a crear entidades bancarias desde el formulario de carga traslada al catálogo el riesgo de duplicados por error de tipeo o por variantes de escritura del mismo banco, lo que degradaría tanto la identificación de los cheques como el filtrado posterior por banco. La mitigación es de triple barrera: la interfaz nunca persiste texto libre sino identificadores efectivamente seleccionados de la lista; el modal de alta exhibe las entidades semejantes y exige confirmación explícita antes de crear; y el backend normaliza el nombre y rechaza los homónimos con `HTTP 409`, respaldado por la restricción `UNIQUE` del esquema. Se asume, no obstante, que el catálogo requerirá una depuración manual periódica, para la que conviene prever a futuro una pantalla de administración de bancos (renombrado y fusión de entidades duplicadas), fuera del alcance de este requerimiento.


5. **Obligatoriedad Condicional no Forzable por el Motor:** La obligatoriedad del banco emisor, del número de comprobante y de la fecha de vencimiento depende de un atributo de otra tabla (`MedioPago.es_diferido`), por lo que no puede expresarse como restricciones `NOT NULL` sobre `id_banco`, `numero_comprobante` y `fecha_vencimiento`: esas columnas deben permanecer nulables en el esquema para admitir los cobros inmediatos. La coherencia queda enteramente a cargo de la capa de servicio, que es el único punto donde debe validarse; ningún otro flujo de escritura sobre `Pago` debe sortear ese control, so pena de admitir en la base cheques sin banco, sin número identificatorio o sin fecha de presentación al cobro.


6. **Ambigüedad Semántica entre las Tres Fechas:** El registro pasa a manejar tres marcas temporales de naturaleza distinta —creación en el sistema, recepción del cobro y vencimiento del cheque— y la confusión entre ellas distorsionaría tanto el libro de movimientos como la gestión de la cartera de cheques. El renombrado de `fecha_pago` a `fecha_recepcion` apunta precisamente a suprimir esa ambigüedad, pero por tratarse de una columna preexistente exige una migración cuidadosa: mientras convivan referencias al nombre anterior en el modelo, el DTO, los filtros o el frontend, las consultas fallarán de forma silenciosa o devolverán datos vacíos. El renombrado debe aplicarse de forma completa y en un único cambio, con `migracion_taller.sql` actualizado y la base de test `DB_NAME_TEST` recreada antes de ejecutar la suite.



---

### Estrategia de Tests (Backend)

Siguiendo las dos modalidades de prueba establecidas en `backend/__tests__/` (pruebas unitarias de servicio con mocks vía `jest.mock`, y pruebas de integración con `supertest` contra la base de datos real `DB_NAME_TEST`), se cubren los siguientes casos para el registro de pagos.

* **`payment.service.test.js` (unitario, mockeando `Payment` y `Client` con `jest.mock`):**
  * `createPayment` debe resolver siempre el `id_estado_pago` correspondiente a "Borrador", tanto para medios de pago inmediatos como diferidos (`es_diferido` en `false` o `true`), verificando que `Payment.create` sea invocado con ese estado sin importar el medio.
  * `createPayment` debe lanzar `404` si `Client.findById` no encuentra al cliente, o si el cliente existe pero `is_active` es `false`, sin invocar `Payment.create`.
  * `createPayment` debe lanzar `404` si `Payment.findMethodById` no encuentra el medio de pago indicado.
  * `createPayment` debe lanzar `400` si `monto` es `0`, negativo, `NaN` o está ausente.
  * `createPayment` debe lanzar `400` si falta `id_cliente`, `id_medio_pago` o `fecha_recepcion`.
  * `createPayment` debe lanzar `500` si el catálogo de estados (`Payment.findAllStates`) no tiene configurado el estado "Borrador" (catálogo mal parametrizado).
  * `createPayment` debe lanzar `400` si el medio de pago recuperado tiene `es_diferido = 1` y no se informó `id_banco`, sin invocar `Payment.create`.
  * `createPayment` debe lanzar `400` si el medio de pago recuperado tiene `es_diferido = 0` y se informó un `id_banco`, sin invocar `Payment.create`.
  * `createPayment` debe lanzar `404` si `Payment.findBankById` no encuentra el banco informado para un medio diferido.
  * `createPayment` debe persistir `id_banco` y `fecha_vencimiento` en `null` cuando el medio de pago no es diferido y no se informaron.
  * `createPayment` debe lanzar `400` si el medio de pago es diferido y `numero_comprobante` está ausente, vacío o compuesto solo por espacios, sin invocar `Payment.create`.
  * `createPayment` debe lanzar `400` si el medio de pago es diferido y falta `fecha_vencimiento`, si esa fecha no es una fecha real de calendario (`2026-02-31`) o si es anterior a `fecha_recepcion`, sin invocar `Payment.create`.
  * `createPayment` debe lanzar `400` si el medio de pago no es diferido y se informó `fecha_vencimiento`, sin invocar `Payment.create`.
  * `createPayment` debe admitir un vencimiento anterior a la fecha actual (carga tardía de un cheque ya vencido) siempre que no sea anterior a la fecha de recepción.
  * `createPayment` debe persistir el `numero_comprobante` recortado de espacios en sus extremos.
  * `createBank` debe lanzar `400` ante un nombre vacío, compuesto solo por espacios o de más de 50 caracteres, sin invocar `Payment.createBank`.
  * `createBank` debe lanzar `409` cuando `Payment.findBankByName` devuelve una entidad existente, sin invocar `Payment.createBank`.
  * `createBank` debe normalizar el nombre recibido (recorte de espacios en los extremos y colapso de espacios internos) antes de delegar la inserción.

* **`payment.controller.test.js` (integración REST con `supertest`, mockeando `PaymentService`):**
  * `POST /api/payment` debe retornar `201` y el `data` devuelto por `PaymentService.createPayment` cuando el payload es válido.
  * `POST /api/payment` debe retornar `400` si falta `id_cliente`, `id_medio_pago`, `monto` o `fecha_recepcion`, sin invocar al servicio.
  * `POST /api/payment` debe propagar el `statusCode` de la excepción del servicio (`404`, `400`) en la respuesta HTTP.
  * `POST /api/payment/banks` debe retornar `201` con el banco devuelto por `PaymentService.createBank`, `400` si falta el nombre en el cuerpo —sin invocar al servicio— y propagar el `409` de la excepción de duplicado.
  * `GET /api/payment/banks` debe retornar `200` con la colección devuelta por `PaymentService.getBanks`.

* **`payment.api.test.js` (integración end-to-end contra `DB_NAME_TEST`, sin mocks):**
  * `beforeAll` trunca `Pago`, `Cliente`, `EstadoPago`, `MedioPago` y `Banco`, y siembra un cliente activo, el catálogo de estados, al menos dos medios de pago (uno con `es_diferido = 0` y otro con `es_diferido = 1`) y al menos un banco.
  * Registrar un pago con un medio de pago **inmediato** (`es_diferido = 0`) y verificar en la fila insertada que `id_estado_pago` corresponde a "Borrador" (no "Aceptado") y que `id_banco` y `fecha_vencimiento` quedaron en `NULL`.
  * Registrar un pago con un medio de pago **diferido** (`es_diferido = 1`) informando el banco sembrado, el número de comprobante y la fecha de vencimiento, y verificar igualmente que `id_estado_pago` corresponde a "Borrador" (no "Pendiente de acreditación") y que `id_banco`, `numero_comprobante` y `fecha_vencimiento` quedaron persistidos.
  * Verificar que un pago con medio diferido y sin `id_banco` retorna `400` y no inserta fila en `Pago`.
  * Verificar que un pago con medio diferido y sin `numero_comprobante` retorna `400` y no inserta fila en `Pago`, y que el mismo pago con medio inmediato y sin comprobante se registra correctamente con `numero_comprobante` en `NULL`.
  * Verificar que un pago con medio diferido y sin `fecha_vencimiento`, o con un vencimiento anterior a la fecha de recepción, retorna `400` y no inserta fila en `Pago`.
  * Verificar que un pago con medio diferido y un `id_banco` inexistente retorna `404` y no inserta fila en `Pago`.
  * Verificar que un pago con medio inmediato acompañado de un `id_banco` o de una `fecha_vencimiento` retorna `400` y no inserta fila en `Pago`.
  * Dar de alta un banco mediante `POST /api/payment/banks` debe retornar `201`, insertar la fila con el nombre normalizado y hacerlo visible en la respuesta de `GET /api/payment/banks`; repetir el alta con el mismo nombre en distinta caja de letras debe retornar `409` sin insertar una segunda fila.
  * Verificar que un pago con `id_cliente` inexistente retorna `404` y no inserta fila en `Pago`.
  * Verificar que un pago con `monto <= 0` retorna `400` y no inserta fila en `Pago`.
  * Verificar que la respuesta `201` incluye `estado_pago_nombre: 'Borrador'` en el DTO devuelto.
