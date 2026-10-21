# **Prompt \- Planificación detallada requerimiento**

Partiendo de la definición de los requerimientos que hicimos, te pediré el detalle de cada requerimiento, lo haremos uno por uno, no me respondas con más de un requerimiento.   
Aplicaremos la misma lógica anterior para el requerimiento 35,  
Esta es la descripción del requerimiento y las tareas que se definieron:  
Modificación movimientos de cuenta:  
En caso de que se realicen modificaciones de Órdenes de Reparación o Pagos en estado "Borrador", el sistema debe actualizar de forma automática los movimientos de cuenta asociados.

Model: Invalidar/refrescar la query de movimientos tras editar un pago u OR en Borrador

Junto con los artefactos pedidos en las instrucciones del cuaderno, el output esperado debe ademas incluir un documento con este formato:

\*\*Requerimiento \<id\>: \<Nombre requerimiento\>\*\*

\#\#\# Resumen del Requerimiento

El objetivo central es permitir la edición de una orden de reparación previamente registrada. La funcionalidad debe actuar en dos modalidades: si la orden se encuentra "Abierta", el usuario puede gestionar libremente los productos asociados y sus precios; si la orden está "Cerrada", el sistema debe adoptar una postura defensiva, bloqueando cualquier intento de edición para proteger la integridad contable.

\#\#\# Backend (Capa de Datos, Servicio y Exposición)

