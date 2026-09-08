**Requerimiento 29: Estado de cuenta**

### Resumen del Requerimiento

Permitir la consulta del saldo firme actual y los totales agregados (débitos confirmados, créditos confirmados) de un cliente, sin traer el detalle línea por línea de cada movimiento. Es una consulta liviana pensada para alimentar tarjetas de resumen y, potencialmente, el listado de clientes.

---

### Backend

* **Model (`AccountSummary.js`):** Consulta agregada (no fila por fila) sobre `OrdenReparacion` y `Pago`, filtrando por `id_cliente`, sumando montos por estado sin necesidad de window function — es una agregación simple, no una serie cronológica.
* **Service (`accountSummary.service.js`):** Valida existencia del cliente y estructura el DTO con los tres valores agregados.
* **Controller (`accountSummary.controller.js`):** Expone `GET /api/account-statements/:clientId/summary`.

### Frontend

* **Integración API (`accountSummary.service.js`):** Función `apiGetAccountSummary(clientId)` vía `fetch`.
* **UI (integrada en `AccountStatementPage.jsx`, bloque superior):** Panel de tarjetas (Total Débitos Confirmados, Total Cobrado, Saldo Firme Actual). Sin grilla, sin banner.

---

### Reglas de Negocio Clave

* **Determinismo e Invariancia Contable:** `Saldo = Total Débitos Confirmados − Total Créditos Confirmados`, considerando únicamente OR "Cerrada" y Pagos "Aceptado".
* **Independencia del detalle:** Esta consulta no debe requerir traer ni procesar el listado completo de movimientos; se calcula directamente vía `SUM(...) WHERE estado = ...`, sin necesidad de ordenar cronológicamente ni de función de ventana.

---

### Desglose Atómico de Tareas (WBS)

#### 1. Capa de Datos (`backend/src/models/AccountSummary.js`)
* **Tarea 1.1:** Implementar `getSummaryByClient(id_cliente)`, con dos sumas independientes: `SUM(importe) FROM OrdenReparacion WHERE id_cliente = ? AND estado = 'Cerrada'` y `SUM(monto) FROM Pago WHERE id_cliente = ? AND estado = 'Aceptado'`.

#### 2. Capa de Lógica de Negocio (`backend/src/services/accountSummary.service.js`)
* **Tarea 2.1:** Implementar `getSummary(clientId)`.
* **Tarea 2.2 (Validación de Entidad):** Verificar existencia del cliente vía `Client.findById(clientId)`; si no existe, `HTTP 404 Not Found`.
* **Tarea 2.3:** Calcular `total_debitos_confirmados`, `total_creditos_confirmados`, `saldo_firme_actual`.
* **Tarea 2.4:** Estructurar el DTO de salida (solo estos tres valores + datos de cabecera del cliente).

#### 3. Capa de Exposición
* **Tarea 3.1:** Crear `accountSummary.controller.js`, método `handleGetSummary(req, res)`.
* **Tarea 3.2:** `try/catch` con códigos semánticos (`200`, `400`, `404`, `500`).
* **Tarea 3.3:** Declarar `GET /api/account-statements/:clientId/summary` en `accountSummary.routes.js`.
* **Tarea 3.4:** Registrar el router en `app.js`.

#### 4. Capa de Integración Frontend
* **Tarea 4.1:** Crear `frontend/src/services/accountSummary.service.js`.
* **Tarea 4.2:** Implementar `apiGetAccountSummary(clientId)`.

#### 5. Capa de Presentación
* **Tarea 5.1:** Bloque de tarjetas (Cards) con los tres totales, reutilizable tanto en `AccountStatementPage.jsx` como en el posible listado de clientes.
* **Tarea 5.2:** Manejo de estado reactivo (`isLoading`, error, cliente sin movimientos => saldo 0).

---

### Advertencia de Arquitectura

**Performance despreciable:** al ser una agregación directa (`SUM` con `WHERE`, sin `JOIN` cruzado ni función de ventana), esta consulta es sensiblemente más liviana que la del Req. 34, es la que conviene reutilizar en el listado masivo de clientes, nunca la vista completa de movimientos.