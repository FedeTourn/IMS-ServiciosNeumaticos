**Requerimiento 33: Creación movimiento de cuenta**

### Resumen del Requerimiento

El objetivo central de este requerimiento es resolver la consolidación del estado de cuenta de los clientes mediante una estrategia de derivación lógica en tiempo real, prescindiendo por completo de una tabla física persistida para evitar redundancias, desincronizaciones y anomalías contables. El sistema debe unificar las dos fuentes de imputación financiera (débitos provenientes de órdenes de reparación y créditos derivados de cobros de pagos) mediante una vista relacional SQL (`MovimientoCuenta`). Esta vista discrimina mediante la columna calculada `computa_saldo` qué transacciones inciden formalmente sobre el pasivo/activo del cliente (órdenes en estado "Cerrada" y pagos en estado "Aceptado") y cuáles constituyen movimientos preliminares o informativos (estados "Borrador", "Pendiente de acreditación" o "Rechazado").

---

### Backend (Capa de Datos, Servicio y Exposición)

* **Base de Datos (Vista `MovimientoCuenta`):** Centraliza la consolidación contable virtual mediante una sentencia SQL `UNION ALL` entre las tablas relacionales `OrdenReparacion` y `Pago`. Expone una estructura homogénea con metadatos de auditoría, identificadores de comprobantes de origen y la columna proyectada `computa_saldo` generada dinámicamente según el estado del documento.


* **Model (`AccountMovement.js`):** Actúa como abstracción de acceso a datos sobre la vista relacional `MovimientoCuenta`. Provee el método de lectura parametrizada `findByClientAndDateRange(id_cliente, filters)` para consultar movimientos de cuenta corriente filtrando de manera eficiente por cliente y períodos de tiempo (`fecha_desde`, `fecha_hasta`).


* **Service (`accountMovement.service.js`):** Orquesta el consumo de los movimientos unificados desde el modelo. Su responsabilidad es validar la existencia del cliente, asegurar la coherencia cronológica de los rangos de fechas suministrados y aislar el cómputo de balance financiero entre débitos y créditos firmes para su consumo por requerimientos dependientes.



---

### Frontend (Capa de Integración y Presentación)

*(Capa omitida para este requerimiento fundacional; la integración visual, tabulación interactiva y presentación en pantalla de los movimientos y saldos derivados se delega formalmente al Requerimiento 34: Consulta movimientos de cuenta).*

---

### Reglas de Negocio Clave

* **Persistencia Virtual (Single Source of Truth):** No se permite la materialización física ni duplicación de asientos contables en tablas estáticas; el estado de cuenta y sus saldos derivan exclusivamente de la consulta relacional sobre las fuentes transaccionales originales.


* **Criterio Determinista de Imputación (`computa_saldo`):**
* Las órdenes de reparación computan saldo (`computa_saldo = true`) única y estrictamente cuando su estado operativo sea "Cerrada". En cualquier otro estado ("Abierta" o "Borrador"), `computa_saldo = false`.


* Los pagos computan saldo (`computa_saldo = true`) única y estrictamente cuando su estado operativo sea "Aceptado". En estados "Borrador", "Pendiente de acreditación" o "Rechazado", `computa_saldo = false`.




* **Consistencia de Signos e Impacto Financiero:** Las órdenes representan débitos (cargos a la cuenta que incrementan la deuda del cliente) y los pagos representan créditos (abonos que reducen la deuda).



---

### Desglose Atómico de Tareas (WBS) por Componente Arquitectónico

#### 0. Base de Datos

* **Tarea 0.1:** Redactar y ejecutar el script DDL de creación de la vista relacional `MovimientoCuenta` en MySQL aplicando `UNION ALL` entre `OrdenReparacion` y `Pago`, respetando la directriz de nombres en PascalCase para vistas y snake_case para columnas:


