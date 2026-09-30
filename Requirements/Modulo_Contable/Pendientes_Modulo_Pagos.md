**Pendientes de implementación: Módulo de Pagos (Requerimientos 31, 31.1, 32 y 32.1)**

### Contexto

La última revisión de los requerimientos del ciclo de pagos incorporó tres cambios que atraviesan el registro (31), la consulta (31.1) y la modificación (32) de pagos:

* **Catálogo de bancos:** nueva tabla maestra `Banco` (`id_banco`, `nombre VARCHAR(50) UNIQUE`, `fecha_creacion`), alimentada de forma incremental desde el propio formulario de pagos mediante un control de búsqueda con alta asistida.
* **Datos obligatorios del cheque:** cuando el medio de cobro es diferido (`MedioPago.es_diferido = 1`), el banco emisor (`id_banco`), el número de comprobante externo (`numero_comprobante`) y la fecha de vencimiento (`fecha_vencimiento`) son obligatorios, y el vencimiento no puede ser anterior a la recepción. Cuando el medio es inmediato, el banco y el vencimiento no se admiten y el comprobante es optativo.
* **Renombrado de la fecha de negocio:** la columna `Pago.fecha_pago` pasa a llamarse `Pago.fecha_recepcion` y su tipo cambia a `DATE`. La fecha de vencimiento también es `DATE`; la fecha de creación sigue siendo el `TIMESTAMP` de auditoría.

Este documento enumera lo que falta implementar para completar esos cambios, ordenado por capa.

---

### Estado actual

| Capa | Estado |
| --- | --- |
| Base de datos (`migracion_taller.sql` y bases desplegadas) | ✅ Completa |
| Modelo (`backend/src/models/Payment.js`) | ✅ Completa |
| Servicio (`backend/src/services/payment.service.js`) | ✅ Completa |
| Controlador y rutas (`payment.controller.js`, `payment.routes.js`) | ✅ Completa |
| Integración frontend (`frontend/src/services/payment.service.js`) | ✅ Completa |
| Presentación (`frontend/src/pages/Payments/`) | ⏳ Pendiente |
| Tests del backend (`backend/__tests__/payment.*.test.js`) | ✅ Completa |

Endpoints del backend ya disponibles tras los cambios:

* `POST /api/payment`: recibe `fecha_recepcion` (ya no `fecha_pago`), `id_banco`, `fecha_vencimiento` y `numero_comprobante`, y responde con el registro creado, incluido `banco_nombre`.
* `GET /api/payment`: acepta los nuevos criterios `id_banco`, `vencimiento_desde` y `vencimiento_hasta`, y los conceptos de ordenamiento `banco_nombre`, `numero_comprobante`, `fecha_recepcion` (por defecto) y `fecha_vencimiento`. Cada registro incluye `id_banco`, `banco_nombre` y `fecha_vencimiento` (en `null` para los cobros inmediatos).
* `PUT /api/payment/:id`: admite mutar `id_banco`, `fecha_recepcion` y `fecha_vencimiento`, además de los campos ya existentes.
* `GET /api/payment/banks`: devuelve el catálogo de bancos ordenado por nombre.
* `POST /api/payment/banks`: da de alta un banco a partir de `{ nombre }`; responde `201` con `{ id_banco, nombre }`, `400` ante un nombre vacío o de más de 50 caracteres, y `409` si ya existe un banco con ese nombre (sin distinguir mayúsculas ni acentos).

---

### 1. Capa de Integración Frontend (`frontend/src/services/payment.service.js`)

