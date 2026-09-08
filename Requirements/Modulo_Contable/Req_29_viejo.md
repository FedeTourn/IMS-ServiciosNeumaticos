**Requerimiento 29: Estados de cuenta - VIEJO** 

### Resumen del Requerimiento

El objetivo central es permitir la consulta integral, transparente y en tiempo real del estado de cuenta de cada cliente dentro del módulo administrativo y contable. La funcionalidad debe consolidar el histórico cronológico completo de transacciones (órdenes de reparación y cobros/pagos) sin ocultar operaciones preliminares o transicionales. Para preservar la consistencia financiera, el sistema debe calcular un saldo acumulado progresivo que avance de forma estricta únicamente sobre aquellos movimientos que computan saldo (órdenes de reparación en estado "Cerrada" y pagos en estado "Aceptado"). La interfaz de usuario debe ofrecer una visualización clara mediante un DataGrid responsivo acompañado de un banner informativo permanente que explicite las reglas de cómputo contable.

---

### Backend (Capa de Datos, Servicio y Exposición)

* **Model (`AccountMovement.js`):** La capa de acceso a datos debe consumir la vista relacional derivada `MovimientoCuenta` sobre MySQL. Debe implementar una consulta agregada que recupere la totalidad de los movimientos de un cliente parametrizado (`id_cliente`), proyectando la columna `computa_saldo` y calculando el saldo acumulado progresivo mediante una función de ventana (*window function* SQL) o dejando los acumuladores normalizados para la capa de servicios.


* **Service (`accountStatement.service.js`):** Orquesta la consolidación contable. Su responsabilidad es validar la existencia del cliente, procesar el listado cronológico de movimientos, computar los totales consolidados (total de débitos firmes, total de créditos confirmados) y estructurar el saldo firme actual en un Data Transfer Object (DTO) plano listo para su serialización.


* **Controller (`accountStatement.controller.js`):** Expone el endpoint `GET /api/account-statements/:clientId` a través de Express.js. Su tarea es capturar el parámetro de ruta `clientId`, validar su corrección sintáctica, delegar la consulta al servicio y despachar la respuesta estructurada bajo códigos de estado semánticos (`200 OK`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`).


---

### Frontend (Capa de Integración y Presentación)

* **Integración API (`accountStatement.service.js`):** Implementa la función asíncrona cliente `apiGetAccountStatement(clientId)` utilizando la API nativa `fetch` para consumir el endpoint del servidor, gestionando el manejo de cabeceras JSON y el control de excepciones de red.


* **UI (`AccountStatementPage.jsx`):** Componente visual interactivo estilizado con clases de TailwindCSS. Renderiza un panel superior con tarjetas de resumen métrico (Total Facturado, Total Cobrado, Saldo Firme Actual), una grilla cronológica con todos los movimientos (mostrando el progreso progresivo del balance únicamente sobre ítems confirmados), y un banner informativo fijo/destacado que instruye al usuario sobre el criterio contable aplicado: el saldo solo contempla órdenes "Cerradas" y pagos "Aceptados".

---

### Reglas de Negocio Clave

* **Cómputo Selectivo de Balance:** El saldo firme acumulado solo contempla órdenes de reparación en estado "Cerrada" (débitos) y pagos en estado "Aceptado" (créditos). Los comprobantes en estado "Borrador", "Pendiente de acreditación" o "Rechazado" deben exhibirse en la cronología pero no deben alterar el valor del saldo contable de la fila.


* **Transparencia Operativa:** La consulta no debe filtrar ni ocultar los movimientos preliminares; el usuario administrativo debe visualizar la totalidad de las operaciones asociadas al cliente para tener una perspectiva global de los compromisos pendientes de acreditación o facturación.


* **Determinismo e Invariancia Contable:** El saldo firme final debe ser equivalente a la sumatoria neta de débitos cerrados menos créditos aceptados (`Saldo = Total Débitos Confirmados - Total Créditos Confirmados`), garantizando que la columna acumulada converja siempre de manera idéntica al balance general del cliente.



---

### Desglose Atómico de Tareas (WBS) por Componente Arquitectónico

#### 0. Base de Datos

* *(Sin tareas nuevas)*. Se apoya en la vista relacional SQL `MovimientoCuenta` y en los índices compuestos de `OrdenReparacion` y `Pago` definidos en los requerimientos transaccionales previos.



#### 1. Capa de Datos (`backend/src/models/AccountMovement.js`)



* **Tarea 1.1:** En `AccountMovement.js`, implementar el método `getAccountStatementByClient(id_cliente)` consultando sobre la vista `MovimientoCuenta`.


* **Tarea 1.2:** Estructurar la sentencia SQL parametrizada recuperando: identificador de comprobante, fecha de movimiento, tipo de comprobante (Orden / Pago), descripción/comprobante, estado operativo, importe, `computa_saldo` y el cálculo de saldo progresivo evaluando únicamente registros donde `computa_saldo = true`:


```sql
SUM(CASE 
      WHEN computa_saldo = true AND tipo_movimiento = 'DEBITO' THEN monto 
      WHEN computa_saldo = true AND tipo_movimiento = 'CREDITO' THEN -monto 
      ELSE 0 
    END) OVER (ORDER BY fecha_movimiento ASC, id_movimiento_origen ASC) AS saldo_acumulado

```


* **Tarea 1.3:** Ordenar cronológicamente la consulta resultante para mantener consistencia contable (`ORDER BY fecha_movimiento ASC`).



#### 2. Capa de Lógica de Negocio (`backend/src/services/accountStatement.service.js`)



* **Tarea 2.1:** Crear `accountStatement.service.js` e implementar la función `getStatement(clientId)`.


* **Tarea 2.2 (Validación de Entidad):** Verificar la existencia del cliente mediante `Client.findById(clientId)`; si no se encuentra en el sistema, interrumpir el flujo elevando una excepción semántica `HTTP 404 Not Found`.


* **Tarea 2.3:** Consolidar el resultado crudo del modelo y calcular las métricas agregadas del cliente:
* `total_debitos_confirmados`: Sumatoria de montos de órdenes en estado 'Cerrada'.


* `total_creditos_confirmados`: Sumatoria de montos de pagos en estado 'Aceptado'.


* `saldo_firme_actual`: Diferencia directa entre débitos y créditos confirmados.


* **Tarea 2.4:** Estructurar el DTO de salida uniforme conteniendo los datos de cabecera del cliente, las tarjetas de totales y la colección ordenada de transacciones con sus indicadores contables.


#### 3. Capa de Exposición (`backend/src/controllers/accountStatement.controller.js` y `backend/src/routes/accountStatement.routes.js`)



* **Tarea 3.1:** Crear `accountStatement.controller.js` e implementar el método `handleGetAccountStatement(req, res)` extrayendo y sanitizando el parámetro de ruta `req.params.clientId`.


* **Tarea 3.2:** Envolver la llamada al servicio en un bloque `try/catch` para capturar excepciones de dominio y despachar códigos HTTP semánticos (`200 OK`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`).


