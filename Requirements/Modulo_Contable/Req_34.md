**Requerimiento 34: Consulta de movimientos de cuenta (detalle)**

### Resumen del Requerimiento

Permitir la consulta cronológica completa de todos los movimientos de un cliente (OR y Pagos, en cualquier estado), sin ocultar operaciones preliminares, con el saldo progresivo calculado fila por fila y un banner que explique el criterio de cómputo contable.

---

### Backend

* **Model (`AccountMovement.js`):** Consulta sobre la vista `MovimientoCuenta`, proyectando `computa_saldo` y calculando el saldo acumulado vía *window function*, ordenado cronológicamente.
* **Service (`accountMovements.service.js`):** Procesa el listado cronológico completo y lo estructura en un DTO con la colección de transacciones.
* **Controller (`accountMovements.controller.js`):** Expone `GET /api/account-movements/:clientId`.

### Frontend

* **Integración API (`accountMovements.service.js`):** Función `apiGetAccountMovements(clientId)`.
* **UI (`AccountMovementsGrid.jsx`, dentro de `AccountStatementPage.jsx`):** Grilla cronológica con todos los movimientos y su saldo progresivo, más el banner informativo fijo.

---

### Reglas de Negocio Clave

* **Cómputo Selectivo de Balance:** el saldo progresivo solo avanza sobre OR "Cerrada" y Pagos "Aceptado"; el resto se muestra pero no altera la columna de saldo.
* **Transparencia Operativa:** no debe filtrarse ni ocultarse ningún movimiento preliminar (Borrador, Pendiente de acreditación, Rechazado).

---

### Desglose Atómico de Tareas (WBS)

#### 0. Base de Datos
* *(Sin tareas nuevas)*. Se apoya en la vista `MovimientoCuenta` e índices ya definidos.

#### 1. Capa de Datos (`backend/src/models/AccountMovement.js`)
* **Tarea 1.1:** Implementar `getAccountMovementsByClient(id_cliente)` consultando sobre la vista `MovimientoCuenta`.
* **Tarea 1.2:** Proyectar: identificador de comprobante, fecha, tipo (Orden/Pago), descripción/comprobante, estado, importe, `computa_saldo` y saldo progresivo:

```sql
SUM(CASE 
      WHEN computa_saldo = true AND tipo_movimiento = 'DEBITO' THEN monto 
      WHEN computa_saldo = true AND tipo_movimiento = 'CREDITO' THEN -monto 
      ELSE 0 
    END) OVER (ORDER BY fecha_movimiento ASC, id_movimiento_origen ASC) AS saldo_acumulado
```

* **Tarea 1.3:** Ordenar cronológicamente (`ORDER BY fecha_movimiento ASC`).

#### 2. Capa de Lógica de Negocio (`backend/src/services/accountMovements.service.js`)
* **Tarea 2.1:** Implementar `getMovements(clientId)`.
* **Tarea 2.2 (Validación de Entidad):** `Client.findById(clientId)`; si no existe, `HTTP 404 Not Found`.
* **Tarea 2.3:** Estructurar el DTO con la colección ordenada de transacciones e indicadores contables (no incluye totales agregados — eso lo resuelve el Req. 29).

#### 3. Capa de Exposición
* **Tarea 3.1:** Crear `accountMovements.controller.js`, método `handleGetAccountMovements(req, res)`.
* **Tarea 3.2:** `try/catch` con códigos semánticos.
* **Tarea 3.3:** Declarar `GET /api/account-movements/:clientId`.
* **Tarea 3.4:** Registrar el router en `app.js`.

#### 4. Capa de Integración Frontend
* **Tarea 4.1:** Crear `frontend/src/services/accountMovements.service.js`.
* **Tarea 4.2:** Implementar `apiGetAccountMovements(clientId)`.

#### 5. Capa de Presentación
* **Tarea 5.1:** Diseñar la grilla con TailwindCSS: Fecha, Tipo de Comprobante, Identificador, Estado (Badge), Débito, Crédito, Saldo Progresivo.
* **Tarea 5.2:** Banner informativo fijo: *"El saldo de cuenta corriente contempla únicamente Órdenes de Reparación en estado 'Cerrada' y Pagos en estado 'Aceptado'. Los movimientos en borrador o pendientes se muestran con fines informativos."*
* **Tarea 5.3:** Formato condicional en "Saldo Progresivo": si `computa_saldo = false`, mostrar `—` y aplicar `opacity-60` a la fila.
* **Tarea 5.4:** Manejo de estado reactivo (`isLoading`, error, cliente sin movimientos).

---

### ⚠️ Gestión de Riesgos y Advertencias de Arquitectura

1. **Riesgo de Confusión de Saldos Proyectados vs. Firmes:** el banner y la diferenciación visual por fila son indispensables para evitar reclamos administrativos por parte de clientes que vean movimientos no confirmados.
2. **Impacto en el Rendimiento por Window Functions:** verificar que `WHERE id_cliente = ?` se aplique antes de evaluar la función de ventana, para que el cálculo corra solo sobre la partición del cliente consultado.