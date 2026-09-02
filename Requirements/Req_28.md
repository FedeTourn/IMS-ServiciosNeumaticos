**Requerimiento 28: Modificación de órdenes de reparación**

### Resumen del Requerimiento

El objetivo central es permitir la edición de una orden de reparación previamente registrada. La funcionalidad debe actuar en dos modalidades: si la orden se encuentra "Abierta", el usuario puede gestionar libremente los productos asociados y sus precios; si la orden está "Cerrada", el sistema debe adoptar una postura defensiva, bloqueando cualquier intento de edición para proteger la integridad contable.

### Backend (Capa de Datos, Servicio y Exposición)

* **Model (`RepairOrder.js` y `Product.js`):** La base de datos debe ser capaz de actualizar los datos maestros de la orden mediante un método `update`. Además, se requiere un método auxiliar `unlinkFromRepairOrder` para limpiar la clave foránea de las válvulas que el usuario decida quitar de la orden, desvinculándolas sin alterar su estado físico actual.


* **Service (`repairOrder.service.js`):** A través del método `updateRepairOrder(id, data)`, esta capa orquesta la operación. Su principal responsabilidad es comparar la lista de productos que el usuario envió desde la interfaz contra la lista que ya existía en la base de datos. A partir de esta comparación, el servicio deduce qué válvulas deben desvincularse y cuáles deben actualizarse, ejecutando todas estas acciones de forma segura dentro de una única transacción.


* **Controller (`repairOrder.controller.js`):** Debe exponer el endpoint `PUT /api/repair-orders/:id`. Su tarea es atrapar la petición HTTP, validar que el formato de los datos entrantes sea correcto, delegar el trabajo al servicio y devolver una respuesta semántica (éxito o error).



### Frontend (Capa de Integración y Presentación)

* **Integración API (`repairOrder.service.js`):** Se debe implementar el método `updateRepairOrder(id, data)` para enviar el nuevo estado deseado de la orden hacia el servidor mediante una petición HTTP.


* **UI (`UpdateRepairOrder.jsx`):** El componente visual debe ser inteligente y reaccionar al estado de la orden. Si detecta que es una orden "Cerrada", debe deshabilitar toda interacción e informar al usuario mediante un banner visual. Si está "Abierta", debe permitir agregar o quitar válvulas y ajustar precios, armando un paquete de datos final (el estado consolidado) al presionar "Guardar".



### Reglas de Negocio Clave

* **Inmutabilidad por Estado:** El backend debe abortar la operación inmediatamente si se intenta modificar una orden cuyo estado es "Cerrada".


* **Disponibilidad Real:** Al buscar válvulas elegibles para agregar a la orden, el sistema debe contemplar aquellas en estado "Recibido", "Libre" y, a partir de nuestra última definición, "Reparado".
* **Conservación de Estado:** Las válvulas desvinculadas durante la edición conservarán su estado actual (ej. "Reparado"), limitándose la acción a eliminar su lazo lógico con la orden.


WBS:
0. Base de Datos
    (Sin tareas ). Utilizaremos la estructura existente de las tablas OrdenReparacion, EstadoOrdenReparacion y Producto definidas.

1. Capa de Datos (backend/src/models/)
    Tarea 1.1: En RepairOrder.js, implementar el método update(id, updateData, connection). Este método debe ser agnóstico y limitarse a ejecutar el UPDATE sobre la tabla OrdenReparacion (ej. actualizando importe_total, observaciones, id_estado_orden), operando sobre la transacción inyectada.

    Tarea 1.2: En Product.js, implementar un método auxiliar (ej. unlinkFromRepairOrder(id_producto, connection)). Este método es vital para desvincular una válvula de la orden (seteando id_orden_reparacion = NULL) y sin modificar su estado, si el usuario decide quitarla durante la modificación de una orden abierta.

2. Capa de Lógica de Negocio (backend/src/services/repairOrder.service.js)
    Tarea 2.1: Implementar el método principal updateRepairOrder(id, data).
    Tarea 2.2 (Regla de Negocio Crítica): Consultar el estado actual de la orden invocando a RepairOrder.findById(id). Si el estado_nombre (o el id_estado_orden) corresponde a 'Cerrada', interrumpir inmediatamente el flujo (Fail-Fast) y lanzar una excepción de negocio (HTTP 403 o 409).
    Tarea 2.3 (Enfoque Declarativo): Implementar la lógica de "Diff" (Diferencia) para las válvulas. El servicio debe comparar las válvulas que actualmente tiene la orden en la base de datos contra el nuevo arreglo de IDs enviado por el frontend.
    Tarea 2.4 (Transaccionalidad): Abrir una transacción SQL (beginTransaction).
        Ejecutar las desvinculaciones (unlinkFromRepairOrder) para las válvulas que ya no están en el payload. Ejecutar las vinculaciones/actualizaciones (updateForRepairOrder) para las válvulas nuevas o que modificaron su precio.
        Actualizar la orden base (RepairOrder.update). Confirmar (commit) o revertir (rollback) ante cualquier excepción.

3. Capa de Exposición (backend/src/controllers/ y backend/src/routes/)
    Tarea 3.1: En repairOrder.controller.js, implementar el método updateRepairOrder. Su responsabilidad será extraer el req.params.id y el req.body, hacer validaciones de forma rápidas (ej. que items sea un array) y delegar al servicio.
    Tarea 3.2: En repairOrder.routes.js, exponer el endpoint PUT /api/repair-orders/:id.

4. Capa de Integración Frontend (frontend/src/services/repairOrder.service.js)
    Tarea 4.1: Implementar la función asíncrona updateRepairOrder(id, data) utilizando tu instancia de Axios/Fetch para apuntar al nuevo endpoint PUT.
5. Capa de Presentación (frontend/src/pages/UpdateRepairOrderPage.jsx)

    Tarea 5.1: Modificar la lógica de carga (useEffect). Si la orden está en estado 'Cerrada', el componente debe pasivar todos los inputs interactivos e inyectar un banner visual indicando que es de solo lectura.

    Tarea 5.2: Si la orden es 'Abierta', el componente debe comportarse como el flujo de creación. Se debe cargar la lista de productos disponibles del cliente seleccionado y pre-seleccionar los que ya pertenecen a la orden, permitiendo su modificación.

    Tarea 5.3: Reutilizar la lógica de agrupación (Estado Derivado) para la cotización y mapear los datos al mismo formato de payload utilizado en la creación al hacer clic en "Guardar" o "Guardar y Cerrar".