* Proyección 1 (`OrdenReparacion`):
* `CONCAT('OR-', id_orden_reparacion) AS id_movimiento_origen`
* `id_cliente`
* `'DEBITO' AS tipo_movimiento`
* `importe_total AS monto`
* `fecha_creacion AS fecha_movimiento`
* `id_orden_reparacion`
* `NULL AS id_pago`
* `id_estado_orden AS id_estado`
* `CASE WHEN id_estado_orden = [ID_ESTADO_CERRADA] THEN True ELSE False END AS computa_saldo`


* Proyección 2 (`Pago`):
* `CONCAT('PAG-', id_pago) AS id_movimiento_origen`
* `id_cliente`
* `'CREDITO' AS tipo_movimiento`
* `monto`
* `fecha_pago AS fecha_movimiento`
* `NULL AS id_orden_reparacion`
* `id_pago`
* `id_estado_pago AS id_estado`
* `CASE WHEN id_estado_pago = [ID_ESTADO_ACEPTADO] THEN True ELSE False END AS computa_saldo`




* **Tarea 0.2:** Verificar la existencia de índices relacionales en `OrdenReparacion(id_cliente, fecha_creacion, id_estado_orden)` y `Pago(id_cliente, fecha_pago, id_estado_pago)` para garantizar que la ejecución del plan de la vista utilice índices compuestos y evite escaneos de tabla completos.



#### 1. Capa de Datos (`backend/src/models/AccountMovement.js`)

* **Tarea 1.1:** Crear el archivo de persistencia `AccountMovement.js` configurado sobre el pool de base de datos `{ pool: db }`.


* **Tarea 1.2:** Implementar el método `findByClientAndDateRange(id_cliente, dateRange = {})` sobre la vista `MovimientoCuenta`.


* **Tarea 1.3:** Estructurar la consulta parametrizada con cláusula `WHERE id_cliente = ?` e inyección condicional de límites temporales (`fecha_movimiento >= ?` y `fecha_movimiento <= ?`) ordenando cronológicamente de forma ascendente o descendente (`ORDER BY fecha_movimiento DESC`).



#### 2. Capa de Lógica de Negocio (`backend/src/services/accountMovement.service.js`)

* **Tarea 2.1:** Crear `accountMovement.service.js` e implementar la función `getMovementsByClient(id_cliente, queryFilters)`.


* **Tarea 2.2 (Validaciones de Dominio):**
* Validar la existencia del cliente consultando `Client.findById(id_cliente)`; en caso de inexistencia, elevar una excepción semántica (`HTTP 404 Not Found`).


* Validar que los parámetros temporales `fecha_desde` y `fecha_hasta` posean formatos válidos y que la fecha de inicio no sea posterior a la de cierre; si fallan, arrojar `HTTP 400 Bad Request`.


* **Tarea 2.3:** Sanitizar el objeto de fechas y delegar la consulta a `AccountMovement.findByClientAndDateRange`.


* **Tarea 2.4:** Normalizar los datos devueltos mapeando el DTO plano con casteo seguro de números (`Number(monto)`) y booleanos (`Boolean(computa_saldo)`) para preservar la integridad de tipos en la serialización JSON hacia capas superiores.



---

##### ⚠️ Gestión de Riesgos y Advertencias de Arquitectura

1. **Rendimiento de Vistas Derivadas (Optimización del Plan de Ejecución):** Las vistas con cláusula `UNION ALL` en MySQL no admiten indexación directa y pueden materializarse temporalmente en disco o memoria si no se transfieren adecuadamente los predicados de búsqueda. Es crítico que toda consulta a la vista `MovimientoCuenta` filtre inmediatamente por `id_cliente` en el `WHERE` exterior para permitir que el optimizador del motor inserte el predicado dentro de cada subconsulta indexada (*Index Condition Pushdown*).


2. **Desacoplamiento de Identificadores Mágicos:** La resolución de la columna `computa_saldo` no debe depender de identificadores numéricos fijos (*hardcoded*) que puedan desfasarse entre entornos de staging y producción. Se debe garantizar que la condición de cierre de la orden o aceptación del pago se resuelva mediante los códigos o identificadores normalizados del sistema.