* [x] **Requerimiento 31:** Implementar `fetchBanks()`, que consulta `GET /api/payment/banks` con las cabeceras de `getAuthHeaders()` y retorna la colección, con la misma estructura que `fetchPaymentMethods` y `fetchPaymentStates`.
* [x] **Requerimiento 31:** Implementar `apiCreateBank(bankData)`, que despacha `POST /api/payment/banks`, propaga el `statusCode` en la excepción (en particular el `409` de nombre duplicado, que la interfaz debe distinguir de un error genérico) y retorna el banco creado.
* [x] **Requerimiento 31.1:** En `fetchPayments(filters)`, serializar `id_banco`, `vencimiento_desde` y `vencimiento_hasta` con el mismo tratamiento que los demás criterios, y actualizar el JSDoc (`fecha_desde`/`fecha_hasta` describen ahora la fecha de recepción).
* [x] **Requerimiento 32:** `apiUpdatePayment` y `fetchPaymentById` no requieren cambios en su forma; solo cambian los campos que transportan.

---

### 2. Capa de Presentación (`frontend/src/pages/Payments/`)

#### 2.1. Componente compartido de selección de banco (propuesta a confirmar)

El control de búsqueda con alta asistida debe comportarse igual en el registro y en la modificación de pagos. Para no duplicarlo, se propone implementarlo una única vez como componente reutilizable en `frontend/src/components/common/`, junto a `ConfirmationModal.jsx` y `AmountRangeSlider.jsx`. Queda a confirmar antes de implementarlo.

* [x] *Combobox* con filtrado incremental sobre el catálogo en memoria, normalizando el texto y los nombres (recorte de espacios, minúsculas y supresión de acentos) para que la coincidencia parcial no dependa de la caja ni de la acentuación.
* [x] Solo una selección efectiva de la lista, por clic o por teclado, fija `id_banco`. Si el usuario sale del campo sin elegir, el texto visible vuelve al nombre del banco seleccionado o se vacía.
* [x] Acción secundaria "Agregar nuevo banco", visible siempre, que abre un modal con un único campo de nombre precargado con el texto de búsqueda.
* [x] El modal lista los bancos con nombre semejante y exige confirmación explícita cuando existen, ofreciendo seleccionarlos en lugar de crear un duplicado.
* [x] El modal tiene su propia bandera contra el doble envío y muestra dentro de sí el mensaje de banco ya existente cuando el backend responde `409`.
* [x] Confirmada el alta, el banco creado se agrega al catálogo en memoria y queda seleccionado, sin perder los datos ya cargados del formulario.

#### 2.2. Registro de pagos (`CreatePaymentPage.jsx`), Requerimiento 31

* [x] Renombrar el campo `fecha_pago` a `fecha_recepcion` en el estado, el control y el payload.
* [x] Cargar el catálogo de bancos con `fetchBanks` en el `useEffect` inicial, junto con los clientes y los medios de pago.
* [x] Derivar `es_diferido` del medio seleccionado y mostrar el selector de banco y el campo de vencimiento solo cuando sea verdadero, rotulándolos como obligatorios. En ese caso, la etiqueta del comprobante externo pasa de optativa a obligatoria.
* [x] Al pasar de un medio diferido a uno inmediato, limpiar el banco y el vencimiento para que no viajen en el payload.
* [x] Bloquear el envío mientras un medio diferido no tenga banco, comprobante y vencimiento, y validar junto al campo que el vencimiento no sea anterior a la fecha de recepción.
* [x] Incluir `id_banco` y `fecha_vencimiento` en el payload solo cuando el medio es diferido.

#### 2.3. Lista de pagos (`PaymentsPage.jsx`), Requerimiento 31.1

* [x] Cambiar el ordenamiento por defecto (`sort_by`) y el concepto de la columna "Fecha Recepción" de `fecha_pago` a `fecha_recepcion`, y mostrar `pago.fecha_recepcion` en la celda.
* [x] Agregar las columnas Banco Emisor, Comprobante Externo y Fecha de Vencimiento, todas ordenables y con un guion cuando el dato no está informado (caso normal en los cobros inmediatos).
* [x] Agregar al panel de filtros un selector de bancos poblado con `fetchBanks` y un calendario de rango para el vencimiento (`vencimiento_desde` / `vencimiento_hasta`).
* [x] Incluir ambos filtros en la acción de limpieza.
* [x] Reducir la grilla a las columnas Medio de Pago, Fecha de Recepción, Banco Emisor, Fecha de Vencimiento, Comprobante Externo, Monto, Cliente, Estado y Acciones, en ese orden, y retirar del panel los filtros de número interno y fecha de creación (el backend y la integración los conservan).

