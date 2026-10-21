**UNIVERSIDAD TECNOLÓGICA NACIONAL**

**FACULTAD REGIONAL DE SANTA FE**

**Informe de Avances Número 1**

**Desarrollo de un sistema de gestión de stock de productos nuevos y a reparar para un taller mecánico**

**Integrante:**	Tourn, Federico Paulino \- [fedetourn1@gmail.com](mailto:fedetourn1@gmail.com)

**Director:**		García Flappo, Pablo \- [pablo.garcia.flappo@gmail.com](mailto:pablo.garcia.flappo@gmail.com)

**Fecha de**		  
**Entrega:**		03/09/2025

Año 2025

Índice de contenidos

[**Introducción	3**](#introducción)

[**1\. Definición de Requerimientos Funcionales y no Funcionales	4**](#1.-definición-de-requerimientos-funcionales-y-no-funcionales)

[1.1. Requerimientos Funcionales	4](#1.1.-requerimientos-funcionales)

[Gestión de Usuarios e Inicio	4](#gestión-de-usuarios-e-inicio)

[Registro y seguimiento de productos en reparación	5](#registro-y-seguimiento-de-productos-en-reparación)

[Procesos administrativos y contables	6](#procesos-administrativos-y-contables)

[Gestión de repuestos y productos nuevos	8](#gestión-de-repuestos-y-productos-nuevos)

[1.2. Requerimientos No Funcionales	11](#1.2.-requerimientos-no-funcionales)

[**2\. Cronograma ajustado del proyecto	12**](#2.-cronograma-ajustado-del-proyecto)

[2.1. Cronograma Propuesto	12](#2.1.-cronograma-propuesto)

[Fase 1 – Análisis y Definición de Requerimientos (4 semanas)	12](#fase-1-–-análisis-y-definición-de-requerimientos-\(4-semanas\))

[Fase 2 – Diseño de Arquitectura y Base de Datos (4 semanas)	12](#fase-2-–-diseño-de-arquitectura-y-base-de-datos-\(4-semanas\))

[Fase 3 – Desarrollo e Implementación por Módulos (13 semanas)	12](#fase-3-–-desarrollo-e-implementación-por-módulos-\(13-semanas\))

[Fase 4 – Pruebas y Validación (2 semanas)	13](#fase-4-–-pruebas-y-validación-\(2-semanas\))

[Fase 5 – Documentación y Entrega Final (1 semana)	13](#fase-5-–-documentación-y-entrega-final-\(1-semana\))

[**3\. Definición de entornos de trabajo y justificación de tecnologías	15**](#3.-definición-de-entornos-de-trabajo-y-justificación-de-tecnologías)

[3.1. Entornos de trabajo	15](#3.1.-entornos-de-trabajo)

[3.2. Justificación de Tecnologías	15](#3.2.-justificación-de-tecnologías)

[**4\. Arquitectura general del sistema y la base de datos	17**](#4.-arquitectura-general-del-sistema-y-la-base-de-datos)

[4.1. Arquitectura General del Sistema	17](#4.1.-arquitectura-general-del-sistema)

[4.2. Arquitectura de la Base de Datos	17](#4.2.-arquitectura-de-la-base-de-datos)

[**5\. Anexo	19**](#5.-anexo)

# Introducción {#introducción}

El presente documento corresponde al **Entregable N.º 1** del proyecto “*Desarrollo de un sistema de gestión de stock de productos nuevos y a reparar para un taller mecánico*”. Tal como se definió en el plan de proyecto, este entregable fue desarrollado en los meses 1 y 2 del proyecto y se abordan los siguientes contenidos:

* Definición de los requerimientos funcionales y no funcionales.  
* Cronograma ajustado del proyecto, con fases definidas y entregables tentativos.  
* Definición de entornos de trabajo y justificación de tecnologías.  
* Arquitectura general del sistema y la base de datos.

El proyecto tiene como objetivo diseñar e implementar un sistema informático que permita optimizar los procesos de recepción, reparación y entrega de productos en un taller, así como estandarizar la venta de productos nuevos y asegurar la coherencia en la definición de precios para el cliente **SERVICIOS NEUMATICOS** (Razón Social: Tourn Mauricio).

A partir del diálogo con el cliente y los usuarios finales, se definió dividir el desarrollo del sistema en tres módulos principales, de manera de realizar entregas incrementales de software funcional que aporten valor en cada iteración. Los módulos son:

1. Registro y seguimiento de productos en reparación.  
2. Procesos administrativos y contables.  
3. Gestión de repuestos y productos nuevos.

En el apartado “Cronograma ajustado del proyecto” se detallan las fases y entregables correspondientes a cada módulo.

Cabe aclarar que, conforme a lo establecido en el Plan de Proyecto, las funcionalidades correspondientes al *Módulo de generación automática de documentos comerciales* y al *Módulo de integración con servicios de mensajería* se integran en el presente informe dentro del módulo **Procesos administrativos y contables**, ya que ambos forman parte de los procesos administrativos automatizados del sistema. En esta versión, dichos módulos se ven reflejados en los requerimientos vinculados a la generación de comprobantes, órdenes, liquidaciones y al envío automático de notificaciones por correo electrónico.

En conjunto con el cliente, se decidió no incorporar la **gestión de facturas** dentro del sistema. Esta decisión se fundamenta en que dichos documentos poseen carácter comercial y relevancia administrativa, y el cliente ha manifestado su preferencia por continuar utilizando, por el momento, el sistema ARCA para dicha función. En próximas etapas se definirá con el cliente si los demás documentos comerciales almacenarán información respecto a facturas.

Finalmente, cabe destacar que, en línea con la metodología de desarrollo definida en el plan de proyecto, basada en un modelo incremental con enfoque iterativo, este primer entregable se centra en las etapas de **análisis y especificación de requerimientos**, así como en el **diseño del sistema y de la base de datos**, constituyendo la base para el desarrollo posterior.

# 1\. Definición de Requerimientos Funcionales y no Funcionales {#1.-definición-de-requerimientos-funcionales-y-no-funcionales}

La definición de requerimientos se realizará siguiendo la metodología de desarrollo establecida, adoptando un enfoque incremental. Esto implica que en el presente informe se presentará una especificación detallada de los requerimientos asociados a las funciones principales y a los aspectos troncales del proceso de negocio, mientras que los requerimientos correspondientes a etapas posteriores se describirán de manera preliminar y con menor nivel de detalle.

Es importante aclarar que, dentro de la organización, los productos son comúnmente denominados como **“válvulas”**. En consecuencia, en este documento se utilizará dicha denominación al referirse a los productos, manteniendo coherencia con el vocabulario propio de la empresa, de todas maneras, en etapas siguientes se utilizará “**productos**” por simplicidad y para evitar confusiones.

Los requerimientos serán obtenidos aplicando técnicas de relevamiento como entrevistas al personal de la organización y observación de los procesos productivos. Las preguntas que guiarán el plan de entrevistas para la obtención de requerimientos funcionales se detallan en el Anexo.

## 1.1. Requerimientos Funcionales {#1.1.-requerimientos-funcionales}

### **Gestión de Usuarios e Inicio** {#gestión-de-usuarios-e-inicio}

1. **Alta de Usuarios**

   El sistema debe permitir registrar nuevos usuarios, ingresando al menos: nombre completo, nombre de usuario, contraseña y rol. Registrando la fecha de creación del usuario. El sistema debe validar que el nombre de usuario sea único antes de permitir el alta.

2. **Asignación de Roles**

   El sistema debe permitir asignar a cada usuario un rol (ejemplo: administrador, técnico, administrativo).

3. **Modificación de Usuarios**

   El sistema debe permitir modificar los datos de los usuarios existentes (nombre completo, contraseña, rol, estado). Registrando la fecha de la última modificación de cada usuario.

4. **Habilitacion de usuarios**

   El sistema debe permitir habilitar o deshabilitar usuarios sin necesidad de eliminarlos.

5. **Inicio de sesión**

   El sistema debe permitir que los usuarios registrados inicien sesión mediante un nombre de usuario y contraseña.

   

6. **Credenciales**

   El sistema debe validar las credenciales de acceso antes de permitir el ingreso.

**INICIO**

7. **Interfaz de inicio**

   El sistema debe contar con una página de inicio (dashboard) accesible luego del inicio de sesión.

   

8. **Accesos dashboard**

   El dashboard debe ofrecer accesos rápidos a las funcionalidades principales del sistema (por ejemplo: gestión de clientes, órdenes de reparación, gestión de repuestos, entre otros). Los accesos rápidos específicos se definirán en conjunto con el cliente en etapas posteriores del proyecto.

   

9. **Información dashboard**

   El dashboard debe mostrar información resumida y relevante para la gestión del negocio (por ejemplo: cantidad de órdenes activas, clientes registrados, estado del inventario). La información mostrada en el dashboard se definirá en conjunto con el cliente en etapas posteriores del proyecto.

### **Registro y seguimiento de productos en reparación** {#registro-y-seguimiento-de-productos-en-reparación}

10. **Registro de valvulas recibidas**

    El sistema debe permitir registrar la recepción de válvulas, asociando el registro a un cliente, detallando las válvulas recibidas (modelo, cantidad), la fecha de recepción, la fecha de entrega pactada (si corresponde) e imágenes opcionales.

    

11. **Consulta de válvulas**

    El sistema debe permitir consultar las válvulas registradas, mostrando un listado con su información relevante. El usuario podrá filtrar por campos principales (modelo, cliente, fecha de recepción, estado) y ordenar los resultados de manera ascendente o descendente en cualquiera de esos campos. Además, el sistema debe permitir consultar el detalle de una válvula seleccionada, mostrando toda la información asociada a la misma.

    

12. **Modificación de las válvulas para atributos diferentes de estado**

    El sistema debe permitir modificar la información de una válvula registrada, siempre que esta no se encuentre en estado **Entregada**. Las modificaciones deben quedar registradas en un historial de cambios asociado a la válvula.

13. **Cambios de estado de las válvulas**

    El sistema debe permitir modificar el estado de una válvula registrada. Los estados disponibles son: **Recibida, Reparada, Entregada, No Reparable y Libre (para válvulas propias)**. El cambio de estado debe registrarse en el historial de la válvula y está sujeto a reglas de transición de estado que serán definidas con el cliente en etapas futuras.

14. **Registro de clientes nuevos**

    El sistema debe permitir registrar clientes nuevos, detallando el nombre y apellido o razón social, información de contacto (teléfono y/o email), CUIT y dirección (opcional). Asimismo, el sistema debe validar la unicidad del cliente, notificando al usuario en caso de duplicados, dicha validación debe realizarse utilizando como identificador único el CUIT, Apellido y Nombre o correo electrónico. El registro de clientes estará sujeto a niveles de permisos que, junto con el campo de validación, serán definidos con el cliente en etapas futuras.

    

15. **Consulta de clientes**

    El sistema debe permitir consultar los clientes registrados, mostrando un listado con su información relevante. El usuario podrá filtrar por campos principales (Nombre y Apellido, email, telefono, CUIT) y ordenar los resultados de manera ascendente o descendente en cualquiera de esos campos. Además, el sistema debe permitir consultar el detalle de un cliente seleccionado, mostrando toda la información asociada al mismo.

    

16. **Búsqueda de clientes**

    El sistema debe permitir buscar clientes mediante nombre, CUIT u otro campo principal, mostrando los resultados que coincidan total o parcialmente con los criterios ingresados. El sistema debe notificar al usuario en caso de no encontrar clientes que coincidan con la búsqueda.

    

17. **Modificación de clientes**

    El sistema debe permitir modificar cierta información de un cliente registrado, los campos modificables son dirección y teléfono. Las modificaciones deben quedar registradas en un historial de cambios asociado y estarán sujetas a niveles de permisos que serán definidos con el cliente en etapas futuras.

### **Procesos administrativos y contables** {#procesos-administrativos-y-contables}

18. **Registro de comprobantes de recepción**

    El sistema debe permitir la creación y registro automático de comprobantes de recepción, asociando el registro a un cliente y a las válvulas recibidas.

19. **Consulta de comprobantes de recepción**

    El sistema debe permitir la consulta de comprobantes de recepción registrados, mostrando un listado con su información relevante.

    

20. **Impresión de comprobantes de recepción**

    El sistema debe permitir que un comprobante de recepción seleccionado sea exportado en un formato imprimible.

    

21. **Modificación de comprobantes de recepción**

    El sistema debe permitir modificar la información de los comprobantes de recepción.

22. **Creación y registro de orden de reparación**

    El sistema debe permitir registrar órdenes de reparación, asociando el registro a un cliente y una o más válvulas o uno o más repuestos.

    

23. **Consulta de órdenes de reparación**

    El sistema debe permitir consultar las órdenes de reparación registradas, mostrando un listado con su información relevante.

    

24. **Impresión de ordenes de reparación**

    El sistema debe permitir que una orden de reparación seleccionada sea exportada en un formato imprimible.

    

25. **Modificación de órdenes de reparación**

    El sistema debe permitir modificar la información de las órdenes de reparación.

26. **Estados de cuenta**

    El sistema debe permitir llevar un registro de los estados de cuenta de los clientes, incluyendo las órdenes de reparación y los pagos asociados, de forma que se pueda consultar en cualquier momento el saldo actualizado.

    

27. **Creación de liquidaciones**

    El sistema debe permitir la creación de liquidaciones de estado de cuenta en formato exportable.

    

28. **Registro de nuevo pago**

    El sistema debe permitir el registro de pagos realizados por los clientes.

29. **Modificación pago**

    El sistema debe permitir la modificación de la información asociada a los pagos registrados.

30. **Creación movimiento de cuenta**

    El sistema debe registrar automáticamente en el estado de cuenta de cada cliente las órdenes de reparación asociadas.

    

    El sistema debe asociar los pagos realizados por los clientes a su estado de cuenta de forma automática.

    

31. **Consulta movimientos de cuenta**

    El sistema debe permitir consultar en cualquier momento el listado de movimientos (órdenes de reparación y pagos) correspondientes a un cliente.

    

32. **Modificación movimientos de cuenta**

    En caso de que se realicen modificaciones de Órdenes de reparación o Pagos, el sistema debe actualizar de forma automática los movimientos de cuenta asociados.

Servicios de mensajería

33. **Envío automático de Comprobantes de Recepción**

    El sistema deberá permitir al usuario el envío automático de correos electrónicos a los clientes cuando se registre un nuevo **Comprobante de Recepción** asociado a dicho cliente. 

    El correo electrónico deberá incluir como mínimo:

* Nombre del cliente.  
* Número y fecha del comprobante.  
* Descripción de los productos recibidos.  
* Archivo adjunto con el comprobante en formato PDF.

  El envío deberá realizarse automáticamente al confirmar el registro del comprobante.

34. **Envío automático de Órdenes de Reparación**

    El sistema deberá permitir al usuario el envío automático de correos electrónicos a los clientes asociados cuando se modifique el estado de una **Órden de Reparación** al estado “Terminada”.

    

35. **Envío automático de Estados de cuenta / Liquidaciones**

    El sistema deberá permitir al usuario el envío automático de correos electrónicos a los clientes asociados al momento de la creación de **liquidaciones de estado de cuenta**.

### **Gestión de repuestos y productos nuevos** {#gestión-de-repuestos-y-productos-nuevos}

Repuesto

36. **Creación de Repuesto**

    El sistema debe permitir dar de alta nuevos repuestos con atributos como nombre, cantidad en stock, estado de inventario, precio y proveedor asociado.

    

37. **Consulta de Repuestos**

    El sistema debe permitir consultar en cualquier momento el listado de repuestos existentes en el sistema, mostrando la información más relevante de cada uno.

    

38. **Modificación de Repuesto**

    El sistema debe permitir modificar los atributos de un repuesto, manteniendo un registro histórico de cambios.

    

    El sistema debe garantizar que la modificación del precio de un repuesto no afecte los precios históricos de órdenes ya registradas.

    

    El sistema debe permitir modificar el stock de un repuesto y el precio de compra del mismo.

    

39. **Alerta de stock**

    El sistema debe generar alertas cuando el stock de un repuesto esté por debajo de un umbral mínimo definido.

    

40. **Consulta de Stock**

    El sistema debe permitir consultar el estado del stock (cantidad disponible, estado de inventario, repuestos agotados o bajo stock).

    

41. **Asociación con productos**

    El sistema debe permitir asociar repuestos a modelos de válvulas, indicando cuáles son compatibles.

42. **Gestión de stock**

    El sistema debe descontar automáticamente del stock los repuestos utilizados en la reparación de válvulas o vendidos directamente.

    

43. **Integración con órdenes de reparación**

    El sistema debe permitir incluir repuestos dentro de una orden de reparación, copiando el precio actual al detalle de la orden para mantener histórico.

Proveedores

44. **Registro de proveedores**

    El sistema debe permitir registrar proveedores y asociar repuestos y productos nuevos a cada proveedor.

45. **Consulta de proveedores**

    El sistema debe permitir consultar el proveedor y precio de adquisición de cada repuesto y producto nuevo para facilitar compras y reposición.

    

46. **Modificación de proveedores**

    El sistema debe permitir la modificación de la información asociada a cada proveedor registrado.

Producto Nuevo

47. **Creación de Producto Nuevo**

    El sistema debe permitir dar de alta nuevos Productos con atributos como nombre, cantidad en stock, estado de inventario, precio y proveedor asociado.

    

48. **Consulta de Productos Nuevos**

    El sistema debe permitir consultar en cualquier momento el listado de Productos Nuevos existentes en el sistema, mostrando la información más relevante de cada uno.

    

49. **Modificación de Producto Nuevo**

    El sistema debe permitir modificar los atributos de un Producto Nuevo, manteniendo un registro histórico de cambios.

    El sistema debe garantizar que la modificación del precio de un Producto Nuevo no afecte los precios históricos de órdenes ya registradas.

    El sistema debe permitir modificar el stock de un Producto Nuevo y el precio de compra del mismo.

    

50. **Alerta de stock**

    El sistema debe generar alertas cuando el stock de un Producto Nuevo esté por debajo de un umbral mínimo definido.

    

51. **Consulta de Stock**

    El sistema debe permitir consultar el estado del stock (cantidad disponible, estado de inventario, Producto Nuevo agotados o bajo stock).

    

52. **Gestión de stock**

    El sistema debe descontar automáticamente del stock los Productos Nuevos   vendidos directamente.

    

53. **Integración con órdenes de reparación**

    El sistema debe permitir incluir Producto Nuevo dentro de una orden de reparación, copiando el precio actual al detalle de la orden para mantener histórico.

  


## 1.2. Requerimientos No Funcionales {#1.2.-requerimientos-no-funcionales}

* **Longitud de contraseñas**

  El sistema debe validar que la contraseña cumpla con una longitud mínima (8 caracteres).


* **Compatibilidad de dispositivos**

  El sistema debe implementarse como una aplicación web responsiva, accesible desde navegadores web modernos (Mozilla Firefox, Google Chrome y Safari) en computadoras de escritorio (PC) y dispositivos móviles con sistemas operativos Android e iOS.


* **Seguridad y autenticación**  
  El sistema debe requerir autenticación de usuario para el acceso.

  El nivel de seguridad se establecerá en media/baja, acorde a la criticidad de los procesos.  
    
* **Concurrencia**

  El sistema debe soportar el uso simultáneo de hasta 3 usuarios sin afectar su funcionamiento.


* **Disponibilidad**

  El sistema debe tolerar un tiempo máximo de inactividad de 24 horas consecutivas.


* **Respaldo de datos**

  El sistema debe generar copias de seguridad completas de los datos con una frecuencia mínima de una vez por semana.


* **Operación offline**

  El sistema debe permitir su uso sin conexión a Internet, garantizando el acceso y registro de operaciones en red local.


* **Rendimiento**

  El sistema no requiere un nivel alto de velocidad de respuesta; el rendimiento esperado se considera bajo.


* **Alcance de red**

  El sistema debe funcionar principalmente dentro de la red local de la organización.


* **Cifrado de datos**

  No se requiere cifrado de datos en almacenamiento ni en transmisión, sólo es necesario para contraseñas.

# 2\. Cronograma ajustado del proyecto {#2.-cronograma-ajustado-del-proyecto}

Como se mencionó anteriormente, a partir del diálogo con el cliente y los usuarios finales, se definió dividir el desarrollo del sistema en tres módulos principales. Los módulos son:

1. Registro y seguimiento de productos en reparación.  
2. Procesos administrativos y contables.  
3. Gestión de repuestos y productos nuevos.

## 2.1. Cronograma Propuesto {#2.1.-cronograma-propuesto}

### **Fase 1 – Análisis y Definición de Requerimientos (4 semanas)** {#fase-1-–-análisis-y-definición-de-requerimientos-(4-semanas)}

* Relevamiento con el cliente de los tres módulos:  
  * **Registro y seguimiento de productos en reparación**  
  * **Procesos administrativos y contables**  
  * **Gestión de repuestos y productos nuevos**

* Validación y aprobación de requerimientos.

### **Fase 2 – Diseño de Arquitectura y Base de Datos (4 semanas)** {#fase-2-–-diseño-de-arquitectura-y-base-de-datos-(4-semanas)}

* Diseño de arquitectura del sistema y modelo de datos.  
* Modelado general de clases y relaciones UML.

**Entregables Fase 1 y 2:** 

Informe de Avances 1:

* Definición de los requerimientos funcionales y no funcionales.  
* Cronograma ajustado del proyecto.  
* Definición de entornos de trabajo y justificación de tecnologías.  
* Arquitectura general del sistema y la base de datos.

### **Fase 3 – Desarrollo e Implementación por Módulos (13 semanas)** {#fase-3-–-desarrollo-e-implementación-por-módulos-(13-semanas)}

**Iteración 0 – Prototipado y refinamiento de Arquitectura (2 semanas)**

* Diseño de interfaces de usuario: presentación de mockups o wireframes de las principales vistas del sistema.  
* Arquitectura refinada del sistema y base de datos  
  **Entregable:** Informe de Avances 2: Documento de diseño \+ Modelo lógico BD \+ Prototipo.

**Iteración 1 – Módulo Registro y Seguimiento de Productos (4 semanas)**

* Refinamiento de requerimientos (específicos al módulo).  
* Diseño de base de datos y casos de uso relacionados.  
* Desarrollo del módulo.  
  * Gestión de usuarios.  
  * Implementacion de Inicio.  
  * Implementación de gestión de clientes.  
  * Gestión de productos para reparar.  
* Pruebas y validación del módulo.  
  **Entregable:** Módulo operativo \+ documentación básica.

**Iteración 2 – Módulo Procesos Administrativos y Contables (4 semanas)**

* Refinamiento de requerimientos del módulo.  
* Ajustes al modelo de datos y arquitectura.  
* Desarrollo del módulo.  
  * Registro de Comprobantes de Recepción.  
  * Registro de Órdenes de reparación y seguimiento.  
  * Estado de cuenta de clientes (órdenes, pagos, movimientos).  
  * Gestión de pagos y comprobantes.  
  * Actualización automática de movimientos.  
* Pruebas y validación del módulo.  
* Pruebas integradas con el módulo anterior.  
  **Entregable:** Módulos 1 \+ 2 funcionando en conjunto.

**Iteración 3 – Módulo Gestión de Repuestos y Productos Nuevos (4 semanas)**

* Refinamiento de requerimientos del módulo.  
* Ajustes al modelo de datos y arquitectura.  
* Desarrollo del módulo.  
  * Asociación con repuestos usados.  
  * Gestión de repuestos (stock, precios, proveedores, compatibilidades).  
  * Registro de compras de repuestos.  
  * Gestión de productos nuevos  
  * Venta directa de repuestos y productos nuevos.  
* Pruebas y validación del módulo.  
* Pruebas de integración de todo el sistema.  
  **Entregable:** Sistema completo con los 3 módulos.

### **Fase 4 – Pruebas y Validación (2 semanas)** {#fase-4-–-pruebas-y-validación-(2-semanas)}

* Pruebas unitarias, integración y aceptación por módulo.  
* Corrección de incidencias.  
  **Entregables:** Informe de pruebas \+ versión estable.

### **Fase 5 – Documentación y Entrega Final (1 semana)** {#fase-5-–-documentación-y-entrega-final-(1-semana)}

* Manual de usuario.  
* Documentación técnica del sistema.  
* Capacitación final al cliente.  
  **Entregable:** Versión final \+ Manual de usuario \+ Informe de proyecto final.

# 3\. Definición de entornos de trabajo y justificación de tecnologías {#3.-definición-de-entornos-de-trabajo-y-justificación-de-tecnologías}

## 3.1. Entornos de trabajo {#3.1.-entornos-de-trabajo}

Con la siguiente distinción de entornos de trabajo, se busca separar fases del ciclo de vida del software y asegurar calidad antes de llegar al usuario final.

**Entorno de Desarrollo**

* Utilizado por el programador para implementar el sistema.  
* **Sistema operativo de desarrollo:** Windows 11 (PC del desarrollador).  
* **IDE/Editor de código:** Visual Studio Code (por su rapidez, extensiones y soporte de múltiples lenguajes).  
* **Control de versiones:** Git con repositorio en GitHub (para historial y respaldo del código).  
* **Entorno de ejecución local:** Docker (para simular el entorno de producción con contenedores de base de datos y servidor web).  
* **Servidor web de desarrollo:** Node.js con Express (para el backend).  
* **Base de datos local:** MySQL (contenedor Docker).

**Entorno de Pruebas / Testing**

* Réplica al entorno de producción en configuración, pero aislado.  
* Permite realizar pruebas funcionales, de integración y de seguridad.  
* Facilita la detección temprana de errores antes de liberar versiones estables.

#### 

## 3.2. Justificación de Tecnologías {#3.2.-justificación-de-tecnologías}

**Lenguaje y Framework de Desarrollo**

* **Tecnología seleccionada:** Node.js con Express.   
* **Justificación:** tecnología open source, con amplia documentación, bajo costo de adopción, comunidad activa y facilidad para incorporar mejoras a futuro.

**Base de Datos**

* **Tecnología seleccionada:** MySQL.   
* **Justificación:** robusta, de libre uso, ampliamente utilizada, con buen rendimiento para el volumen de datos esperado y soporte multiplataforma.

**Frontend / Interfaz de Usuario**

* **Tecnología seleccionada:** JavaScript con React.js.   
* **Justificación:** asegura compatibilidad en cualquier navegador dentro de la red de la empresa, con una curva de aprendizaje moderada y mantenimiento ágil.  
* **Estilos:** React.js y TailwindCSS, para construir interfaces limpias y rápidas sin necesidad de un diseño gráfico especializado.

**Control de Versiones**

* **Tecnología seleccionada:** GitHub.   
* **Justificación:** servicio gratuito en su modalidad base, indispensable para trazabilidad, respaldo y trabajo colaborativo.

**Servidor de Aplicación**

* **Tecnología seleccionada:** PC de la empresa configurada con Windows como servidor local, ejecutando Node.js y MySQL como servicios permanentes en contenedores Docker.   
* **Justificación:** bajo costo de implementación inicial. En caso de crecimiento, el uso de Docker facilitará la migración a un servidor dedicado o a la nube (AWS, Azure, GCP).

**Pruebas**

* **Unitarias:** Jest, para pruebas de backend.   
* **Integración y validación de endpoints:** Postman.   
* **Funcionales:** pruebas manuales de casos de uso críticos en el entorno de pruebas.

# 4\. Arquitectura general del sistema y la base de datos {#4.-arquitectura-general-del-sistema-y-la-base-de-datos}

## 4.1. Arquitectura General del Sistema {#4.1.-arquitectura-general-del-sistema}

El sistema se basará en una arquitectura de tres capas, utilizada en el desarrollo de aplicaciones web, lo que pretende facilitar el mantenimiento, la escalabilidad y la separación de responsabilidades.

**Capa de Presentación (Frontend)**

* Será Implementada como una aplicación web responsive desarrollada con React.js y TailwindCSS.

* Accesible desde navegadores web (Firefox, Chrome, Safari) en PC y dispositivos móviles (Android/iOS).

**Capa de Lógica de Negocio (Backend)**

* Será desarrollada en Node.js con Express, alojada en un servidor local dentro de la red de la organización.

* Contendrá las reglas de negocio que regulan los procesos de:

  * Registro y seguimiento de productos en reparación.

  * Procesos administrativos y contables.

  * Gestión de repuestos y productos nuevos.

* Incluirá autenticación de usuarios, gestión de permisos y validación de datos.

**Capa de Datos (Base de Datos)**

* Gestionada mediante un DBMS relacional MySQL, ejecutado en un contenedor de Docker dentro del servidor.  
* Almacenará de manera estructurada la información necesaria para utilizar el sistema.

La comunicación entre frontend y backend se realizará mediante API REST, lo que asegura flexibilidad y escalabilidad futura, en caso de que el sistema se expanda o se integre con otros servicios externos.

## 4.2. Arquitectura de la Base de Datos {#4.2.-arquitectura-de-la-base-de-datos}

La base de datos se diseñará en un modelo relacional MySQL, con tablas que representen las entidades principales: Clientes, Órdenes de Reparación, Pagos, Repuestos, Proveedores, Movimientos de Cuenta y Comprobantes de Recepción, entre otras.

En el caso de los Comprobantes de Recepción, se incluirá la posibilidad de adjuntar fotografías tomadas al momento de la recepción del producto (válvula). Estas imágenes servirán como respaldo visual del estado inicial del producto. Dado que se trata de archivos binarios de mayor tamaño, se opta por un esquema de almacenamiento híbrido, en el cual la información estructurada permanece en la base de datos, mientras que los archivos de imagen se resguardan en el sistema de archivos del servidor.

**Estrategia de almacenamiento**

Se establece un directorio raíz destinado a los comprobantes, dentro del cual se organizarán subdirectorios de forma jerárquica, ya sea por fecha o por identificador del comprobante, con el objetivo de asegurar orden y trazabilidad. 

**Relación con la base de datos**

* La base de datos no almacenará las imágenes de manera binaria (BLOB), sino únicamente la referencia a la ruta del archivo en el sistema de archivos.

* Para ello, se define una tabla adicional, la cual mantiene la relación entre un comprobante y las imágenes vinculadas.

**Inserción y consulta**

* **Inserción**: al registrar un comprobante, el sistema permitirá asociar una o más fotografías, las cuales se almacenarán en el sistema de archivos, generando simultáneamente un registro en la tabla correspondiente.

* **Consulta**: al visualizar un comprobante, el sistema recuperará las rutas de las imágenes desde la base de datos y cargará los archivos desde el sistema de archivos para su visualización en la interfaz.

# 5\. Anexo {#5.-anexo}

Preguntas

**Preguntas sobre los procesos y funcionamiento**

**Procesos de reparación**

* ¿Cómo se registra actualmente la recepción de un producto a reparar?  
  * Si es solo uno, se le pone un papel con el nombre del cliente y se le saca una foto (no siempre se hace).  
  * Si es más de uno, se saca una foto de los productos recibidos y se los coloca en una o más cajas con papeles para identificar al cliente.

* ¿Cómo hacen el seguimiento del estado de cada reparación?  
  * Dependiendo del sector del taller en el que la válvula se encuentre. Normalmente, si se encuentra sucia en una caja, significa que no fue reparada, si la válvula está armada y limpia sobre alguna de las mesas de trabajo significa que fue reparada. Finalmente, si la válvula se encuentra en una estantería para entrega, significa que está lista para entregar. Este proceso no siempre es respetado

* ¿Qué información se registra sobre cada producto reparado?  
  * No se registra información sobre el producto, solo es registrado en un remito de entrega/orden de reparación y una factura.

* ¿Cómo se gestiona la entrega al cliente y se registra que fue entregado?  
  * Se notifica al cliente mediante whatsapp o llamada y se registra que fue entregado mediante una orden de reparación.

**Gestión de stock y repuestos**

* ¿Tienen un inventario actualizado de productos nuevos o repuestos?  
  * No

* ¿Qué hacen cuando se quedan sin stock? ¿Cómo detectan faltantes?  
  * Las faltantes de stock se detectan al momento de necesitar los repuestos o al momento de utilizar el último repuesto en el mejor de los casos. Si no hay stock de un repuesto, la válvula queda pendiente de ser reparada.

* ¿Cómo eligen a qué proveedor comprar y cómo registran esas compras?  
  * La elección del proveedor depende de la calidad del producto, el precio y disponibilidad de tipos de repuestos del proveedor. No se registran esas compras, solo se guardan las facturas por cuestiones tributarias.

**Precios y facturación**

* ¿Cómo determinan el precio de un trabajo o producto nuevo?  
  * El precio se determina en función del tiempo de reparación, costo de repuestos, valor de la válvula nueva y complejidad de la válvula.

* ¿Dónde registran los precios para cada cliente?  
  * Los precios están registrados en una lista de precios, en algunos casos este precio se respeta y en otros no.

* ¿Cómo generan la factura o resumen de cuenta? ¿Se hace a mano?  
  * La factura se hace en el sistema de ARCA y el resumen de cuenta se hace a mano (a mano significa utilizando planillas de cálculo Excel simples).

* ¿Cómo se relacionan los remitos con las facturas?  
  * La relación entre remitos/órdenes de reparación y facturas se hace en ambos documentos, en la orden de reparación se anota a qué factura está asociada y en la factura queda registrada la orden de reparación que se facturó.

**Comunicación con el cliente**

* ¿Se le informa al cliente cuáles productos fueron recibidos para evitar problemas?  
  * No.

* ¿Cómo se informa al cliente que su producto está listo?  
  * Por whatsapp o llamada.

* ¿Cómo hacen el seguimiento con el cliente si no retira un producto?  
  * Se notifica varias veces, si luego de algunos meses el cliente no retira el producto, el mismo se utiliza como si fuera propio.

**Documentación y control administrativo**

* ¿Qué tipo de documentos generan (remitos, comprobantes, reportes)?  
  * Ordenes de reparación/Remitos

* ¿Tienen registros históricos de trabajos realizados?  
  * Si, las Órdenes de reparación.

* ¿Qué pasa si necesitan saber cuántos productos se repararon en un mes?  
  * Se cuentan las bolsas de repuestos usadas.

**Preguntas para encontrar requerimientos funcionales**

* ¿Qué funcionalidades mínimas debería tener el sistema desde el punto de vista del operario?  
  * Dashboard de estados de productos por cliente (Productos entregados, productos recibidos, productos reparados).  
  * Estado de inventarios de repuestos y de productos nuevos.  
  * Asociar número de remito/orden de reparación con producto.

* ¿Qué funcionalidades necesitaría un usuario que gestiona la parte administrativa?  
  * Precios automáticos al elegir la válvula a remitir o facturar.  
  * Estados de cuenta de clientes.  
  * Liquidaciones automáticas para enviar a clientes.

* ¿Qué información debe poder cargarse y consultarse sobre cada producto?  
  * Del negocio: Precio. Modelo. Estado en el que se encuentra. Repuestos y sus costos.  
  * Sobre la trazabilidad: Fecha de recepción. Cliente. Fecha de reparación. Fecha de entrega.

* ¿Qué tipos de usuarios van a existir en el sistema?  
  * Administrador  
  * Administrativo.  
  * Operario.

**Preguntas para encontrar requerimientos no funcionales**

Estos se refieren a **la calidad, restricciones y condiciones técnicas** del sistema:

* ¿Desde qué dispositivos se quiere acceder al sistema? (PC, teléfono, tablet)  
  * PC y Smartphone (Android y IOS)

* ¿Qué nivel de seguridad se espera? ¿Se necesita autenticación por usuario?  
  * Nivel de seguridad media/baja. Se necesita autenticación.

* ¿Cuántos usuarios lo usarán al mismo tiempo?  
  * 3 usuarios como máximo.

* ¿Cuánto tiempo se puede tolerar de inactividad del sistema?  
  * 24hs

* ¿Qué tipo de respaldo de datos se espera?  
  * Backup semanales

* ¿Se espera poder usar el sistema sin conexión a internet?  
  * Si

* ¿Qué tan importante es la velocidad de respuesta del sistema?  
  * Baja

* ¿Se va a usar dentro de una red local o también desde Internet?  
  * Red local.

* ¿Se requiere que los datos estén cifrados?  
  * No.
