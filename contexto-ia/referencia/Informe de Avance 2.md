**UNIVERSIDAD TECNOLÓGICA NACIONAL**

**FACULTAD REGIONAL DE SANTA FE**

**Informe de Avances Número 2**

**Desarrollo de un sistema de gestión de stock de productos nuevos y a reparar para un taller mecánico**

**Integrante:**	Tourn, Federico Paulino \- [fedetourn1@gmail.com](mailto:fedetourn1@gmail.com)

**Director:**		García Flappo, Pablo \- [pablo.garcia.flappo@gmail.com](mailto:pablo.garcia.flappo@gmail.com)

**Fecha de**		  
**Entrega:**		08/10/2025

Año 2025

Índice de contenidos

[**Introducción	2**](#introducción)

[**1\. Arquitectura refinada de la base de datos	3**](#1.-arquitectura-refinada-de-la-base-de-datos)

[1.1. Definición del modelo de base de datos	3](#1.1.-definición-del-modelo-de-base-de-datos)

[1.2. Interpretación Funcional Del Modelo	6](#1.2.-interpretación-funcional-del-modelo)

[**2\. Diseño de interfaces de usuario	7**](#2.-diseño-de-interfaces-de-usuario)

[2.1. Interfaces Principales Módulo de Registro y seguimiento de productos	7](#2.1.-interfaces-principales-módulo-de-registro-y-seguimiento-de-productos)

[2.2. Interfaces Preliminares Módulo de Procesos administrativos y contables	10](#2.2.-interfaces-preliminares-módulo-de-procesos-administrativos-y-contables)

[2.3. Interfaces Preliminares Módulo de Gestión de repuestos y productos nuevos	11](#2.3.-interfaces-preliminares-módulo-de-gestión-de-repuestos-y-productos-nuevos)

[**3\. Anexo	13**](#3.-anexo)

# Introducción {#introducción}

El presente documento corresponde al **Entregable N.º 2** del proyecto “*Desarrollo de un sistema de gestión de stock de productos nuevos y a reparar para un taller mecánico*”. Tal como se definió en el plan de proyecto, este entregable fue desarrollado en el mes 3 del proyecto y se abordan los siguientes contenidos:

* Arquitectura refinada de la base de datos.  
* Diseño de interfaces de usuario: presentación de mockups o wireframes de las principales vistas del sistema.

El proyecto tiene como objetivo diseñar e implementar un sistema informático que permita optimizar los procesos de recepción, reparación y entrega de productos en un taller, así como estandarizar la venta de productos nuevos y asegurar la coherencia en la definición de precios para el cliente **SERVICIOS NEUMATICOS** (Razón Social: Tourn Mauricio).

Finalmente, como se mencionó en documentos anteriores, la metodología de desarrollo del proyecto está basada en un modelo incremental con enfoque iterativo, este segundo entregable se centra en el **diseño del sistema y de la base de datos**, sirviendo como una base más detallada para el desarrollo posterior, pero no se descartan modificaciones futuras.

# 1\. Arquitectura refinada de la base de datos {#1.-arquitectura-refinada-de-la-base-de-datos}

En sistemas web la base de datos representa un pilar imprescindible para el buen funcionamiento de la aplicación, debido a que la mayoría de las interacciones que tiene el usuario con el sistema es la creación, consulta y modificación de la información almacenada en dicha base de datos.

## 1.1. Definición del modelo de base de datos {#1.1.-definición-del-modelo-de-base-de-datos}

A continuación se realiza un detalle de las tablas presentes en la base de datos y la función que cumplen cada una de ellas, en el Anexo se encuentra una [imagen con el diagrama de Tablas](#3.-anexo).

**1\. Cliente**  
Propósito: Representa a los clientes del taller.  
 Campos principales:

* IdCliente (PK): Identificador único del cliente.  
* Nombre, Dirección, CUIT, Email: Datos personales y de contacto.

**2\. TelefonoCliente**  
Propósito: Almacena los números de teléfono asociados a cada cliente.  
 Campos principales:

* Teléfono (PK): Número del cliente.  
* IdCliente (PK, FK): Relaciona con la tabla Cliente.  
* Descripción: Detalle del número (personal, laboral, etc.).

**3\. Pago**  
Propósito: Registra los pagos realizados por los clientes.  
 Campos principales:

* IdPago (PK)  
* FechaRegistro, Monto, MedioDePago, Descripción  
* IdCliente (FK): Cliente que realizó el pago.

**4\. ComprobanteRecepcion**  
Propósito: Guarda información de los comprobantes asociados a la recepción de productos.  
 Campos principales:

* IdComprobante (PK)  
* FechaRecepcion, RutaImagen, Descripción  
* IdCliente (FK): Cliente que entrega el o los productos.

**5\. Producto**  
Propósito: Registra los productos (piezas, componentes, válvulas, etc.) que ingresan al taller para ser reparados.  
 Campos principales:

* Id Producto (PK)  
* Tipo, Modelo (FKs): Para evitar inconsistencias se decidió que los posibles tipos y modelos se encuentren registrados y sean asociados al producto.  
* FechaRecepcion, FechaReparacion, FechaEntrega.  
* Precio, Observaciones  
* Estado (FK): Para evitar inconsistencias y simplificar el manejo futuro de los productos se decidió incluir una tabla con los posibles estados que un producto puede alcanzar.  
* IdComprobanteRecepcion (FK): Asocia el producto a un comprobante de recepción.  
* IdCliente (FK): Asocia el producto a un cliente.  
* IdOrdenReparacion (FK): Asocia el cliente a una orden de reparación.

**6\. TipoProducto**  
Propósito: Define las categorías generales de productos (ej. válvula, bomba, inyector).  
 Campos principales:

* IdTipo (PK)  
* Nombre

**7\. ModeloProducto**  
Propósito: Define los modelos específicos dentro de un tipo de producto.  
 Campos principales:

* IdModelo (PK)  
* Nombre  
* Tipo (FK a TipoProducto)

**8\. EstadoProducto**  
Propósito: Define los posibles estados de un producto (ej. recibido, en reparación, terminado, entregado).  
 Campos principales:

* IdEstado (PK)  
* Nombre

**9\. HistorialEstados**  
Propósito: Registra los cambios de estado de cada producto.  
 Campos principales:

* IdHistorial (PK)  
* FechaCambio  
* Producto (FK a Producto)  
* EstadoAnterior, EstadoNuevo (FKs a EstadoProducto)

**10\. OrdenReparacion**  
Propósito: Representa una orden de reparación asociada a un cliente.  
 Campos principales:

* IdOrdenReparacion (PK)  
* FechaCreacion, PrecioTotal, Observaciones  
* Estado (FK a EstadoOrdenReparacion)  
* IdCliente (FK)

**11\. EstadoOrdenReparacion**  
Propósito: Define los estados posibles de una orden de reparación (ej. abierta, en curso).  
 Campos principales:

* IdEstado (PK)  
* Nombre

**12\. OrdenDetalleRepuesto**  
Propósito: Define los repuestos vendidos en una orden de reparación, los cuales son vendidos como repuestos y no dentro de un producto reparado.  
 Campos principales:

* IdOrdenReparacion (PK, FK)  
* IdRepuesto (PK, FK)  
* PrecioUnidad, Cantidad

**13\. Repuesto**  
Propósito: Contiene la información de los repuestos disponibles.  
 Campos principales:

* IdRepuesto (PK)  
* Nombre, StockDisponible

**14\. Proveedor**  
Propósito: Almacena los datos de los proveedores de repuestos.  
 Campos principales:

* IdProveedor (PK)  
* Nombre, Dirección, CUIT, Email

**15\. TelefonoProveedor**  
Propósito: Registra los teléfonos de los proveedores.  
 Campos principales:

* IdProveedor (PK, FK)  
* Telefono (PK)  
* Descripcion

**16\. ProveedorRepuesto**  
Propósito: Relaciona los proveedores con los repuestos que ofrecen.  
 Campos principales:

* IdProveedor (PK, FK)  
* IdRepuesto (PK, FK)  
* CodigoProveedor, Precio

**17\. RepuestoProducto**  
Propósito: Relaciona los repuestos utilizados con los productos reparados.  
 Campos principales:

* IdProducto (PK, FK)  
* IdRepuesto (PK, FK)  
* Precio

## 1.2. Interpretación Funcional Del Modelo {#1.2.-interpretación-funcional-del-modelo}

Este modelo representa al sistema de gestión integral para un taller mecánico especializado en reparación de productos y manejo de stock.

El flujo funcional es el siguiente:

1. **Gestión de Clientes:**  
    Se registran clientes con sus datos de contacto y teléfonos. Cada cliente puede tener múltiples órdenes de reparación y comprobantes de recepción.

2. **Ingreso de Producto:**  
   Al recibir un producto de un cliente, se genera un *ComprobanteRecepcion* y se registra el *Producto* con su tipo, modelo y estado inicial, entre otras características.

3. **Gestión del Proceso de Reparación:**  
   Cada producto puede formar parte de una *OrdenReparacion*, que agrupa varios productos o tareas del mismo cliente.  
   * La orden tiene un *EstadoOrdenReparacion* (ej. abierta, cerrada).  
   * Los productos tienen un *EstadoProducto*, que puede cambiar y queda registrado en *HistorialEstados*.

4. **Control de Repuestos:**  
   Los productos pueden requerir repuestos, registrados en *RepuestoProducto*.  
   Los repuestos están asociados a *Proveedores* (tabla *ProveedorRepuesto*), con información sobre precios y códigos.

5. **Pagos y Facturación:**  
   Los *Pagos* asociados a los clientes permiten llevar control de los cobros según los servicios prestados.

6. **Trazabilidad y Control:**  
   Gracias a *HistorialEstados*, se puede auditar el ciclo de vida de cada producto (desde recepción hasta entrega).  
    Además, se puede rastrear qué repuestos se usaron en cada reparación y de qué proveedor provienen.

# 2\. Diseño de interfaces de usuario {#2.-diseño-de-interfaces-de-usuario}

A continuación se muestran una serie de interfaces de usuario para las pestañas principales del **Módulo 1: Registro y seguimiento de productos en reparación**, el cual fue presentado en documentos anteriores. Además, se presentan diseños preliminares de interfaces del **Módulo 2: Procesos administrativos y contables** y del **Módulo 3: Gestión de repuestos y productos nuevos**, respectivamente.

Es necesario aclarar que el diseño de las interfaces fue revisado con el cliente pero está sujeto a modificaciones.

## 2.1. Interfaces Principales Módulo de Registro y seguimiento de productos {#2.1.-interfaces-principales-módulo-de-registro-y-seguimiento-de-productos}

**Interfaz de Inicio**  

**Interfaz de consulta de Productos registrados**  

**Interfaz de Registro de productos a reparar**  

**Interfaz para consulta de Clientes registrados**  

**Interfaz para registro de nuevo cliente**  

## 2.2. Interfaces Preliminares Módulo de Procesos administrativos y contables  {#2.2.-interfaces-preliminares-módulo-de-procesos-administrativos-y-contables}

**Interfaz para Consulta de comprobantes de recepción**  

**Interfaz para Creación de Orden de reparación**  

**Interfaz para Consulta de Órdenes de reparación**  

## 2.3. Interfaces Preliminares Módulo de Gestión de repuestos y productos nuevos {#2.3.-interfaces-preliminares-módulo-de-gestión-de-repuestos-y-productos-nuevos}

**Interfaz para Consulta de Repuestos registrados**  

**Interfaz para Consulta de Productos Nuevos Registrados**  

# 3\. Anexo {#3.-anexo}


## Imagen 1\. Diagrama de Tablas de la base de datos.