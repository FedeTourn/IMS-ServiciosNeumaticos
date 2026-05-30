1. Desarrollo y Arquitectura

    [ ] Separación de Capas: El código respeta estrictamente la arquitectura de tres capas. La lógica de negocio reside en los Services y no en los Controllers.

    [ ] Clean Code & SOLID: Se han aplicado principios de responsabilidad única. No existen funciones "monolíticas" (más de 20-30 líneas).

    [ ] Documentación de Código: Todas las funciones cuentan con comentarios JSDoc en español detallando propósito, parámetros y valores de retorno.

    [ ] Gestión de Errores: Se implementó un manejo de excepciones global en el backend y notificaciones (Toasts/Alerts) en el frontend para errores de API.

2. Base de Datos (MySQL)

    [ ] Convención de Nombres: Tablas en PascalCase y columnas en snake_case.

    [ ] Integridad Referencial: Se han definido correctamente las Foreign Keys y las acciones en cascada (ON DELETE, ON UPDATE) si aplica.

    [ ] Scripts de Migración: Cualquier cambio en el esquema está reflejado en un script SQL versionado para asegurar la paridad entre tu entorno de desarrollo y el del cliente.

3. Frontend (React.js + TailwindCSS)

    [ ] Responsividad: La interfaz es funcional en resoluciones de escritorio y móviles (cumpliendo el requerimiento no funcional de uso en smartphones).

    [ ] Consistencia Visual: Se utilizan los componentes base definidos (botones, inputs, tablas) manteniendo la estética de Tailwind.

    [ ] Validaciones: Los formularios cuentan con validaciones de tipo de dato y campos obligatorios antes de disparar la petición al backend.

4. Reglas de Negocio (Módulo de Válvulas)

    [ ] Validación de Estados: Se ha verificado que la transición de estados (Recibido → En Reparación → etc.) cumpla con la máquina de estados definida.

    [ ] Inmutabilidad: Un producto en estado Entregado no permite modificaciones en su historial de reparación.

5. Documentación Académica y Calidad

    [ ] Registro en la Memoria: Se ha redactado el apartado técnico correspondiente a la funcionalidad en el borrador de la tesis.

    [ ] Peer Review (Auto-revisión): El código ha sido revisado buscando "code smells" o variables mal nombradas.