\* \*\*Model (\`RepairOrder.js\` y \`Product.js\`):\*\* La base de datos debe ser capaz de actualizar los datos maestros de la orden mediante un método \`update\`. Además, se requiere un método auxiliar \`unlinkFromRepairOrder\` para limpiar la clave foránea de las válvulas que el usuario decida quitar de la orden, desvinculándolas sin alterar su estado físico actual.

\* \*\*Service (\`repairOrder.service.js\`):\*\* A través del método \`updateRepairOrder(id, data)\`, esta capa orquesta la operación. Su principal responsabilidad es comparar la lista de productos que el usuario envió desde la interfaz contra la lista que ya existía en la base de datos. A partir de esta comparación, el servicio deduce qué válvulas deben desvincularse y cuáles deben actualizarse, ejecutando todas estas acciones de forma segura dentro de una única transacción.

\* \*\*Controller (\`repairOrder.controller.js\`):\*\* Debe exponer el endpoint \`PUT /api/repair-orders/:id\`. Su tarea es atrapar la petición HTTP, validar que el formato de los datos entrantes sea correcto, delegar el trabajo al servicio y devolver una respuesta semántica (éxito o error).

\#\#\# Frontend (Capa de Integración y Presentación)

\* \*\*Integración API (\`repairOrder.service.js\`):\*\* Se debe implementar el método \`updateRepairOrder(id, data)\` para enviar el nuevo estado deseado de la orden hacia el servidor mediante una petición HTTP.

\* \*\*UI (\`UpdateRepairOrder.jsx\`):\*\* El componente visual debe ser inteligente y reaccionar al estado de la orden. Si detecta que es una orden "Cerrada", debe deshabilitar toda interacción e informar al usuario mediante un banner visual. Si está "Abierta", debe permitir agregar o quitar válvulas y ajustar precios, armando un paquete de datos final (el estado consolidado) al presionar "Guardar".

\#\#\# Reglas de Negocio Clave

\* \*\*Inmutabilidad por Estado:\*\* El backend debe abortar la operación inmediatamente si se intenta modificar una orden cuyo estado es "Cerrada".

\* \*\*Disponibilidad Real:\*\* Al buscar válvulas elegibles para agregar a la orden, el sistema debe contemplar aquellas en estado "Recibido", "Libre" y, a partir de nuestra última definición, "Reparado".  
\* \*\*Conservación de Estado:\*\* Las válvulas desvinculadas durante la edición conservarán su estado actual (ej. "Reparado"), limitándose la acción a eliminar su lazo lógico con la orden.

WBS:  
0\. Base de Datos  
    (Sin tareas ). Utilizaremos la estructura existente de las tablas OrdenReparacion, EstadoOrdenReparacion y Producto definidas.

1\. Capa de Datos (backend/src/models/)  
    Tarea 1.1: En RepairOrder.js, implementar el método update(id, updateData, connection). Este método debe ser agnóstico y limitarse a ejecutar el UPDATE sobre la tabla OrdenReparacion (ej. actualizando importe\_total, observaciones, id\_estado\_orden), operando sobre la transacción inyectada.

    Tarea 1.2: En Product.js, implementar un método auxiliar (ej. unlinkFromRepairOrder(id\_producto, connection)). Este método es vital para desvincular una válvula de la orden (seteando id\_orden\_reparacion \= NULL) y sin modificar su estado, si el usuario decide quitarla durante la modificación de una orden abierta.

2\. Capa de Lógica de Negocio (backend/src/services/repairOrder.service.js)  
    Tarea 2.1: Implementar el método principal updateRepairOrder(id, data).  
    Tarea 2.2 (Regla de Negocio Crítica): Consultar el estado actual de la orden invocando a RepairOrder.findById(id). Si el estado\_nombre (o el id\_estado\_orden) corresponde a 'Cerrada', interrumpir inmediatamente el flujo (Fail-Fast) y lanzar una excepción de negocio (HTTP 403 o 409).  
    Tarea 2.3 (Enfoque Declarativo): Implementar la lógica de "Diff" (Diferencia) para las válvulas. El servicio debe comparar las válvulas que actualmente tiene la orden en la base de datos contra el nuevo arreglo de IDs enviado por el frontend.  
    Tarea 2.4 (Transaccionalidad): Abrir una transacción SQL (beginTransaction).  
        Ejecutar las desvinculaciones (unlinkFromRepairOrder) para las válvulas que ya no están en el payload. Ejecutar las vinculaciones/actualizaciones (updateForRepairOrder) para las válvulas nuevas o que modificaron su precio.  
        Actualizar la orden base (RepairOrder.update). Confirmar (commit) o revertir (rollback) ante cualquier excepción.

3\. Capa de Exposición (backend/src/controllers/ y backend/src/routes/)  
    Tarea 3.1: En repairOrder.controller.js, implementar el método updateRepairOrder. Su responsabilidad será extraer el req.params.id y el req.body, hacer validaciones de forma rápidas (ej. que items sea un array) y delegar al servicio.  
    Tarea 3.2: En repairOrder.routes.js, exponer el endpoint PUT /api/repair-orders/:id.

4\. Capa de Integración Frontend (frontend/src/services/repairOrder.service.js)  
    Tarea 4.1: Implementar la función asíncrona updateRepairOrder(id, data) utilizando tu instancia de Axios/Fetch para apuntar al nuevo endpoint PUT.  
5\. Capa de Presentación (frontend/src/pages/UpdateRepairOrderPage.jsx)

    Tarea 5.1: Modificar la lógica de carga (useEffect). Si la orden está en estado 'Cerrada', el componente debe pasivar todos los inputs interactivos e inyectar un banner visual indicando que es de solo lectura.

    Tarea 5.2: Si la orden es 'Abierta', el componente debe comportarse como el flujo de creación. Se debe cargar la lista de productos disponibles del cliente seleccionado y pre-seleccionar los que ya pertenecen a la orden, permitiendo su modificación.

    Tarea 5.3: Reutilizar la lógica de agrupación (Estado Derivado) para la cotización y mapear los datos al mismo formato de payload utilizado en la creación al hacer clic en "Guardar" o "Guardar y Cerrar".

# **Prompt \- Pseudo Sprint Plan**

Vamos a hacer una sesión de pseudo sprint planning: Te voy a pasar una descripción de los requerimientos que vamos a desarrollar y vos me tenes que hacer el desglose preliminar de los requerimientos en tareas, el desglose debe realizarse por componente arquitectónico y fundamentalmente por requerimiento, respetando esta estructura:  
Desglose Atómico de Tareas (WBS) por Componente Arquitectónico:  
0\. Base de datos (Creación modificación de relaciones)  
1\. Capa de Datos (Modelo / Mapeo a Base de Datos)  
2\. Capa de Lógica de Negocio (Servicio)  
3\. Capa de Exposición (Rutas y Controlador \- Conexión Front/Back)  
4\. Capa de Integración Frontend (API Cliente)  
5\. Capa de Presentación (Interfaz de Usuario \- UI)

\*\*Aclaración\*\*: Con desglose preliminar me refiero a identificar de manera grosera las tareas que deben realizarse, este desglose va a servir como artefacto de entrada para luego, por cada tarea de cada requerimiento, realizar una definición detallada de la solución a implementar.  
\*\*Aclaración 2\*\*: Es probable que haya requerimientos que no requieran tareas de alguna capa de la arquitectura, podes omitir dichas tareas vacías

Requerimientos:  
29    Estados de cuenta    El sistema debe permitir llevar un registro de los estados de cuenta de los clientes, incluyendo las órdenes de reparación y los pagos asociados, de forma que se pueda consultar en cualquier momento el saldo actualizado.  
          
30    Creación de liquidaciones    El sistema debe permitir la creación de liquidaciones de estado de cuenta, exportables en formato PDF (equivalente a la impresión de la vista en pantalla).  
          
30.1    Alcance de la liquidación    La liquidación debe incluir únicamente órdenes de reparación en estado "Cerrada" y pagos en estado "Aceptado", dentro del período seleccionado.  
          
30.2    Advertencia de movimientos en borrador    Al generar una liquidación, si existen pagos u órdenes de reparación en estado "Borrador" dentro del período seleccionado, el sistema debe mostrar una advertencia (banner) indicando cuáles son, sin impedir la generación de la liquidación.  
          
30.3    Exclusión de advertencia del documento    La advertencia mencionada en 30.2 no debe formar parte del documento de liquidación exportado; es únicamente informativa para el usuario en la pantalla de generación.  
          
31    Registro de nuevo pago    El sistema debe permitir el registro de pagos realizados por los clientes.  
          
32    Modificación pago    El sistema debe permitir la modificación y eliminación de pagos únicamente mientras se encuentren en estado "Borrador". Los pagos en estado "Aceptado" no podrán modificarse ni eliminarse.  
          
32.1    Estados de pago    El sistema debe soportar los siguientes estados para un pago: "Borrador", "Pendiente de acreditación" (para cheques u otros medios diferidos), "Aceptado" y "Rechazado" (por ejemplo, un cheque rebotado).  
          
32.2    Transición de pagos diferidos    Un pago en estado "Pendiente de acreditación" debe poder pasar a "Aceptado" (si se acredita correctamente) o a "Rechazado" (si el medio de pago no se hace efectivo, por ejemplo un cheque rebotado).  
          
32.3    Exclusión de pagos rechazados    Un pago en estado "Rechazado" no debe computar en el saldo del cliente.  
          
33    Creación movimiento de cuenta    El sistema debe registrar automáticamente en el estado de cuenta de cada cliente las órdenes de reparación en estado "Cerrada" y los pagos en estado "Aceptado". Los documentos en otros estados no deben impactar el saldo del cliente.

33.1    Órdenes en borrador sin impacto contable    Una orden de reparación en estado "Borrador" no debe generar movimiento de cuenta ni afectar el saldo del cliente.  
          
33.2    Cierre contable de orden de reparación    Al pasar una orden de reparación a estado "Cerrada", el sistema debe reflejarla automáticamente en el estado de cuenta del cliente.  
          
33.3    Inmutabilidad de orden cerrada    El estado "Cerrada" de una orden de reparación es final: el sistema no debe permitir su modificación ni anulación. (Pendiente de definición futura: posibilidad de marcar una orden cerrada como "Anulada".)  
          
34    Consulta movimientos de cuenta    El sistema debe permitir consultar en cualquier momento el listado de movimientos de un cliente, mostrando: pagos en estado "Borrador" y "Aceptado", y órdenes de reparación en estado "Borrador" y "Cerrada". Esto permite al usuario visualizar la situación completa del cliente, incluyendo operaciones aún no confirmadas.

35    Modificación movimientos de cuenta    En caso de que se realicen modificaciones de Órdenes de Reparación o Pagos en estado "Borrador", el sistema debe actualizar de forma automática los movimientos de cuenta asociados.

Para lo relacionado a la base de datos, en las fuentes del proyecto se encuentra el documento Arquitectura\_Base\_Datos\_Planificada.md el cual representa la arquitectura que se planificó, no  la arquitectura actual. La idea de ese archivo es que lo uses como base para proponer modificaciones o mejoras (en el documento mencionado las columnas de las tablas están en PascalCase, no lo tengas en cuenta, las incluiré a la base de datos con snake\_case)

No es necesario que menciones como se llamarán las funciones o los archivos.

# **Prompt \- Planificación detallada requerimiento acoplado**

Comencemos con la planificación detallada del requerimiento 28:  
Modificación de órdenes de reparación:  
Descripción del requerimiento: El sistema debe permitir modificar la información de las órdenes de reparación.  
Desglose de tareas preliminar:

* Model: Debe encargarse de 2 “etapas”, la obtención de la orden de reparación e información asociada y la carga de la orden de reparación modificada:  
  * **Obtención de la orden de reparación**: Actualmente existe el método findById, el cual recupera el detalle completo de una orden de reparación Maestro (Datos de la orden)-Detalle (Productos asociados).  
  * I**nformación asociada restante**: Si la orden que se consulta es una orden abierta (o borrador) significa que el usuario puede modificar completamente la orden de reparación. Para este caso, el proceso de modificación se debería comportar como el proceso de creación. Por cuestiones de simplicidad, no permitiremos que se modifique el cliente, pero si se pueden modificar todos los productos asociados (lo que también modifica los registros de los productos), y los demás campos de la orden de reparación. Más información sobre el comportamiento del flujo de creación se detalla al final del mensaje.  
  * **Persistencia/carga de los cambios**: Implementar update(). Debería realizarse transaccionalmente (rollback si no se completa), porque además de afectar los datos de la orden de reparación, debería modificar los productos (añadir / quitar válvulas de la orden requiere limpiar el id\_orden\_reparacion y modificar el listado en los productos desvinculados).  
* Service: Implementar updateRepairOrder(id, data). El frontend no debería permitir la modificación de órdenes cerradas, pero en caso de que suceda, el sistema siempre debería consultar primero el estado actual de la orden. Si id\_estado\_orden corresponde a 'Cerrada', lanzar un error que detalle que no se puede mutar una orden cerrada. (es posible que sean necesarias modificaciones a otros métodos del service, espero que propongas las mismas, principalmente consultar getRepairOrderById(id))  
* Controller: Implementar updateRepairOrder y exponer PUT /api/repair-orders/:id.(Además evaluar y proponer modificaciones necesarias en el resto de los métodos del controlador)  
* Servicio API: Implementar updateRepairOrder(id, data).(Además evaluar y proponer modificaciones necesarias en el resto de los métodos del servicio del frontend)  
* UI: Reutilizar UpdateRepairOrder.jsx. Para ordenes de reparación cerradas el comportamiento no debería cambiar, UpdateRepairOrder.jsx fue implementada primero para ordenes de reparación cerradas y con el desarrollo de este requerimiento se pretende ampliar la funcionalidad a ordenes de reparación abiertas.

Comportamiento del flujo de creación:  
1\. Page loads → fetch clients  
On mount, the useEffect at CreateRepairOrderPage.jsx calls fetchClients() to fill the client \<select\>. This is a simple GET, nothing special.

2\. User picks a client → load their repairable products  
handleClientChange (CreateRepairOrderPage.jsx) calls fetchProductsByClient(id). Trace:

* Frontend service [repairOrder.service.js](http://repairOrder.service.js) GET /api/repair-orders/products-by-client/:id\_cliente.  
* Route repairOrder.routes.js → controller getProductPricesByClient (repairOrder.controller.js) just forwards req.params.id\_cliente to the service.  
* Service getProductPricesByClient (repairOrder.service.js) is a pure pass-through to the model.  
* Model findProductPricesByClient (Product.js) is where the actual logic lives: one SQL query joins Producto → ModeloProducto → TipoProducto → EstadoProducto → Cliente, and LEFT JOINs PrecioPorCategoria on the client's categoria (with vigente \= 1\) to get the suggested price for that client's category. It filters to products in state 'Recibido' or 'Libre' — i.e. only valves that are actually available to put on a new order (not already mid-repair or delivered). This is why the resulting precio\_sugerido can be 0 (via COALESCE) if no price is configured for that model/category combo.

The result populates products, which the table in Section 2 of the page renders with checkboxes.

3\. User checks valves and adjusts prices — all client-side  
handleProductSelected toggles IDs in selectedProductIds. Then groupedProducts (CreateRepairOrderPage.jsx) reduces the selected products by id\_modelo — since a client can have multiple valves of the same model, it groups them into one row (quantity \+ subtotal) instead of listing each valve individually. precioSugerido for a group defaults to the DB-suggested price for that model, but handlePriceChange lets the user override it per model via customPrices. orderTotal just sums the subtotals. No backend involved yet — this is purely UI state until save.

4\. Save — the core request: createRepairOrder  
Two buttons call handleSaveIntent(esCerrada): "Guardar Abierta" (false) skips confirmation and calls executeSave directly; "Guardar y Cerrar" (true) first opens the ConfirmationModal, and only calls executeSave(true) if the user confirms — because closing an order is meant to be harder to do by accident (matches the business rule that closed data shouldn't be casually mutated).

executeSave (CreateRepairOrderPage.jsx) builds the payload:  
{  
  id\_cliente,  
  es\_cerrada,  
  items: \[{ id\_producto, precio\_final }, ...\]   // one entry per selected valve (not grouped)  
}  
Note it maps back over selectedProductIds (individual valves), pulling the per-model custom price (or the suggested one) for each — so even though the UI shows grouped rows, the request sends one line per physical valve.

Frontend service  
repairOrder.service.js — POST /api/repair-orders with the JSON body. Standard fetch wrapper, nothing notable.

Controller  
createRepairOrder (repairOrder.controller.js:8-41) does shape validation only (id\_cliente present, items is a non-empty array) before delegating to the service — this is exactly the "extract \+ validate shape \+ delegate" pattern the checklist expects, so no deeper explanation needed.

Service — this is where the real business logic is  
repairOrder.service.js, RepairOrderService.createRepairOrder:

Re-validates items isn't empty (defense in depth beyond the controller check).  
Translates es\_cerrada into DB values: id\_estado\_orden \= 2 (Cerrada) or 1 (Abierta), and sets fecha\_cierre to now only if closing.  
Computes importe\_total itself by summing precio\_final across items — it does not trust a total sent from the frontend, which is correct: the server is the source of truth for money.  
Opens a transaction via db.getConnection() / beginTransaction(). This matters because this operation touches two tables (OrdenReparacion and multiple Producto rows) and they must succeed or fail together — you don't want an order created with its valves left in the wrong state, or valves updated without an order to link them to.  
Inserts the order row via RepairOrder.create(orderData, connection) — passing the same connection so this insert is part of the transaction, and gets back the new id\_orden\_reparacion.  
For every item, calls Product.updateForRepairOrder(...) (also on the same connection) to: link the valve to the new order (id\_orden\_reparacion), stamp its agreed precio\_final, and flip its state to ESTADO\_PRODUCTO\_REPARADO (hardcoded 3, i.e. "Reparado") — regardless of whether the order itself is Abierta or Cerrada. These run via Promise.all, since they're independent updates to different rows.  
On success, commit(). On any thrown error, rollback() so nothing is left half-applied, then rethrow so the controller/frontend still sees the error. connection.release() always runs in finally to return the connection to the pool.  
Model layer  
RepairOrder.create (RepairOrder.js) — one INSERT, returns insertId. Straightforward.  
Product.updateForRepairOrder (Product.js) — one UPDATE setting id\_orden\_reparacion, precio, estado, and fecha\_reparacion \= CURRENT\_TIMESTAMP, executed on the injected transactional connection. Straightforward once you understand why the connection is passed in (step 4-6 above).  
Back on the frontend  
executeSave receives { success, message, id\_orden\_reparacion }, shows a success message with the new order number, and after 2 seconds calls handleClearScreen() to reset all the local state (client, products, prices) so the form is ready for a new order. On failure, the caught error's .message (which is whatever the backend controller sent back, e.g. a validation or DB error) is shown in the red banner.

Key business rule worth remembering  
Whether the order is saved as Abierta or Cerrada, the linked valves are moved to the same "Reparado" state (ESTADO\_PRODUCTO\_REPARADO) — the open/closed distinction only affects the order's status and whether fecha\_cierre is set, not the valves' state. If that's not the intended behavior (e.g. an "Abierta" order arguably shouldn't mark valves as fully repaired yet), that'd be a product/business question worth confirming, not a bug in the code as written.

# 

# **Asignación de Story Points a Requerimientos \- 07/05/2026**

Se ha adoptado una metodología de desarrollo incremental basada en el marco de trabajo Scrum. El 'Product Backlog' se compone de 60 requerimientos funcionales, los cuales son priorizados y agrupados en 'Sprints' de dos semanas. Este enfoque permite obtener 'Incrementos de Software' funcionales y testeados al final de cada ciclo, facilitando la validación temprana con el cliente y minimizando el riesgo de desviaciones sobre el alcance técnico definido originalmente.

Para la cuantificación del esfuerzo de desarrollo se adoptó la métrica de Story Points basada en la secuencia de Fibonacci. Este enfoque de estimación relativa permite abstraer la variable temporal de la complejidad intrínseca de los requerimientos. Se definieron valores de referencia para garantizar la consistencia sistémica, evaluando en cada unidad funcional la complejidad algorítmica, la profundidad de la interacción con el modelo de datos (capa de persistencia) y el grado de incertidumbre técnica asociado a los requerimientos no funcionales. 

Para la gestión del desarrollo, se ha procedido a la descomposición de los Requerimientos Funcionales en Unidades de Trabajo Atómicas (Tareas Técnicas). Este proceso de refinamiento, realizado durante la fase de 'Sprint Planning', permite una estimación de esfuerzo más precisa y facilita la aplicación de patrones de diseño específicos para cada capa de la arquitectura. La trazabilidad se mantiene vinculando cada tarea técnica a su correspondiente ítem del Product Backlog, asegurando que cada incremento de código responda directamente a una necesidad del negocio validada. 

¿Qué va en la "Tarjeta"? (El PBI vs. la Task)

En un entorno profesional, la tarjeta principal que se mueve en el tablero (To Do \-\> In Progress \-\> Done) es el PBI (Historia de Usuario).  
**La Tarjeta (PBI):** Representa el "Qué" y el "Para quién".  
**El Detalle Técnico (Tasks):** Son **sub-tareas** que viven *dentro* de esa tarjeta. No son tarjetas independientes que fluyen por el tablero principal, sino una lista de control (checklist) o sub-items técnicos.   
Al cliente (y a tu Director de Tesis) le interesa saber si el "Registro de Comprobantes" está terminado, no si ya hiciste el "script SQL" pero falta el "CSS". La unidad de valor es el requerimiento funcional completo. 

Se ha implementado una estructura de gestión basada en Historias de Usuario (User Stories) como unidades de valor primarias dentro del Product Backlog. La estimación de esfuerzo se realizó a nivel de Story (PBI) mediante la técnica de 'Planning Poker', considerando la complejidad técnica latente en la integración de las tres capas de la arquitectura. Cada Story fue descompuesta en tareas técnicas atómicas para su ejecución, manteniendo el Story Point como métrica de velocidad del proyecto y evitando la atomización de la estimación en tareas menores que no representan un incremento funcional per se. 

[https\://www\.iebschool.com/hub/work-breakdown-structure-wbs-agile-scrum/](https://www.iebschool.com/hub/work-breakdown-structure-wbs-agile-scrum/)  
[https\://www\.scrum.org/resources/what-scrum-module](https://www.scrum.org/resources/what-scrum-module)

Se ha optado por una gestión centralizada del alcance mediante un Product Backlog integral, donde la totalidad de los requerimientos funcionales fueron indexados desde el inicio del ciclo de vida del proyecto. No obstante, se aplicó un principio de **elaboración progresiva**; esto implica que el detalle técnico y la descomposición en tareas atómicas se realizaron únicamente para los ítems seleccionados durante la 'Sprint Planning', optimizando así el tiempo de gestión y permitiendo adaptar el diseño técnico a los hallazgos realizados en iteraciones previas. 

**REVISAR ÉPICA AGREGADA:**

### **Definición de la Épica: Configuración Sistémica**

**Nombre:** Módulo de Administración y Parametrización Global. **Objetivo:** Proveer una interfaz centralizada para la gestión de tablas maestras y constantes de negocio, garantizando la integridad referencial y permitiendo la adaptabilidad del software ante cambios en los procesos operativos del taller.

### **Consideraciones de Arquitectura (Senior Mentor)**

Para que estas funcionalidades sigan los principios de **Clean Code** y **Scalability**:

1. **Tablas Maestras (Lookup Tables):** Todas estas entidades deben vivir en sus propias tablas MySQL.  
   * *Ejemplo:* No guardes el nombre del modelo como un string en la tabla Producto. Guarda el id\_modelo (FK). Esto evita errores de carga y facilita reportes estadísticos (ej: "¿Qué modelo falló más este mes?").  
2. **El Peligro de "Gestión de Estados":** \> \[\!CAUTION\]  
   **Riesgo Crítico:** En tu flujo de negocio, los estados (Recibido, En Reparación, etc.) tienen lógica de programación asociada. Si permites que un usuario cree un estado nuevo llamado "En Espera" desde la interfaz, el **Backend** no sabrá qué reglas aplicar a ese estado nuevo.  
   **Recomendación:** Deja los estados como una tabla de solo lectura o parametrización estética (cambiar color del badge, nombre visual), pero **no permitas crear/borrar lógica de transición** desde la UI.  
3. **Lógica de Precios (Req. 64):**  
   No guardes los precios finales "quemados" en el código. Implementa una función en el Service de Node.js que calcule:  
   \$\$PrecioFinal \= (CostoRepuestos \+ ManoObra) \\times (1 \+ FactorGanancia)\$\$  
   Donde el FactorGanancia se obtenga de esta nueva pantalla de configuración.

La implementación de un Módulo de Parametrización responde al atributo de calidad de **mantenibilidad**. Mediante el uso de Tablas Maestras para entidades como modelos, tipos y roles, se logra un desacoplamiento entre la lógica de negocio y los datos de referencia. Esto permite que el sistema evolucione sin necesidad de intervenciones en el código fuente ante cambios en el catálogo de productos o proveedores del taller, cumpliendo con el principio Open/Closed de SOLID. 

Para la funcionalidad de ingesta masiva de datos, se optó por el estándar **RFC 4180 (CSV)**. Esta decisión técnica se fundamenta en la necesidad de proveer un mecanismo de transferencia de datos desacoplado de software propietario. El procesamiento en la capa de lógica de negocio se realiza mediante **Streams de lectura**, lo cual garantiza la escalabilidad del sistema al manejar grandes volúmenes de registros sin comprometer el stack de memoria del servidor Node.js. Asimismo, se implementó un proceso de validación previa a la inserción para asegurar la integridad referencial en la base de datos MySQL. 

# **Estrategia de Ramificación Git para Proyectos \- 11/05/2026**

En la sección de **Metodología de Desarrollo** o **Gestión de la Configuración**, puedes incluir el siguiente texto:

> "Para garantizar la integridad del código fuente y permitir un desarrollo iterativo-incremental, se ha adoptado el modelo de ramificación GitFlow. Esta estrategia permite aislar el desarrollo de nuevas funcionalidades (ramas *feature*) de la versión estable del sistema (rama *main*). La implementación de este flujo de trabajo asegura que cada entrega de avance sea atómica y que el proceso de integración de código sea trazable, minimizando los conflictos de versiones y facilitando la auditoría técnica del software."

**Gestión de la Configuración y Control de Versiones**:

> "Se ha implementado una estrategia de desarrollo concurrente mediante el aislamiento de ciclos de estabilización. Al derivar una rama de 'Release', el proyecto permite el desacoplamiento entre el aseguramiento de la calidad (QA) de la versión próxima a entregar y el flujo de desarrollo de nuevos requerimientos en la rama 'Develop'. Este enfoque garantiza la continuidad operativa y minimiza los tiempos de inactividad del ciclo de vida del software, asegurando que las correcciones en caliente realizadas durante la fase de pre-entrega sean retroalimentadas a la línea base de desarrollo mediante procesos de integración continua."

**Configuración de Entornos**: **Solución Técnica**

> "Se ha implementado un esquema de configuración desacoplado mediante el uso de variables de entorno (archivos .env). Esta decisión de diseño garantiza que el sistema sea agnóstico al entorno de ejecución, evitando la dependencia de parámetros de red estáticos (hardcoded IPs). Siguiendo el principio de 'Configuración externa', el servidor se parametriza dinámicamente, facilitando la transición entre entornos de desarrollo local y despliegue on-premise en la infraestructura del cliente."

**Arquitectura de Software \- Comunicación entre Capas**: **Solución Técnica**

> "Se ha implementado un esquema de configuración basado en **Inyección de Dependencias de Entorno**. Mediante el uso de variables de entorno desacopladas del código fuente, el frontend de la aplicación adquiere la capacidad de mutar su punto de enlace (Endpoint) sin necesidad de recompilación. Esta práctica no solo mejora la seguridad al evitar la exposición de topologías de red en el repositorio, sino que garantiza la **Escalabilidad Horizontal**, permitiendo que el sistema se despliegue en entornos de Testing, Staging o Producción de manera transparente."

**Despliegue y Distribución**, podés incluir esta explicación técnica de lo que acabas de hacer:

> "Se ha implementado una estrategia de **Desacoplamiento de Configuración** siguiendo los principios de 'The Twelve-Factor App'. Al externalizar los parámetros de red (IPs y puertos) hacia variables de entorno, el sistema adquiere la propiedad de **Portabilidad Ambiental**. Complementariamente, se ha integrado la tecnología de **Contenerización mediante Docker**, lo que permite encapsular las dependencias de ejecución del frontend y backend. Esta arquitectura de despliegue garantiza la paridad entre los entornos de desarrollo y producción, minimizando errores de configuración durante la puesta en marcha on-premise en las instalaciones del cliente."

Se procedió a la estandarización del repositorio bajo el modelo GitFlow, adaptando los comandos de gestión de la configuración al alias de red definido para el proyecto (`IMS-SN`). Este proceso garantizó la integridad del historial de versiones al unificar las líneas de tiempo divergentes mediante un merge de historias no relacionadas, permitiendo establecer una rama de integración (`develop`) que servirá como base para el desarrollo incremental de los Módulos 2 y 3\. 

**Calidad de Software y Gestión de la Configuración**:

> "Para asegurar la integridad de la rama de producción (`main`), se ha implementado un **Ruleset de Gobernanza** en el repositorio remoto. Esta política de protección automatizada prohíbe el volcado directo de código (Direct Push) y la alteración del historial mediante técnicas de 'Force Push'. El flujo de integración hacia la línea base estable queda restringido obligatoriamente al uso de 'Pull Requests', garantizando que cada incremento de versión en producción haya pasado por un proceso formal de validación y cierre de ciclo de vida.

## 

# **El "Definition of Done" (DoD) Académico \- 12/05/2026**

En el mundo profesional, una tarea está "Done" cuando el código está en producción. Para que un requerimiento se considere terminado, debe cumplir con tu **DoD**:

1. **Código:** Funciona según el requerimiento, sin errores de consola.  
2. **Clean Code:** Las funciones están documentadas en español y siguen principios SOLID.  
3. **Base de Datos:** El esquema sigue PascalCase y snake\_case.  
4. **Documentación:** El módulo está redactado en la memoria (explicación técnica de la lógica).  
5. **Test:** Se realizaron pruebas de caja negra (validar que el CUIT duplicado falle, por ejemplo).

Para asegurar la calidad del software y la integridad de los entregables, se estableció un estándar de **Definition of Done (DoD)**. Este conjunto de criterios objetivos permitió estandarizar el proceso de desarrollo, garantizando que cada incremento funcional no solo cumpla con los requisitos operativos, sino también con los atributos de calidad no funcionales, tales como la mantenibilidad del código bajo principios SOLID y la consistencia del modelo de datos relacional. 

**Metodología de Desarrollo** o **Aseguramiento de la Calidad**, puedes incluir este párrafo:

> "Para mitigar la degradación de la calidad del código durante el proceso iterativo, se implementó una estrategia de **Análisis Estático de Código** mediante el uso de *Linters* (ESLint). Esta herramienta garantiza de forma automatizada que el código fuente adhiera a los estándares definidos, como la consistencia en el tipado y la prevención de patrones propensos a errores. Complementariamente, se institucionalizó el uso de **Plantillas de Pull Request** en el sistema de control de versiones, obligando a la validación explícita de los criterios de aceptación (Definition of Done) antes de la integración de cualquier incremento funcional en la rama principal.

**El Linter (Análisis Estático):** Revisa **cómo** está escrito el código. Se asegura de que sigas las reglas de estilo y no cometas errores de "ortografía" técnica. No le importa la lógica del negocio (ej. el cálculo de un precio) está bien o mal, solo que el código esté "limpio".  
**Las Pruebas Automáticas (Unit/Integration Tests):** Revisan **qué hace** el código. Ejecutan la función y verifican si, al pasarle un producto, el estado cambia correctamente a "Reparado".

Para garantizar la **mantenibilidad** y la **transferibilidad** del software, se integró ESLint como herramienta de análisis estático. El objetivo técnico es reducir la carga cognitiva durante la revisión de código y minimizar la introducción de 'code smells'. La automatización de estas reglas asegura que el sistema mantenga una cohesión estilística, independientemente de la etapa del ciclo de vida en la que se encuentre el desarrollo, cumpliendo así con estándares de calidad de software de nivel industrial. 

### **Advertencia de Arquitecto**

Federico, tené en cuenta que al usar `--legacy-peer-deps`, le quitamos a NPM la capacidad de avisarte si una librería realmente es incompatible.

* **Riesgo:** Si en el futuro instalás otra librería de UI (como una galería de fotos o un gráfico complejo) y te tira errores raros, recordá que podrías tener versiones "pisadas".  
* **Mitigación:** Siempre que instales algo nuevo en el frontend de ahora en más, usá el flag `--legacy-peer-deps` si el error persiste, o mejor aún, revisá que la librería sea compatible con React 18\.

**Herramientas de Gestión y Configuración**:

> "Se ha implementado el estándar de **Conventional Commits** para la gestión del historial de versiones. Este esquema semántico clasifica cada intervención según su naturaleza (feat, fix, refactor, style, etc.), permitiendo una trazabilidad granular de la evolución del software. El uso de esta convención facilita la auditoría de cambios y asegura que la documentación del repositorio sea comprensible para cualquier ingeniero que se integre al ciclo de mantenimiento del sistema."

# **Auditoría y Refactorización de Código \- 13/05/2026**

Al finalizar la primera iteración incremental, se estableció una fase de **Refactorización de Código y Aseguramiento de la Calidad (QA)**. Este proceso tiene como objetivo mitigar la deuda técnica acumulada durante el prototipado inicial, garantizando que la arquitectura de tres capas cumpla con los estándares de **acoplamiento débil y alta cohesión**. Se priorizó la normalización de la base de datos bajo el estándar definido y la validación de reglas de negocio en el lado del servidor para asegurar la integridad de los estados de los productos en transición. 

15/05/2026  
*“Estandarización de la Capa de Datos":*

> "Con el objetivo de mantener la consistencia semántica y facilitar el mantenimiento del código (Maintainability), se optó por el uso de **Alias en la Desestructuración de Módulos**. Esta técnica permite que la Capa de Datos (Models) conserve una interfaz interna estable mediante la referencia `db`, independizándola del nombre técnico de la instancia del pool de conexiones definido en la configuración global. De este modo, se cumple con el principio de **Encapsulamiento**, permitiendo cambios en la infraestructura de conexión sin propagar modificaciones estructurales en la lógica de persistencia."

*"Capa de Datos" en tu memoria final:*

> "Para la persistencia de la entidad Usuario, se ha implementado el patrón **Data Access Object (DAO)**, centralizando las operaciones CRUD y garantizando la separación de responsabilidades. Se utiliza el método `execute()` del driver `mysql2`, el cual implementa **Prepared Statements** a nivel de motor de base de datos. Esta técnica optimiza el plan de ejecución de las consultas recurrentes y mitiga vectores de ataque por **Inyección SQL** al desvincular la estructura de la consulta de los datos de entrada. Asimismo, se implementó un mecanismo de **construcción dinámica de consultas** para la actualización de registros, permitiendo peticiones atómicas que solo modifican los campos alterados en la capa de presentación."

**Atomicidad en el `id_role`:** En la función `create` y `update`, el sistema asume que el `id_role` proporcionado es válido. Si se envía un ID inexistente, MySQL lanzará un error de restricción de clave foránea.

* *Recomendación:* Asegúrate de que en el controlador/servicio se valide la existencia del rol antes de intentar persistir el usuario.

CLIENT CONTROLLER TIENE ACCESO A BASE DE DATOSSSS?????

# **Definición de estándar de proyecto \- 17/05/2026**

Se ha adoptado el estándar **JSDoc** para la documentación técnica del código fuente. Esta práctica permite la creación de un contrato claro entre los diferentes módulos del sistema, detallando tipos de datos, parámetros de entrada, valores de retorno y excepciones posibles. La integración de JSDoc con el entorno de desarrollo (IDE) mejora la mantenibilidad al proporcionar documentación contextual inmediata, reduciendo el tiempo de inducción ante futuras evoluciones del software y garantizando que la lógica de negocio —especialmente las transiciones de estado de los productos— esté explícitamente declarada en la base de código. 

# **Priorizar Pruebas Automatizadas Sobre Documentación \- 19/05/2026**

"Aseguramiento de la Calidad" o "Estrategia de Transición entre Módulos":

> *"Previo a la fase de integración del Módulo 2 (Procesos Administrativos y Contables), se determinó la necesidad de estabilizar la línea base del Módulo 1 mediante un proceso de refactorización estructural. Para mitigar el riesgo de regresión en las funcionalidades ya validadas, se desestimó la documentación manual exhaustiva en favor de la implementación de una suite de Pruebas Automatizadas (Unitarias y de Integración). Esta decisión arquitectónica garantizó que el saneamiento del código respetara estrictamente las reglas de negocio predefinidas —especialmente el autómata de estados de los productos—, proporcionando una red de seguridad ejecutable que actuó, de manera intrínseca, como documentación viva del comportamiento esperado del sistema."*

# **Metodología de refactorización segura de código \- 21/05/2026**

*Arquitectura o Lógica de Negocio*:

> **Desacoplamiento y Principio de Responsabilidad Única (SRP)** *"Para garantizar la escalabilidad y mantenibilidad del Módulo 1 (Gestión de Válvulas), se implementó una refactorización arquitectónica basada en el patrón de Servicios (Service Layer). Originalmente, la validación de las transiciones de estado de los productos residía en los Controladores, generando un alto acoplamiento. Mediante la extracción de la matriz de reglas de negocio (`TRANSITION_RULES`) hacia un módulo dedicado (`ProductService`), se logró el cumplimiento estricto del Principio de Responsabilidad Única (SRP). Los controladores ahora actúan únicamente como despachadores (delegadores) de peticiones HTTP, mientras que la capa de Servicio centraliza las invariantes del dominio, facilitando su evaluación aislada mediante Pruebas Unitarias."*

# **Metodología de refactorización segura de código \- 23/05/2026**

*"¿Por qué creaste un Servicio que casi no hace nada más que llamar al Modelo?"*, tu respuesta de Ingeniero debe ser:

> *"Se aplicó el patrón **Data Transfer Object (DTO)** y **Fachada (Facade)** en la capa de Servicios para aislar a los controladores de la estructura física de la base de datos. Aunque algunas operaciones sean simples lecturas (Queries), obligar a que pasen por el Servicio asegura un punto centralizado para la sanitización de datos (como la eliminación de hashes criptográficos en las respuestas) y mantiene una estricta cohesión arquitectónica que facilita la futura implementación de capas de caché (como Redis) sin alterar los controladores."*

**Aislamiento de la Capa de Acceso a Datos y Prevención de Fugas (Database Bleeding)** *"Para cumplir con el desacoplamiento estricto requerido por la arquitectura de tres capas, se implementó el patrón de **Traducción de Excepciones** en la Capa de Datos (Modelos). Las excepciones nativas del motor relacional, tales como violaciones de unicidad (ej. `ER_DUP_ENTRY` de MySQL), son interceptadas y transformadas en errores genéricos de dominio (ej. `DUPLICATE_ROLE_NAME`). Posteriormente, la capa de Servicios mapea estos errores a sus correspondientes códigos de estado HTTP (ej. 409 Conflict). Esta práctica evita que la capa de Presentación (Controladores) adquiera conocimiento sobre la tecnología de persistencia subyacente, fortaleciendo la seguridad al no exponer esquemas internos de base de datos y respetando el principio de Inversión de Dependencias."* 

Esta es una excelente oportunidad para justificar por qué implementaremos Pruebas Unitarias más adelante en tu proyecto. Un Test Unitario para `createRole` hubiera atrapado estos errores en 2 milisegundos en tu consola, sin necesidad de que levantes la aplicación y pruebes manualmente con Postman o React.

**Tu Misión:**

1. Corrige estos 3 detalles en tu código.  
2. Comprueba que todo corra correctamente.

Debes escribir pruebas unitarias exclusivamente para las funciones que contienen **Lógica de Negocio, Criptografía o Reglas de Validación**. Si estas funciones fallan, el sistema colapsa o hay una brecha de seguridad. 

**Estrategia de Cobertura de Pruebas Basada en Riesgos (Risk-Based Testing)** *"Dado el alcance del Proyecto Final, se desestimó el objetivo de alcanzar una cobertura de código (Code Coverage) del 100%, considerándolo un antipatrón para las restricciones de tiempo y recursos actuales. En su lugar, se adoptó una estrategia de 'Pruebas Basadas en Riesgos'. Los esfuerzos de Aseguramiento de Calidad Automatizado (QA) mediante Jest se focalizaron exclusivamente en el núcleo de la lógica de dominio (Core Domain): algoritmos criptográficos (hashing mediante Bcrypt), generación de tokens de acceso (JWT), validación de invariantes de negocio y transiciones de estado complejas. Las operaciones CRUD triviales fueron excluidas de las pruebas unitarias puras, delegando su validación a pruebas de integración o End-to-End, maximizando así el Retorno de Inversión (ROI) del tiempo de desarrollo."* 

**Aislamiento de Pruebas mediante Dobles de Prueba (Mocking)** *"Para evaluar la capa de Lógica de Negocio (Servicios) de forma estricta y determinista, se aplicó la técnica de Mocking utilizando el framework Jest. Se simularon tanto los objetos de acceso a datos (Modelos) como las librerías criptográficas de terceros (`bcrypt`, `jsonwebtoken`). Esto permitió validar el comportamiento del sistema ante flujos alternativos (ej. colisiones de unicidad o credenciales inválidas) sin penalizar el rendimiento de la suite de pruebas ni alterar el estado de la base de datos relacional, garantizando la pureza de las pruebas unitarias."* 

### **1\. `_buildSearchClause(searchField, searchTerm)`**

Esta función es la **primera línea de defensa contra inyecciones SQL** y el motor de flexibilidad de tu buscador.

* **¿Por qué es una función separada?** La lógica de determinar qué columnas buscar (`WHERE (a LIKE ? OR b LIKE ?)`) es compleja. Si estuviera dentro de `findAll`, la función principal sería ilegible.  
* **Anatomía del proceso:**  
  1. **Guard Clause:** Si no hay término de búsqueda, retorna inmediatamente, evitando procesos innecesarios.  
  2. **Mapeo de Campos:** Verifica si el `searchField` solicitado existe en nuestro diccionario `SEARCH_COLUMNS`. Si el usuario envía un campo inexistente o `todos`, la función por defecto utiliza la búsqueda global.  
  3. **Generación de Parámetros:** Utilizamos `Array(n).fill(term)` para crear el array de parámetros que MySQL necesita. Esto asegura que si buscamos en 4 columnas simultáneamente, el driver de `mysql2` reciba exactamente 4 `?` y 4 valores correspondientes, manteniendo la integridad de la consulta.

### **2\. `_buildOrderClause(orderBy, sortOrder)`**

Esta función aplica el principio de **"Lista Blanca" (Whitelist)**, que es una técnica de seguridad fundamental.

* **El Riesgo:** Si permitiéramos que el usuario enviara directamente el nombre de la columna para ordenar, un atacante podría enviar algo como `id_producto; DROP TABLE Cliente;`, lo cual es una vulnerabilidad crítica (SQL Injection).  
* **¿Por qué es una función separada?** La ordenación suele ser una funcionalidad que crecerá. Mañana podrías querer ordenar por *fecha de entrega* o *prioridad del cliente*. Tenerlo encapsulado te permite agregar nuevas columnas permitidas en un solo lugar (`ALLOWED_ORDER_BY`) sin tocar el núcleo de la lógica de negocio.  
* **Anatomía del proceso:**  
  * **Normalización:** Recibe el parámetro del cliente y lo compara contra un objeto (diccionario) que define las columnas reales de la base de datos (`c.nombre`, `p.fecha_recepcion`).  
  * **Fallback (Seguridad por defecto):** Si el cliente solicita un campo que no está en nuestra lista blanca, la función ignora el input y devuelve `fecha_recepcion DESC`. Esto garantiza que la API siempre responda con un orden válido y predecible.

### **3\. El flujo de datos: ¿Por qué este diseño es "Arquitectónicamente Superior"?**

En tu pregunta anterior mencionabas que te parecía ineficiente volver a la base de datos. Sin embargo, al separar estas funciones, el flujo de ejecución ahora es limpio y sigue el **Patrón de Estrategia**:

1. **Capa de Presentación:** Envía `?orderBy=cliente&sortOrder=ASC`.  
2. **Capa de Negocio:** Valida que el request tenga sentido.  
3. **Capa de Datos (`findAll`):**  
   * Llama a `_buildSearchClause` \-\> recibe la cadena `WHERE` y los `params`.  
   * Llama a `_buildOrderClause` \-\> recibe la cadena `ORDER BY`.  
   * Concatena y ejecuta una sola consulta `SELECT` optimizada.

**"Diseño de Capas"**:

> *"Se implementó un esquema de delegación de responsabilidades donde el Controlador actúa como punto de entrada de la API REST, validando el contrato de comunicación (HTTP status codes), mientras que la Capa de Servicio encapsula el motor de reglas de negocio (`TRANSITION_RULES`). Esta normalización arquitectónica permitió reducir la complejidad ciclomática de los controladores y facilitó la implementación de pruebas unitarias aisladas, donde mediante técnicas de 'mocking' se verificó la integridad de las reglas de estado sin dependencias de infraestructura, incrementando la robustez del Módulo 1 frente a cambios en la lógica de negocio."*

**Diseño de Modelo y Seguridad en Capa de Datos** *"Se implementó un patrón de acceso a datos basado en el principio de menor privilegio. Para mitigar vulnerabilidades de inyección SQL en consultas con parámetros dinámicos (ordenamiento y filtrado), se integró una capa de validación mediante 'listas blancas' (Whitelisting) en el Modelo. Esto asegura que solo los identificadores de columna y direcciones de ordenamiento explícitamente permitidos sean inyectados en la sentencia SQL, transformando entradas de usuario no confiables en parámetros controlados por el sistema."* 

Como Arquitecto, debo señalar un riesgo residual importante que debemos atacar próximamente (quizás en la refactorización final): **Ausencia de Transacciones SQL (ACID).**

En tu servicio `createClient`, estás insertando el Cliente y luego iterando para insertar sus Teléfonos. Si el cliente se guarda, pero la inserción del teléfono falla (ej. se cae la red o el teléfono ya existe en otro registro), tu base de datos quedará en un **estado inconsistente** (un cliente registrado parcialmente).

Al usar `pool.query`, no estamos manejando un bloque de transacción global. Para un proyecto final académico, justificar por qué la capa de servicio no controla un `BEGIN; ... COMMIT;` puede ser un punto vulnerable ante el tribunal.

# **Refactorización y Arquitectura de Ordenamiento \- 27/05/2026**

*Aseguramiento de la Calidad*:

> *"Para garantizar la estabilidad funcional del módulo de gestión de clientes, se implementó una suite de pruebas automatizadas basada en el framework Jest. Siguiendo el principio de inversión de dependencias, se desarrollaron pruebas unitarias sobre la capa de Servicios utilizando objetos simulados (Mocks) para la capa de Acceso a Datos, permitiendo validar las reglas de negocio y la normalización de entidades de forma determinista y aislada. Complementariamente, se diseñaron pruebas de integración (Black-box testing) mediante Supertest para verificar los contratos de la API REST y el correcto manejo de códigos de estado HTTP frente a excepciones de dominio (ej. conflictos por unicidad de datos)."*

# **Validación de datos: Frontend y Backend \- 28/05/2026**

"Para garantizar la integridad y robustez del sistema, se ha implementado una estrategia de validación de datos en dos capas. La **capa de presentación** ejecuta validaciones del lado del cliente para optimizar la experiencia de usuario y reducir la carga innecesaria en la red mediante respuestas inmediatas. Complementariamente, la **capa de lógica de negocio** en el backend implementa una validación exhaustiva y estricta de todos los datos entrantes (contratos de API). Esta redundancia controlada asegura que, independientemente del medio de acceso a los endpoints, el sistema mantenga la consistencia de los datos y prevenga la persistencia de información maliciosa o mal formada en el motor de base de datos." 

"Se ha implementado un módulo de validación de datos desacoplado (`validation.js`), el cual encapsula la lógica de verificación de integridad (formato de CUIT y correos electrónicos). Este enfoque garantiza la **consistencia de la lógica de negocio** en todos los niveles del sistema:

* **Capa de Presentación:** Permite la validación preventiva, mejorando la usabilidad mediante la reducción de ciclos de respuesta innecesarios al servidor.  
* **Capa de Lógica de Negocio:** Actúa como un *gatekeeper* (guardián), aplicando las mismas reglas de validación ante cualquier petición entrante, independientemente de su origen. Esta redundancia de control es fundamental para la **arquitectura de defensa en profundidad**, asegurando que la persistencia de datos en el motor MySQL solo ocurra tras la verificación estricta de las reglas de negocio."

Pull Request: Refactorización y Estabilización Arquitectónica del Módulo 1  
Descripción

Este PR consolida una serie de refactorizaciones profundas orientadas a mejorar la escalabilidad, mantenibilidad y robustez del Módulo 1\. Se ha migrado lógica procedimental hacia una arquitectura de tres capas estricta, aplicando principios SOLID y garantizando la integridad de datos mediante validaciones y pruebas automatizadas.  
Resumen de Cambios  
Arquitectura y Core

    Patrón de Capas: Extracción de lógica de negocio desde controladores hacia servicios (Service Layer), eliminando el acoplamiento directo con la persistencia.

    Persistencia: Implementación de un Pool de Conexiones asíncrono y uso de Prepared Statements (DAO) para mitigar riesgos de Inyección SQL.

    Seguridad: Implementación de whitelist mapping en modelos para prevenir asignación masiva de campos no autorizados.

Testing y Calidad

    Suite de Pruebas: Configuración de Jest (unitarias) y Supertest (integración) para validar contratos de API y reglas de negocio.

    Entorno de Testing: Configuración de un esquema de base de datos efímero (taller\_db\_test) para pruebas deterministas.

    Documentación: Integración de JSDoc para estandarizar la documentación técnica en el código fuente.

Frontend y UX

    Saneamiento: Optimización del ciclo de vida de componentes (React) mediante Lazy Loading y eliminación de fugas de memoria.

    Validación: Implementación de validación lógica de negocio compartida (CUIT/Email) con control de foco programático para una mejor experiencia de usuario.

Impacto

    Mantenibilidad: El código ahora cumple con el principio de Responsabilidad Única (SRP), facilitando futuras modificaciones sin efectos colaterales.

    Robustez: La integración de pruebas permite detectar regresiones antes del despliegue.

    Seguridad: Mitigación de riesgos de inyección SQL y mejora en el manejo de conexiones a la base de datos.

Checklist de Verificación (Definition of Done)

    \[x\] Lógica de negocio extraída a servicios.

    \[x\] Pruebas unitarias de servicios implementadas y pasando.

    \[x\] Pruebas de integración de endpoints pasando.

    \[x\] Validación de CUIT/Email unificada.

    \[x\] Documentación JSDoc agregada a funciones críticas.

    \[x\] Análisis estático (ESLint) sin advertencias críticas.

"Gestión de la Configuración y Versionado"   
"La integración de nuevas funcionalidades y refactorizaciones se gestiona bajo el modelo de ramificación 'Git Flow'. Se adoptó una política de **integración controlada**, donde las ramas de desarrollo (`refactor-modulo1`) son sincronizadas con la rama base (`develop`) mediante operaciones de 'Merge' tras una validación local previa. Este procedimiento garantiza que la rama `develop` actúe como un entorno de integración continua, donde el código es validado en un contexto estable antes de cualquier promoción hacia el entorno de producción (`main`)." 

# **Priorizar TailwindCSS \- 29/05/2026**

**Configuración de Core:** Instalación de TailwindCSS, configuración de `tailwind.config.js` y definición de la paleta de colores acorde a la identidad del taller.  
**Sistema de Diseño (Atomic Design):** Crear una carpeta de componentes comunes (`/src/components/common`) con:

* `Button.jsx` (variantes: primary, secondary, danger).  
* `Input.jsx` (con estilos de validación).  
* `Badge.jsx` (para los estados de las válvulas: Recibido, Reparado, etc.).

**Layout Principal:** Implementar el Sidebar y Navbar definitivos para la navegación entre módulos.  
**Refactor Visual del Módulo 1:** Aplicar los estilos a las tablas de productos y formularios de registro que ya tienes funcionando.

"Se ha seleccionado **TailwindCSS** como framework de estilos bajo un enfoque de 'Utility-First', con el objetivo de optimizar la carga del frontend mediante la eliminación de CSS no utilizado (PurgeCSS). Esta decisión técnica garantiza la escalabilidad del sistema de diseño, permitiendo que las interfaces de los módulos subsiguientes (Administrativo y Repuestos) mantengan una consistencia visual y funcional, reduciendo la deuda técnica asociada a la maquetación procedimental." 

"Se ha implementado un esquema de disposición **Flexible Box Layout (Flexbox)** para la interfaz maestra. Esta arquitectura de presentación desacopla las dimensiones de los contenedores de la lógica de renderizado, permitiendo una adaptación dinámica del viewport ante la interacción con el menú lateral persistente. El uso de contenedores con límites de ancho paramétricos (`max-width`) garantiza el cumplimiento de las heurísticas de Nielsen sobre legibilidad y carga cognitiva en sistemas de gestión de datos densos." 

Se ha implementado un patrón de **Dashboard Operativo** en la vista de inicio, estructurado mediante el uso de rejillas dinámicas (CSS Grids). Se dividió la jerarquía visual en dos niveles: 1\) **Navegación Contextual**, que optimiza los flujos de trabajo más frecuentes detectados en el relevamiento inicial, y 2\) **Métricas de Control de Gestión**, que proporcionan visibilidad inmediata sobre el estado de la planta. Este diseño reduce el número de clics necesarios para la toma de decisiones, mejorando la eficiencia operativa del sistema. 

Se ha implementado un patrón de **Visualización de Datos Tabular** optimizado para la gestión masiva de registros. La interfaz emplea **Micro-interacciones** en los encabezados para el ordenamiento dinámico (Sortable Headers) y un filtrado predictivo asíncrono. Se priorizó la **Densidad de Información** equilibrada mediante el uso de tipografías monoespaciadas para datos numéricos (CUIT) y etiquetas de estado (Badges) para la categorización, minimizando el tiempo de escaneo visual por parte del operador y reduciendo errores en la identificación de cuentas.   
**Ingeniería de Usabilidad**   
Un formulario de alta de datos estructurado mediante **Agrupación Lógica de Dominios**, lo que reduce la carga cognitiva del usuario al separar la información de identidad, localización y contacto. Se aplicó un patrón de **Entrada Dinámica** para la gestión de cardinalidad 1:N en la relación Cliente-Teléfono, permitiendo la escalabilidad de la información sin comprometer el espacio en pantalla. La validación en el lado del cliente (Client-side validation) utiliza **Retroalimentación Visual Sincrónica** y gestión de foco programático, garantizando la integridad de los datos (CUIT/Email) antes del despacho a la capa de servicios. 

Estrategias de Persistencia y Gestión de Estado  
Se ha implementado una arquitectura de actualización de perfiles basada en el principio de **Integración Selectiva**. Esta técnica permite segmentar la información del cliente en atributos inmutables (como la identificación primaria ante el fisco) y atributos volátiles (contacto y localización), protegiendo la integridad referencial del sistema. Asimismo, se incorporó un patrón de **Baja Lógica (Soft Delete)**, el cual permite la inhabilitación del sujeto sin la destrucción del histórico de transacciones asociadas (órdenes de reparación), cumpliendo con los estándares de trazabilidad y auditoría requeridos para sistemas de gestión contable. 

Esta estructura responde a una arquitectura de **Administración Basada en Dominios**:

> "Se ha diseñado una vista de configuración centralizada bajo un patrón de **Agrupación Funcional**. La interfaz permite al administrador del sistema acceder a las tablas maestras y parámetros globales mediante una segmentación por dominios de negocio (Seguridad, Producto, Comercial). Se implementó un diseño de **Navegación en Rejilla** con retroalimentación visual diferenciada para funciones operativas y funciones en etapa de desarrollo, garantizando la escalabilidad de la plataforma sin comprometer la consistencia de la experiencia de usuario durante el proceso de implementación incremental."

**"Módulos de Seguridad y Auditoría"**:

> "Se ha implementado una consola de administración de usuarios que centraliza el control de acceso al sistema. La interfaz utiliza una **Arquitectura de Tabla de Datos (Data Table)** con segmentación visual por estados de actividad. Se aplicó un patrón de **Semántica de Color** para la identificación inmediata de privilegios (Roles) y estados operativos (Activo/Inactivo), permitiendo que el administrador realice tareas de mantenimiento de cuentas con una baja probabilidad de error visual. La disposición de las acciones sigue el estándar de **Acceso Secuencial**, alineado con las políticas de gobernanza de datos definidas para el taller."

Interfaz Humano-Computadora   
"Se ha implementado una interfaz de gestión de perfiles centrada en la **Prevención de Errores Críticos**. La arquitectura de la vista diferencia los datos persistentes de identificación del usuario de los atributos de configuración volátiles. La sección de actualización de credenciales se encuentra visualmente aislada mediante un patrón de **Acentuación Cromática de Advertencia** (Amber Design), obligando al operador a una validación consciente antes de la modificación de claves. Esta disposición garantiza la seguridad operativa y el cumplimiento de las normativas internas de gestión de identidades y accesos. 

Ten cuidado de no permitir que un administrador se desactive a sí mismo si es el único administrador del sistema (bloqueo total).

* *Mitigación Sugerida*: En el backend, podrías agregar una validación que impida desactivar al usuario con `id_user = 1` o al usuario que está realizando la petición si es el último administrador activo.

**Seguridad en Interfaces**:

> "Se ha implementado una interfaz controlada para la matriculación de nuevos usuarios basada en el principio de **Validación Sincrónica Dual**. La capa de presentación intercepta el flujo de envío del formulario para corroborar las restricciones de longitud y la paridad de los campos de verificación de credenciales antes del procesamiento criptográfico en el servidor. La experiencia de usuario (UX) se optimiza mediante una jerarquía por pasos lógicos y la inyección dinámica de foco periférico en los componentes reactivos ante fallos de coincidencia, reduciendo el índice de excepciones operacionales por errores de entrada de datos."

**Unicidad del Username:** Aunque el formulario esté validado visualmente, el riesgo principal reside en que dos empleados intenten registrar el mismo identificador de acceso (ej. `mperez`). Recuerda capturar el código HTTP `409 Conflict` enviado por tu controlador del backend para inyectarlo en el estado `message` local, evitando que la aplicación quede colgada.

**Asignación de Roles por Defecto:** Al cargar la página, el estado `id_role` inicia vacío. Esto obliga explícitamente al administrador a seleccionar una opción, mitigando el riesgo de registrar por accidente a un operario con el nivel de acceso más alto (Administrador) por herencia de la primera opción del combo.

**Arquitectura de Información para Entornos de Alta Carga**:

> "Se ha desarrollado una consola de trazabilidad de productos basada en el estándar de **Visualización de Datos de Procesos**. La interfaz integra una **Máquina de Estados Visual (StatusBadge)** que permite al operario identificar el cuello de botella en la línea de producción mediante codificación cromática semántica. Se optimizó el flujo de navegación mediante un sistema de **Búsqueda Multimodal**, permitiendo el filtrado cruzado entre Clientes y Modelos de Producto de forma asincrónica. Esta arquitectura de presentación minimiza el 'Time to Action' (TTA) del personal administrativo, cumpliendo con los requisitos de optimización de procesos establecidos en el Módulo 1 del proyecto."

Se ha implementado una interfaz de **Captura de Datos Operacionales** bajo un esquema de filtrado jerárquico. El componente utiliza una lógica de dependencia de estados (useEffect) para la carga dinámica de modelos basada en el tipo de producto seleccionado, reduciendo el margen de error en la entrada de datos. El diseño visual, basado en TailwindCSS, prioriza la legibilidad y la jerarquía de la información mediante el uso de micro-tipografías para metadatos y campos de entrada de alto contraste, preparando la infraestructura para la futura integración de módulos de gestión de activos multimedia (fotografías de recepción). 

**Visualización de estados** y **Encapsulamiento de lógica**.

> "Se ha implementado una interfaz de **Gestión de Estados de Ciclo de Vida** para productos en reparación. La vista utiliza un componente atómico (`StatusBadge`) para la representación del estado actual, asegurando coherencia visual con el resto del ecosistema de componentes. Asimismo, se integró una capa de validación de reglas de negocio en la capa de presentación, la cual restringe las transiciones de estado permitidas (ej. prohibición de retroceder desde un estado de 'Entregado'), previniendo incoherencias en la trazabilidad logística desde el cliente. El diseño emplea una estructura de rejilla simétrica que separa la información histórica (Read-only) de las acciones de modificación (Formulario), optimizando la densidad de información y reduciendo la carga cognitiva del operario."

**Riesgo:** Si en el backend cambias el ID de un estado (ej. "Entregado" pasa a ser ID 7), el Frontend se romperá.  
**Mitigación:** Actualmente, el mapeo `FRONTEND_STATE_IDS` está en el archivo. Para un sistema profesional, te sugiero que en la etapa 3, tu API tenga un endpoint `GET /api/product-states/rules` que envíe estas reglas de negocio desde el servidor, para que el frontend no tenga que conocer las reglas de negocio (evitando duplicar lógica).

**Protección contra Inconsistencias**:

> "Se implementó una estrategia de **mutación controlada** en el formulario de edición. Para evitar la modificación accidental de estados críticos del ciclo de vida del producto (State Mutation), la interfaz desacopla el estado visual (Badge de estado actual) del estado de selección (Select del formulario). El sistema implementa una lógica donde la persistencia del nuevo estado solo se consolida tras la validación explícita del usuario mediante el botón de guardado, mitigando el riesgo de errores operativos inducidos por una selección errónea en el formulario."

**Proceso de Desarrollo**:

> "El presente Pull Request representa la culminación de la fase de estandarización de la interfaz de usuario. Se ha migrado el stack de estilos hacia un framework de utilidad (TailwindCSS), permitiendo una mayor coherencia visual entre los distintos módulos. Este proceso de integración siguió una metodología de desarrollo basada en ramas funcionales, donde cada refactorización fue sometida a una validación de integridad referencial, asegurando que los cambios de estilo no alteraran la lógica de negocio ni la persistencia de datos."

**Gestión de Configuración y Control de Versiones**:

> "Se estableció un flujo de trabajo basado en la **Sincronización Continua de Ramas Locales**. Tras la aprobación de un Pull Request en el entorno remoto (GitHub), se ejecuta de manera sistemática la actualización de la rama de integración (`develop`) en el entorno local. Este proceso garantiza que el estado del código en las estaciones de trabajo de desarrollo sea idéntico al repositorio central, eliminando la deriva de código (code drift) y preparando el entorno para la integración de nuevas funcionalidades del siguiente sprint."

# **Plan de acción de requerimientos de Software \- 04/06/2026**

principio de **Trazabilidad de Activos**:

> "La implementación del Módulo de Trazabilidad responde a la necesidad de mantener un control estricto sobre el ciclo de vida del producto. Se ha diseñado una arquitectura basada en eventos (Event-based logging) que registra de manera inmutable cada transición de estado. Esto no solo facilita la auditoría operativa, sino que también proporciona al cliente herramientas para la resolución de controversias sobre el estado del producto en cualquier punto temporal de su estadía en el taller."

**Catálogo de Referencia**:

> "La implementación de la entidad `CategoriaCliente` permite desacoplar la lógica de precios y beneficios comerciales del registro individual de clientes. Esta normalización de datos facilita la administración centralizada de políticas comerciales, permitiendo al administrador del sistema escalar las estrategias de precios (Req. 62\) sin necesidad de reconfigurar la base de datos relacional de usuarios finales."

"Lógica de Negocio", puedes justificar esto como un **Modelo de Máquina de Estados**:

> "Para garantizar la integridad operativa del taller y la trazabilidad de los activos, se implementó una Máquina de Estados Finita (FSM). Este componente centraliza la lógica de transiciones permitidas, asegurando que cada producto siga un flujo de vida estrictamente definido. Esta arquitectura previene transiciones inválidas en el ciclo de reparación, garantizando que el sistema sea un reflejo fiel de los procesos físicos del taller y facilitando la auditoría de estados."

"Gestión de Datos y Operaciones", puedes documentar esto como **Carga Masiva de Activos**:

> "Con el propósito de facilitar la migración de datos y reducir la fricción en la adopción del sistema, se ha desarrollado un módulo de importación de lotes mediante archivos CSV. Esta solución implementa un procesamiento por *stream* para garantizar un uso eficiente de los recursos del servidor y una validación atómica (ACID) que preserva la integridad referencial en todo momento. Se garantiza así la consistencia del catálogo de productos y clientes, evitando errores de entrada manual durante la carga inicial de inventario."

**Migración de Datos y Normalización**:

> "Para la gestión eficiente de la cartera de clientes, se implementó un mecanismo de importación masiva mediante archivos CSV, el cual incorpora una política de 'Upsert' para prevenir la duplicidad de registros. Este módulo no solo optimiza la carga inicial, sino que actúa como un filtro de calidad de datos, validando la integridad de la información sensible (como DNI y contacto) contra las restricciones del modelo relacional definido. La automatización de este proceso reduce significativamente la probabilidad de error humano frente a la carga manual, garantizando la consistencia de la base de datos de clientes desde el despliegue del sistema."

> 

# **Desarrollo Modulo 1.1: Gestión  Tipos de Producto \- 05/06/2026**

**Diseño de la Capa de Datos**:

> "Para la implementación de la Gestión de Tipos de Producto, se extendió la capa de acceso a datos aplicando el principio de *Single Responsibility* (SRP). Se desarrollaron métodos específicos (`findTypeById`, `createType`, `updateType`) encapsulando las sentencias DML correspondientes. El uso de *Prepared Statements* mitiga riesgos de inyección SQL, mientras que la estandarización de las firmas de retorno garantiza una interfaz consistente con la capa de Servicios, permitiendo una gestión de errores centralizada y predecible."

**Lógica de Negocio**:

> "La capa de servicios actúa como un validador de integridad para las entidades maestras. En la gestión de `TipoProducto`, se implementó una lógica de validación previa a la persistencia que asegura la unicidad del nombre mediante una normalización en formato *UPPERCASE*. Esta capa centraliza las reglas de negocio, permitiendo que la API REST responda con códigos de estado HTTP semánticos (ej. `400 Bad Request` para entradas vacías, `409 Conflict` para duplicados), desacoplando los validadores de la lógica de acceso a datos directa."

**Riesgo:** La función `findAllProductTypes` devuelve un array completo. Si a futuro tuviéramos miles de tipos, esto no sería escalable.  
**Solución a mediano plazo:** En cuanto el volumen de datos crezca, deberemos mover la verificación de duplicidad a una consulta SQL específica (ej. `SELECT COUNT(*) FROM TipoProducto WHERE nombre = ?`), delegando la tarea de conteo al motor de base de datos. Por ahora, **mantenerlo así es correcto para tu MVP** (principio YAGNI: *You Ain't Gonna Need It*).

**Implementación de la Capa de Controladores**:

> "El controlador `ProductController` actúa como orquestador de las peticiones HTTP, manteniendo una interfaz delgada mediante la delegación de responsabilidades hacia `ProductService`. Para la gestión de tipos de productos, se han implementado métodos que aseguran el cumplimiento de los contratos definidos, retornando códigos de estado RESTful adecuados. Esta separación permite que la capa de presentación ignore la complejidad de las reglas de validación subyacentes, facilitando la mantenibilidad y evolución del sistema según los principios de *Clean Architecture*."

**Riesgo de API:** Al añadir nuevos métodos (`POST`, `PUT`), asegúrate de haber actualizado el archivo de rutas (`product.routes.js`) para exponer estos endpoints (`/api/products/types` y `/api/products/types/:id_tipo`).  
**Seguridad:** Recuerda que estas operaciones (`create`, `update`) suelen ser **privilegiadas**. En etapas futuras, deberás agregar un Middleware de autenticación/autorización para asegurar que solo usuarios con rol de `Administrador` puedan ejecutar estos métodos.

**Diseño de API REST**:

> "Siguiendo el principio de REST, se implementó el método `GET /:id` para la entidad `TipoProducto`. Esto permite desacoplar la consulta de la entidad de su modificación, habilitando al frontend a recuperar el estado actual del recurso antes de realizar una operación de actualización (`PUT`), mejorando la robustez de la interfaz y la gestión de errores en la capa de transporte."

**Implementación de la Capa de Interfaz**:

> "La gestión de catálogos maestros, como los 'Tipos de Producto', se implementó mediante un componente reactivo centralizado que encapsula el ciclo de vida del dato. Se utilizó un patrón de estado local para la sincronización entre la interfaz de usuario (tabla de consulta) y la capa de servicios, garantizando una experiencia de usuario fluida mediante feedback visual inmediato ante operaciones CRUD. La modularización del componente permite su escalabilidad hacia otras entidades maestras (como modelos o estados) mediante la reutilización de la estructura de formularios modales."

**Componentes Reutilizables de la Capa de Presentación**:

> "Se desarrolló un componente modal altamente cohesivo para la gestión de entidades maestras. El componente `ModalProductType` encapsula la lógica de entrada de datos y validación de formulario, utilizando el patrón de 'props-down, events-up' para comunicarse con el contenedor superior. Al delegar la lógica de persistencia al servicio de negocio y mantener la UI del modal pura, se garantiza la reutilización de este componente para otras entidades, reduciendo la duplicación de código en la interfaz de administración."

**Integridad Referencial en Consultas**:

> "La capa de persistencia se diseñó siguiendo el paradigma relacional, integrando consultas mediante `JOIN` entre las entidades `ModeloProducto` y `TipoProducto`. Esta estrategia elimina la necesidad de realizar consultas anidadas (N+1 queries) desde la capa de negocio, optimizando el rendimiento de la API y permitiendo que la capa de presentación reciba objetos enriquecidos con la información necesaria para el despliegue de catálogos maestros."

**"Mecanismos de Validación e Integridad en la Lógica de Dominio"**:

> "En la capa de lógica de negocio (`ProductService`), la manipulación de la entidad secundaria `ModeloProducto` requiere un control estricto de integridad relacional antes de su envío al plano de persistencia. Mediante la interceptación preventiva, el sistema comprueba la existencia de la clave foránea del catálogo maestro (`TipoProducto`) a través del método de lectura directa en el DAO. Esta estrategia de diseño encapsula las restricciones relacionales en el dominio del servidor, mitigando el procesamiento innecesario de excepciones a nivel de motor de base de datos y retornando estados HTTP semánticos y limpios (`404 Not Found` en lugar de fallos internos `500` por violación de integridad estructural)."

**Arquitectura del Software \- Flujo de Control de Excepciones**:

> "La homogeneización de la capa de controladores (`ProductController`) permite un tratamiento uniforme de las respuestas HTTP en recursos anidados o dependientes, como es el caso de la entidad `ModeloProducto`. Al delegar el flujo transaccional y las reglas de validación estructural al componente de negocio `ProductService`, el controlador se reduce a un despachador puro de protocolo REST. Este enfoque garantiza que ante fallos lógicos o violaciones de restricciones maestras, se intercepten códigos de estado semánticos (`400 Bad Request`, `404 Not Found`) y se evite la propagación de fugas de información o trazas internas del motor relacional hacia el cliente."

**Refinamiento del Modelo Relacional**:

> "Para dotar al sistema de una alta flexibilidad operacional y desacoplar las reglas de negocio del código fuente, se normalizó la matriz de transiciones de ciclo de vida del producto mediante la entidad asociativa DiccionarioEstado. Este diseño implementa un enfoque dirigido por datos (Data-Driven Architecture) sobre la máquina de estados finitos del taller. Estructuralmente, se configuró una clave primaria compuesta \$\\langle\\text{estado\\\_origen, estado\\\_destino}\\rangle\$ para anular la redundancia de arcos, reforzada por restricciones de integridad referencial vinculadas a la tabla base EstadoProducto. Esta abstracción relacional simplifica las auditorías de procesos y habilita la reconfiguración dinámica de flujos de trabajo administrativos sin necesidad de realizar alteraciones lógicas en los servicios de la capa de aplicación."

**Scripts de Inicialización y Semillas de Datos (Seeds)**:

> "El aprovisionamiento inicial de las reglas operacionales del taller se realiza mediante un script DML de inserción atómica. El conjunto de tuplas insertadas en `DiccionarioEstado` traduce la matriz de adyacencia dirigida que gobierna el ciclo de vida del producto. Este método garantiza que, desde el despliegue inicial (*cold-start*), el motor de base de datos impida estados huérfanos o transiciones inválidas mediante la aplicación nativa de restricciones relacionales, salvaguardando la integridad de la máquina de estados lógicos sin depender exclusivamente de las validaciones en tiempo de ejecución de la capa de aplicación."

**Abstracción de la Capa de Datos (DAO)**:

> "Para asegurar el desacoplamiento de las reglas de control de flujo, se incorporó en el objeto de acceso a datos (`ProductModel`) el método analítico `findAllowedDestinations`. Esta función encapsula la proyección relacional sobre la tabla `DiccionarioEstado`, abstrayendo la lógica de consultas mediante la conversión estructural de los registros resultantes (*ResultSets*) en vectores nativos de enteros. Al centralizar esta operación en el modelo, se garantiza que la capa superior de lógica de negocio opere exclusivamente con tipos de datos primitivos e interfaces limpias, abstrayéndose por completo de la sintaxis SQL subyacente."

**Refactorización y Reducción de Deuda Técnica**:

> "Con el objetivo de garantizar la Escalabilidad y la inmutabilidad de la máquina de estados, se refactorizó la función `updateProductState` en la capa de lógica de negocio. Se eliminaron las reglas de transición anidadas estáticamente en el código fuente (Hardcoded State Matrix), reemplazándolas por consultas dinámicas a la entidad asociativa `DiccionarioEstado` mediante el método `findAllowedDestinations`. Esta modificación asegura que cualquier alteración futura en la secuencia de operaciones del negocio no requerirá un nuevo despliegue (*deploy*) del software, reduciendo sustancialmente la deuda técnica y cumpliendo con el principio de Abierto/Cerrado (OCP) de la ingeniería de software."

La transición hacia una arquitectura orientada a datos se validó mediante un proceso de **Testing de Integración (Black-box)**. Se ajustaron los contratos de prueba para simular la respuesta del motor de persistencia ante consultas dinámicas de adyacencia de estados. Este enfoque asegura que, incluso con cambios en la fuente de verdad (de memoria volátil a persistencia en MySQL), el comportamiento externo de la API se mantenga consistente, verificando la integridad del contrato de interfaz frente al usuario final. 

**Diseño de la Capa de Acceso a Datos**:

> "Para la gestión del diccionario de estados, se implementó el método `getAllStateTransitions`, el cual abstrae la complejidad de la relación asociativa entre estados mediante una consulta con `JOIN` doble sobre la tabla `EstadoProducto`. Esta aproximación garantiza que la capa de presentación reciba datos descriptivos y normalizados (nombres de los estados) en lugar de claves foráneas abstractas, cumpliendo con los estándares de usabilidad de interfaces administrativas y eliminando lógica de mapeo innecesaria en el cliente."

Para la gestión de la lógica de estados, se implementó el servicio `getStateTransitions` en la capa de negocio. Esta función actúa como un mediador que recupera la matriz de adyacencia desde el modelo, permitiendo que la capa de controladores solicite las reglas de transición vigentes sin conocer la infraestructura de almacenamiento subyacente. Esta separación de responsabilidades facilita la auditabilidad del sistema y asegura que las reglas de flujo operativo sean gestionables desde una única fuente de verdad. 

**Interfaz de Configuración Avanzada**:

> "Con el fin de proveer una consola de supervisión de procesos de negocio al personal jerárquico, se diseñó la interfaz reactiva `StateTransitionsPage`. El componente utiliza un mecanismo de reducción asociativa síncrona en el frontend para procesar el catálogo plano provisto por la API REST y transformarlo en una matriz relacional agrupada. La representación visual emplea un código cromático adaptativo mediante utilidades CSS parametrizadas por dominio, reflejando fielmente las restricciones del arco de transiciones de la máquina de estados e impidiendo inconsistencias cognitivas en el operario respecto a los flujos reglamentarios del sistema."

# **Gestión de precios por Categoria \- 18/06/2026**

Diseño físico y justificación de persistencia del Módulo 2:

"Para dar cumplimiento al requerimiento funcional de **Listas de Precios por Categoría de Cliente**, se desestimó el acoplamiento directo entre el catálogo activo y las transiciones de las órdenes de trabajo. En su lugar, se implementaron dos estrategias específicas:

1. **Patrón Snapshot en Entidades Transaccionales:** Se adicionó el atributo `precio` a la entidad `Producto`. Al consolidar la orden de reparación, el sistema copia el valor vigente del catálogo en dicha columna. Esto aísla la transacción histórica de futuras fluctuaciones comerciales y permite modificaciones manuales (como bonificaciones puntuales) por parte del operador sin alterar los maestros globales.  
2. **Historial de Vigencia mediante Slowly Changing Dimensions (SCD Tipo 2):** La tabla `PrecioPorCategoria` preserva la inmutabilidad de los datos históricos estructurándose bajo un esquema de intervalos temporales delimitado por los campos `vigencia_desde` y `vigencia_hasta`.  
3. **Restricción de Unicidad Virtual:** Se incorporó la columna generada síncrona `vigente`. Dado que el motor de base de datos indexa múltiples registros nulos pero restringe escalares exactos, el índice único compuesto por `id_modelo`, `id_categoria` y `vigente` impide la coexistencia de dos precios activos simultáneamente, delegando la integridad transaccional al motor relacional."

**Capa de Persistencia**:

"Con el objetivo de proveer los datos referenciales para la matriz administrativa del taller, se implementó el método `getActivePrices` en la clase de persistencia `PriceCategory`. La función ejecuta un acoplamiento interno (`INNER JOIN`) síncrono entre la tabla histórica `PrecioPorCategoria` y los maestros de dominio `ModeloProducto` y `CategoriaCliente`. Al aplicar el filtro estricto sobre el atributo virtual computado `vigente = 1`, la consulta optimiza el uso del pool de conexiones retornando exclusivamente los estados comerciales activos, delegando el ordenamiento al motor relacional para aliviar el cómputo en la capa del cliente."

Con el propósito de suministrar la información requerida por las interfaces del módulo contable, se implementó el componente de persistencia `PriceCategory.js` bajo el patrón Data Access Object (DAO). Se estructuraron los métodos de consulta `findAllActive` y `findSuggestedPrice` utilizando sentencias SQL parametrizadas para mitigar vectores de Inyección SQL. El primer método consolida el catálogo activo cruzando la tabla asociativa con los maestros `ModeloProducto` y `CategoriaCliente` mediante un filtro síncrono sobre la restricción calculada `vigente = 1`. El segundo optimiza la búsqueda puntual en el punto de carga de órdenes de reparación, aislando el escalar del precio en base a las claves foráneas suministradas. 

Para que la lógica sea robusta y soportar el aislamiento transaccional en la capa de servicios (falla todo o se aplica todo), las funciones mutadoras deben aceptar un parámetro opcional de conexión (`connection`). Esto nos permitirá ejecutar las queries dentro del mismo contexto transaccional (`START TRANSACTION`). 

Para dotar al sistema de capacidades de mutación histórica alineadas con el paradigma Slowly Changing Dimensions (SCD Tipo 2), se desarrollaron los métodos de persistencia `invalidatePrice` e `insertPrice` mediante CommonJS. Ambas funciones admiten la inyección dinámica de una conexión del pool relacional, lo que permite delegar el control de la atomicidad, consistencia, aislamiento y durabilidad (propiedades ACID) a transacciones orquestadas desde la capa superior de lógica de negocio. El método de invalidación finaliza la ventana de vigencia cronológica del precio precedente, mientras que el método de inserción consolida el nuevo escalar monetario activo. 

Para implementar la **actualización transaccional**, importaremos el pool de conexiones (`db`) para obtener una conexión del set (`getConnection`) y controlar de forma manual la atomicidad mediante un bloque `try/catch`. Si la invalidación o la inserción fallan, ejecutaremos un `rollback` para proteger la base de datos de inconsistencias cronológicas. 

Para dar cumplimiento a las especificaciones comerciales del subsistema contable, se implementó el componente `price.service.js` encargado de centralizar las reglas de negocio del dominio. El método de mutación `updatePriceList` implementa un control explícito de transacciones mediante la obtención de un hilo exclusivo del pool relacional de conexiones. El flujo operacional garantiza la atomicidad bajo el principio ACID: se realiza la invalidación lógica de intervalos de vigencia anteriores mediante el método `invalidatePrice` del DAO, y de forma subsecuente se inserta el nuevo escalar monetario inmutable vía `insertPrice`. Cualquier interrupción en la secuencia de persistencia gatilla una reversión síncrona (`rollback`), impidiendo la corrupción o duplicidad de estados tarifarios activos para un mismo modelo y categoría. 

Para mitigar el riesgo de inconsistencias financieras derivado de interrupciones de red (parcialidad de datos) y evitar la sobrecarga del servidor mediante el antipatrón *Chatty API*, la actualización del catálogo de precios se diseñó bajo una estrategia de **Procesamiento por Lotes (Bulk Update)**. El frontend actúa como un acumulador de estado, consolidando las variaciones en un único Payload JSON. El backend procesa este arreglo de estructuras de datos encapsulando la iteración dentro de una **única transacción global**. Esta decisión arquitectónica asegura que las modificaciones operen de forma atómica: el lote completo es confirmado (`commit`) o, ante la presencia de un dato anómalo, es revertido en su totalidad (`rollback`), preservando el estado original del sistema. 

Para la exposición de las funcionalidades hacia las aplicaciones cliente, se diseñó e implementó la Capa de Presentación del backend utilizando el marco de trabajo Express.js. Se adoptó un diseño basado en arquitectura RESTful, estructurando los controladores bajo el principio de *Separation of Concerns*. El controlador asume la responsabilidad exclusiva de interceptar los objetos de petición y respuesta HTTP (`req` y `res`), extraer los parámetros del protocolo (Query Strings y JSON Payloads), e inyectarlos de manera agnóstica en la capa de Servicios. Asimismo, se implementó un mapeo semántico de excepciones de negocio hacia los códigos de estado estandarizados del protocolo HTTP (200 OK, 400 Bad Request, 404 Not Found y 500 Internal Server Error), dotando a la API de un comportamiento predictivo y robusto. 

En el marco del desarrollo de la interfaz de usuario para el subsistema administrativo, se implementó una vista de gestión centralizada basada en el patrón de **Matriz Dinámica**. Debido a la naturaleza cruzada de la información (Modelos vs. Categorías), se desestimó el uso de formularios convencionales por cada tarifa individual. En su lugar, el componente contenedor (`PriceMatrixPage`) procesa la estructura de datos relacional plana provista por la API REST y genera un *pivotaje* síncrono en memoria para alimentar una cuadrícula de datos. A nivel de usabilidad, se incorporó un mecanismo de **Tracking de Estado Local** que identifica las mutaciones transitorias en las celdas, proporcionando un *feedback* visual inmediato (cambio de contexto cromático) y consolidando las modificaciones en un único *Payload* transaccional, reduciendo drásticamente la latencia y la carga sobre el pool de conexiones del servidor.   
**Rendimiento en Grillas Extensas:** React renderizará un `input` por cada combinación (ej: 50 modelos x 4 categorías \= 200 inputs). Esto está perfecto para el alcance actual del taller. Sin embargo, si en el futuro el taller incorpora 2.000 modelos de válvulas, la renderización masiva en el DOM podría ralentizar la interfaz (el navegador se "trabará").  
**Mitigación Prevista:** Si se proyecta ese volumen, habría que paginar los modelos en la tabla, o implementar técnicas avanzadas de virtualización de listas (ej. `react-window`), aunque por la descripción del contexto actual (un taller Pyme), esto excede la complejidad necesaria de momento.

Para garantizar un bajo nivel de acoplamiento entre los componentes visuales y la infraestructura de red, se implementó el patrón *Proxy/Gateway* en la capa del cliente mediante el módulo `price.service.js`. Este artefacto encapsula las llamadas asíncronas a la API REST (mediante la API nativa `Fetch` de JavaScript) y centraliza la orquestación de parámetros, cabeceras HTTP y el manejo de excepciones de red. Al centralizar la resolución de URIs dinámicas y la inyección de la constante global del entorno, el código de los componentes visuales (como la grilla dinámica) queda libre de lógica de comunicación, respetando el Principio de Responsabilidad Única y facilitando el proceso de pruebas de interfaz.

*Refinamiento de UI/UX*   
Durante las etapas de validación de usabilidad de la interfaz de la Matriz de Precios, se detectó un riesgo de ambigüedad asociado a la nomenclatura exclusiva por modelo. Para mitigar la carga cognitiva del usuario administrativo y prevenir errores de imputación financiera, se aplicó un patrón de **Agrupación Jerárquica de Datos** en la grilla visual. A nivel de persistencia, se acopló la entidad `TipoProducto` en el grafo de consultas del DAO, permitiendo a la Capa de Presentación renderizar una columna consolidada de 'Descripción'. Esta columna expone la información apilada (Tipo como metadato primario y Modelo como entidad principal), garantizando una rápida lectura escaneable (*Scannability*) y elevando la robustez operativa del sistema. 

Para salvaguardar la integridad transaccional y mejorar la Experiencia de Usuario (UX) en la Matriz de Precios, se implementó una estrategia de **Validación en el Lado del Cliente (Client-Side Validation)** bajo el principio arquitectónico de *Fail-Fast* (Falla Rápida). Se sustituyeron los elementos de entrada nativos tipo numérico (`<input type="number">`) por entradas de texto con teclado decimal virtual (`inputMode="decimal"`), dado que el estándar HTML5 permite la inyección de caracteres alfabéticos específicos como la notación exponencial ('e'). La Capa de Presentación intercepta síncronamente cada evento de teclado evaluando la entrada mediante **Expresiones Regulares (RegEx)**. Ante la detección de una anomalía de tipado, el sistema altera adaptativamente el árbol de componentes (DOM) para advertir visualmente al usuario y bloquea la comunicación HTTP hacia el servidor hasta que el conflicto sea subsanado, reduciendo latencias y procesamiento infructuoso en el backend. 

Aseguramiento de Calidad" o "Pruebas de Software   
Para garantizar la fiabilidad del subsistema contable de Precios por Categoría, se instrumentó una suite automatizada fundamentada en el patrón de Pruebas Aisladas (Isolated Testing). En la Capa de Lógica de Negocio, se emplearon funciones simuladas (*Mocks*) de la librería Jest para auditar los hilos de ejecución transaccional. Esto permitió certificar matemáticamente que, ante la inserción de un escalar anómalo (como un precio negativo en un bloque de 50 actualizaciones), el servicio invoca determinísticamente la operación `rollback`, preservando las propiedades ACID del motor relacional. Complementariamente, se aplicaron pruebas de integración (*Black-Box*) sobre la capa de controladores mediante el framework Supertest, validando la semántica de la API REST, la obligatoriedad de parámetros y la correcta emisión de códigos de estado HTTP frente a diferentes vectores de error.

# **Desglose de tareas para comprobantes de recepción \- 24/06/2026**

**Planificación del Proyecto y Metodologías de Desarrollo**,  
Con el propósito de mitigar los desvíos en el alcance funcional y garantizar la trazabilidad operacional de la iteración, se aplicó una descomposición modular orientada a requerimientos individuales en lugar de agrupaciones por capas horizontales de infraestructura. Este enfoque metodológico de desglose atómico vertical asegura que cada requerimiento cumpla de manera independiente con el criterio 'Definition of Done' establecido por el equipo, permitiendo evaluar de forma aislada la consistencia transaccional y la cohesión de los componentes de la arquitectura de tres capas ante cambios imprevistos en las reglas del negocio de la organización." 

*Persistencia e Integridad de Datos*:

> *"Para la persistencia de los registros administrativos asociados al ingreso de componentes en el taller (REQ 21), se diseñó un esquema relacional con restricciones de clave foránea que implementan políticas de aislamiento de tipo `ON DELETE RESTRICT`. Esto imposibilita la remoción física de un registro de cliente que cuente con comprobantes de recepción activos en el sistema. Los componentes lógicos del Modelo de Datos (DAO) fueron desacoplados del control de flujo transaccional a través de la inyección explícita del contexto de conexión (Connection Injection), permitiendo que la Capa de Lógica de Negocio agrupe de forma atómica y bajo condiciones ACID múltiples sentencias de actualización sobre la base de datos MySQL."*

inserción masiva de productos a un comprobante de recepción  
Para optimizar el rendimiento de la capa de datos y reducir los accesos redundantes al motor de persistencia (I/O Bottlenecks), se implementó un patrón de Inserción Masiva (Bulk Insert) en la entidad Producto. Al centralizar la creación del comprobante administrativo y el alta de sus componentes lógicos en un único lote atómico de ejecución, se minimiza la sobrecarga de red en el protocolo de comunicación de la base de datos y se asegura que ningún producto pueda existir de forma huérfana en el sistema sin su correspondiente documento de respaldo legal. 

Servicio de creación de comprobantes de recepción  
**Validación Preventiva de Negocio:** El servicio debe cerciorarse de que el payload traiga al menos un producto válido y que el cliente exista antes de abrir la transacción, optimizando el uso de recursos del motor MySQL. 

*Diseño Lógico \- Transaccionalidad y Robustez*:   
La capa de lógica de negocio del sistema implementa un control transaccional explícito basado en el principio de aislamiento y atomicidad de las operaciones críticas. La función `registerReceiptWithProducts` actúa como un orquestador que unifica el ciclo de persistencia de las solicitudes administrativas de ingreso. Mediante el uso de primitivas de control nativas (`beginTransaction`, `commit`, y `rollback`), el servicio garantiza el estado de consistencia global del sistema; si la inserción masiva de productos (válvulas) falla debido a restricciones de integridad o problemas sintácticos, el encabezado del comprobante previamente instanciado es descartado de forma automática por el motor de base de datos. Esta arquitectura de software previene la persistencia de registros inconsistentes o estados transaccionales huérfanos. 

**Inyección de Atributos No Deseados (Mass Assignment):** Un error común de Clean Code es pasar directamente el objeto `req.body` al servicio. Esto vulnera el sistema si un usuario malintencionado inyecta parámetros que el backend procesa a ciegas. Es mandatorio desestructurar de forma explícita solo los campos autorizados. 

Se optó por delegar la persistencia de los productos al DAO especializado `Product`, implementando un patrón de Inyección de Conexión (Connection Injection). Aunque las inserciones por lote (Bulk Inserts) reducen marginalmente las peticiones al motor, introducen un alto acoplamiento y duplican la lógica de esquema. Al resolver las inserciones concurrentemente mediante promesas asíncronas controladas dentro del mismo hilo transaccional del servicio, se prioriza el Principio de Responsabilidad Única (SRP) y la mantenibilidad ante evoluciones del modelo de dominio, garantizando al mismo tiempo la atomicidad de la operación. 

*Capa de Exposición y Controladores de Interfaz*:

> *"Para la comunicación asíncrona entre las terminales de presentación y el núcleo del servidor, se adoptó el modelo de madurez de Richardson para servicios REST. La capa de exposición implementa middlewares de interceptación pre-vuelo (Pre-flight Validation Middlewares), encargados de auditar la corrección sintáctica de las tramas JSON entrantes de manera previa a su procesamiento en las capas inferiores. Este esquema de diseño arquitectónico no solo descentraliza y aisla las validaciones de formato de las reglas lógicas propias del negocio, sino que protege de forma defensiva la asignación masiva de variables hacia el motor de base de datos MySQL, optimizando el rendimiento operativo ante payloads maliciosos o mal estructurados."*

*Patrones de Diseño Arquitectónico en Capa de Presentación*:

> *"Para maximizar la usabilidad del sistema y reducir la carga cognitiva del operario durante el alta masiva de componentes, se aplicó un patrón de Enriquecimiento de Datos en el Cliente (Client-Side Data Enrichment). Al desacoplar la representación visual de la UI de las restricciones estructurales de la base de datos MySQL —donde el atributo Tipo fue removido para adherirse a la tercera forma normal (3FN)— el frontend asocia en tiempo de ejecución los catálogos en memoria para consolidar un campo calculado bidimensional denominado 'Descripción Válvula'. Este enfoque garantiza la Separation of Concerns (Separación de Intereses), posibilitando una experiencia de usuario altamente descriptiva sin degradar los contratos de la API ni persistir redundancias lógicas en el servidor."*

*Estrategia de Verificación y Validación de Software (V\&V)*:

> *"Para certificar el correcto funcionamiento de las transacciones asociadas al Módulo Administrativo (REQ 21), se implementó un marco de pruebas automatizado bifásico utilizando la biblioteca Jest. En primera instancia, se desarrollaron pruebas unitarias con técnicas de aislamiento lógico (Mocking), cuyo objetivo es inducir fallas de persistencia artificiales en la capa de datos. Esto permitió comprobar que el manejador de excepciones del servicio ejecute de forma sistemática el descarte físico de los cambios mediante primitivas 'Rollback', impidiendo la deriva de datos en el motor MySQL. En segunda instancia, las pruebas de integración black-box mediante Supertest validaron los contratos de la interfaz REST y el comportamiento defensivo de los middlewares de validación estructural, garantizando la robustez sintáctica de la API ante payloads incompletos o maliciosos."*

*Arquitectura de Red y Protocolo de Comunicación*   
Para la resolución de consultas dinámicas sobre el repositorio de remitos (REQ 22), se diseñó un mecanismo de parametrización basado en cadenas de consulta (Query Strings) serializadas de forma dinámica en el cliente. La interfaz cliente encapsula la lógica de sanitización sintáctica, purgando cadenas vacías y caracteres redundantes antes de su transmisión sobre el protocolo HTTP. Este diseño garantiza que el backend reciba estructuras de filtrado altamente cohesivas, permitiendo la generación dinámica de cláusulas complejas en la capa de datos sin alterar la naturaleza sin estado (Stateless) de la API REST. 

*Controladores y Contratos de Exposición de Servicios*:   
La capa de exposición implementa endpoints de lectura idempotentes mapeados bajo el verbo semántico `GET`. El controlador especializado procesa de forma agnóstica los metadatos de transporte incrustados en la URI del protocolo HTTP (`Query Strings`), aplicando técnicas de conversión explícita de tipos (Type Casting) para normalizar valores alfanuméricos y escalares enteros. Este desacoplamiento sintáctico asegura que las entradas de usuario sean sanitizadas antes de transferir el contexto de ejecución a la capa de lógica de negocio, blindando al sistema contra errores de conversión en tiempo de ejecución en el motor relacional y cumpliendo con el principio arquitectónico de menor privilegio. 

*Metodologías de Diseño \- Capa de Abstracción de Negocio*   
Para la resolución del requerimiento de auditoría y consulta de remitos (REQ 22), la Capa de Lógica de Negocio implementa un componente de normalización sintáctica y sanitización de consultas. Mediante la adopción de una política de 'Listas Blancas' (Whitelisting), el servicio intercepta las opciones de ordenamiento y direccionamiento de flujos solicitadas por el cliente de presentación antes de su traslación a sentencias SQL. Aquellos parámetros que no se correspondan estrictamente con las variables operativas permitidas del modelo de dominio son descartados de forma preventiva y sustituidos por los criterios deterministas por defecto del taller (`fecha_recepcion DESC`). Este enfoque arquitectónico garantiza el aislamiento de fallos, la inmutabilidad sintáctica de la base de datos MySQL y la predictibilidad del rendimiento ante peticiones concurrentes. 

Para optimizar la ergonomía de la interfaz de consulta de comprobantes, se implementó un mecanismo de ordenamiento dinámico bidireccional (Bidirectional Sorting). La capa de presentación gestiona el estado de ordenamiento delegando la resolución algorítmica al motor de base de datos a través de parámetros de consulta (Query Params). Este enfoque mantiene el frontend ligero y delega el esfuerzo de ordenamiento (Sorting Overhead) a la optimización de índices B-Tree nativos de MySQL, garantizando el cumplimiento estricto del Principio de Responsabilidad Única (SRP) entre el cliente y el servidor. 

Para satisfacer el requerimiento de generación de comprobantes impresos (REQ 23), se optó por un enfoque basado en directivas CSS @media print anidadas directamente en el framework TailwindCSS (clases `print:`). Esta decisión arquitectónica evita el sobre-procesamiento en el lado del servidor (Server-Side Rendering) asociado a la generación de archivos PDF dinámicos. Al unificar la vista de detalle y la plantilla de impresión en un único componente React, se garantiza el principio DRY (Don't Repeat Yourself), reduciendo la deuda técnica y delegando el motor de renderizado de impresión de manera nativa y eficiente al navegador web del cliente. 

*Patrones de Acceso a Datos e Integridad Transaccional*:

> *"Para satisfacer los requerimientos de consulta detallada y modificación restringida (REQ 23 y 24), se implementó un Data Access Object (DAO) asimétrico. La operación de recuperación (`getReceiptById`) adopta un patrón de ensamblaje en memoria, despachando subconsultas en paralelo (Concurrent Data Fetching) hacia la base de datos MySQL, lo cual evita la redundancia algorítmica de procesar JOINs cartesianos masivos. Por su parte, la operación de actualización (`updateReceipt`) implementa el principio de privilegio mínimo de seguridad (Principle of Least Privilege), restringiendo la mutabilidad de la tupla exclusivamente a metadatos informativos (fecha y observaciones) y bloqueando estructuralmente cualquier alteración a las claves foráneas de dependencias contables."*

*Diseño de Lógica de Dominio y Restricciones de Integridad*   
Para satisfacer los requerimientos de modificación administrativa (REQ 24), se instrumentó un patrón de control de inmutabilidad estado-dependiente en la capa de Servicios. Previo a la delegación de las operaciones DML (Data Manipulation Language) al motor de base de datos, el servicio orquestador inspecciona el grafo de objetos subordinados (las entidades Producto). Si se detecta una divergencia respecto al estado operativo inicial ('Recibido'), el componente aborta la solicitud y eleva una excepción tipificada como 'Conflicto Operacional' (HTTP 409). Este nivel de abstracción asegura que las reglas de inmutabilidad contable residan exclusivamente en el núcleo del negocio y no dependan de validaciones endebles en las terminales de interfaz de usuario. 

Diseño de APIs REST y Manejo de Excepciones   
El sistema implementa una arquitectura de comunicación basada en la semántica de códigos de estado HTTP para el manejo de excepciones de dominio. Específicamente, se ha configurado el uso del código `409 Conflict` para señalar escenarios donde una operación de modificación (REQ 24\) contraviene las reglas de integridad de la máquina de estados. Al desacoplar la detección del conflicto (Capa de Servicio) de la notificación al usuario (Capa de Presentación/UI), se logra un diseño robusto que permite al cliente reaccionar ante bloqueos administrativos, proporcionando una realimentación transparente y contextualizada para el operador, sin comprometer la consistencia transaccional del backend. 

Para la implementación del módulo de edición y auditoría (REQ 24), se optó por un enfoque de **Formulario Controlado (Controlled Components)**, asegurando que el estado de React sea siempre la única fuente de verdad. La validación de integridad referencial es delegada a la capa de servicio (Backend), la cual evalúa el estado del grafo de productos antes de autorizar cualquier mutación en los metadatos del comprobante. Finalmente, la funcionalidad de impresión (REQ 23\) fue resuelta mediante **CSS Media Queries (`@media print`)**, permitiendo generar documentos formales sin la carga computacional asociada a la generación de archivos binarios (PDF) en el servidor, optimizando así los recursos del sistema. 

* **"Cierre transaccional de documento"**.

> *"Para garantizar la integridad y trazabilidad de los documentos emitidos (REQ 23), se implementó un flujo de 'Impresión Transaccional'. Este patrón asegura que la acción de imprimir esté condicionada a la persistencia exitosa del estado actual del comprobante. Al centralizar la validación, persistencia y visualización en un flujo de ejecución atómico, se elimina la brecha de sincronización entre el estado lógico del sistema y el documento físico, cumpliendo así con las exigencias de auditoría administrativa."*

# 

# **Desglose de tareas Ordenes de reparación \- 01/07/2026**

**Análisis de Reglas de Negocio**:

> *"Durante el relevamiento y diseño del Módulo Administrativo, se identificó una regla de negocio tácita respecto a la semántica de las 'Órdenes de Reparación'. A diferencia de modelos estándar, en el flujo operativo del taller estas órdenes actúan funcionalmente como remitos de trabajo finalizado. Por consiguiente, se definió arquitectónicamente que la creación de una orden gatille una transición automática en la máquina de estados de los productos vinculados, pasándolos a estado 'Reparado' o 'No Reparable', y consolidando su precio final en la entidad Producto para garantizar consistencia contable histórica."*

Con el propósito de mitigar la complejidad accidental durante la primera fase de implementación del Módulo Administrativo, se aplicó un enfoque de alcance iterativo e incremental. Se desvinculó temporalmente la gestión de inventario de repuestos del flujo de creación de Órdenes de Reparación. Arquitectónicamente, se introdujo una entidad normalizada (`EstadoOrdenReparacion`) para gestionar el ciclo de vida documental del remito ('Abierta', 'Cerrada'). Las reglas de negocio, alojadas en la capa de servicios (`repairOrder.service.js`), garantizan el principio de inmutabilidad: la transición de una orden al estado 'Cerrada' sella criptográficamente su estructura, impidiendo operaciones de mutación (`UPDATE`) posteriores y consolidando los estados individuales de las válvulas vinculadas. 

Para la resolución del cálculo de cotizaciones en la vista de Órdenes de Reparación, se aplicó el patrón de diseño **Data Transfer Object (DTO)** en conjunción con una consulta consolidada en la capa de persistencia. En lugar de delegar la resolución de precios al cliente web (lo que implicaría múltiples peticiones y exposición de reglas comerciales), el backend resuelve el cruce relacional entre 'Producto', 'ModeloProducto', 'TipoProducto', 'Cliente' y 'PrecioPorCategoria'. Esto garantiza que el frontend reciba un objeto aplanado, con la información descriptiva completa y el precio sugerido exacto según la categoría del cliente logrando una separación de responsabilidades (Separation of Concerns) óptima y protegiendo la integridad comercial del taller. 

Para garantizar la consistencia en el Módulo Administrativo durante la emisión de Órdenes de Reparación, la capa de acceso a datos (DAO) fue diseñada aplicando el patrón **Unit of Work** mediante el uso de transacciones explícitas en MySQL (ACID). Se implementó un control de flujo riguroso (`BEGIN`, `COMMIT`, `ROLLBACK`) que agrupa lógicamente la inserción de la entidad 'OrdenReparacion' con la mutación masiva de estados y precios en la entidad 'Producto'. Este diseño previene anomalías de datos (como órdenes huérfanas o actualizaciones parciales de inventario) frente a caídas de red o fallos de validación, liberando sistemáticamente las conexiones al pool para prevenir escenarios de inanición de recursos (Connection Leaks). 

Durante la implementación del motor transaccional para la generación de Órdenes de Reparación, se identificó un anti-patrón de acoplamiento si el Modelo de la Orden manipulaba directamente la entidad Producto. Para preservar el Principio de Responsabilidad Única (SRP) y mantener la cohesión del dominio, se re-arquitecturó la solución aplicando Inyección de Dependencias. La capa de Servicios (Business Logic) asume el rol de orquestador (Unit of Work), abriendo la transacción SQL y propagando el objeto de conexión hacia los DAOs involucrados (`RepairOrder.create` y `Product.updateForRepairOrder`). Esto garantiza operaciones ACID sin contaminar los límites lógicos de cada entidad de la base de datos.

diseño de la API REST:

> *"Para la exposición de las funcionalidades del Módulo Administrativo, se implementó un patrón de diseño **Controller-Service**. El `RepairOrderController` asume la responsabilidad exclusiva del manejo del protocolo HTTP (parsing del body, validación primaria o 'Fail-Fast', y mapeo de códigos de estado como 201 Created o 400 Bad Request). Esta abstracción aísla la lógica de red de las reglas de negocio, permitiendo que la API REST actúe únicamente como una interfaz de integración (Gateway) predecible y estandarizada para el cliente web o futuros consumidores."*

Para la resolución de precios en la interfaz de Órdenes de Reparación, se evaluaron dos estrategias de acceso a datos: Lazy Loading (Carga Diferida por evento) y Eager Loading (Carga Temprana en lote). Se optó arquitectónicamente por el **Eager Loading mediante una consulta maestra consolidada**. Aunque esto implica una leve sobre-obtención de datos (Over-fetching) al calcular precios de productos que quizás no sean seleccionados, mitiga por completo el anti-patrón **N+1 Queries** a nivel de red. Al resolver el cruce de 'PrecioPorCategoria' en una única transacción de lectura (JOIN) en MySQL, se minimizó la latencia HTTP y se garantizó una experiencia de usuario (UX) asíncrona e ininterrumpida en la Single Page Application (React), delegando la responsabilidad del cálculo de subtotales al estado derivado del cliente web. 

Para la hidratación de datos en la interfaz de creación de Órdenes de Reparación, se evaluó la viabilidad de reutilizar flujos de consulta existentes y realizar la consolidación de datos (JOINs lógicos) en la capa de Servicios de Node.js o en el cliente (React). Sin embargo, bajo el principio de eficiencia computacional y Separación de Responsabilidades (Separation of Concerns), se optó por diseñar un flujo de lectura específico (Read Model). Se delegó el cruce relacional entre Productos, Modelos y Precios Históricos exclusivamente al motor de base de datos (MySQL), evitando el anti-patrón de 'In-Memory Joins'. Esta decisión garantiza que la capa de presentación reciba un Data Transfer Object (DTO) optimizado, reduciendo la latencia de red y el consumo de memoria en el servidor de aplicaciones. 

Para la comunicación entre capas, se implementó el patrón **Service-Consumer**. La capa de exposición (Backend) expone un endpoint RESTful `/api/repair-orders/products-by-client/:id_cliente`, el cual actúa como fachada hacia el motor de base de datos. En el cliente, se desarrolló un servicio de integración (`repairOrder.service.js`) que encapsula la lógica de comunicación asíncrona mediante el API Fetch. Esta modularización garantiza que el componente de interfaz de usuario (`CreateRepairOrderPage.jsx`) sea agnóstico respecto a la infraestructura de red, recibiendo únicamente un objeto JSON transformado, facilitando tanto el testing unitario de la interfaz como el mantenimiento de los endpoints de la API. 

interfaces:  
Bajo el concepto de **Diseño Web Defensivo**, se integró un patrón de desacoplamiento de confirmación asíncrona mediante el componente `ConfirmationModal`. El objetivo de este diseño en la interfaz es mitigar el riesgo operativo ante acciones críticas y transiciones de estado irreversibles en la máquina de estados del negocio (como el sellado inmutable de un remito mediante 'Guardar y Cerrar'). Al interceptar el evento click mediante un estado controlado en React e interponer una barrera de confirmación con difuminado de fondo (`backdrop-blur`), se protege la integridad referencial histórica del sistema y se reduce la probabilidad de error humano por fatiga o distracción del operador. 

Estrategia de Aseguramiento de Calidad (QA)   
*Para garantizar la fiabilidad del Módulo Administrativo, y específicamente en el proceso crítico de creación de Órdenes de Reparación, se aplicó una estrategia de **Testing Piramidal** automatizado.* \> *A nivel Unitario (Jest), se aislaron las dependencias del motor de persistencia mediante **Mocks**, lo que permitió validar exhaustivamente la lógica de orquestación, el cálculo de importes y, primordialmente, el mecanismo de control de transacciones (Unit of Work), asegurando la invocación del comando ROLLBACK frente a excepciones simuladas.* *Complementariamente, a nivel de Integración (Supertest), se validó el flujo end-to-end (Controlador \$\\to\$ Servicio \$\\to\$ Base de Datos), operando sobre un esquema efímero MySQL aislado (NODE\_ENV=test). Estos tests certificaron el cumplimiento de las restricciones ACID, comprobando empíricamente que la mutación de estado de múltiples productos ocurre de manera indivisible respecto a la creación del documento comercial* 

# **Refactorización de ordenes de reparación \- 25/27/2026**

### **Homogeneización de la Capa de Lógica de Negocio**

**Sección Sugerida:** Arquitectura de Software \> Lógica de Negocio \> Estandarización de Servicios

**Redacción Académica:** *"En el marco de la evolución arquitectónica del sistema, se estableció un patrón de diseño homogéneo para la Capa de Lógica de Negocio (Services), garantizando la consistencia en el procesamiento de peticiones y la validación de entrada a lo largo de todos los módulos. Particularmente en el caso de la consulta de Órdenes de Reparación, se replicó la estructura de validación de listas blancas (Whitelisting) y desestructuración con valores por defecto utilizada en la gestión de comprobantes.*

*Esta decisión arquitectónica responde a los principios de Clean Code y al aislamiento de responsabilidades. Al delegar la sanitización de los parámetros dinámicos de ordenamiento (`sort_by`, `sort_order`) estrictamente a la capa de servicio, se previene de manera proactiva la inyección SQL en la capa de datos subyacente. Adicionalmente, el encapsulamiento del llamado al Modelo mediante bloques de control de excepciones (`try/catch`) permite una trazabilidad clara y una propagación limpia de los errores hacia la capa de presentación (Controladores REST), sin exponer la complejidad de la persistencia de datos."*

Arquitectura de Software \> Controladores REST \> Gestión de Órdenes de Reparación

**Redacción Académica:** *"Para la exposición de las funcionalidades de consulta, se diseñó un controlador REST que actúa como adaptador de protocolo (Facade) entre las peticiones HTTP entrantes y la Capa de Lógica de Negocio. El controlador `getRepairOrders` se responsabiliza exclusivamente de la extracción del objeto `req.query`, delegando el procesamiento algorítmico, las validaciones de seguridad y el acceso a datos al servicio correspondiente.* *El manejo de respuestas se estructuró de manera semántica. Las resoluciones exitosas retornan un código de estado HTTP 200 (OK) encapsulando los resultados en una estructura JSON uniforme. En contraparte, se implementó un bloque de intercepción de excepciones (`try/catch`) que actúa como barrera de seguridad: ante un fallo en las capas inferiores, el controlador emite un log interno para auditoría y retorna un código HTTP 500 (Internal Server Error) con un mensaje genérico, garantizando que no se expongan metadatos sensibles ni trazas de la infraestructura de base de datos hacia el cliente frontend (Principio de Ocultación de Información)."*

Arquitectura de Software \> Lógica de Negocio \> Saneamiento de Entradas

*"Con el objetivo de reducir la carga cognitiva del usuario y mejorar la usabilidad del sistema, se detectó la necesidad de flexibilizar los motores de búsqueda de entidades transaccionales. Dado que los identificadores de orden se almacenan como tipos de datos numéricos (Integer) pero el usuario tiende a utilizar notaciones con ceros a la izquierda, se implementó un middleware de saneamiento en la capa de Servicios. Mediante el uso de Expresiones Regulares (Regex), el sistema pre-procesa el término de búsqueda para normalizarlo a su valor escalar base antes de delegar la consulta a la capa de persistencia, garantizando así la coherencia entre el modelo mental del usuario y el modelo relacional de la base de datos."*

"Para la gestión y evolución del módulo administrativo, se adoptó un enfoque de diseño incremental basado en la separación de responsabilidades. Como paso previo a la implementación de los mecanismos de exportación formal (remitos imprimibles) y de mutación controlada de datos, se consolidó un DTO (Data Transfer Object) de consulta unificada en la capa de servicios. Esta abstracción permite estructurar y agrupar la información relacional de las órdenes de reparación en el servidor, blindando a la capa de presentación de lógica de procesamiento innecesaria y garantizando la integridad transaccional frente a modificaciones concurrentes o sobre entidades con estados terminales (órdenes cerradas)." 

Patrón DTO (Data Transfer Object) e Hidratación: La base de datos, por su naturaleza relacional tabular, devolverá algo similar a N filas si la orden tiene N válvulas. El servicio asume la responsabilidad de aplicar el patrón Data Mapper, tomando la fila \[0\] para ensamblar el nodo raíz (Orden y Cliente) y aplicando una función .map() sobre todo el arreglo para conformar el sub-nodo productos.

Aislamiento de la UI: Gracias a esta transformación en el backend, el frontend no tiene que lidiar con la redundancia de datos (ej. recibir el nombre del cliente 5 veces si hay 5 productos).

Manejo de Errores Semántico: Si la base de datos retorna un arreglo vacío (la orden no existe), el servicio detiene la ejecución inmediatamente (Fail-Fast) e inyecta un código 404 Not Found en la excepción. Esto se alinea perfectamente con el bloque try/catch que programamos en tu RepairOrderController, permitiendo que Express responda con el código HTTP adecuado de manera automática.

Casteo Seguro (Type Safety): Se envuelven las variables monetarias con Number(header.importe\_total) para garantizar que el motor V8 de Node.js no interprete los tipos DECIMAL de MySQL como Strings al momento de serializarlos a JSON, previniendo errores de cálculo en el frontend.

"Para optimizar la recuperación de estructuras de datos compuestas (Maestro-Detalle) en la entidad Orden de Reparación, se implementó un patrón de acceso a datos de múltiples hilos en la capa DAO. Mediante el uso de `Promise.all`, el modelo ejecuta consultas SQL paralelas para extraer la cabecera (Orden y Cliente) y los registros subordinados (Productos vinculados). Esta estrategia mitiga el problema N+1 y evita el sobredimensionamiento del ancho de banda local causado por las redundancias de los clásicos multi-JOIN escalonados, permitiendo que la persistencia devuelva un objeto estructurado pre-consolidado a la capa de Lógica de Negocio." 

esfuerzo en las pruebas del DTO:

> *"Para asegurar la integridad del contrato de datos en la consulta de detalle (Requerimiento 27), se implementaron pruebas unitarias orientadas a certificar el comportamiento del patrón Data Mapper en la capa de Servicios. Estas pruebas garantizan el aislamiento estructural frente a mutaciones del motor MySQL, verificando rigurosamente el 'Type Safety' (casteo de variables de punto flotante a Number) para prevenir fallos matemáticos silenciosos en el Frontend. Conjuntamente, los tests de integración mediante Supertest validaron los escudos defensivos del controlador frente a parámetros inválidos (Fail-Fast), asegurando una API predecible y resiliente."*

# **Planificación de requerimiento de reparaciones \- 21/08/2026**

Para satisfacer la mutación transaccional de las Órdenes de Reparación, se aplicó un patrón de diseño declarativo en la sincronización de entidades. La capa de presentación (Frontend) se exime de calcular los deltas de modificación, transmitiendo únicamente la "fotografía final" del estado deseado de la orden. La Capa de Servicios (Backend) asume la responsabilidad algorítmica de computar las diferencias, orquestando las operaciones de vinculación y desvinculación de productos (válvulas) dentro de un bloque transaccional ACID (Atomic, Consistent, Isolated, Durable) para preservar la integridad del inventario. Además, se implementó una barrera de guarda (Guard Clause) a nivel de servicio para garantizar la inmutabilidad de los registros históricos, abortando cualquier intento de mutación sobre órdenes cuyo ciclo de vida ha sido marcado como 'Cerrada'. 

**Análisis de Reglas de Negocio: Sincronización del Autómata de Estados con la Logística Física**

"Durante el refinamiento iterativo del Requerimiento 28 (Modificación de órdenes de reparación), se identificó la necesidad de sincronizar la máquina de estados lógica del software con la distribución espacial y logística física del taller SERVICIOS NEUMATICOS. Inicialmente, el sistema contemplaba una reversión estricta al estado 'Recibido' ante la desvinculación administrativa de una válvula asociada a una orden abierta.

No obstante, tras un análisis de fidelidad operativa y procesos de dominio, se determinó que los trabajos técnicos ejecutados sobre el producto son invariables a nivel físico, implicando además el traslado físico del componente reparado hacia áreas de almacenamiento diferenciadas dentro de la planta funcional. Por consiguiente, se redefinió la regla de negocio para garantizar que, ante una desvinculación documental, la entidad 'Producto' preserve su estado transicional de 'Reparado'.

A nivel de acceso a datos (DAO), esta adaptación lógica requirió una refactorización de los criterios de filtrado de inventario. La consulta SQL que provee los productos elegibles para nuevas asignaciones fue expandida para admitir no solo los estados iniciales ('Recibido' y 'Libre'), sino también el estado 'Reparado'. Esta evolución en la arquitectura de dominio asegura una trazabilidad sistémica coherente, eliminando fricciones operativas entre el modelo relacional y la realidad empírica de las operaciones del taller."

# 

# **Planificación y desglose de Módulo Contable \- 03/09/2026**

Gestión de Riesgos y Advertencias de Arquitectura:

1\. \*\*Afectación Prematura de Saldo (Riesgo de Consistencia Contable):\*\* Un pago recién registrado no debe consolidar saldo de forma irreversible sin validar su estado inicial. Si el pago se genera como "Borrador" o "Pendiente de acreditación", la capa de servicios debe aislarlo del balance computable para evitar saldos distorsionados en la cuenta corriente del cliente.

2\. \*\*Dependencia de Transaccionalidad en Métodos de Pago Diferidos:\*\* Si a futuro el registro del pago dispara la emisión simultánea de un recibo o la afectación de documentos, el método del modelo debe conservar la capacidad de recibir un objeto \`connection\` externo para no comprometer la atomicidad relacional en MySQL.

Diseño e Implementación de la Capa Transaccional:

"En el marco del Módulo Administrativo y Contable, la implementación del registro de pagos (Requerimiento 31\) se estructuró bajo el principio de separación estricta de responsabilidades (SoC). La capa de acceso a datos fue diseñada para soportar transacciones atómicas desacopladas mediante la inyección explícita del contexto de conexión relacional en MySQL, garantizando el cumplimiento de las propiedades ACID frente a operaciones concurrentes. Asimismo, la capa de lógica de negocio centraliza las invariantes de dominio —tales como la validación de montos positivos y la verificación de integridad referencial del cliente— de manera previa a la persistencia. Esta disposición arquitectónica mitiga la proliferación de datos anómalos y asegura que el sistema exponga hacia el cliente una interfaz uniforme y predecible a través de una API RESTful estandarizada."

##### **Gestión de Riesgos y Advertencias de Arquitectura**

1. **Acoplamiento por Identificadores Fijos (Hardcoding):** Evitar quemar IDs numéricos de estado en el código JavaScript. Es recomendable definir un diccionario o enumerador centralizado de constantes referenciando los nombres o claves semánticas de los estados para prevenir discrepancias si los índices primarios difieren entre entornos de desarrollo y producción.  
2. **Impacto en Saldos de Medios Diferidos:** Un medio diferido con cheque emitido no constituye fondos acreditados. La arquitectura contable debe garantizar que el estado "Pendiente de acreditación" no sea interceptado erróneamente por las consultas de agregación de balances contables hasta tanto se ejecute su acreditación efectiva.

**Parametrización Global y Modelado del Ciclo de Vida Transaccional**:

> "En la modelización de los flujos contables (Requerimiento 32.1), se adoptó una arquitectura relacional normalizada para segregar los catálogos maestros de estados y medios de liquidación financiera. Esta estrategia separa las definiciones operativas de las entidades transaccionales de cobro, dotando a la aplicación de un autómata finito de control de estados predecible y extensible. La tipificación explícita de los instrumentos de cobro mediante el atributo binario de diferimiento (es\_diferido) permite que la capa de negocio ejecute validaciones deterministas antes de autorizar la persistencia, impidiendo la consolidación prematura de fondos y salvaguardando la fidelidad del balance contable del cliente. En la capa de presentación, el desacoplamiento se preserva mediante el consumo asíncrono de catálogos y la representación de invariantes visuales a través de componentes atómicos estilizados, unificando la experiencia de usuario bajo los lineamientos de diseño corporativo."

**Diseño y Optimización de la Capa de Consultas Transaccionales**:

> "El diseño del componente de consulta y auditoría de pagos (Requerimiento 31.1) se fundamentó en el desacoplamiento estricto entre la parametrización de búsqueda y la ejecución física en base de datos. Se implementó un patrón de consulta dinámica estructurada sobre MySQL mediante el uso de sentencias preparadas parametrizadas en la Capa de Datos, mitigando vulnerabilidades de inyección SQL y garantizando un ensamblado predecible del predicado lógico según los criterios demandados por el usuario. La Capa de Servicios centraliza la normalización y sanitización de los parámetros de consulta (*Query Parameters*), actuando como barrera de integridad sintáctica y transformando las tuplas relacionales en Data Transfer Objects (DTO) semánticamente enriquecidos. En la Capa de Presentación, la interfaz reactiva desarrollada en React.js adopta mecanismos de enlace bidireccional y temporización de entradas (*debouncing*), reduciendo la sobrecarga de peticiones HTTP concurrentes hacia el servidor y optimizando la experiencia del operador contable."

**Políticas de Inmutabilidad y Control de Transacciones Contables**:

> "En la gestión de egresos e ingresos financieros (Requerimiento 32), se formalizó una política de inmutabilidad basada en estados para preservar la consistencia del libro mayor contable. Los pagos registrados bajo la categoría operativa de 'Borrador' actúan como transacciones provisionales mutables, permitiendo ajustes sintácticos o su descarte sin impacto financiero. No obstante, una vez que el pago alcanza el estado 'Aceptado', el sistema adopta una estrategia defensiva: la capa de lógica de negocio intercepta cualquier petición de mutación o eliminación mediante cláusulas de guarda (*Fail-Fast*), arrojando excepciones semánticas que impiden la alteración de comprobantes firmes. Esta directriz protege la trazabilidad de las auditorías contables, desacopla la presentación de la validación crítica de negocio y garantiza la correspondencia unívoca entre los comprobantes administrativos y los saldos reales de los clientes en la base de datos relacional MySQL."

**Modelado de Máquinas de Estado Transaccionales y Procesos Asíncronos de Cobro**:

> "En el dominio contable del sistema, los instrumentos de pago diferidos introducen una latencia temporal intrínseca entre la recepción documental y la liquidación efectiva de fondos. Para dar soporte a este ciclo (Requerimiento 32.2), se implementó un autómata finito de control de estados en la Capa de Lógica de Negocio, el cual restringe determinísticamente las trayectorias de transición admitidas. Un pago catalogado como 'Pendiente de acreditación' únicamente puede evolucionar hacia dos estados terminales disjuntos: 'Aceptado', formalizando el ingreso de fondos, o 'Rechazado', evidenciando el rebote del instrumento de cobro sin impacto contable. La arquitectura delega el control de estas mutaciones en un endpoint semántico bajo el verbo HTTP PATCH, aplicando cláusulas de guarda (*Fail-Fast*) y sentencias SQL condicionales a nivel de persistencia. Este enfoque previene condiciones de carrera en entornos concurrentes y garantiza el principio de inmutabilidad sobre comprobantes firmes, preservando la fidelidad del saldo de los clientes en la base de datos relacional MySQL."

**Patrones de Persistencia y Consistencia en Arquitecturas Contables**:

> "En la concepción del subsistema de cuenta corriente (Requerimiento 33), se priorizó el principio de 'Única Fuente de Verdad' (Single Source of Truth) frente a enfoques tradicionales basados en tablas físicas de saldos acumulativos o triggers de sincronización mutua. El almacenamiento de balances calculados en columnas estáticas introduce vulnerabilidades de acoplamiento y riesgos de desincronización transaccional ante modificaciones o anulaciones de comprobantes. Para sortear esta problemática, se implementó una abstracción declarativa en el motor relacional MySQL mediante una vista SQL (`MovimientoCuenta`) estructurada sobre una operación de unión (`UNION ALL`) entre las entidades maestras `OrdenReparacion` y `Pago`. Esta técnica delega el cómputo de saldo a una proyección dinámica en tiempo de consulta, incorporando la columna derivada `computa_saldo` para discriminar el impacto contable según el estado operativo de cada documento. Desde el punto de vista arquitectónico, esta estrategia asegura el cumplimiento de las propiedades ACID sin incurrir en redundancia de datos ni penalizaciones por bloqueos en concurrencia masiva, proveyendo a la Capa de Lógica de Negocio un modelo limpio, normalizado e inherentemente trazable."

**Diseño Transaccional e Invariantes del Balance Contable**:

> "En la arquitectura contable del sistema (Requerimiento 33.1), se adoptó una estrategia de diseño defensivo para prevenir la consolidación prematura de débitos en la cuenta corriente de los clientes. Debido a que una orden de reparación en estado 'Borrador' o 'Abierta' constituye un documento preliminar susceptible de mutaciones continuas sobre sus productos y tarifas, su inclusión en el saldo exigible representaría una anomalía contable. Para garantizar la consistencia, se establecieron filtros estrictos a nivel de persistencia en MySQL junto con cláusulas de salvaguarda en la Capa de Lógica de Negocio. Esta disposición asegura que el saldo firme del cliente derive únicamente de documentos comerciales cerrados e inmutables, manteniendo la trazabilidad, desacoplando los borradores operativos de las obligaciones financieras y asegurando el principio de representación fidedigna en los libros auxiliares del taller."

**Integración de Flujos Operativos y Retroalimentación en la Experiencia de Usuario**:

> "En la arquitectura del sistema, la transición de una orden de reparación al estado 'Cerrada' constituye el hito formal que transfiere una operación operativa del taller mecánico hacia el dominio contable. En concordancia con el patrón de 'Única Fuente de Verdad' implementado mediante la vista relacional `MovimientoCuenta`, no es necesaria la duplicación física de registros contables; la mutación de estado consolida de forma atómica el débito en la cuenta corriente del cliente. No obstante, desde la perspectiva de la interacción humano-computadora (HCI), es imperativo proveer una retroalimentación inequívoca. En cumplimiento del Requerimiento 33.2, la Capa de Presentación instrumenta un mecanismo de notificación reactiva (Toast UI) ante el cierre de órdenes de reparación. Esta retroalimentación asienta ante el operador administrativo que el comprobante comercial ha adquirido fuerza vinculante y ha impactado el saldo exigible del cliente, disminuyendo la incertidumbre operativa y reforzando la trazabilidad del ciclo de facturación."

**Proyecciones Financieras, Auditoría y Reportes de Cuenta Corriente**:

> "La implementación del estado de cuenta de clientes (Requerimiento 29\) resuelve la dualidad entre transparencia informativa y rigurosidad contable en la arquitectura del sistema. Adoptando el principio de diseño de 'Estado Derivado', el balance no se almacena en variables estáticas sino que se calcula en tiempo de ejecución a partir de la vista relacional `MovimientoCuenta`. La consulta analítica aplica funciones de ventana SQL (`OVER ORDER BY`) con filtrado condicional sobre la columna discriminatoria `computa_saldo`. Esta técnica garantiza que la columna de balance acumulativo progrese únicamente frente a transacciones formalizadas (Órdenes 'Cerradas' y Pagos 'Aceptados'), dejando intacta la visibilidad de los comprobantes provisionales para fines de auditoría operativa. En el frontend desarrollado con React.js y TailwindCSS, esta segregación se traslada mediante técnicas de affordance visual y señalización estática en la UI, garantizando que el operador contable distinga el saldo jurídicamente exigible de los compromisos en trámite sin comprometer la inmutabilidad de los registros históricos."

**Patrones de Sincronización y Consistencia Reactiva en Interfaces Contables**:

> "La sincronización automática de los movimientos de cuenta corriente ante modificaciones de comprobantes preliminares (Requerimiento 35\) valida la solvencia técnica del patrón de 'Única Fuente de Verdad' implementado en la arquitectura. Al prescindir de una tabla física de movimientos contables y derivar la cronología en tiempo real mediante la vista SQL `MovimientoCuenta`, cualquier mutación transaccional ejecutada sobre las tablas maestras `Pago` u `OrdenReparacion` se refleja instantáneamente en el motor relacional MySQL sin incurrir en desfasajes ni demandar triggers de reconciliación asíncrona. En el ecosistema cliente desarrollado con React.js, el principio de consistencia eventual se resuelve mediante la invalidación determinista de consultas (*Query Invalidation*), donde la resolución favorable de la promesa de edición desencadena un ciclo de refresco controlado sobre el estado local del componente. Esta sinergia arquitectónica asegura que la interfaz de usuario represente con fidelidad la situación contable y operativa del cliente, optimizando los tiempos de respuesta y preservando la inmutabilidad de los saldos firmes exigibles."

# **Claude \- 27/09**

Req 32 actualizado. Lo que cambió respecto de la versión anterior:

Autocontenido: se eliminaron las referencias cruzadas ("Requerimiento 31", "32.1"). El documento enuncia por sí mismo el ciclo de vida completo (Borrador, Pendiente de acreditación, Aceptado, Rechazado), la premisa de que todo pago nace en "Borrador" y la regla de cobros diferidos. Solo queda una delimitación de alcance, sin numerar, para la resolución de cobros diferidos.

Alcance real de la inmutabilidad: antes bloqueaba solo "Aceptado" y "Rechazado"; ahora bloquea todo lo que no sea "Borrador", incluido "Pendiente de acreditación".

Asignación del estado definitivo incorporada como responsabilidad central de la edición, con la guarda medio/estado (diferido nunca directo a "Aceptado", 409).

Baja acotada a "Borrador", como decidiste, redactada como regla propia y sin presentarla como contradicción.

Nombres reales del código: prefijo /api/payment (no /api/payments), PaymentService con métodos estáticos y ESTADOS\_PAGO, Payment.findById distinguido de findStateById/findMethodById, fecha\_creacion/fecha\_actualizacion, y UI en pages/Payments/UpdatePaymentPage.jsx con ruta /pagos/:id\_pago (no PaymentList.jsx), reutilizando el badge y el modal de confirmación ya existentes.

Concurrencia: la guarda AND id\_estado\_pago \= \[ID\_BORRADOR\] pasó de advertencia a tarea del modelo, con chequeo de affectedRows.

Se agregó Estrategia de Tests con el mismo formato que usa el Req 31\.

Req 31 actualizado. Cambios principales:

Regla del "Borrador" reformulada: ya no se justifica con "los pagos no admiten eliminación física ni lógica" (que contradecía la baja de borradores). Ahora la justificación es doble y compatible con el Req 32: no impactar el saldo antes de la revisión, y que el "Borrador" es la única ventana de corrección o descarte, porque una vez formalizado el pago deja de ser modificable y eliminable.  
Autocontenido: el resumen enuncia el ciclo de vida completo (Borrador, Pendiente de acreditación, Aceptado, Rechazado) y que solo "Aceptado" computa saldo, sin remitir a otros documentos; la asignación del estado definitivo se menciona solo como límite de alcance.  
Nombres reales del código: endpoint POST /api/payment (singular), PaymentService.createPayment estático con ESTADOS\_PAGO, Payment.findMethodById, getAuthHeaders(), y UI en pages/Payments/CreatePaymentPage.jsx con ruta /crear-pago (ya no "PaymentForm.jsx o CreatePaymentPage.jsx").  
Reglas y tareas que faltaban: validación del medio de cobro contra catálogo (404), vigencia is\_active del cliente, validación de forma de los campos obligatorios, 500 ante catálogo sin "Borrador", carga dinámica del selector de medios, registro de la ruta en App.js, y la Tarea 0.2 con las FK ON DELETE RESTRICT ON UPDATE CASCADE.  
Sección de tests: dejó de decir "los tests no se implementan en esta etapa" (ya existen los tres archivos) y se le quitaron los casos que pertenecen al requerimiento de catálogos y a la guarda de asignación de estados (getAllPaymentStates, getAllPaymentMethods, validatePaymentStatusAssignment), que no son de este requerimiento.

Req 31.1 actualizado. Cambios principales:

Nombres reales: endpoint GET /api/payment (era /api/payments), columnas fecha\_creacion/fecha\_actualizacion (eran created\_at/updated\_at), y UI en pages/Payments/PaymentsPage.jsx con panel de filtros integrado (ya no PaymentListPage.jsx \+ PaymentFilters.jsx como componente separado).  
Ordenamiento, que no figuraba en absoluto: incorporado como parte del alcance, con la doble barrera contra inyección (lista blanca en el servicio \+ mapa de traducción en el modelo), el comportamiento por defecto fecha\_pago DESC con desempate por id\_pago, y los encabezados pulsables con indicador de sentido.  
Validaciones reales del servicio: validateSearchFilters con enteros positivos, importes no negativos, fechas reales de calendario y coherencia de los cuatro pares de rango.  
Comportamiento efectivo de la UI: deslizador de doble control para importes con tope derivado una sola vez, calendarios de rango, debounce de la consulta, limpieza de filtros, pie con cantidad de registros, formato local de importes y fechas, clases pay-list-\* centralizadas en index.css, y registro de la ruta /pagos.  
Autocontenido: enuncia por sí mismo los cuatro estados del ciclo de vida y remite a la modificación solo como límite de alcance, sin numerar otros requerimientos.  
Se agregaron dos riesgos que el código hace evidentes: DATE() en el WHERE inhibe los índices, y el tope del deslizador debe fijarse una única vez.

Req 32.1 actualizado. Cambios principales:

Eliminadas las notas de dependencia "(Pendiente para implementación en Requerimientos de creación y mutación de pagos)" y "(Pendiente para realizar en requerimiento 31)". El documento ahora se define por lo que entrega —catálogos, diccionario semántico y función de guarda— y remite al registro/modificación solo como límite de alcance, sin numerarlos.  
Rutas reales: GET /api/payment/methods y GET /api/payment/states (eran /api/payment-methods y /api/payment-statuses, y la Tarea 3.2 decía /api/payment/methods con una incoherencia interna).  
Modelo unificado: ya no habla de "ambos modelos" ni de un findById genérico; documenta findAllStates, findAllMethods, findStateById y findMethodById viviendo en Payment.js, con la razón del sufijo por entidad.  
Guarda redactada según lo implementado: antes decía que el sistema "fuerza" o "asigna de manera mandataria" el estado "Pendiente de acreditación"; ahora describe validatePaymentStatusAssignment como lo que es —una validación que rechaza con 409 la asignación de "Aceptado" a un medio diferido, eleva 404 fuera de catálogo, 400 ante parámetros faltantes y devuelve el estado validado.  
Frontend alineado: fetchPaymentMethods/fetchPaymentStates (el doc decía getPaymentMethods()/getPaymentStates()), getAuthHeaders(), ruta real del componente en components/common/ (el encabezado decía components/common-), y el matiz "rosa" en lugar de "carmesí" según el mapa real del badge, con la normalización sin acentos documentada.  
Se agregaron la regla de referencia semántica de estados, la Tarea 0.4 con el UNIQUE sobre nombre, dos riesgos que el código hace evidentes (fragilidad del matching por nombre y colisión de rutas literales vs. paramétricas) y la Estrategia de Tests en el formato de los otros tres documentos.

Comprobante externo obligatorio para cheques

Req\_31.md: nueva regla de negocio (400 si falta, está vacío o solo tiene espacios en un medio diferido; optativo en los inmediatos; se persiste recortado), incorporado a la validación conjunta del servicio (Tarea 2.5), a la etiqueta condicional del formulario (Tarea 5.3) y a los tests unitarios y end-to-end.  
Req\_31\_1.md: pasa a ser columna de la grilla (antes solo criterio de filtrado) y se suma a la lista blanca de ordenamiento.  
Modelo temporal de tres fechas

Agregué en ambos documentos una sección que define y diferencia las tres marcas, para que no se confundan:

Campo	Origen	Obligatoriedad  
fecha\_creacion	la estampa el motor (DEFAULT CURRENT\_TIMESTAMP)	auditoría interna; no aparece en el formulario de carga, sí como columna y filtro en la grilla  
fecha\_recepcion	la informa el usuario	obligatoria para todo pago; es la fecha de negocio y el orden por defecto de la grilla  
fecha\_vencimiento (DATE)	la informa el usuario	obligatoria solo en medios diferidos; null en los inmediatos  
Reglas nuevas del vencimiento: formato YYYY-MM-DD y fecha real de calendario, no anterior a la fecha de recepción, rechazado con 400 si viene junto a un medio inmediato, y admitido aunque ya esté vencido respecto de hoy (carga tardía de un cheque). En la consulta se suma como columna, como filtro por rango (vencimiento\_desde/vencimiento\_hasta, sin envoltorio DATE() por ser columna DATE) y como concepto de ordenamiento.

Renombrado fecha\_pago → fecha\_recepcion: agregué la Tarea 0.4 de migración (ALTER TABLE Pago CHANGE COLUMN \+ actualización de migracion\_taller.sql, que alimenta Docker y DB\_NAME\_TEST) y un riesgo dedicado, porque el nombre viejo está hoy en el modelo, el DTO, los filtros, el ordenamiento y el frontend, y una referencia olvidada rompe la consulta.

Req\_32.md — Modificación de pago (el de mayor impacto)

Campos mutables ampliados: banco emisor, fecha de recepción, fecha de vencimiento; se aclara que la fecha de creación no es editable.  
Regla nueva de revalidación ante el cambio de medio: la coherencia se evalúa sobre el registro resultante de la edición, no sobre el vigente. Pasar de efectivo a cheque exige banco \+ comprobante \+ vencimiento (400 si falta alguno, 404 si el banco no está en catálogo); pasar de cheque a efectivo limpia banco y vencimiento a null; informarlos sobre un medio inmediato da 400\.  
Modelo: findById suma LEFT JOIN Banco; la cláusula SET pasa de seis a ocho columnas (id\_banco, fecha\_recepcion, fecha\_vencimiento incluidas) — corregido también el conteo en la nota de mejora futura.  
Servicio: nuevas tareas 2.7 (coherencia del instrumento resultante, sobre el registro ya fusionado) y 2.8 (validación temporal del vencimiento), con renumeración del resto.  
UI: tareas 5.6 y 5.7 para la condicionalidad de los campos del cheque y la reutilización del combobox de bancos con alta asistida; frontend reutiliza fetchBanks/apiCreateBank sin duplicarlas.  
Tests: cinco casos unitarios y cuatro end-to-end nuevos (conversión de medio en ambos sentidos, vencimiento inválido, banco fuera de catálogo).  
Req\_32\_2.md — Transición de pagos diferidos

El modal de "Acreditar"/"Rechazar" ahora debe mostrar banco emisor, comprobante y vencimiento para identificar el cheque que se resuelve; se anota que los tres siempre están informados, porque solo los medios diferidos llegan a "Pendiente de acreditación".  
Req\_33.md — Movimiento de cuenta

La proyección de la vista pasa a fecha\_recepcion AS fecha\_movimiento, con la aclaración de que no debe usarse ni la fecha de creación ni la de vencimiento; índice sugerido actualizado a Pago(id\_cliente, fecha\_recepcion, id\_estado\_pago).

# **Claude \- 28/09**

docker-compose.yml

El servicio ims-backend tiene ahora TZ=America/Argentina/Buenos\_Aires. Para que tome efecto hay que recrear el contenedor del backend.  
Req\_31.md

fecha\_recepcion figura como DATE NOT NULL, con la aclaración de que la hora exacta de carga queda en fecha\_creacion.  
La migración de la tarea 0.4 convierte DATETIME en DATE y solo se pierde la hora.  
Banco.nombre pasa a VARCHAR(50) y el límite de 50 caracteres está aplicado en la regla de normalización, la tarea 2.11 y el caso de test.  
La colación ya no se describe solo como insensible a mayúsculas: también ignora los acentos, así que "Banco Nación" y "Banco Nacion" chocan en el UNIQUE. Lo aclaré en la regla de unicidad y en las tareas 0.2 y 1.4.  
Req\_31\_1.md

El párrafo "El backend debe estructurar consultas dinámicas…" volvió al resumen. En su lugar agregué una línea que distingue las fechas DATE (recepción y vencimiento) de las TIMESTAMP (creación y actualización).  
En la sección de base de datos, fecha\_recepcion figura como DATE NOT NULL.  
En la tarea 1.3, recepción y vencimiento se comparan directamente, sin DATE(), y se explica que así se pueden usar índices. Esto coincide con lo que ya hace el modelo.  
Ajusté el riesgo 1: la advertencia sobre DATE() ahora aplica solo a las columnas TIMESTAMP.  
Req\_32.md

La sección de tests se llama "Estrategia de Tests (Backend)", como en 31 y 31.1.

Consulta de pagos, getPayments (31.1)

validateSearchFilters ahora valida id\_banco, las fechas vencimiento\_desde y vencimiento\_hasta, y que ese rango no esté invertido.  
En la lista de ordenamientos permitidos sumé banco\_nombre, numero\_comprobante y fecha\_vencimiento. Si no se pide un orden válido, se ordena por fecha\_recepcion.  
El DTO devuelve fecha\_recepcion y fecha\_vencimiento en ISO. banco\_nombre y fecha\_vencimiento llegan como null en los cobros inmediatos, tal como vienen del LEFT JOIN.  
Catálogo de bancos (31, tareas 2.11 y 2.12)

getBanks() devuelve el catálogo tal como lo entrega el modelo, igual que los catálogos de estados y medios.  
createBank(bankData):  
Recorta los espacios de los extremos y colapsa los internos.  
Rechaza con 400 un nombre vacío o de más de 50 caracteres.  
Rechaza con 409 si ya existe un banco con ese nombre, y el mensaje menciona el nombre ya registrado.  
Métodos auxiliares nuevos  
Siguen el mismo patrón de métodos estáticos que validateSearchFilters:

resolveDeferredInstrument(medio, instrumentData) concentra la regla del cheque, que así se escribe una sola vez para el alta y para la edición. Siempre decide según es\_diferido.  
Medio inmediato: si llegan banco o vencimiento con un valor que no es null, responde 400\. Un null explícito se toma como "no informado", así que el formulario puede enviarse completo sin problema.  
Medio diferido: responde 400 si falta alguno de los tres datos. También responde 400 si el vencimiento no es una fecha real o es anterior a la recepción, y 404 si el banco no existe.  
Devuelve los datos listos para guardar, con el comprobante recortado (o null) y el nombre del banco.  
formatCalendarDate(fecha) convierte a YYYY-MM-DD las columnas DATE que el modelo devuelve como Date. Hace falta para comparar el vencimiento con la recepción cuando esos valores salen del pago ya guardado, en la edición.  
createPayment (31)

Valida que llegue fecha\_recepcion y aplica la regla del cheque apenas confirma que el medio existe.  
Guarda id\_banco y fecha\_vencimiento (en null para cobros inmediatos) y el comprobante recortado.  
El registro que devuelve incluye banco\_nombre.  
updatePayment (32)

Si la edición no cambia el medio, se usa el que tiene el pago guardado, con su es\_diferido.  
La regla del cheque se evalúa sobre cómo queda el pago después de la edición. Si el medio que resulta es diferido, se conservan el banco y el vencimiento guardados cuando no se envían. Si la edición pasa el pago a un medio inmediato, se borran (quedan en null) y solo se rechaza lo que se haya enviado explícitamente.  
Guarda las 8 columnas y devuelve las dos fechas en ISO.

Controlador (payment.controller.js)

handleCreatePayment ahora exige fecha\_recepcion en lugar de fecha\_pago. La obligatoriedad de banco, comprobante y vencimiento no se revisa acá porque depende del medio de pago; la resuelve el servicio.  
handleUpdatePayment acepta como campos modificables id\_banco, fecha\_recepcion y fecha\_vencimiento, además de los que ya tenía.  
handleGetPayments lee id\_banco como número y vencimiento\_desde/vencimiento\_hasta como texto.  
Nuevo getBanks, igual que getPaymentMethods y getPaymentStates.  
Nuevo handleCreateBank: responde 400 si falta el nombre (sin llamar al servicio) y, si el servicio falla, devuelve el código que éste indique (201, 400, 409 o 500).  
Rutas (payment.routes.js)

Agregué GET /banks y POST /banks junto a /methods y /states, antes de /:id, para que Express no tome "banks" como el id de un pago.  
Documento de pendientes

Sigue la guía de documentos autocontenidos: arranca con un resumen de los tres cambios de la revisión, para que se entienda sin leer los requerimientos.  
Incluye una tabla de estado por capa y la lista de endpoints ya disponibles con lo que reciben y devuelven.  
Las tareas están en casillas, agrupadas por capa y por requerimiento: servicio del frontend, las tres páginas, los tests de 31, 31.1, 32 y 32.1, y los pasos de entorno.  
Cierra con las decisiones abiertas y con los requerimientos 32.2 y 33, que ya están afectados en su documentación aunque todavía no se implementaron.

# **Claude \- 29/09**

Cómo se usa desde las páginas. Igual que AmountRangeSlider, el catálogo y el banco elegido los guarda la página, no el componente:

\<BankSelector banks={banks} value={idBanco} onChange={setIdBanco}  
              onBankCreated={(bank) \=\> setBanks(\[...banks, bank\])} /\>  
Búsqueda

Al entrar al campo se abre la lista completa, y se va filtrando mientras se escribe. La comparación ignora espacios de más, mayúsculas y acentos (normalizeText).  
El banco solo queda elegido si se hace clic en una opción o se usa ↑/↓ \+ Enter.  
Si el usuario sale del campo sin elegir (o aprieta Escape), se borra lo que escribió y vuelve a verse el banco elegido, o el campo queda vacío.  
Alta de un banco nuevo

El botón "+ Nuevo", siempre visible al lado del campo, abre un modal. El campo del modal viene cargado con el texto que se estaba buscando.  
Si hay bancos con nombre parecido, el modal los lista con un botón "Seleccionar". Para crear uno nuevo igual, hay que tildar una confirmación.  
El modal tiene su propia protección contra el doble clic (isCreating). Si el backend responde 409 (banco repetido), muestra ese mensaje dentro del modal sin cerrarlo.  
Cuando el alta sale bien, avisa a la página para que sume el banco al catálogo y lo deja seleccionado. Los datos ya cargados del formulario no se tocan.

index.css

Borré .pay-list-cell-id, que quedó sin uso al sacar la columna "N° Pago".  
Req\_31\_1.md

Las tres fechas: la introducción dice ahora que la consulta distingue las tres fechas, no la grilla. De la fecha de creación aclara que el backend la acepta como filtro, pero que no aparece ni en la tabla ni en el panel.  
Descripción de la UI (sección Frontend): el panel ya no menciona el número interno ni el rango de creación.  
Tarea 5.1: las 9 columnas en el orden actual, con una frase que explica por qué no se muestran el número interno ni la fecha de creación.  
Tarea 5.2: los controles actuales del panel. Aclara que esos dos filtros no se ofrecen, pero que el backend y el servicio frontend los siguen aceptando.  
"Prioridad de los Registros Recientes": "fecha de cobro" pasó a "fecha de recepción", por la ambigüedad con la acreditación que charlamos.  
Lo que describe el backend (modelo, servicio, controlador) y los tests quedó igual, porque esas capas siguen aceptando todos los filtros.

Pendientes\_Modulo\_Pagos.md

Marqué el punto 2.3 como hecho y agregué un ítem con la reducción de columnas y filtros, para que quede registrada.

https\://github.com/storytold/photocraft