#### 2.4. Modificación de pagos (`UpdatePaymentPage.jsx`), Requerimiento 32

La página existe como copia sin adaptar de `CreatePaymentPage.jsx`: llama a `apiCreatePayment`, pide cliente, rotula el botón como "Crear Pago en Borrador" y no hidrata el formulario. La ruta `/pagos/:id_pago` ya está registrada en `App.js` y el botón de detalle de la lista ya navega a ella.

* [ ] Hidratar el formulario desde `fetchPaymentById(id_pago)` y cargar los catálogos de medios, estados y bancos. Incluir `id_pago` en las dependencias del `useEffect`.
* [ ] Reemplazar el selector de cliente por un panel informativo: el cliente no puede reasignarse.
* [ ] Campos editables: importe, medio de cobro, estado, banco emisor, fecha de recepción, fecha de vencimiento, número de comprobante y observaciones.
* [ ] Mostrar la vista en solo lectura, con un aviso de bloqueo contable y sin controles de guardado ni de descarte, cuando el pago no está en "Borrador".
* [ ] Identificar el estado en todo momento con `PaymentStatusBadge`.
* [ ] Al seleccionar un medio diferido, advertir que el pago no puede pasar directamente a "Aceptado" y ofrecer "Pendiente de acreditación".
* [ ] Condicionar banco y vencimiento al medio seleccionado con los mismos criterios que el registro. Al pasar a un medio inmediato, limpiarlos para que se persistan en `null`; al pasar a uno diferido, exigir los tres datos antes de habilitar el guardado.
* [ ] Usar el control de selección de banco del punto 2.1, con el banco vigente preseleccionado.
* [ ] Guardar con `apiUpdatePayment`, protegido por `isSaving`, mostrando los errores del servidor.
* [ ] Descartar con `ConfirmationModal` y `apiDeletePayment`, y redirigir a `/pagos` tras el éxito.
* [ ] Advertir antes de guardar que la promoción a un estado definitivo es irreversible.

---

### 3. Tests del Backend (`backend/__tests__/`)

Los tests existentes todavía envían `fecha_pago` y deben actualizarse antes de ejecutar la suite. La base de test `DB_NAME_TEST` debe recrearse con el esquema vigente de `migracion_taller.sql`.

#### 3.1. Registro de pagos, Requerimiento 31

* [x] **Servicio:** renombrar `fecha_pago` a `fecha_recepcion` en los casos existentes y agregar los casos del cheque:
  * `400` si el medio es diferido y falta el banco, el comprobante (ausente, vacío o solo espacios) o el vencimiento;
  * `400` si el vencimiento no es una fecha real o es anterior a la recepción;
  * `400` si el medio es inmediato y se informa banco o vencimiento;
  * `404` si el banco no existe;
  * persistencia de banco y vencimiento en `null` en los medios inmediatos;
  * aceptación de un vencimiento ya pasado, siempre que no sea anterior a la recepción;
  * persistencia del comprobante recortado.
* [x] **Servicio (`createBank`):** `400` ante un nombre vacío, solo espacios o de más de 50 caracteres; `409` ante un homónimo; normalización de espacios antes de insertar.
* [x] **Controlador:** `400` ante la falta de `id_cliente`, `id_medio_pago` o `fecha_recepcion` (hoy solo se cubre `monto`); `POST /api/payment/banks` (`201`, `400` sin nombre sin invocar al servicio, propagación del `409`); `GET /api/payment/banks` (`200`).
* [x] **Integración:** sembrar `Banco` en el `beforeAll`; verificar las columnas persistidas para medios inmediatos y diferidos; verificar que cada rechazo no inserta filas; alta de banco con `409` al repetir el nombre con distinta caja.

