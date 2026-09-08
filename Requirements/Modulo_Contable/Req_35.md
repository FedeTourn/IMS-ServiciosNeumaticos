**Requerimiento 35: Modificación movimientos de cuenta**

### Resumen del Requerimiento

El objetivo central de este requerimiento es asegurar la sincronización automática, inmediata y consistente del estado de cuenta y del libro de movimientos ante cualquier alteración de una Orden de Reparación o un Pago en estado "Borrador". Al haberse estructurado el estado de cuenta contable como una derivación lógica en tiempo real basada en la vista relacional `MovimientoCuenta` (sin persistencia física de asientos duplicados), la actualización en la base de datos se produce de forma inherente e instantánea al mutar el documento de origen en MySQL. En consecuencia, la responsabilidad técnica principal de este requerimiento radica en invalidar y refrescar la consulta de movimientos en la capa de datos y en el cliente tras registrarse una edición, garantizando que el usuario visualice de inmediato las modificaciones de importes, fechas o referencias sin discrepancias de estado.

---

### Backend (Capa de Datos, Servicio y Exposición)

* **Model (`AccountMovement.js`, `Payment.js` y `RepairOrder.js`):** Gracias a la arquitectura de vista relacional `MovimientoCuenta` implementada con `UNION ALL`, las mutaciones ejecutadas a través de `Payment.update` o `RepairOrder.update` impactan directamente sobre la fuente de datos. El modelo `AccountMovement.js` no requiere procedimientos de reconciliación física ni triggers, garantizando que cualquier lectura posterior (`findByClientAndDateRange` o `getAccountStatementByClient`) extraiga los datos frescos directamente de las tuplas maestras actualizadas en MySQL.


* **Service (`accountMovement.service.js`, coordinado con `payment.service.js` y `repairOrder.service.js`):** Al ejecutarse una actualización sobre un pago u orden abierta/en borrador, el servicio orquestador asegura la ejecución atómica de la mutación. En caso de manejarse almacenamiento en memoria caché para consultas analíticas de clientes, el servicio ejecuta la invalidación explícita de la clave de caché asociada a los movimientos de dicho cliente.


* **Controller (`payment.controller.js` y `repairOrder.controller.js`):** Responden a las peticiones exitosas de actualización (`PUT /api/payments/:id` y `PUT /api/repair-orders/:id`) despachando los códigos HTTP semánticos (`200 OK`) junto con el payload del recurso actualizado y encabezados HTTP (`Cache-Control: no-cache`) para prevenir que respuestas cacheadas por intermediarios devuelvan datos contables obsoletos.

---

### Frontend (Capa de Integración y Presentación)

* **Integración API (`accountMovement.service.js` y `accountStatement.service.js`):** Provee los métodos asíncronos para volver a consultar la cronología y estado de cuenta del cliente (`apiGetAccountMovements` / `apiGetAccountStatement`) inmediatamente después de que las promesas de mutación (`apiUpdatePayment` o `apiUpdateRepairOrder`) se resuelvan de manera satisfactoria.


* **UI (`AccountStatementPage.jsx`, `AccountMovementList.jsx` o modales de edición):** Componente interactivo desarrollado en React.js con TailwindCSS. Al confirmar la modificación de un comprobante en estado "Borrador", el componente dispara la invalidación y refetching del estado de la grilla de movimientos (vía re-ejecución del hook `useEffect` o invocación directa de la función de recarga), refrescando los importes y datos modificados en la tabla sin requerir una recarga manual del navegador (`F5`).



---

### Reglas de Negocio Clave

* **Sincronización Transaccional Inherente:** Toda modificación aplicada sobre un pago o una orden en estado "Borrador" debe reflejarse automáticamente en la consulta de movimientos del cliente al estar sustentada sobre la vista relacional derivada `MovimientoCuenta`.


* **Invariancia del Balance Computable:** La modificación de atributos descriptivos o de importes en un documento con estado "Borrador" continúa manteniendo su bandera `computa_saldo = 0`, asegurando que la actualización del movimiento descriptivo no distorsione ni altere el saldo consolidado firme del cliente.