* **Tarea 3.3:** Crear `accountStatement.routes.js`, declarar y exponer el endpoint `GET /api/account-statements/:clientId` vinculándolo al método del controlador.


* **Tarea 3.4:** Registrar el enrutador de estados de cuenta dentro de la aplicación Express (`app.js`).



#### 4. Capa de Integración Frontend (`frontend/src/services/accountStatement.service.js`)



* **Tarea 4.1:** Crear el archivo de servicios cliente `frontend/src/services/accountStatement.service.js`.


* **Tarea 4.2:** Implementar la función asíncrona `apiGetAccountStatement(clientId)` utilizando la API nativa `fetch` apuntando al endpoint correspondiente, verificando `response.ok` y formateando los datos recibidos.



#### 5. Capa de Presentación (`frontend/src/pages/AccountStatementPage.jsx`)



* **Tarea 5.1:** Diseñar la vista con TailwindCSS conteniendo el selector de cliente y un bloque superior de resumen (Cards con Total Débitos Confirmados, Total Cobrado y Saldo Firme Actual).


* **Tarea 5.2:** Implementar un banner informativo fijo y persistente en la parte superior de la grilla que detalle explícitamente: *"El saldo de cuenta corriente contempla únicamente Órdenes de Reparación en estado 'Cerrada' y Pagos en estado 'Aceptado'. Los movimientos en borrador o pendientes se muestran con fines informativos"*.


* **Tarea 5.3:** Diseñar la grilla de movimientos renderizando: Fecha, Tipo de Comprobante, Identificador/Comprobante, Estado (utilizando Badges de estado), Débito, Crédito y la columna Saldo Progresivo.


* **Tarea 5.4:** Aplicar formato condicional en la celda de "Saldo Progresivo": si la fila tiene `computa_saldo = false`, renderizar un indicador de salto neutro (ej. un guion `—`) y aplicar un estilo atenuado (`opacity-60`) sobre la fila para que el usuario distinga a simple vista los ítems no consolidados.


* **Tarea 5.5:** Manejar el estado reactivo (`useState`, `useEffect`) para controlar la carga de datos (`isLoading`), contingencias de error y feedback ante clientes sin movimientos registrados.



---

##### ⚠️ Gestión de Riesgos y Advertencias de Arquitectura

1. **Riesgo de Confusión de Saldos Proyectados vs. Firmes (UX y Atención al Cliente):** Si un cliente observa en su pantalla movimientos en "Borrador" o "Pendiente de acreditación", podría exigir la cancelación de un cheque no acreditado o reclamar por una orden no cerrada. El banner informativo y la diferenciación visual en la grilla no son accesorios: son una salvaguarda indispensable para evitar reclamos administrativos indebidos en el taller.


2. **Impacto en el Rendimiento por Funciones de Ventana (Window Functions):** El cálculo de `SUM(...) OVER (...)` sobre una vista relacional no materializada puede volverse costoso si un cliente acumula miles de transacciones a lo largo de los años. Se debe verificar que la condición del cliente (`id_cliente = ?`) filtre el conjunto de datos de forma previa a la evaluación de la ventana analítica para que el cálculo se ejecute únicamente sobre la partición del cliente consultado en memoria de MySQL.