#### 3.2. Lista de pagos, Requerimiento 31.1

No existen tests de la consulta, por lo que deben escribirse completos:

* [x] **Servicio:** depuración de criterios vacíos, ordenamiento por defecto `fecha_recepcion DESC` ante un concepto fuera de la lista blanca, normalización del DTO (con banco y vencimiento en `null` para cobros inmediatos), traslado de `id_banco` y `400` ante identificadores, importes, fechas o rangos inválidos (incluido `vencimiento_desde` posterior a `vencimiento_hasta`).
* [x] **Controlador:** `200` con la colección, tipado de los parámetros de la query string y propagación del `400` y del `500`.
* [x] **Integración:** consulta sin filtros que incluya los pagos sin banco, filtro por banco, filtro por rango de vencimiento, ordenamiento por vencimiento, combinación de criterios, búsqueda parcial por comprobante, rangos de importes y fechas, ordenamiento por un concepto inexistente y consulta sin coincidencias.

#### 3.3. Modificación y baja de pagos, Requerimiento 32

No existen tests de la modificación ni de la baja, por lo que deben escribirse completos:

* [x] **Servicio:** `404` si el pago no existe; `409` fuera de "Borrador"; `400` ante un importe inválido; descarte de `id_cliente`; `409` al asignar "Aceptado" a un medio diferido; `409` ante `affectedRows === 0`; reglas del cheque sobre el registro resultante de la edición (incluida la limpieza de banco y vencimiento al pasar de cheque a medio inmediato); baja solo en "Borrador".
* [x] **Controlador:** `PUT` con `200`, `400` ante un `id` no numérico o un cuerpo vacío, y propagación de errores; `DELETE` con `200` y propagación de errores.
* [x] **Integración:** modificación de importe y comprobante con `fecha_actualizacion` estampada; conversión de medio inmediato a diferido (con y sin los tres datos); conversión de diferido a inmediato con banco y vencimiento en `NULL`; recepción posterior al vencimiento rechazada; promoción a "Aceptado" según el medio; inmutabilidad y baja según el estado.

#### 3.4. Estados de pago, Requerimiento 32.1

La implementación está completa; solo faltan casos de test:

* [x] **Controlador:** `500` con el sobre de error uniforme en `GET /api/payment/methods` y `GET /api/payment/states` cuando el servicio falla.
* [x] **Integración:** `GET /api/payment/states` devuelve los cuatro estados ordenados por identificador, y `GET /api/payment/methods` refleja fielmente `es_diferido`.

---

### 4. Entorno

* [x] Recrear la base de test `DB_NAME_TEST` con el esquema vigente antes de ejecutar la suite.

---

### 5. Decisiones tomadas

* **Alta concurrente de un mismo banco:** si dos altas simultáneas del mismo nombre superan la validación del servicio, la restricción `UNIQUE` impide el duplicado, pero `Payment.createBank` convierte el error de la base en un error genérico y la segunda respuesta es `500` en lugar de `409`. Puede resolverse detectando `ER_DUP_ENTRY` en el modelo. Es un escenario improbable en la operatoria del taller.
* **Componente compartido de selección de banco:** se debe ubicar en `frontend/src/components/common/` (punto 2.1) antes de implementar las páginas.

---

### 6. Requerimientos futuros alcanzados por los cambios

Los siguientes requerimientos todavía no están implementados, pero su documentación ya incorpora los cambios y debe respetarse al implementarlos:

* **Requerimiento 32.2 (Transición de pagos diferidos):** el modal de confirmación de acreditación o rechazo debe mostrar el banco emisor, el número de comprobante y la fecha de vencimiento del cheque.
* **Requerimiento 33 (Estado de cuenta):** la vista consolidada debe usar `fecha_recepcion AS fecha_movimiento`, y el índice sugerido pasa a ser `Pago(id_cliente, fecha_recepcion, id_estado_pago)`.