* **Frescura de Datos (Data Freshness):** Ningún componente de la interfaz debe mantener en memoria una versión desfasada de los movimientos de cuenta tras haberse procesado un cambio sobre una orden o pago asociado.



---

### Desglose Atómico de Tareas (WBS) por Componente Arquitectónico

#### 0. Base de Datos

* *(Sin tareas nuevas)*. Se apoya de manera estricta en la vista SQL `MovimientoCuenta` y en las sentencias de actualización existentes en las tablas maestras `Pago` y `OrdenReparacion`.



#### 1. Capa de Datos (`backend/src/models/AccountMovement.js`)



* **Tarea 1.1:** En `AccountMovement.js`, auditar que los métodos de lectura sobre la vista `MovimientoCuenta` ejecuten lecturas directas y consistentes sobre la conexión activa de MySQL, evitando el uso de consultas intermedias congeladas.


* **Tarea 1.2:** Asegurar que los métodos `Payment.update` y `RepairOrder.update` finalicen sus transacciones con `COMMIT` antes de que cualquier hilo de lectura concurrente consulte los movimientos de cuenta del cliente.



#### 2. Capa de Lógica de Negocio (`backend/src/services/`)



* **Tarea 2.1:** En `accountMovement.service.js`, estructurar la función de refresco/invalidación para asegurar que cualquier capa intermedia de caché en memoria (si aplica en la sesión) elimine las entradas vinculadas a `id_cliente` tras una mutación exitosa de borradores.


* **Tarea 2.2:** Validar que la respuesta devuelta por los servicios de actualización incluya el `id_cliente` impactado para que la capa de exposición o el cliente web identifiquen con precisión qué estado de cuenta debe ser sincronizado.



#### 3. Capa de Exposición (`backend/src/controllers/`)



* **Tarea 3.1:** En los métodos `handleUpdatePayment` y `handleUpdateRepairOrder`, incorporar directivas de encabezado HTTP (`res.set('Cache-Control', 'no-store')`) para asegurar que el navegador o proxies no almacenen respuestas intermedias al consultar movimientos contables.



#### 4. Capa de Integración Frontend (`frontend/src/services/`)



* **Tarea 4.1:** En los servicios cliente (`payment.service.js` y `repairOrder.service.js`), garantizar que tras completar una petición PUT exitosa se devuelvan los metadatos completos para coordinar la reactualización del estado contable.



#### 5. Capa de Presentación (`frontend/src/pages/` o `frontend/src/components/`)



* **Tarea 5.1:** En la pantalla que contiene la visualización de cuenta corriente (`AccountStatementPage.jsx` o modal integrado de movimientos), implementar un disparador de actualización (ej. bandera de refresco `refreshKey` o callback `onMovementUpdated`).


* **Tarea 5.2:** Conectar el cierre exitoso del formulario de edición de pagos o de órdenes en borrador con el disparador de actualización, ejecutando inmediatamente una nueva llamada a la API (`apiGetAccountMovements` / `apiGetAccountStatement`).


* **Tarea 5.3:** Actualizar el estado local en React (`useState`) con la colección recién devuelta, renderizando la grilla estilizada con TailwindCSS con los datos actualizados y exhibiendo un toast sutil de confirmación: *"Movimientos de cuenta actualizados"*.



---

##### ⚠️ Gestión de Riesgos y Advertencias de Arquitectura



1. **Riesgo de Datos Obsoletos por Caching en el Cliente:** Si el frontend o librerías de petición HTTP aplican políticas agresivas de almacenamiento en memoria sin invalidación explícita, el usuario podría editar un pago en borrador y seguir viendo el importe anterior en la grilla de movimientos de la cuenta corriente. La invocación explícita del refetch tras el guardado es un requisito obligatorio de consistencia visual.


2. **Impacto Nulo en Balances Firmes:** Se debe verificar exhaustivamente que la modificación de un comprobante en estado "Borrador" no compute jamás saldo contable exigible en la corrida de actualización. La reactualización visual debe reflejar los nuevos textos o importes del borrador manteniendo inalterado el valor monetario del saldo consolidado.