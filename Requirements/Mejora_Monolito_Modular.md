**Idea de mejora: Evolución hacia un monolito modular**

> Estado: propuesta a futuro, sin fecha de implementación. Este documento resume el análisis realizado para servir de punto de partida cuando se decida encararla.

### Contexto

El backend es hoy un **monolito organizado en capas**: una única aplicación Express, desplegada como una sola unidad y conectada a una única base MySQL, cuyo código se agrupa por capa técnica (`routes/`, `controllers/`, `services/`, `models/`) con un archivo por dominio en cada una.

La propuesta es reorganizarlo como un **monolito modular**: seguir siendo una sola aplicación, pero agrupando el código por módulo de negocio y estableciendo límites explícitos entre ellos. No se trata de migrar a microservicios.

### Monolito y microservicios

* **Monolito:** sistema cuya lógica de negocio se construye, versiona y despliega como una sola unidad, en un único proceso. Sus módulos se comunican mediante llamadas internas en memoria. Puede estar bien organizado internamente y usar una o varias bases de datos; lo que lo define es que cualquier cambio implica redesplegar la aplicación completa.
* **Microservicios:** sistema compuesto por varias aplicaciones independientes, cada una responsable de una capacidad de negocio, desplegada por separado, dueña exclusiva de sus datos y comunicada con las demás solo a través de la red.

La diferencia de fondo es la **unidad de despliegue**. Las capas, los módulos, la cantidad de bases de datos o de contenedores no la determinan.

Los microservicios no se justifican en este sistema: se usa en un único lugar físico, con pocos usuarios, y su dominio está fuertemente conectado (clientes, válvulas, órdenes y pagos). Sumarían latencia de red, consistencia eventual en lugar de transacciones, duplicación de datos y mucha más infraestructura, sin los beneficios que los motivan (equipos independientes, escalado diferenciado).

### Motivación

* **Límites explícitos entre dominios:** hoy nada impide que un servicio importe el modelo de cualquier otro dominio; en un monolito modular esa dependencia pasa a ser deliberada y visible.
* **Preparación para crecer por módulos:** si en algún momento se quisiera habilitar o deshabilitar partes del sistema, o extraer una como servicio independiente, un módulo con límites claros se separa sin reescribir el resto.
* **Valor académico:** permite fundamentar las decisiones de arquitectura (por qué un monolito, cómo se organiza, cómo se controlan las dependencias) con un ejemplo concreto en el propio código.

### Propuesta

**Módulos sugeridos:**

| Módulo | Dominios |
| --- | --- |
| `core` | Autenticación, usuarios, clientes y precios |
| `taller` | Productos (válvulas), comprobantes de recepción y órdenes de reparación |
| `contable` | Pagos, bancos y, a futuro, estado de cuenta |

**Estructura:** cada módulo conserva internamente la arquitectura de tres capas, de modo que la separación rutas → controladores → servicios → modelos se mantiene y se le suma un nivel de organización por encima.

```
backend/src/modules/
  core/       routes/ controllers/ services/ models/ index.js
  taller/     routes/ controllers/ services/ models/ index.js
  contable/   routes/ controllers/ services/ models/ index.js
```

**Interfaz pública:** cada módulo expone en su `index.js` únicamente lo que los demás pueden usar, y ningún módulo importa archivos internos de otro.

**Lectura de tablas de otros módulos:** se propone un criterio pragmático: se admite *leer* tablas de otros módulos mediante `JOIN` (por ejemplo, el nombre del cliente en el listado de pagos), pero nunca *escribirlas*. La alternativa estricta, en la que cada módulo accede solo a sus tablas, obligaría a reescribir consultas sin un beneficio proporcional con una única base de datos.

**Control de los límites (opcional):** una regla de ESLint (`no-restricted-imports`) que rechace los imports hacia el interior de otro módulo, para que el límite lo garantice una herramienta y no solo la convención.

**Frontend (opcional):** agrupar `pages/` y `services/` por módulo con el mismo criterio. Aporta menos que en el backend, dado que allí no residen reglas de negocio.

**Base de datos (opcional):** si se quisiera reforzar la separación también en los datos, cada módulo podría tener su propio esquema dentro del mismo servidor MySQL. En un mismo servidor se conservan los `JOIN`, las claves foráneas y las transacciones entre esquemas, por lo que el costo es bajo. Separar los módulos en servidores distintos, en cambio, no es recomendable: se pierden esas garantías y se heredan los problemas de los microservicios sin sus ventajas.

### Estado de partida

El análisis del código mostró que el acoplamiento entre dominios ya es bajo. Con la agrupación propuesta, existe **una sola dependencia entre módulos a nivel de servicio**: `payment.service.js` importa el modelo `Client` para verificar que el cliente exista y esté activo. Se resolvería exponiendo desde `core` una función como `ClientService.getActiveClient(id)`. Las demás dependencias entre dominios (comprobantes y órdenes que usan el modelo de productos) quedan dentro del mismo módulo `taller`.

### Esfuerzo estimado

Entre uno y dos días de trabajo para el backend, con riesgo bajo, porque el comportamiento no cambia y la suite de tests existente lo verifica:

* Mover unos 31 archivos a la nueva estructura y actualizar sus imports, los de `app.js` y los de los tests.
* Crear el `index.js` de cada módulo y resolver la dependencia de pagos hacia clientes.
* Documentar el criterio adoptado para las lecturas entre módulos.

### Recomendaciones para encararla

* Hacerla en una rama propia, sin mezclarla con funcionalidades nuevas, para que el diff refleje solo la reorganización.
* Mover los archivos con `git mv`, para que Git conserve el historial de cada uno.
* Correr la suite completa del backend al terminar cada módulo, no solo al final.
