**UNIVERSIDAD TECNOLÓGICA NACIONAL**

**FACULTAD REGIONAL DE SANTA FE**

**Informe de Avances Número 3**

**Desarrollo de un sistema de gestión de stock de productos nuevos y a reparar para un taller mecánico**

**Integrante:**	Tourn, Federico Paulino \- [fedetourn1@gmail.com](mailto:fedetourn1@gmail.com)

**Director:**		García Flappo, Pablo \- [pablo.garcia.flappo@gmail.com](mailto:pablo.garcia.flappo@gmail.com)

**Fecha de**		  
**Entrega:**		05/11/2025

Año 2025

Índice de contenidos

[**Introducción	2**](#introducción)

[**1\. Prototipo funcional de las interfaces principales	3**](#1.-prototipo-funcional-de-las-interfaces-principales)

[1.1. Gestión de Usuarios e Inicio	3](#1.1.-gestión-de-usuarios-e-inicio)

[1.2. Gestión de productos para reparar	7](#1.2.-gestión-de-productos-para-reparar)

[1.3. Implementación de gestión de clientes	9](#1.3.-implementación-de-gestión-de-clientes)

[**2\. Integración preliminar con la base de datos	12**](#2.-integración-preliminar-con-la-base-de-datos)

[**3\. Plan de trabajo para el siguiente ciclo	14**](#3.-plan-de-trabajo-para-el-siguiente-ciclo)

[3.1. Cronograma Ajustado Restante	14](#3.1.-cronograma-ajustado-restante)

[Fase 1 – Análisis y Definición de Requerimientos (Completa)	14](#fase-1-–-análisis-y-definición-de-requerimientos-\(completa\))

[Fase 2 – Diseño de Arquitectura y Base de Datos (Completa)	14](#fase-2-–-diseño-de-arquitectura-y-base-de-datos-\(completa\))

[Fase 3 – Desarrollo e Implementación por Módulos (10 semanas restantes)	14](#fase-3-–-desarrollo-e-implementación-por-módulos-\(10-semanas-restantes\))

[Fase 4 – Pruebas y Validación (3 semanas)	15](#fase-4-–-pruebas-y-validación-\(3-semanas\))

[Fase 5 – Documentación y Entrega Final (2 semana)	15](#fase-5-–-documentación-y-entrega-final-\(2-semana\))

# Introducción {#introducción}

El presente documento corresponde al **Entregable N.º 3** del proyecto denominado “*Desarrollo de un sistema de gestión de stock de productos nuevos y a reparar para un taller mecánico*”. De acuerdo con lo establecido en el plan de proyecto, la elaboración de este entregable se llevó a cabo durante el cuarto mes de ejecución y abarca los siguientes contenidos:

* Prototipo funcional de las interfaces principales: incluye navegación básica e implementación parcial de pantallas operativas.  
* Integración preliminar con la base de datos: permite la visualización de datos reales o simulados.  
* Observaciones y ajustes efectuados tras las pruebas iniciales.  
* Plan de trabajo para el ciclo subsiguiente: detalla los módulos a implementar, las dificultades encontradas y las nuevas decisiones técnicas adoptadas.

El proyecto tiene como finalidad el diseño e implementación de un sistema informático orientado a la optimización de los procesos de recepción, reparación y entrega de productos en un taller, así como la estandarización de la venta de productos nuevos y la garantía de coherencia en la definición de precios para el cliente **SERVICIOS NEUMATICOS** (Razón Social: Tourn Mauricio).

Según el cronograma definido en el Informe de Avances N.º 1, el desarrollo del presente informe se enmarca en la implementación del Módulo Registro y Seguimiento de Productos. Dicho módulo comprendió las siguientes actividades:

* Refinamiento de los requerimientos específicos vinculados al Registro y Seguimiento de Productos.  
* Diseño de la base de datos y de los casos de uso asociados.  
* Desarrollo del módulo, que incluyó:  
  * Gestión de usuarios.  
  * Implementación de la funcionalidad de Inicio.  
  * Implementación de la gestión de clientes.  
  * Gestión de productos para reparar.  
* Pruebas y validación del módulo.

Los requerimientos establecidos en el Informe de Avances N.º 1 sirvieron como fundamento y guía para el desarrollo de esta iteración. No obstante, es pertinente señalar que los mismos experimentaron modificaciones durante el proceso de desarrollo. Dichos ajustes y observaciones, originados por el diálogo con el cliente o por consideraciones técnicas, se encuentran detallados en relación con los diversos componentes del módulo (tales como interfaces o tablas de base de datos) y no han sido centralizados en una sección específica.

Con la presentación de este informe de avances, se considera finalizado el Módulo 1 \- Registro y seguimiento de productos en reparación. Sin embargo, la implementación del módulo está sujeta a posibles alteraciones futuras, ya sea por requerimientos adicionales del cliente o por aspectos técnicos emergentes.

# 1\. Prototipo funcional de las interfaces principales {#1.-prototipo-funcional-de-las-interfaces-principales}

La navegacion basica del sistema incluye interfaces que le permitan al usuario realizar las siguientes actividades:

* **Gestionar los usuarios.**

  El sistema debe permitir al usuario el alta, baja y modificación de usuarios, así como el acceso seguro al sistema mediante el uso de credenciales de acceso.


* **Gestión de productos para reparar.**

  El sistema debe permitir al usuario el alta, baja y modificación de productos, así como la consulta de los productos cargados en el sistema y la búsqueda y filtrado de dicha consulta.


* **Implementación de gestión de clientes.**

  El sistema debe permitir al usuario el alta, baja y modificación de clientes, así como la consulta de los clientes en el sistema y la búsqueda y filtrado de dicha consulta.


  
A continuación se detallan imágenes de las interfaces implementadas:

## 1.1.	Gestión de Usuarios e Inicio {#1.1.-gestión-de-usuarios-e-inicio}

**Interfaz de Login**  
Esta interfaz implementa los requerimientos **Inicio de sesión** y **Credenciales**, definidos en el informe de avances 1\.

**Interfaz de Configuración**  
La pestaña de configuración brinda funcionalidades secundarias, que tienen que ver con la administración del sistema, más que con el uso del mismo.  

**Interfaz de Consulta de Usuarios**  
Permite consultar los usuarios registrados, además permite dar de alta nuevos usuarios o modificar los usuarios existentes.

**Interfaz Dar de Alta Usuario**  
Esta interfaz permite registrar nuevos usuarios, ingresando nombre completo, nombre de usuario, contraseña y rol (Requerimientos **Alta de Usuarios** y **Asignación de Roles**).  

**Interfaz para Modificar Usuario**  
Permite modificar los datos de los usuarios existentes y habilitar o deshabilitar usuarios (Requerimientos **Modificación de Usuarios** y **Habilitacion de usuarios**).

**Interfaz para Vistas no desarrolladas**  
Para aumentar la información brindada al usuario, se decidió incluir mensajes de “En construcción” para las funcionalidades no implementadas.

**Interfaz de Inicio**  
Representa la pantalla principal del sistema, de esta derivan la mayoría de las pantallas con las que el usuario puede interactuar, dicha interfaz implementa los requerimientos **Interfaz de inicio**, Accesos dashboard e Información Dashboard, es necesario aclarar que al momento de la entrega no se definió con el cliente la información que debe ser presentada en el Inicio, debido a esto, dicha sección se encuentra pendiente de implementación.

## 1.2.	Gestión de productos para reparar {#1.2.-gestión-de-productos-para-reparar}

**Interfaz de Consulta de Productos a Reparar**  
La pantalla **Productos a Reparar** provee al usuario un listado general de productos, el cual presenta un registro completo de los productos ingresados al sistema, mostrando sus datos más relevantes como tipo, modelo, cliente asociado, fecha de recepción y estado actual, dichas categorías fueron definidas con el cliente y están sujetas a cambios. El usuario puede ordenar los registros por distintos campos (modelo, cliente, fecha o estado) y aplicar filtros de búsqueda para localizar rápidamente productos específicos, lo cual satisface el requerimiento **Consulta de productos** definido en etapas anteriores.

**Interfaz de detalle / Modificar producto**  
Esta interfaz es accesible desde el listado de productos a reparar (**Requerimiento Consulta de productos**) y permite modificar la información de un producto registrado (**Requerimiento** **Modificación de productos para atributos diferentes de estado**), actualmente permite modificar las observaciones y el estado, las transiciones de estado posibles fueron definidas según reglas de negocio del taller, dichas transiciones son:

*   Recibido → Todos los estados son alcanzables.  
  *   En Reparación → Todos los estados son alcanzables, exceptuando Recibido.  
  *   Reparado → Entregado o Libre.  
  *   Entregado → Sin transiciones válidas.  
  *   No Reparable → Entregado o Libre  
  *   Libre → Todos los estados son alcanzables, exceptuando Recibido

  Dichas transiciones de estado satisfacen el requerimiento **Cambios de estado de los productos.**

**Interfaz para Registrar Recepción de Productos**  
El sistema implementa la recepción de productos de forma simplificada, debido a que dicha función será desarrollada en el futuro haciendo uso de Comprobantes de Recepción, actualmente implementa parcialmente el requerimiento **Registro de productos recibidos**.

## 

## 1.3.	Implementación de gestión de clientes {#1.3.-implementación-de-gestión-de-clientes}

**Interfaz para Consulta de Clientes registrados**  
La interfaz provee al usuario un listado de clientes cargados en el sistema, mostrando sus datos más relevantes como nombre, dirección, CUIT, categoría y teléfonos, dichas categorías fueron definidas con el cliente y están sujetas a cambios. El usuario puede ordenar los registros por distintos campos (Nombre, Dirección, CUIT, Categoría) y aplicar filtros de búsqueda, lo cual satisface los requerimientos **Consulta de clientes** y **Búsqueda de clientes** definidos en etapas anteriores.

**Interfaz para Agregar Clientes**  
Mediante esta interfaz, el sistema permite registrar clientes nuevos, detallando Apellido y nombre, CUIT, Categoría,  Provincia y ciudad de domicilio de forma obligatoria. Actualmente no se encuentra definido un criterio de validación de unicidad de clientes, dicho criterio se definirá en etapas posteriores. Esta interfaz implementa parcialmente el requerimiento **Registro de clientes nuevos**.

**Interfaz para Modificar Cliente**  
Esta interfaz es accesible desde el listado de clientes (Requerimiento **Consulta de Clientes**) y permite modificar la información de un cliente registrado (Requerimiento **Modificación de clientes**), actualmente permite modificar los campos de dirección, Email, Categoría del cliente y los distintos teléfonos asociados. A su vez, incorpora la funcionalidad de **deshabilitación de clientes**.

# 2\. Integración preliminar con la base de datos {#2.-integración-preliminar-con-la-base-de-datos}

El desarrollo de la base de datos se realizó conforme a la metodología presentada en el plan de proyecto, teniendo eso en cuenta, se incorporaron las siguientes tablas y relaciones a la base de datos para el desarrollo del **Módulo 1 \- Registro y seguimiento de productos en reparación**.

A continuación se detallan las diferencias entre el diseño definido en el Informe de Avances 2 y la implementación actual.

* **Incorporación de tablas User y Role**: Fueron incorporadas para el manejo de usuarios y roles en el sistema.  
* **Cambios en tabla Producto**:  
  * Eliminación de atributo tipo: La presencia del atributo tipo en la tabla Producto puede traer problemas de consistencia a la hora de cargar productos al sistema.  
  * Eliminación de atributo precio: Será manejado por la tabla PrecioPorCategoria.  
* **Cambios es tabla Cliente:**  
  * *Incorporación del campo categoría*: FK proveniente de relación con CategoriaCliente, necesaria para manejo de precios.  
  * *Incorporación del atributo is\_active*: Permite identificar si el Cliente fue “eliminado” del sistema. Cuando un cliente es dado de baja no se elimina de la base de datos, el campo is\_active es marcado en 0 para no perder el historial de transacciones con el mismo.  
  * *Incorporación del campo updated\_at*: Lleva registro de las modificaciones realizadas a las entidades Cliente.  
* **Incorporación de tabla CategoriaCliente**: Registra las Categorías de clientes disponibles con id y nombre, para facilitar la gestión de categorías de clientes.  
* **Incorporación de tabla PrecioPorCategoria**: Asocia las tablas ModeloProducto y CategoriaCliente para facilitar la gestión de precios de los distintos productos.

# 3\. Plan de trabajo para el siguiente ciclo {#3.-plan-de-trabajo-para-el-siguiente-ciclo}

Como se ha detallado previamente, el desarrollo del sistema se estructuró en tres módulos fundamentales:

1. Registro y seguimiento de productos en reparación.  
2. Procesos administrativos y contables.  
3. Gestión de repuestos y productos nuevos.

Se informa que el **Módulo 1 (Registro y seguimiento de productos en reparación)** ha sido finalizado, lo cual implica la conclusión de las Fases 1 y 2 según el cronograma establecido en el informe de avances anterior.

Las fases restantes para la culminación del proyecto son:

* Fase 3: Desarrollo e Implementación por Módulos (Iteraciones 2 y 3\)  
* Fase 4: Pruebas y Validación  
* Fase 5: Documentación y Entrega Final.

Se ha determinado la necesidad de **ajustar la duración** de las etapas pendientes debido a que los plazos originales se han demostrado insuficientes.

## 3.1. Cronograma Ajustado Restante {#3.1.-cronograma-ajustado-restante}

### **Fase 1 – Análisis y Definición de Requerimientos (Completa)** {#fase-1-–-análisis-y-definición-de-requerimientos-(completa)}

### **Fase 2 – Diseño de Arquitectura y Base de Datos (Completa)** {#fase-2-–-diseño-de-arquitectura-y-base-de-datos-(completa)}

### **Fase 3 – Desarrollo e Implementación por Módulos (10 semanas restantes)** {#fase-3-–-desarrollo-e-implementación-por-módulos-(10-semanas-restantes)}

**Iteración 0 – Prototipado y refinamiento de Arquitectura (Completa)**

**Iteración 1 – Módulo Registro y Seguimiento de Productos (Completa)**

**Iteración 2 – Módulo Procesos Administrativos y Contables (5 semanas)**

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

**Iteración 3 – Módulo Gestión de Repuestos y Productos Nuevos (5 semanas)**

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

### **Fase 4 – Pruebas y Validación (3 semanas)** {#fase-4-–-pruebas-y-validación-(3-semanas)}

* Pruebas unitarias, integración y aceptación por módulo.  
* Corrección de incidencias.  
  **Entregables:** Informe de pruebas \+ versión estable.

### **Fase 5 – Documentación y Entrega Final (2 semana)** {#fase-5-–-documentación-y-entrega-final-(2-semana)}

* Manual de usuario.  
* Documentación técnica del sistema.  
* Capacitación final al cliente.  
  **Entregable:** Versión final \+ Manual de usuario \+ Informe de proyecto final.