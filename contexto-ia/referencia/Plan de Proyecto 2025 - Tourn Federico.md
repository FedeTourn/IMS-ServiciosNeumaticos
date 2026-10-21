**UNIVERSIDAD TECNOLÓGICA NACIONAL**

**FACULTAD REGIONAL DE SANTA FE**

**Plan de Proyecto Final de Carrera**

**Desarrollo de un sistema de gestión de stock de productos nuevos y a reparar para un taller mecánico**

**Integrante:**	Tourn, Federico Paulino \- [fedetourn1@gmail.com](mailto:fedetourn1@gmail.com)

	

**Director:** García Flappo, Pablo \- [pablo.garcia.flappo@gmail.com](mailto:pablo.garcia.flappo@gmail.com)

Año 2025

Índice de contenidos

[**1\. Datos PFC	2**](#1.-datos-pfc)

[**2\. Delimitación del tema/problema	2**](#2.-delimitación-del-tema/problema)

[2.1. Objetivo General	2](#2.1.-objetivo-general)

[2.2. Objetivos Específicos	2](#2.2.-objetivos-específicos)

[2.3. Alcance	3](#2.3.-alcance)

[2.4. Población	4](#2.4.-población)

[2.5. Áreas de conocimiento	4](#2.5.-áreas-de-conocimiento)

[**3\. Fundamentación y Justificación	5**](#3.-fundamentación-y-justificación)

[3.1. Fundamentación	5](#3.1.-fundamentación)

[3.2. Justificación	5](#3.2.-justificación)

[**4\. Aportes	7**](#4.-aportes)

[**5\. Metodología	8**](#5.-metodología)

[5.1. Modelo de desarrollo	8](#5.1.-modelo-de-desarrollo)

[5.2. Organización del proyecto	8](#5.2.-organización-del-proyecto)

[5.3. Etapas del desarrollo	8](#5.3.-etapas-del-desarrollo)

[5.3.1. Análisis y especificación de requerimientos	8](#5.3.1.-análisis-y-especificación-de-requerimientos)

[5.3.2. Diseño del sistema y de la base de datos	8](#5.3.2.-diseño-del-sistema-y-de-la-base-de-datos)

[5.3.3. Desarrollo e implementación de módulos funcionales	8](#5.3.3.-desarrollo-e-implementación-de-módulos-funcionales)

[5.3.4. Pruebas y validación	9](#5.3.4.-pruebas-y-validación)

[5.3.5. Documentación y entrega	9](#5.3.5.-documentación-y-entrega)

[5.4. Herramientas y tecnologías	9](#5.4.-herramientas-y-tecnologías)

[5.5. Validación del sistema	9](#5.5.-validación-del-sistema)

[**6\. Fechas estimadas	11**](#6.-fechas-estimadas)

[**7\. Cronograma del proyecto	11**](#7.-cronograma-del-proyecto)

[7.1. Informes de Avance Planificados	11](#7.1.-informes-de-avance-planificados)

[**8\. Estimación de duración del proyecto	13**](#8.-estimación-de-duración-del-proyecto)

[**9\. Plan de monitoreo del proyecto	13**](#9.-plan-de-monitoreo-del-proyecto)

[**10\. Plan de Gestión de Riesgos e Impacto Ambiental	14**](#10.-plan-de-gestión-de-riesgos-e-impacto-ambiental)

[10.1. Matriz de probabilidad e impacto	14](#10.1.-matriz-de-probabilidad-e-impacto)

[10.2. Análisis de Riesgos Específicos	14](#10.2.-análisis-de-riesgos-específicos)

[10.2.1. Desviación del alcance original	14](#10.2.1.-desviación-del-alcance-original)

[10.2.2. Desbalance entre etapas del proyecto	15](#10.2.2.-desbalance-entre-etapas-del-proyecto)

[10.2.3. Falta de validación continua	15](#10.2.3.-falta-de-validación-continua)

[10.2.4. Cambios de requerimientos en etapas avanzadas	16](#10.2.4.-cambios-de-requerimientos-en-etapas-avanzadas)

[10.2.5. Dependencia del conocimiento tácito del cliente	16](#10.2.5.-dependencia-del-conocimiento-tácito-del-cliente)

[10.3. Impacto Ambiental	17](#10.3.-impacto-ambiental)

[**11\. Referencias	19**](#11.-referencias)

# 1\. Datos PFC {#1.-datos-pfc}

El que suscribe **TOURN, FEDERICO PAULINO**, alumno de la carrera Ingeniería en Sistemas de Información, L.U.: **26080**, correo electrónico **fedetourn1@gmail.com** solicita autorización para iniciar el Proyecto Final de Carrera sobre el tema **Desarrollo de un sistema de gestión de stock de productos nuevos y a reparar para un taller mecánico**, y propone como Director/a del mismo a **GARCÍA FLAPPO, PABLO**.

# 2\. Delimitación del tema/problema {#2.-delimitación-del-tema/problema}

## 2.1. Objetivo General {#2.1.-objetivo-general}

Diseñar e implementar un sistema informático para la gestión de stock de productos en reparación y productos nuevos, que permita optimizar los procesos de recepción, reparación y entrega, así como estandarizar la venta de productos nuevos y asegurar la coherencia en la definición de precios para el cliente SERVICIOS NEUMATICOS \- Razón Social: Tourn Mauricio.

## 2.2. Objetivos Específicos {#2.2.-objetivos-específicos}

* Desarrollar un módulo de registro y seguimiento de productos en reparación, que permita gestionar su trazabilidad desde la recepción hasta la entrega final al cliente.

* Desarrollar un módulo de control de stock de productos nuevos y repuestos, que facilite el seguimiento de existencias, la identificación de faltantes y la optimización de las compras a proveedores.

* Desarrollar un módulo que permita automatizar la generación de documentos comerciales, como remitos, comprobantes de entrega y reportes de facturación, para simplificar las tareas administrativas.

* Diseñar una base de datos que permita almacenar y gestionar de manera eficiente la información de productos, clientes, reparaciones y stocks, integrándose la misma con el sistema de gestión.  
    
* Integrar el sistema con APIs de mensajería, como correo electrónico o WhatsApp, para automatizar el envío de notificaciones sobre recepción, avance de reparación y la entrega de productos a los clientes.

## 2.3. Alcance {#2.3.-alcance}

Al tratarse de un proyecto de desarrollo e implementación de un sistema de software, el alcance del mismo prevé el desarrollo del sistema circunscripto en las etapas conocidas del desarrollo de sistemas. 

Respecto al análisis, se pretende realizar un estudio de los procesos, tecnologías y soluciones con las que cuenta el cliente actualmente con el objetivo de que el nuevo sistema no entre en conflicto con los procesos de negocio que desempeña la organización. Además se prevé contar con requerimientos para el desarrollo del sistema, los cuales serán obtenidos a partir de entrevistas e intercambios con el personal de la organización.

Con relación al diseño, se espera diagramar una arquitectura del sistema que cumpla con los requerimientos del cliente (Servicios Neumáticos) y permita que los procesos de negocio se desarrollen de manera fluida, a su vez se prevé definir una estructura de base de datos que brinde soporte al funcionamiento del sistema. Además, se espera presentar mockups que permitan al cliente validar las interfaces gráficas y la experiencia de usuario previo a la implementación del sistema.

Asociado a la implementación, el sistema deberá incluir funcionalidades principales como el registro de recepción de productos a reparar, junto con el seguimiento del estado de reparación de cada producto. Además, deberá permitir la emisión de correos electrónicos automáticos para informar a los clientes sobre la recepción y entrega de los productos. También se prevé la incorporación de módulos que gestionen el stock de productos nuevos y repuestos, facilitando su administración y control, además de ofrecer herramientas para la actualización de precios de productos y servicios. Asimismo, el sistema deberá ser capaz de generar y almacenar documentos comerciales, como remitos, comprobantes de entrega y otros reportes definidos por el cliente.

En cuanto a las tecnologías, se propone que el sistema sea desarrollado como una aplicación web responsive, con el fin de garantizar una mayor compatibilidad con distintos dispositivos. La aplicación será alojada de manera local, en un equipo del cliente, y el acceso estará restringido exclusivamente a dispositivos conectados a la red interna de la organización. Las bases de datos relacionales se implementarán utilizando gestores de bases de datos como PostgreSQL o MySQL.

El proyecto además deberá incluir la definición y realización de pruebas que verifiquen el buen funcionamiento del software y que permitan validar el mismo con el personal de “Servicios Neumáticos” de manera continua.

Finalmente, se pretende que el despliegue del sistema esté comprendido dentro del proyecto, dicho despliegue se espera realizar en equipos de los cuales el cliente dispone, pero no se descarta la realización de un análisis de la infraestructura actual y la propuesta de mejoras que permitan al sistema desempeñarse de manera óptima.

El tiempo estimado de realización del proyecto oscila entre 6 y 12 meses, debido a que el proyecto contempla un proceso de aprendizaje en relación con algunas de las tecnologías que se utilizarán. El sistema buscará ofrecer una solución práctica y accesible, alineada con las necesidades específicas del cliente, al tiempo que permitirá futuras expansiones y mejoras.

## 2.4. Población {#2.4.-población}

El proyecto estará a cargo de un estudiante, quien será el responsable principal de llevar adelante todas las etapas de desarrollo. A lo largo del proceso, se contará con el acompañamiento eventual de entre uno y tres profesionales con experiencia en desarrollo de sistemas informáticos, quienes actuarán en calidad de tutores y directores del proyecto, brindando orientación técnica y metodológica.

Por parte de la organización cliente, se prevé la participación activa de operarios y personal de gestión, quienes aportarán información clave para el relevamiento de requerimientos y la validación de funcionalidades. Estos mismos actores serán los principales beneficiarios del sistema. En total, se estima que entre 5 y 10 personas estarán involucradas directamente en el uso cotidiano del sistema, con impactos positivos indirectos sobre el funcionamiento general de la empresa.

## 2.5. Áreas de conocimiento {#2.5.-áreas-de-conocimiento}

* Desarrollo de Software:  
  * Paradigmas de Programación  
  * Bases de Datos  
  * Desarrollo de Software  
  * Ingeniería y Calidad de Software  
* Computación y Ciencia de Datos:  
  * Redes de Datos  
* Gestión Ingenieril:  
  * Gestión Gerencial  
  * Seguridad en los Sistemas de Información  
* Sistemas de Información:  
  * Análisis de Sistemas de Información  
  * Diseño de Sistemas de Información  
  * Administración de Sistemas de Información

# 

# 3\. Fundamentación y Justificación {#3.-fundamentación-y-justificación}

## 3.1. Fundamentación {#3.1.-fundamentación}

La necesidad de implementar un sistema de gestión digital en talleres técnicos y pequeñas empresas de reparación en Argentina surge de una problemática ampliamente documentada: la falta de digitalización en estos entornos limita su eficiencia operativa, competitividad y capacidad de respuesta ante las demandas del mercado actual.

“De acuerdo con el sondeo de Adopción Digital 2023 realizado por Movistar Empresas, el 88% de las pymes de Argentina invertirá en su digitalización este año” (El Cronista, 2023). Este estudio, que incluyó a 1.748 micro, pequeñas y medianas empresas, destaca que “el 90% de las pymes en Hispanoamérica considera a la digitalización relevante para sus negocios” (El Cronista, 2023). Esta tendencia refleja un consenso creciente sobre los beneficios concretos de la transformación digital para mejorar la gestión interna y la competitividad externa de las empresas.

Además, el Programa Piloto para la Transformación Digital de las PyMEs, impulsado por el Ministerio de Desarrollo Productivo de Argentina, busca desarrollar la infraestructura tecnológica necesaria para la transformación digital del sector productivo, en particular de las PyMEs. Este programa también contempla la capacitación de los equipos de trabajo para facilitar la adopción de tecnologías digitales.

En cuanto a antecedentes tecnológicos, existen plataformas y software comerciales orientados a la gestión de talleres o servicios técnicos (como Tango, TOTVS, o Zoho Inventory), muchas de estas soluciones son excesivamente generales, costosas o poco adaptables a las necesidades específicas de pequeñas empresas del sector técnico en el contexto argentino. Además, la dependencia de servicios en la nube, licencias y requerimientos de conectividad puede ser una barrera para PyMEs que operan con recursos limitados o en entornos con infraestructura acotada.

En este contexto, desarrollar un sistema que permita la gestión eficiente, respaldado por tecnologías digitales, no solo responde a una necesidad operativa inmediata, sino que también se alinea con las recomendaciones y marcos establecidos por organismos nacionales e internacionales para impulsar la competitividad y sostenibilidad de las PyMEs en el entorno actual.

## 3.2. Justificación {#3.2.-justificación}

El desarrollo del sistema de gestión propuesto responde a una necesidad concreta y observada dentro del funcionamiento cotidiano de un taller técnico dedicado a la reparación y comercialización de productos como lo es “Servicios Neumáticos”. La falta de trazabilidad de los artículos reparados, el desorden en la gestión de stock, las dificultades en la emisión de comprobantes, las inconsistencias de precios y la ausencia de comunicación automatizada con los clientes son problemáticas que no solo generan ineficiencias operativas, sino también pérdidas económicas, insatisfacción del cliente y obstáculos para el crecimiento de la empresa.

Desde el enfoque **tecnológico**, este proyecto propone incorporar herramientas digitales que permitan automatizar y optimizar los procesos más críticos del negocio. La adopción de una aplicación web desarrollada a medida facilitará la centralización de la información, mejorará la precisión de los datos operativos y reducirá el margen de error humano. En un contexto donde la digitalización ya no es una opción sino una necesidad para mantenerse competitivo, esta solución representa una oportunidad concreta de modernización sin depender de sistemas comerciales costosos y poco adaptables.

Desde el punto de vista **económico**, el sistema permitirá una mejor gestión del stock, lo que se traduce en reducción de pérdidas por faltantes o sobrantes, mayor control de los costos de reparación y venta, y facturación más precisa. Al contar con información consolidada y trazable, la empresa podrá tomar decisiones más acertadas, administrar sus recursos de manera más eficiente y evitar pérdidas derivadas de errores de gestión o cobros omitidos.

Además, en el **contexto actual de la Argentina**, donde comienzan a flexibilizarse las restricciones a las importaciones, muchas empresas del sector se ven enfrentadas a un mercado más competitivo, con una creciente disponibilidad de repuestos y productos sustitutos provenientes del exterior. Esta nueva realidad obliga a las PyMEs locales a optimizar sus procesos internos, mejorar la eficiencia operativa y profesionalizar su gestión para mantener su competitividad frente a proveedores internacionales mejor organizados o con precios más agresivos. En este marco, un sistema de gestión deja de ser una mejora opcional para transformarse en una herramienta estratégica imprescindible.

Finalmente, si el sistema no se implementa, la empresa seguirá enfrentando los mismos problemas estructurales que afectan su eficiencia, generan un desgaste administrativo constante y limitan su capacidad de crecimiento, lo que podría poner en riesgo su sostenibilidad frente a la mayor organización y competitividad de empresas del exterior. Este proyecto no solo es pertinente y útil, sino también oportuno: responde a un momento clave en el que muchas PyMEs del país están comenzando a apostar por la digitalización como herramienta para crecer, diferenciarse y profesionalizar su oferta.

En resumen, desarrollar este sistema representa una inversión estratégica con impacto concreto en la operatividad, la rentabilidad y la proyección de la empresa, alineado con las tendencias actuales de modernización del sector productivo y de servicios, y adaptado al nuevo escenario económico nacional.

# 4\. Aportes {#4.-aportes}

El desarrollo del sistema informático propuesto genera una serie de aportes concretos en distintas dimensiones, que justifican el valor y la pertinencia del proyecto tanto desde una perspectiva técnica como práctica.

Desde el punto de vista **técnico**, el sistema introduce una solución digital a un entorno tradicionalmente manejado de forma manual, incorporando tecnologías web modernas, bases de datos relacionales y mecanismos automatizados de notificación por correo electrónico. Esto permite mejorar la trazabilidad de los productos en reparación, facilitar la gestión del stock y brindar herramientas más eficientes para el control y actualización de precios.

En el plano **práctico**, el sistema aporta directamente a la organización de los procesos internos del taller, resolviendo problemas concretos como la pérdida de trazabilidad de productos, la falta de control sobre el stock de repuestos, la facturación inconsistente y la gestión desorganizada de precios. Estas mejoras impactan en la productividad diaria, reducen los errores operativos y disminuyen la carga administrativa del personal.

En términos **económicos**, el proyecto se presenta como una inversión de bajo costo con beneficios sustanciales, especialmente para pequeñas y medianas empresas (PyMEs) que, como en este caso, necesitan modernizar su funcionamiento sin acceder necesariamente a soluciones de software comerciales de alto costo. La posibilidad de alojar el sistema en infraestructura propia y utilizar tecnologías libres fortalece este aporte.

Finalmente, a nivel **personal y académico**, el proyecto representa un desafío de aprendizaje para el desarrollador, quien abordará el diseño e implementación de una aplicación web completa, integrando conocimientos de programación, bases de datos y experiencia de usuario. Este proceso contribuye al desarrollo de competencias técnicas aplicables a futuros proyectos en contextos similares.

# 5\. Metodología {#5.-metodología}

## 5.1. Modelo de desarrollo {#5.1.-modelo-de-desarrollo}

Se optará por un modelo de desarrollo incremental con enfoque iterativo, lo que permitirá construir el sistema por módulos funcionales y entregar versiones parciales utilizables, minimizando riesgos y facilitando correcciones tempranas. Esta estrategia también permite ajustar las prioridades en función de las necesidades que vayan surgiendo del cliente durante el proceso. A su vez, el proyecto será realizado por una sola persona, lo cual reafirma la idea de entregas funcionales de pequeño tamaño y baja complejidad.

## 5.2. Organización del proyecto {#5.2.-organización-del-proyecto}

La gestión del proyecto será llevada adelante mediante herramientas de organización de tareas como Trello o Notion, en donde se planificarán y registran los avances por etapas. Se establecerán entregas parciales para validar funcionalidades clave. El desarrollo se organizará en bloques de trabajo distribuidos en función de los objetivos específicos del sistema, asegurando trazabilidad y control del progreso. Si bien no habrá división de roles, se documentará cada etapa para facilitar su mantenimiento y replicabilidad futura.

## 5.3. Etapas del desarrollo {#5.3.-etapas-del-desarrollo}

### **5.3.1. Análisis y especificación de requerimientos** {#5.3.1.-análisis-y-especificación-de-requerimientos}

En esta etapa se realizará el relevamiento detallado de las necesidades propuestas por el personal de Servicios Neumáticos, entrevistas y análisis del flujo de trabajo actual. A partir de esta información se definirán los requerimientos funcionales y no funcionales del sistema, priorizando aquellos asociados a la trazabilidad de productos y la gestión del stock, lo cual se interpreta como la funcionalidad principal que debe ofrecer el sistema.

### **5.3.2. Diseño del sistema y de la base de datos** {#5.3.2.-diseño-del-sistema-y-de-la-base-de-datos}

Se diseñará la arquitectura del sistema y el modelo de datos, el cual deberá permitir el almacenamiento eficiente de información relativa a productos, clientes, reparaciones, stock y documentos. La base de datos será relacional, implementada con PostgreSQL o MySQL, y pensada para integrarse de forma robusta con el resto de los módulos del sistema. 

### **5.3.3. Desarrollo e implementación de módulos funcionales** {#5.3.3.-desarrollo-e-implementación-de-módulos-funcionales}

El desarrollo se dividirá en cinco grandes componentes, alineados con los objetivos específicos:

* Módulo de registro y seguimiento de productos en reparación, con funciones para cargar productos, asignar estados de reparación y consultar historiales y existencias.  
* Módulo de control de stock de productos nuevos y repuestos, que permita registrar movimientos de inventario, detectar faltantes y consultar niveles de stock en tiempo real.  
* Módulo de generación automática de documentos comerciales, como remitos, comprobantes de entrega y reportes de facturación, con posibilidad de exportación.  
* Diseño e integración de la base de datos, como pilar transversal del sistema.  
* Módulo de integración con servicios de mensajería, utilizando servicios de correos electrónicos automáticos.

### **5.3.4. Pruebas y validación** {#5.3.4.-pruebas-y-validación}

Se realizarán pruebas funcionales sobre cada módulo para asegurar su correcto funcionamiento, y pruebas de flujo completo para verificar la coherencia entre módulos. Además, se prevé una instancia de validación con el cliente, donde se recopilarán observaciones y sugerencias de mejora, a fin de refinar la experiencia de uso y ajustar el producto a sus requerimientos reales.

### **5.3.5. Documentación y entrega** {#5.3.5.-documentación-y-entrega}

Se generará documentación técnica del sistema, incluyendo la estructura de la base de datos y arquitectura del sistema, mockups de las interfaces de usuario principales, manual de usuario básico. En caso de que el proyecto lo permita se prevé realizar la instalación del entorno en la red local del cliente y una capacitación inicial para facilitar la adopción de la herramienta por parte del personal de Servicios Neumáticos.

## 5.4. Herramientas y tecnologías {#5.4.-herramientas-y-tecnologías}

El sistema será desarrollado como una aplicación web responsive, utilizando tecnologías como React para el frontend, Django como framework backend y PostgreSQL o MySQL como sistema de gestión de base de datos. Se empleará Git para el control de versiones y herramientas como Visual Studio Code para el desarrollo. En el supuesto que el proyecto abarque la instalación del sistema, el mismo será alojado localmente en un equipo del cliente conectado a la red interna, garantizando el acceso solo a usuarios autorizados dentro del entorno de la organización.

## 5.5. Validación del sistema {#5.5.-validación-del-sistema}

Además de las pruebas funcionales internas, se realizará una instancia de validación con usuarios finales dentro de la estructura de Servicios Neumáticos, quienes probarán las funcionalidades clave en situaciones reales. Se recopilará su feedback y se realizarán los ajustes necesarios. El éxito del sistema se medirá en función de indicadores como:

* Reducción de errores en la entrega de productos.  
* Mejora en la trazabilidad de reparaciones.  
* Disminución del tiempo de generación de documentos.  
* Aceptación y satisfacción de los usuarios.

# 6\. Fechas estimadas  {#6.-fechas-estimadas}

* Fecha de presentación del plan de proyecto: 22/06/2025  
* Fecha de inicio concreto del proyecto: 07/07/2025  
* Fecha probable de presentación escrita del proyecto: 02/02/2026

# 7\. Cronograma del proyecto {#7.-cronograma-del-proyecto}

Se propone el 7 de julio de 2025 como fecha de inicio del proyecto.

Al tratarse de un proyecto con un enfoque metodológico iterativo e incremental, se ha definido un tiempo entre entregas incrementales de 1 mes. La estructura de los incrementos es similar en etapas de desarrollo, las cuales serán detalladas con más precisión luego de la recopilación de requerimientos del cliente. 

Como se puede observar en el siguiente diagrama, la primer etapa es, en su mayoría, exploratoria centrada en la adquisición de requerimientos y el diseño general de la arquitectura del sistema y la base de datos, teniendo poca o nula validación de los usuarios debido a que no se prevé contar con módulos funcionales.

Imagen 1: Cronograma General propuesto.

En las distintas iteraciones al momento de las entregas se espera que existan instancias de validación de los módulos presentados, y asociado a esto, se considera que habrá cierta recopilación de requerimientos y sugerencias del cliente.

## 7.1. Informes de Avance Planificados {#7.1.-informes-de-avance-planificados}

**Informe de Avance 1**

**Mes 1 y 2**

Contenidos esperados:

* Definición de los requerimientos funcionales y no funcionales.  
* Cronograma ajustado del proyecto, con fases definidas y entregables tentativos.  
* Definición de entornos de trabajo y justificación de tecnologías.  
* Arquitectura general del sistema y la base de datos.

Fecha de inicio y entrega previstas: 07/07/2025 \- 03/09/2025

**Informe de Avance 2**

**Mes 3**

Contenidos esperados:

* Arquitectura refinada del sistema y base de datos.  
* Diseño de interfaces de usuario: presentación de mockups o wireframes de las principales vistas del sistema (pantallas de ingreso, visualización de productos, gestión de stock, etc.).

Fecha de inicio y entrega previstas: 08/09/2025 \- 06/10/2025

**Informe de Avance 3**

**Mes 4**

Contenidos esperados:

* Prototipo funcional de las interfaces principales: navegación básica, pantallas operativas parcialmente implementadas.  
* Integración preliminar con la base de datos: visualización de datos reales o simulados.  
* Observaciones y ajustes realizados tras las primeras pruebas.  
* Plan de trabajo para el siguiente ciclo: módulos a implementar, dificultades encontradas, y nuevas decisiones técnicas.

Fecha de inicio y entrega previstas: 08/10/2025 \- 05/11/2025

# 8\. Estimación de duración del proyecto {#8.-estimación-de-duración-del-proyecto}

Teniendo como base al alcance del proyecto, junto con las fechas propuestas y el cronograma general definido anteriormente, se estima que el proyecto tenga una duración de entre 6 y 7 meses.

# 9\. Plan de monitoreo del proyecto {#9.-plan-de-monitoreo-del-proyecto}

El monitoreo del proyecto se llevará a cabo de forma continua, estableciendo instancias regulares de evaluación tanto con los tutores y directores del proyecto como con el cliente. Durante las etapas iniciales (aproximadamente los primeros tres meses), se realizará la presentación de informes de avance dirigidos al equipo académico, con el propósito de validar los requerimientos, definir la arquitectura del sistema y consolidar una base técnica y conceptual sólida para el desarrollo posterior.

Una vez superada esta fase de base, se prevé la realización de reuniones mensuales con personal de Servicios Neumáticos (organización cliente), con el objetivo de validar de forma progresiva las funcionalidades implementadas, verificar el cumplimiento de los objetivos específicos definidos y ajustar el alcance del sistema en función de nuevas necesidades o restricciones surgidas durante el desarrollo del proyecto. Este esquema de monitoreo permitirá un seguimiento ágil del proyecto, facilitando la toma de decisiones y reduciendo riesgos asociados a desvíos técnicos o funcionales.

# 10\. Plan de Gestión de Riesgos e Impacto Ambiental {#10.-plan-de-gestión-de-riesgos-e-impacto-ambiental}

## 10.1. Matriz de probabilidad e impacto {#10.1.-matriz-de-probabilidad-e-impacto}

| Probabilidad de Ocurrencia | Impacto |  |  |
| :---: | :---: | :---: | :---: |
|  | **Bajo** | **Medio** | **Alto** |
| **Baja** | **Bajo** | **Bajo** | **Moderado** |
| **Media** | **Bajo** | **Moderado** | **Alto** |
| **Alta** | **Moderado** | **Alto** | **Crítico** |

Tabla 1: Matriz de probabilidad e impacto de riesgos.

## 10.2. Análisis de Riesgos Específicos {#10.2.-análisis-de-riesgos-específicos}

Al tratarse de un proyecto de desarrollo de una aplicación web existe documentación extensa y probada para mitigar los posibles riesgos que surjan en el proceso de codificación y desarrollo, por lo tanto en este documento nos centraremos en analizar posibles riesgos que no estén comprendidos en el proceso de programación propiamente dicho. Nos enfocaremos en analizar riesgos existentes en las demás etapas del proceso de desarrollo de software.

### **10.2.1. Desviación del alcance original** {#10.2.1.-desviación-del-alcance-original}

**Descripción**: Durante el desarrollo, el cliente puede solicitar nuevas funcionalidades que no fueron previstas en la etapa de planificación. Si se incorporan sin evaluación adecuada, esto puede generar sobrecarga de trabajo, desorganización y pérdida del foco en los objetivos principales.

**Tipo**: Administrativo-Técnico / externo.

**Probabilidad**: Media.

**Impacto**: Alto. Retrasos significativos en el cronograma y/o disminución de la calidad en funcionalidades ya planificadas.

**Prioridad**: Alta.

**Estrategias de Respuesta**

**Para mitigar la probabilidad:** Documentar el alcance acordado al inicio del proyecto.

**Para mitigar el impacto:** Posponer mejoras no críticas para futuras versiones o fases posteriores y evaluar cada nueva solicitud con criterios de urgencia e impacto.

**Plan de Contingencia**

* Evaluar la incorporación de las funcionalidades propuestas, y en caso de incluirla en el proyecto, decidir el momento oportuno para incorporar la misma. En caso de exceder el alcance del proyecto por complejidad o por extensión será necesario consultar con el cliente funcionalidades alternativas o sustitución de features para lograr el cumplimiento del proyecto.

### **10.2.2. Desbalance entre etapas del proyecto** {#10.2.2.-desbalance-entre-etapas-del-proyecto}

**Descripción**: Existe el riesgo de dedicar demasiado tiempo a fases tempranas como análisis o diseño, postergando la implementación, lo cual podría dejar módulos claves sin desarrollar.

**Tipo**: Administrativo / interno.

**Probabilidad**: Media.

**Impacto**: Alto. Entregables incompletos y funcionalidades críticas sin validar correctamente.

**Prioridad**: Alta.

**Estrategias de Respuesta**

**Para mitigar la probabilidad:** Establecer hitos parciales y fechas de revisión interna, utilizar técnicas pseudo ágiles para cumplir con las entregas y estimar más tiempo para etapas con mayor incertidumbre.

**Plan de Contingencia**

* Realizar una priorización de los entregables en base a su importancia y criticidad con el objetivo de catalogar entregables secundarios como propuestas de mejora y evaluar la modificación del alcance del proyecto, excluyendo dichas funcionalidades de la entrega final del proyecto.

### **10.2.3. Falta de validación continua** {#10.2.3.-falta-de-validación-continua}

**Descripción**: Si no se realiza un feedback frecuente con el cliente durante el desarrollo, pueden tomar decisiones equivocadas respecto a la lógica del sistema, el diseño de las pantallas o el flujo del sistema.

**Tipo**: Administrativo / externo.

**Probabilidad**: Baja.

**Impacto**: Alto. Módulos desarrollados que no cumplen con las expectativas, necesidad de re trabajo en etapas avanzadas, pérdida de confianza del cliente en el sistema.

**Prioridad**: Moderada.

**Estrategias de Respuesta**

**Para mitigar la probabilidad:** Establecer reuniones regulares con el cliente, usar mockups, prototipos interactivos y demos parciales y validar los requerimientos por escrito antes de implementarlos.

**Para mitigar el impacto:** Realizar entregas funcionales frecuentes y simples.

**Plan de Contingencia**

* Evaluar la criticidad del error y programar su corrección en base a los comentarios del cliente y la dificultad de la corrección.

### **10.2.4. Cambios de requerimientos en etapas avanzadas** {#10.2.4.-cambios-de-requerimientos-en-etapas-avanzadas}

**Descripción**: Una vez que el sistema está en desarrollo avanzado o en pruebas, pueden surgir necesidades nuevas o reinterpretaciones de lo solicitado inicialmente.

**Tipo**: Administrativo / externo.

**Probabilidad**: Baja.

**Impacto**: Alto. Refactorización o rediseño de código ya funcional, aumento del esfuerzo de desarrollo, desalineación con el cronograma planificado.

**Prioridad**: Moderada.

**Estrategias de Respuesta**

**Para mitigar la probabilidad:** Confirmar por escrito los requerimientos en etapas iniciales y revisar los mismos con el cliente previo al inicio de cada módulo.

**Para mitigar el impacto:** Dejar margen en el cronograma para ajustes menores, y si es viable, modularizar el sistema para aislar impactos.

**Plan de Contingencia**

* Evaluar si los nuevos requerimientos se pueden implementar dentro del cronograma establecido, en caso de no ser posible proponerlos como mejoras luego de la entrega final del sistema.

### **10.2.5. Dependencia del conocimiento tácito del cliente** {#10.2.5.-dependencia-del-conocimiento-tácito-del-cliente}

**Descripción**: El personal de Servicios Neumáticos actualmente gestiona muchos procesos "de memoria". Formalizar esta lógica en un sistema sin documentación clara puede derivar en malentendidos o errores.

**Tipo**: Administrativo / externo.

**Probabilidad**: Alta.

**Impacto**: Alto. Reglas de negocio mal interpretadas, incompletitud funcional, insatisfacción del cliente por el comportamiento del sistema.

**Prioridad**: Crítico.

**Estrategias de Respuesta**

**Para mitigar la probabilidad:** Documentar todas las decisiones y condiciones especiales en conjunto con el cliente, incluir ejemplos reales en los casos de prueba y realizar entrevistas específicas para capturar procesos informales antes de automatizarlos.

**Para mitigar el impacto**: Implementar primero los módulos más importantes para el flujo de trabajo relevado con el objetivo de definirlo correctamente en etapas tempranas del proyecto.

**Plan de Contingencia**

* Relevar nuevamente el flujo de los procesos  de forma más detallada y refactorizar o implementar nuevamente los módulos críticos. En caso de ser necesario, redefinir el alcance del proyecto para incluir funcionalidades menos críticas como mejoras secundarias.

## 10.3. Impacto Ambiental {#10.3.-impacto-ambiental}

Considerando que el proyecto se va a centrar en el desarrollo, implementación y puesta en producción de un sistema web para gestión de stock, es conocido que las etapas de desarrollo e implementación no representan un impacto ambiental sustancial. 

Si nos enfocamos en las etapas de desarrollo e implementación, el impacto ambiental en dichas etapas se debe principalmente al uso de los equipos informáticos para la adquisición de requerimientos, comunicación con el cliente (Servicios Neumáticos), diseño del sistema e implementación del mismo, estos aspectos del proceso no requieren un uso intensivo de los equipos, por lo que no representan un alto impacto ambiental. 

Sumado al uso de las tecnologías, es conocido que durante las etapas de desarrollo e implementación se realizarán una serie de entregas de documentos e informes, se optó por realizar estas entregas en formato digital con el objetivo reducir el impacto ambiental que genera la impresión de dichos documentos.

Ahora bien, si nos enfocamos en la puesta en producción y uso del software final, encontramos que el mismo se pretende alojar en un equipo del cual “Servicios Neumáticos” ya dispone. Para reducir el impacto ambiental que supone el uso prolongado de los equipos informáticos, en caso de no requerir el software, por ejemplo, en horas donde no funcionará el taller o períodos de vacaciones, se recomendará al cliente que el equipo servidor sea suspendido o apagado hasta su próximo uso. Esto permitirá reducir el consumo eléctrico innecesario y aumentar la vida útil de los equipos, lo cual también representa un impacto ambiental.

Finalmente, dado el caso de que una actualización del hardware sea inevitable, se recomendará la compra de hardware de larga vida útil y, en caso de ser posible, también se promoverá la utilización de marcas comprometidas con el medio ambiente. Además se proveerá al cliente con información sobre el reuso o reciclaje de los componentes descontinuados.

# 11\. Referencias {#11.-referencias}

* El Cronista. (2023, diciembre 11). Conectividad: el 88% de las PyMEs argentinas invertirán en transformación digital en 2024\. [https\://www\.cronista.com/brand-strategy/conectividad-el-88-de-las-pymes-argentinas-invertiran-en-transformacion-digital-en-2024/](https://www.cronista.com/brand-strategy/conectividad-el-88-de-las-pymes-argentinas-invertiran-en-transformacion-digital-en-2024/)