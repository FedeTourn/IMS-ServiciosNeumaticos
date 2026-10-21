¡Genial\! Me parece excelente que ya tengas la estructura de directorios base y la documentación del proyecto. Basado en la arquitectura de tres capas (Frontend con **React.js/TailwindCSS**, Backend con **Node.js/Express**, y Base de Datos **MySQL**), y el modelo relacional que definiste, te propongo una estructura de directorios más detallada para comenzar la programación.

---

## **🏗️ Estructura de Directorios Detallada**

La estructura que te sugiero es modular, lo que facilitará la separación de responsabilidades y el mantenimiento, siguiendo el patrón **MVC (Modelo-Vista-Controlador)** en el *backend* y una organización por **funcionalidad/componentes** en el *frontend*.

Directorio Proyecto Taller/  
├── backend/  
│   ├── src/  
│   │   ├── config/             \# Configuración de la app (puertos, variables de entorno, etc.)  
│   │   │   ├── config.js  
│   │   │   └── db.config.js    \# Parámetros de conexión a MySQL  
│   │   ├── controllers/        \# Lógica de negocio de la API (manejan las peticiones y respuestas)  
│   │   │   ├── auth.controller.js  \# Gestión de usuarios e inicio de sesión  
│   │   │   ├── client.controller.js  
│   │   │   ├── product.controller.js  
│   │   │   └── order.controller.js  
│   │   ├── models/             \# Estructuras de datos / ORM (interacción con la DB)  
│   │   │   ├── Client.js       \# Modelo para la tabla Cliente  
│   │   │   ├── Product.js      \# Modelo para la tabla Producto  
│   │   │   ├── RepairOrder.js  \# Modelo para la tabla OrdenReparacion  
│   │   │   └── index.js        \# Para exportar todos los modelos y configurar las relaciones  
│   │   ├── routes/             \# Definición de las rutas de la API (endpoints)  
│   │   │   ├── auth.routes.js  
│   │   │   ├── client.routes.js  
│   │   │   ├── product.routes.js  
│   │   │   └── index.js        \# Para agrupar todas las rutas  
│   │   ├── services/           \# Lógica de negocio compleja (opcional, para separar del controller)  
│   │   │   ├── stock.service.js  
│   │   │   └── email.service.js  \# Para el envío de correos automáticos  
│   │   ├── utils/              \# Funciones auxiliares (logs, validaciones, middleware, etc.)  
│   │   │   ├── middleware.js  
│   │   │   └── logger.js  
│   │   └── app.js              \# Archivo principal de Express (configuración, middlewares, rutas)  
│   ├── .env                    \# Variables de entorno sensibles (conexión a DB, secretos)  
│   ├── package.json  
│   └── server.js               \# Punto de inicio del servidor (ejecuta app.js)  
├── frontend/  
│   ├── public/                 \# Archivos estáticos (index.html, manifest.json, favicon)  
│   ├── src/  
│   │   ├── assets/             \# Archivos multimedia (imágenes, iconos, fuentes)  
│   │   ├── components/         \# Componentes reutilizables de UI (Button, Card, Input)  
│   │   │   ├── common/  
│   │   │   └── ui/  
│   │   ├── contexts/           \# Gestión de estado global de React (ej. AuthContext)  
│   │   ├── hooks/              \# Custom Hooks para lógica reutilizable (ej. useAuth)  
│   │   ├── pages/              \# Componentes que representan páginas/vistas completas  
│   │   │   ├── Dashboard/  
│   │   │   ├── Clients/        \# Página de consulta de clientes  
│   │   │   ├── Products/       \# Página de gestión de válvulas/productos  
│   │   │   └── Login/  
│   │   ├── services/           \# Lógica para interactuar con el Backend (peticiones API REST)  
│   │   ├── utils/              \# Funciones de utilidad (formato de fechas, validaciones)  
│   │   ├── App.js              \# Componente raíz de la aplicación  
│   │   ├── index.js            \# Punto de entrada de React  
│   │   └── index.css           \# Estilos base o de TailwindCSS  
│   ├── package.json  
│   └── tailwind.config.js      \# Archivo de configuración de TailwindCSS  
├── docs/                       \# Toda la documentación del proyecto (Tus informes PDF)  
├── .gitignore  
└── README.md

---

## **💡 Próximos Pasos Sugeridos**

1. **Configuración del Entorno (backend)**:  
   * En backend/server.js, configura la inicialización del servidor Express y la conexión a la base de datos MySQL (usando el modelo relacional del **Informe de Avances 2**).  
   * Configura las variables de entorno en el archivo .env.  
2. **Módulo de Usuarios e Inicio de Sesión (Iteración 1: Fase 3\)**:  
   * Crea el modelo de **Usuario** en backend/src/models/ y su lógica de negocio en backend/src/controllers/auth.controller.js para los requerimientos funcionales de **Alta de Usuarios**, **Asignación de Roles** e **Inicio de sesión**.  
   * Define las rutas en backend/src/routes/auth.routes.js.  
   * En el *frontend*, crea la vista de Login en frontend/src/pages/Login/ y la lógica de autenticación en frontend/src/contexts/.  
3. **Módulo de Clientes (Iteración 1: Fase 3\)**:  
   * Crea el modelo y las rutas para la **Gestión de clientes**.  
   * Desarrolla las interfaces de **Consulta de clientes** y **Registro de nuevo cliente** (basadas en los *mockups* del **Informe de Avances 2**) en frontend/src/pages/Clients/.

Este enfoque te permitirá realizar entregas incrementales, como se planificó en tu cronograma.

El siguiente video de YouTube muestra un ejemplo de cómo se pueden estructurar las carpetas y archivos en un proyecto de Node.js, lo cual puede ser útil al configurar tu directorio backend.

Estructura de carpetas y archivos de un Proyecto creado con Node.JS

**Vos decis que toda esa estructura la cree ya?**

No, no estoy sugiriendo que crees **todos** esos archivos y carpetas inmediatamente. La estructura que te presenté es un **modelo de arquitectura recomendado** que se alinea con las tecnologías elegidas (Node.js/Express y React.js) y la metodología de desarrollo incremental de tu proyecto1.

### **🛠️ Estrategia de Implementación Incremental**

Debes crear la estructura de manera **progresiva**, siguiendo las fases de desarrollo planificadas en tu cronograma2.

| Fase / Iteración | Módulos a Implementar | Carpetas/Archivos Clave a Crear Inicialmente |
| :---- | :---- | :---- |
| **Inicio del Backend** | Configuración de Express y MySQL. | backend/src/config/, backend/src/app.js, backend/src/server.js, .env. |
| **Iteración 1 (Semanas 5-8)** | Módulo Registro y Seguimiento de Productos (Usuarios, Clientes, Productos a Reparar) 4. | backend/src/models/, backend/src/controllers/auth.controller.js, backend/src/controllers/client.controller.js, backend/src/routes/auth.routes.js, frontend/src/pages/Login/, frontend/src/pages/Clients/, frontend/src/pages/Products/. |
| **Iteración 2 (Semanas 9-12)** | Módulo Procesos Administrativos y Contables (Órdenes, Comprobantes, Pagos) 5555. | backend/src/controllers/order.controller.js, modelos de OrdenReparacion, Pago, ComprobanteRecepcion. |
| **Iteración 3 (Semanas 13-16)** | Módulo Gestión de Repuestos y Productos Nuevos (Repuestos, Proveedores) 6666. | backend/src/controllers/stock.controller.js, modelos de Repuesto, Proveedor. |

**En resumen:** Comienza por las carpetas y archivos necesarios para la **configuración base** del servidor y la **autenticación** (Gestión de Usuarios)7. A medida que abordes las iteraciones (Clientes, Productos, Órdenes, etc.), crea las carpetas controllers/, models/, routes/ y pages/ correspondientes a ese módulo.

Absolutamente. Dada tu estructura inicial y el plan para la **Iteración 1 (Módulo Registro y Seguimiento de Productos)**, aquí tienes los archivos y carpetas esenciales que debes crear ahora.

Comenzaremos por establecer la configuración del backend y los directorios fundamentales de la primera iteración (Autenticación, Clientes, Productos a Reparar).

## **🗂️ Estructura de Directorios a Crear**

### **Backend (/backend)**

Para el backend (Node.js/Express) necesitas refinar la estructura para separar la lógica de configuración, base de datos, rutas y controladores.

| Ruta a crear | Propósito |
| :---- | :---- |
| **.env** | Almacena variables de entorno sensibles (ej. DB\_HOST, DB\_USER, JWT\_SECRET). |
| **src/** | Carpeta que contendrá todo el código fuente de tu aplicación (separa el código de los archivos de configuración de Node/NPM). |
| **src/config/** | Contendrá los archivos de configuración. |
| **src/config/db.config.js** | Configuración de conexión a **MySQL** (DBMS relacional)1111. |
| **src/controllers/** | Lógica de negocio (manejo de peticiones HTTP). |
| **src/models/** | Modelos de datos (interacción directa con la base de datos). |
| **src/routes/** | Definición de los *endpoints* de la API REST. |
| **src/app.js** | Archivo principal de Express (configura middlewares y carga rutas). |

| Archivo a Renombrar/Modificar | Razón |
| :---- | :---- |
| **index.js** \$\\to\$ **server.js** | Se moverá a la raíz de /backend y solo contendrá la lógica mínima para levantar la aplicación Express (definida en app.js). |

---

### **Frontend (/frontend/src)**

Para el frontend (React.js), la carpeta src necesita ser organizada por componentes reusables y páginas (vistas).

| Ruta a crear dentro de /frontend/src | Propósito (Módulos de la Iteración 1\) |
| :---- | :---- |
| **components/** | Componentes reutilizables a nivel global (botones, *navbar*, *footer*, etc.). |
| **pages/** | Componentes que representan las vistas completas del sistema. |
| **pages/Login/** | Vista para el **Inicio de sesión**2. |
| **pages/Clients/** | Vistas para la **Consulta de clientes** y **Registro de clientes nuevos**3333. |
| **pages/Products/** | Vistas para la **Consulta de válvulas** (productos a reparar) y **Registro de válvulas recibidas**4444. |
| **services/** | Funciones para comunicarse con el **Backend API REST** (ej. clientService.js). |
| **contexts/** | Para el **AuthContext** (manejo de estado global de autenticación/usuario). |

## **📝 Pasos a Seguir**

1. **Reorganizar el Backend:**  
   * Crea la carpeta backend/src.  
   * Mueve tu index.js a la raíz de /backend y re-nómbralo a **server.js**.  
   * Crea el archivo **.env** en /backend.  
2. **Crear Archivos Esqueleto del Backend (Iteración 1):**

| Archivo | Contenido Mínimo (Esqueleto) |
| :---- | :---- |
| backend/src/app.js | Inicialización de Express y definición de dónde se cargarán las rutas. |
| backend/src/config/db.config.js | Definición de los parámetros de conexión para MySQL. |
| backend/src/models/User.js | Definición del modelo de datos para la tabla de Usuarios (requerido por Gestión de Usuarios)5. |
| backend/src/models/Client.js | Definición del modelo de datos para la tabla **Cliente** 6666. |
| backend/src/routes/auth.routes.js | Rutas para el login/registro de usuarios. |
| backend/src/routes/client.routes.js | Rutas para la gestión de clientes (CRUD)7777. |

3.   
   **Crear Carpetas y Archivos Esqueleto del Frontend:**  
   * Crea las carpetas components, pages, services, y contexts dentro de /frontend/src.  
   * Crea las subcarpetas dentro de pages (Login, Clients, Products) y empieza con un componente .js o .jsx dentro de cada una.

¡Excelente\! Dar ese primer paso con la estructura básica es crucial. Basado en la metodología incremental de tu proyecto 1, la arquitectura de tres capas 2, y los requerimientos definidos en el **Informe de Avances 1** 3, te recomiendo comenzar de la siguiente manera, centrándote en la **base de la seguridad y la usabilidad (Módulo de Usuarios)**.

Este enfoque te asegura que la capa más crítica, la autenticación, esté funcional antes de integrar la lógica de negocio.

## **🚀 Plan de Inicio para la Iteración 1**

### **Paso 1: Configurar la Capa de Datos (Backend \- Modelos)**

Antes de que el servidor pueda manejar el inicio de sesión o clientes, necesita conectarse a la base de datos y definir cómo se estructuran los datos.

1. **Conexión a MySQL (db.config.js)**:  
   * Crea el código para establecer la conexión a tu base de datos MySQL (utilizando los parámetros del .env).  
2. **Modelo de Usuario (models/User.js)**:  
   * Implementa el modelo para la tabla Usuario. Esto es fundamental para cumplir con los requerimientos de **Alta de Usuarios** y **Asignación de Roles** 4. Los campos esenciales son: nombre completo, nombre de usuario, contraseña, rol y fecha de creación5.

### **Paso 2: Configurar el Servidor y la Autenticación (Backend \- Lógica de Negocio)**

Ahora que tienes el modelo de datos, define cómo el servidor recibe y procesa las peticiones.

1. **Inicialización de Express (app.js y server.js)**:  
   * En server.js, importa y llama a la aplicación principal de Express.  
   * En app.js, configura los *middlewares* básicos de Express (ej. *CORS*, *body-parser*) y el puerto de escucha.  
2. **Rutas de Autenticación (routes/auth.routes.js)**:  
   * Define las rutas iniciales para:  
     * /api/auth/register (para el Alta de Usuarios 666)  
     * /api/auth/login (para el Inicio de sesión 777)  
3. **Controlador de Autenticación (controllers/auth.controller.js)**:  
   * Implementa la lógica para el registro de usuarios (con *hashing* de contraseñas)8.  
   * Implementa la lógica para el inicio de sesión, que debe **validar las credenciales** 9 y generar un *token* (JWT) si son correctas.

### **Paso 3: Desarrollar la Interfaz de Usuario (Frontend \- Autenticación)**

El foco inicial en el frontend debe ser la pantalla de inicio de sesión.

1. **Configuración Base de React**:  
   * Configura el entorno para usar **TailwindCSS** (si aún no lo hiciste) para cumplir con el requisito de ser una **aplicación web responsiva**10101010.  
   * Configura la navegación (react-router-dom) para la vista de Login y el futuro *Dashboard*.  
2. **Pantalla de Login (pages/Login/)**:  
   * Implementa la interfaz de usuario para el inicio de sesión.  
   * Conecta el formulario al *backend* (utilizando la lógica en services/).  
3. **Contexto de Autenticación (contexts/AuthContext.js)**:  
   * Crea un contexto de React para almacenar el estado del usuario autenticado y el *token*. Esto centraliza la gestión del acceso11.

### **Resumen: Priorización de Tareas**

| Prioridad | Módulo | Requerimiento Funcional Cubierto |
| :---- | :---- | :---- |
| **Crítica** | **Seguridad** | Inicio de sesión, Alta de Usuarios (Autenticación y Roles)121212121212121212. |
| **Alta** | **Infraestructura** | Conexión a la Base de Datos. |

Una vez que el usuario puede iniciar sesión, puedes proceder a implementar el módulo de **Clientes** y luego el de **Productos para Reparar**, ya que la autenticación es la puerta de entrada a todas las demás funcionalidades13.

Comprendido. Dado que estás empezando con este *stack* (React.js, Node.js/Express, MySQL), es mejor adoptar un enfoque de "paso a paso" y verificar cada componente antes de pasar al siguiente.

Aquí tienes un plan de acción con pasos muy pequeños, centrados en la tarea más crítica para empezar: **Conexión a la Base de Datos y un Endpoint de Prueba**.

---

## **1\. Configuración Inicial del Backend (Node.js/Express)**

El objetivo es tener tu servidor Express funcionando y conectado a la base de datos MySQL.

### **1.1. Configurar Archivos Esenciales**

Asegúrate de que tus archivos básicos tengan este contenido.

| Archivo | Contenido Mínimo |
| :---- | :---- |
| backend/.env | Define las variables de conexión a la base de datos. |
| backend/server.js | El punto de entrada que levanta tu servidor. |
| backend/src/app.js | El corazón de Express, donde defines el middleware. |

**backend/.env**

Fragmento de código  
\# Variables de entorno para el backend  
PORT=3001

\# Configuración de la Base de Datos MySQL (ajusta estos valores)  
DB\_HOST=localhost  
DB\_USER=root  
DB\_PASSWORD=tu\_contraseña\_segura  
DB\_NAME=taller\_db

**backend/server.js**

JavaScript  
// Este es el punto de inicio de la aplicación  
const app \= require('./src/app');  
require('dotenv').config(); // Carga las variables del .env  
const port \= process.env.PORT || 3001;

// Escucha en el puerto definido  
app.listen(port, () \=\> {  
  console.log(\`Server is running on port \${port}\`);  
  console.log(\`Access at: http\://localhost:\${port}\`);  
});

**backend/src/app.js**

JavaScript  
// src/app.js  
const express \= require('express');  
const cors \= require('cors'); // Para permitir peticiones desde el frontend (React)

const app \= express();

// Middleware  
app.use(cors()); // Importante para la comunicación Frontend-Backend  
app.use(express.json()); // Para poder recibir datos JSON en las peticiones

// Rutas de prueba inicial  
app.get('/', (req, res) \=\> {  
  res.send('Welcome to the Taller Backend API');  
});

// Ejemplo de ruta que devuelve un JSON  
app.get('/api/test', (req, res) \=\> {  
  res.status(200).json({   
    message: 'API is working\!',  
    date: new Date()   
  });  
});

module.exports \= app;

### **1.2. Instalar y Ejecutar Dependencias**

Abre tu terminal en la carpeta /backend e instala las librerías necesarias.

Bash  
npm install express mysql2 dotenv cors  
\# O si usas yarn:  
\# yarn add express mysql2 dotenv cors

Para simplificar la ejecución, añade un script en tu package.json:

JSON  
// backend/package.json (fragmento)  
"scripts": {  
  "start": "node server.js",  
  "dev": "nodemon server.js"   
  // Instala nodemon globalmente o como dependencia de desarrollo (npm install \-g nodemon)  
},

Finalmente, ejecuta el servidor:

Bash  
npm start  
\# o  
npm run dev

**Verificación:** Abre tu navegador o Postman y ve a http\://localhost:3001/api/test. Deberías ver la respuesta JSON.

---

## **2\. Implementar la Conexión a MySQL**

Ahora vamos a usar la librería mysql2 y la configuración de db.config.js para conectarnos.

### **2.1. Configurar el Pool de Conexiones**

**backend/src/config/db.config.js**

JavaScript  
// src/config/db.config.js  
require('dotenv').config();  
const mysql \= require('mysql2');

// Crea el pool de conexiones usando las variables del .env  
const pool \= mysql.createPool({  
  host: process.env.DB\_HOST,  
  user: process.env.DB\_USER,  
  password: process.env.DB\_PASSWORD,  
  database: process.env.DB\_NAME,  
  waitForConnections: true,  
  connectionLimit: 10,  
  queueLimit: 0  
});

// Prueba la conexión  
pool.getConnection((err, connection) \=\> {  
  if (err) {  
    console.error('Database connection failed:', err.stack);  
    return;  
  }  
  console.log('Successfully connected to MySQL as id ' \+ connection.threadId);  
  connection.release();   
});

module.exports \= pool.promise(); // Exporta para usar en los modelos/controladores

### **2.2. Integrar la Conexión en app.js**

Asegúrate de que la conexión se intente establecer cuando la aplicación inicie.

**backend/src/app.js** (Solo añade la importación al inicio)

JavaScript  
// src/app.js  
const express \= require('express');  
const cors \= require('cors');  
// Importa el pool de conexiones para que se ejecute la prueba de conexión al iniciar la app  
const db \= require('./config/db.config'); // \<--- AÑADIR ESTO

const app \= express();  
// ... resto del código

**Verificación:** Reinicia tu servidor (npm start). Deberías ver el mensaje de consola: **Successfully connected to MySQL as id X**.

---

## **3\. Preparación del Frontend (React.js)**

El objetivo es asegurar que la aplicación React pueda comunicarse con el backend.

### **3.1. Crear un Componente de Prueba**

Vamos a modificar App.js para que haga una petición al endpoint de prueba que creaste (/api/test).

**frontend/src/App.js**

JavaScript  
// frontend/src/App.js  
import React, { useState, useEffect } from 'react';  
import './App.css'; 

function App() {  
  const \[message, setMessage\] \= useState('Loading...');

  // Función para hacer la llamada al backend  
  useEffect(() \=\> {  
    fetch('http\://localhost:3001/api/test') // Asegúrate que el puerto coincida con el backend  
      .then(response \=\> {  
        if (\!response.ok) {  
          throw new Error('Network response was not ok');  
        }  
        return response.json();  
      })  
      .then(data \=\> {  
        setMessage(data.message \+ ' \- ' \+ data.date);  
      })  
      .catch(error \=\> {  
        setMessage('Error connecting to backend: ' \+ error.message);  
      });  
  }, \[\]);

  return (  
    \<div className="App"\>  
      \<header className="App-header"\>  
        \<h1\>Taller App Frontend\</h1\>  
        \<p\>Backend Status: {message}\</p\>  
        \<p\>✅ Frontend running on port 3000 (usually)\</p\>  
      \</header\>  
    \</div\>  
  );  
}

export default App;

**Verificación:** Inicia tu aplicación React (usualmente con npm start en la carpeta /frontend). Deberías ver en la pantalla el mensaje de que la **API está funcionando**, lo que confirma que la comunicación entre el frontend y el backend está configurada correctamente.

**Perfecto, funciono de maravillas, tengo una duda, para correr la aplicacion entonces necesito primero ejecutar npm start en /backend y despues lo mismo en /frontend?** 

Comprendido. Volvamos al desarrollo real. El paso que sigue es vital: **implementar el Modelo de Datos para los Usuarios (Autenticación)**. Esto es lo mínimo indispensable para empezar a construir cualquier funcionalidad segura.

Seguiremos con el **Paso 1** de nuestro plan incremental: Configurar la capa de datos.

---

## **1\. Implementación del Modelo de Usuario (Backend)**

El objetivo es crear la estructura de la tabla Usuario en tu proyecto para manejar los requerimientos de **Alta de Usuarios** y **Asignación de Roles** 1. Dado que estás usando mysql2, utilizaremos código SQL para definir la estructura de la tabla.

### **1.1. Crear la Tabla Usuario en MySQL**

Asume que ya creaste la base de datos taller\_db (según tu archivo .env). Debes ejecutar el siguiente código SQL en tu cliente de MySQL (MySQL Workbench, DBeaver, etc.) para crear la tabla de usuarios.

SQL  
\-- SQL para crear la tabla de roles (para cumplir con la Asignación de Roles)  
CREATE TABLE Role (  
    id\_role INT PRIMARY KEY AUTO\_INCREMENT,  
    name VARCHAR(50) NOT NULL UNIQUE  
);

\-- Insertar roles iniciales basados en los requerimientos (Administrador, Técnico, Administrativo) \[cite: 58, 534-536\]  
INSERT INTO Role (name) VALUES ('Administrador'), ('Tecnico'), ('Administrativo'), ('Operario');

\-- SQL para crear la tabla de usuarios  
CREATE TABLE User (  
    id\_user INT PRIMARY KEY AUTO\_INCREMENT,  
    full\_name VARCHAR(100) NOT NULL,  
    username VARCHAR(50) NOT NULL UNIQUE,  
    password\_hash VARCHAR(255) NOT NULL, \-- Almacenará la contraseña cifrada (hash)  
    id\_role INT,  
    is\_active BOOLEAN NOT NULL DEFAULT TRUE, \-- Para Habilitacion de usuarios \[cite: 63\]  
    created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,  
    updated\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP ON UPDATE CURRENT\_TIMESTAMP,  
      
    \-- Clave foránea para el rol  
    FOREIGN KEY (id\_role) REFERENCES Role(id\_role)  
);

### **1.2. Crear el Archivo de Lógica del Modelo (User.js)**

En tu arquitectura MVC, el "Modelo" debe contener la lógica para interactuar con la base de datos (CRUD: Crear, Leer, Actualizar, Borrar). Usarás el pool de conexiones que definiste en db.config.js.

**backend/src/models/User.js**

JavaScript  
// src/models/User.js

// Importa el pool de conexiones de la base de datos  
const db \= require('../config/db.config'); 

/\*\*  
 \* Busca un usuario por su nombre de usuario.  
 \* @param {string} username \- El nombre de usuario a buscar.  
 \* @returns {Promise\<Object\>} Un objeto con los datos del usuario o null.  
 \*/  
exports.findByUsername \= async (username) \=\> {  
    // Consulta SQL para obtener todos los datos del usuario, incluyendo el nombre del rol.  
    const query \= \`  
        SELECT   
            u.id\_user, u.full\_name, u.username, u.password\_hash, u.is\_active, r.name as role\_name   
        FROM User u  
        JOIN Role r ON u.id\_role \= r.id\_role  
        WHERE u.username \= ?  
    \`;  
      
    try {  
        const \[rows\] \= await db.query(query, \[username\]);  
        // Si se encuentra una fila, devuelve el primer objeto (el usuario)  
        return rows\[0\] || null;  
    } catch (error) {  
        console.error("Error finding user by username:", error);  
        throw error;  
    }  
};

/\*\*  
 \* Registra un nuevo usuario en la base de datos.  
 \* @param {Object} userData \- Datos del usuario (full\_name, username, password\_hash, id\_role).  
 \* @returns {Promise\<number\>} El ID del usuario recién creado.  
 \*/  
exports.create \= async (userData) \=\> {  
    // Requerimiento: El sistema debe registrar nuevos usuarios \[cite: 54\]  
    const query \= \`  
        INSERT INTO User (full\_name, username, password\_hash, id\_role)  
        VALUES (?, ?, ?, ?)  
    \`;  
      
    try {  
        const \[result\] \= await db.query(query, \[  
            userData.full\_name,  
            userData.username,  
            userData.password\_hash,  
            userData.id\_role  
        \]);  
          
        return result.insertId;  
    } catch (error) {  
        console.error("Error creating new user:", error);  
        throw error;  
    }  
};

// Se pueden añadir aquí otras funciones del CRUD (ej. exports.update, exports.delete)

**Siguiente Paso:** Una vez que este modelo esté listo, el siguiente paso es crear el **Controlador de Autenticación (auth.controller.js)** que usará estas funciones para manejar las peticiones HTTP de Login y Registro.

Excelente, la capa del Modelo de Datos para los usuarios ya está lista, lo que significa que tienes la base para interactuar con las tablas User y Role.

El siguiente paso crucial es crear la **Lógica del Negocio** para la autenticación: el **Controlador de Autenticación**. Este archivo recibirá las peticiones HTTP del frontend (JSON con usuario y contraseña) y usará tu modelo para verificar credenciales y registrar nuevos usuarios.

Necesitarás instalar dos librerías clave en tu proyecto de **backend**:

1. **bcrypt**: Para cifrar y comparar contraseñas de forma segura (hashing)1.  
2. **jsonwebtoken (JWT)**: Para crear un *token* que pruebe la identidad del usuario una vez que inicia sesión correctamente.

Abre tu terminal en la carpeta /backend e instala:

Bash  
npm install bcrypt jsonwebtoken

---

## **2\. Implementación del Controlador de Autenticación**

El controlador manejará dos funciones principales: register (Registro de Usuarios) y login (Inicio de Sesión).

### **backend/src/controllers/auth.controller.js**

JavaScript  
// src/controllers/auth.controller.js

const User \= require('../models/User');  
const bcrypt \= require('bcrypt');  
const jwt \= require('jsonwebtoken');

// \--- 1\. CONFIGURACIÓN \---  
// Deberías mover esto a tu archivo .env por seguridad.  
const JWT\_SECRET \= process.env.JWT\_SECRET || 'YOUR\_SECURE\_RANDOM\_SECRET\_KEY';  
const SALT\_ROUNDS \= 10; // Nivel de seguridad para el hashing de bcrypt

// \--- 2\. FUNCIÓN DE REGISTRO (Alta de Usuarios) \---

exports.register \= async (req, res) \=\> {  
    // Requerimientos: nombre completo, nombre de usuario, contraseña y rol. \[cite: 55\]  
    // Requerimiento: El nombre de usuario debe ser único. \[cite: 56\]  
    const { full\_name, username, password, id\_role } \= req.body;

    // Validación mínima de entrada  
    if (\!username || \!password || \!full\_name || \!id\_role) {  
        return res.status(400).json({ message: "All fields (full\_name, username, password, id\_role) are required." });  
    }  
      
    // Requerimiento: La contraseña debe cumplir con longitud mínima.   
    if (password.length \< 8\) {  
        return res.status(400).json({ message: "Password must be at least 8 characters long." });  
    }

    try {  
        // 1\. Verificar unicidad del usuario  
        const existingUser \= await User.findByUsername(username);  
        if (existingUser) {  
            return res.status(409).json({ message: "Username already exists." });  
        }

        // 2\. Cifrar la contraseña  
        const password\_hash \= await bcrypt.hash(password, SALT\_ROUNDS);

        // 3\. Crear el nuevo usuario  
        const newUserId \= await User.create({  
            full\_name,  
            username,  
            password\_hash,  
            id\_role   
        });

        // 4\. Respuesta exitosa  
        res.status(201).json({   
            message: "User registered successfully.",   
            userId: newUserId   
        });

    } catch (error) {  
        console.error('Registration error:', error);  
        res.status(500).json({ message: "Internal server error during registration." });  
    }  
};

// \--- 3\. FUNCIÓN DE LOGIN (Inicio de Sesión) \---

exports.login \= async (req, res) \=\> {  
    // Requerimiento: Permitir inicio de sesión mediante nombre de usuario y contraseña. \[cite: 65\]  
    // Requerimiento: El sistema debe validar las credenciales de acceso. \[cite: 73\]  
    const { username, password } \= req.body;

    if (\!username || \!password) {  
        return res.status(400).json({ message: "Username and password are required." });  
    }

    try {  
        // 1\. Buscar usuario por nombre de usuario  
        const user \= await User.findByUsername(username);  
          
        // Verificar si el usuario existe o si está deshabilitado  
        if (\!user || \!user.is\_active) {  
            return res.status(401).json({ message: "Invalid credentials or account disabled." });  
        }

        // 2\. Comparar la contraseña ingresada con el hash guardado  
        const isMatch \= await bcrypt.compare(password, user.password\_hash);

        if (\!isMatch) {  
            return res.status(401).json({ message: "Invalid credentials." });  
        }

        // 3\. Generar el Token de Autenticación (JWT)  
        const token \= jwt.sign(  
            { id: user.id\_user, role: user.role\_name },   
            JWT\_SECRET,   
            { expiresIn: '1h' } // Token expira en 1 hora  
        );

        // 4\. Respuesta exitosa (enviando el token y la información del usuario)  
        res.status(200).json({  
            message: "Login successful.",  
            token,  
            user: {  
                id: user.id\_user,  
                full\_name: user.full\_name,  
                username: user.username,  
                role: user.role\_name  
            }  
        });

    } catch (error) {  
        console.error('Login error:', error);  
        res.status(500).json({ message: "Internal server error during login." });  
    }  
};

---

## **Próximo Paso: Crear las Rutas**

El siguiente paso lógico es crear el archivo **auth.routes.js** y conectar estas dos funciones (register y login) a los *endpoints* de la API. Luego, integramos esas rutas en el archivo principal app.js.

¡Excelente\! Con la lógica del controlador lista, el siguiente paso es conectar esas funciones (register y login) a las URLs específicas de tu API REST.

Aquí te muestro cómo crear el archivo de rutas y luego cómo integrarlo en tu aplicación principal de Express (app.js).

---

## **3\. Implementación de las Rutas de Autenticación**

El objetivo es mapear las funciones del controlador a los métodos HTTP (POST) y a las rutas (endpoints).

### **3.1. Crear el Archivo de Rutas**

Crea el archivo **backend/src/routes/auth.routes.js** y define los endpoints de registro e inicio de sesión.

**backend/src/routes/auth.routes.js**

JavaScript  
// src/routes/auth.routes.js

const express \= require('express');  
const router \= express.Router(); // Utiliza el Router de Express para definir rutas  
const authController \= require('../controllers/auth.controller');

// Ruta POST para registrar un nuevo usuario  
// Endpoint: /api/auth/register  
router.post('/register', authController.register);

// Ruta POST para el inicio de sesión  
// Endpoint: /api/auth/login  
router.post('/login', authController.login);

module.exports \= router;

---

## **4\. Integración de las Rutas en la Aplicación Principal**

Ahora tienes que decirle a tu aplicación Express (app.js) que use estas rutas bajo un prefijo común (/api/auth).

### **4.1. Modificar app.js**

Abre **backend/src/app.js** y añade la importación y el uso del nuevo archivo de rutas.

**backend/src/app.js** (Fragmento, solo las partes nuevas/modificadas)

JavaScript  
// src/app.js  
const express \= require('express');  
const cors \= require('cors');   
// Importa el pool de conexiones de la DB (para que se inicie la conexión)  
const db \= require('./config/db.config'); 

// Importa el nuevo módulo de rutas de autenticación  
const authRoutes \= require('./routes/auth.routes'); // \<--- AÑADIR ESTO

const app \= express();

// Middleware  
app.use(cors());   
app.use(express.json()); // Para poder recibir datos JSON en las peticiones

// \--- RUTAS DE PRUEBA (puedes eliminarlas o moverlas) \---  
app.get('/', (req, res) \=\> {  
  res.send('Welcome to the Taller Backend API');  
});  
app.get('/api/test', (req, res) \=\> {  
  res.status(200).json({   
    message: 'API is working\!',  
    date: new Date()   
  });  
});  
// \-----------------------------------------------------

// \--- RUTAS DE LA APLICACIÓN \---  
// Define el prefijo base /api/auth para todas las rutas del módulo  
app.use('/api/auth', authRoutes); // \<--- AÑADIR ESTO

module.exports \= app;

---

## **✅ Verificación**

1. **Reinicia tu servidor** en la carpeta /backend (npm run dev o npm start).  
2. Usa una herramienta como **Postman** o **cURL** para probar los nuevos *endpoints*:

### **Prueba 1: Registro (Crear un Administrador Inicial)**

* **Método:** POST  
* **URL:** http\://localhost:3001/api/auth/register  
* **Body (raw JSON):**  
* JSON

{  
    "full\_name": "Federico Tourn",  
    "username": "admin",  
    "password": "PasswordSeguro123",  
    "id\_role": 1    
    // Asume que '1' es el ID para 'Administrador' según tu tabla Role.  
}

*   
* **Resultado esperado:** Status 201 Created y un mensaje de éxito.

### **Prueba 2: Inicio de Sesión**

* **Método:** POST  
* **URL:** http\://localhost:3001/api/auth/login  
* **Body (raw JSON):**  
* JSON

{  
    "username": "admin",  
    "password": "PasswordSeguro123"  
}

*   
* **Resultado esperado:** Status 200 OK y la respuesta debe contener un **token JWT** y la información del usuario.

Una vez que estas pruebas funcionen, tendrás el módulo de autenticación completamente operativo en el backend, lo que te permitirá pasar al frontend para crear la interfaz de login.

¡Genial\! Que las pruebas de los endpoints de autenticación funcionen significa que tu backend está sólido.

Ahora, vamos a pasar al frontend (React) para crear una **interfaz de inicio de sesión básica** y conectarla al backend. El objetivo de este paso es verificar que la conexión completa (Frontend \$\\to\$ Backend \$\\to\$ MySQL) funcione con credenciales reales.

---

## **5\. Implementación del Frontend (Login Básico)**

Comenzaremos creando el servicio (la lógica para hacer las peticiones HTTP), el contexto de autenticación (para manejar el estado global del usuario), y finalmente la vista de Login.

### **5.1. Crear el Servicio de Autenticación (auth.service.js)**

Este archivo es el que se comunicará directamente con tus endpoints de Express.

Crea el archivo **frontend/src/services/auth.service.js**:

JavaScript  
// frontend/src/services/auth.service.js

const API\_URL \= 'http\://localhost:3001/api/auth'; // Asegúrate que el puerto coincida

/\*\*  
 \* Función para iniciar sesión.  
 \* @param {string} username \- Nombre de usuario.  
 \* @param {string} password \- Contraseña.  
 \* @returns {Promise\<Object\>} Datos del usuario y token.  
 \*/  
export const login \= async (username, password) \=\> {  
    const response \= await fetch(\`\${API\_URL}/login\`, {  
        method: 'POST',  
        headers: {  
            'Content-Type': 'application/json',  
        },  
        body: JSON.stringify({ username, password }),  
    });

    const data \= await response.json();

    if (\!response.ok) {  
        // Lanza un error si el backend responde con un código de error (401, 500, etc.)  
        throw new Error(data.message || "Failed to log in.");  
    }

    // Si el login es exitoso, guarda el token en el almacenamiento local (LocalStorage)  
    if (data.token) {  
        localStorage.setItem('user\_token', data.token);  
        localStorage.setItem('user\_data', JSON.stringify(data.user));  
    }

    return data.user;  
};

/\*\*  
 \* Función para cerrar la sesión (elimina el token).  
 \*/  
export const logout \= () \=\> {  
    localStorage.removeItem('user\_token');  
    localStorage.removeItem('user\_data');  
};

/\*\*  
 \* Función para obtener los datos del usuario logueado desde el almacenamiento local.  
 \*/  
export const getCurrentUser \= () \=\> {  
    const user\_data \= localStorage.getItem('user\_data');  
    return user\_data ? JSON.parse(user\_data) : null;  
};

---

### **5.2. Crear el Contexto de Autenticación (AuthContext.js)**

El contexto permitirá que cualquier componente en tu aplicación (como el menú, el dashboard, etc.) sepa si el usuario está logueado, sin tener que pasar la información manualmente.

Crea el archivo **frontend/src/contexts/AuthContext.js**:

JavaScript  
// frontend/src/contexts/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';  
import { login, logout, getCurrentUser } from '../services/auth.service';

const AuthContext \= createContext();

export const useAuth \= () \=\> useContext(AuthContext);

export const AuthProvider \= ({ children }) \=\> {  
    const \[user, setUser\] \= useState(null);  
    const \[isLoading, setIsLoading\] \= useState(true);

    // Carga el usuario al iniciar la aplicación si hay un token guardado  
    useEffect(() \=\> {  
        const storedUser \= getCurrentUser();  
        if (storedUser) {  
            setUser(storedUser);  
        }  
        setIsLoading(false);  
    }, \[\]);

    const signIn \= async (username, password) \=\> {  
        setIsLoading(true);  
        try {  
            const userData \= await login(username, password);  
            setUser(userData);  
            setIsLoading(false);  
            return userData;  
        } catch (error) {  
            setIsLoading(false);  
            throw error; // Propaga el error para que la vista lo maneje  
        }  
    };

    const signOut \= () \=\> {  
        logout();  
        setUser(null);  
    };

    const value \= {  
        user,  
        isLoading,  
        isAuthenticated: \!\!user,  
        signIn,  
        signOut,  
    };

    return \<AuthContext.Provider value={value}\>{children}\</AuthContext.Provider\>;  
};

---

### **5.3. Usar el Contexto en el Punto de Entrada**

Debes envolver tu aplicación principal con el AuthProvider.

Modifica **frontend/src/index.js** (o donde sea que inicie tu app):

JavaScript  
// frontend/src/index.js (fragmento)  
import React from 'react';  
import ReactDOM from 'react-dom/client';  
import './index.css';  
import App from './App';  
// Importa el AuthProvider  
import { AuthProvider } from './contexts/AuthContext'; 

const root \= ReactDOM.createRoot(document.getElementById('root'));  
root.render(  
  \<React.StrictMode\>  
    {/\* Envuelve la aplicación con el proveedor de autenticación \*/}  
    \<AuthProvider\>  
      \<App /\>  
    \</AuthProvider\>  
  \</React.StrictMode\>  
);

---

### **5.4. Crear la Vista de Login (LoginPage.jsx)**

Ahora vamos a implementar la interfaz de usuario. Usaremos código simple de React, ya que la complejidad de TailwindCSS se puede añadir después.

Crea el archivo **frontend/src/pages/Login/LoginPage.jsx**:

JavaScript  
// frontend/src/pages/Login/LoginPage.jsx

import React, { useState } from 'react';  
import { useAuth } from '../../contexts/AuthContext';

const LoginPage \= () \=\> {  
    const { signIn, isAuthenticated, user } \= useAuth();  
    const \[username, setUsername\] \= useState('');  
    const \[password, setPassword\] \= useState('');  
    const \[error, setError\] \= useState('');

    const handleSubmit \= async (e) \=\> {  
        e.preventDefault();  
        setError('');

        if (\!username || \!password) {  
            setError("Username and password are required.");  
            return;  
        }

        try {  
            await signIn(username, password);  
            // Si tiene éxito, el contexto de autenticación actualizará la aplicación  
            // (En un sistema real, aquí harías una redirección al Dashboard)  
        } catch (err) {  
            // Muestra el error devuelto por el backend  
            setError(err.message || "Login failed. Check server status.");  
        }  
    };

    if (isAuthenticated) {  
        // Muestra el estado del usuario logueado (Temporal)  
        return (  
            \<div style={{ padding: '20px', border: '1px solid green' }}\>  
                \<h2\>¡Login Exitoso\! ✅\</h2\>  
                \<p\>Bienvenido, {user.full\_name} ({user.role})\</p\>  
                \<button onClick={useAuth().signOut}\>Cerrar Sesión\</button\>  
            \</div\>  
        );  
    }

    // Formulario de Login  
    return (  
        \<div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid \#ccc' }}\>  
            \<h2\>Inicio de Sesión \- UTN Taller\</h2\>  
            \<form onSubmit={handleSubmit}\>  
                \<div style={{ marginBottom: '15px' }}\>  
                    \<label\>Usuario:\</label\>  
                    \<input   
                        type="text"  
                        value={username}  
                        onChange={(e) \=\> setUsername(e.target.value)}  
                        style={{ width: '100%', padding: '8px' }}  
                    /\>  
                \</div\>  
                \<div style={{ marginBottom: '15px' }}\>  
                    \<label\>Contraseña:\</label\>  
                    \<input   
                        type="password"  
                        value={password}  
                        onChange={(e) \=\> setPassword(e.target.value)}  
                        style={{ width: '100%', padding: '8px' }}  
                    /\>  
                \</div\>  
                {error && \<p style={{ color: 'red' }}\>{error}\</p\>}  
                \<button type="submit" style={{ padding: '10px 15px', backgroundColor: 'blue', color: 'white', border: 'none' }}\>  
                    Ingresar  
                \</button\>  
            \</form\>  
        \</div\>  
    );  
};

export default LoginPage;

---

### **5.5. Conectar la Vista a App.js**

Finalmente, modifica **frontend/src/App.js** para mostrar esta página.

JavaScript  
// frontend/src/App.js

import React from 'react';  
import './App.css';   
import LoginPage from './pages/Login/LoginPage';

function App() {  
  // En un proyecto real usarías react-router-dom para manejar las rutas  
  // Pero por ahora, mostramos directamente la página de Login  
  return (  
    \<div className="App"\>  
      \<LoginPage /\>  
    \</div\>  
  );  
}

export default App;

## **✅ Verificación Final**

1. Asegúrate de que tu **backend esté corriendo** (npm start en /backend).  
2. Inicia tu **frontend** (npm start en /frontend).  
3. Ingresa las credenciales del usuario admin que creaste en el paso anterior.  
4. Si el login funciona, verás el mensaje de "Login Exitoso". Si falla, verás el mensaje de error devuelto por el backend.

Con esto, has completado el ciclo completo de autenticación y tienes la base para empezar a trabajar en la vista del Dashboard y la **Gestión de Clientes**.

**Me tiro este error:**  
**src\\pages\\Login\\LoginPage.jsx**  
**React Hook "useAuth" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?**

**La linea 35:34 a la que hace referencia creo que puede ser una de estas:**  
                **\<p\>Bienvenido, {user.full\_name} ({user.role})\</p\>**  
                **\<button onClick={useAuth().signOut}\>Cerrar Sesión\</button\>**

Tienes razón, ese error es un clásico de React. La línea de código que señalaste es la causa.

El problema no es el contenido de la línea en sí, sino **dónde** estás llamando al Hook useAuth() dentro del componente.

### **📝 Diagnóstico del Error**

React tiene una regla estricta: **los Hooks (como useState, useEffect, y tus *Custom Hooks* como useAuth) solo pueden ser llamados en el nivel superior de una función de componente de React**. No pueden estar dentro de bucles, condiciones (if), ni después de un *early return*.

En tu código LoginPage.jsx, estás haciendo esto:

JavaScript  
// LoginPage.jsx (Fragmento con el error conceptual)  
const LoginPage \= () \=\> {  
    // ... otros Hooks llamados aquí (Nivel superior)

    if (isAuthenticated) {  
        // ... (Early return)  
        return (  
            // ...  
            \<button onClick={useAuth().signOut}\>Cerrar Sesión\</button\> // \<-- ERROR: Hook llamado dentro del JSX, DESPUÉS del Hook useAuth en la línea 6  
        );  
    }  
      
    // ... resto del componente  
};

Cuando React evalúa el componente, si se cumple isAuthenticated y se hace el *early return*, la segunda llamada a useAuth() que está dentro del JSX del botón nunca se ejecuta. Esto rompe la regla de "llamar Hooks en el mismo orden en cada renderizado".

### **✅ Solución: Llamar al Hook una Sola Vez**

Debes llamar a **useAuth() una sola vez** al inicio del componente y guardar las funciones (signOut, signIn) en variables.

Aquí tienes la versión corregida de tu componente LoginPage.jsx:

JavaScript  
// frontend/src/pages/Login/LoginPage.jsx (CORREGIDO)

import React, { useState } from 'react';  
import { useAuth } from '../../contexts/AuthContext';

const LoginPage \= () \=\> {  
    // 1\. LLAMA AL HOOK useAuth UNA SOLA VEZ AL INICIO  
    // Desestructura todas las funciones y valores que necesites.  
    const { signIn, signOut, isAuthenticated, user } \= useAuth(); // \<-- HOOKS EN EL NIVEL SUPERIOR  
      
    const \[username, setUsername\] \= useState('');  
    const \[password, setPassword\] \= useState('');  
    const \[error, setError\] \= useState('');

    const handleSubmit \= async (e) \=\> {  
        e.preventDefault();  
        setError('');

        if (\!username || \!password) {  
            setError("Username and password are required.");  
            return;  
        }

        try {  
            // Usa la función signIn desestructurada  
            await signIn(username, password);   
        } catch (err) {  
            setError(err.message || "Login failed. Check server status.");  
        }  
    };

    if (isAuthenticated) {  
        // Si el usuario está autenticado, muestra el mensaje y el botón de cerrar sesión  
        return (  
            \<div style={{ padding: '20px', border: '1px solid green' }}\>  
                \<h2\>¡Login Exitoso\! ✅\</h2\>  
                \<p\>Bienvenido, {user.full\_name} ({user.role})\</p\>  
                {/\* 2\. USA LA FUNCIÓN signOut DESESTRUCTURADA \*/}  
                \<button onClick={signOut}\>Cerrar Sesión\</button\>   
            \</div\>  
        );  
    }

    // Formulario de Login  
    return (  
        \<div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid \#ccc' }}\>  
            \<h2\>Inicio de Sesión \- UTN Taller\</h2\>  
            \<form onSubmit={handleSubmit}\>  
                \<div style={{ marginBottom: '15px' }}\>  
                    \<label\>Usuario:\</label\>  
                    \<input   
                        type="text"  
                        value={username}  
                        onChange={(e) \=\> setUsername(e.target.value)}  
                        style={{ width: '100%', padding: '8px' }}  
                    /\>  
                \</div\>  
                \<div style={{ marginBottom: '15px' }}\>  
                    \<label\>Contraseña:\</label\>  
                    \<input   
                        type="password"  
                        value={password}  
                        onChange={(e) \=\> setPassword(e.target.value)}  
                        style={{ width: '100%', padding: '8px' }}  
                    /\>  
                \</div\>  
                {error && \<p style={{ color: 'red' }}\>{error}\</p\>}  
                \<button type="submit" style={{ padding: '10px 15px', backgroundColor: 'blue', color: 'white', border: 'none' }}\>  
                    Ingresar  
                \</button\>  
            \</form\>  
        \</div\>  
    );  
};

export default LoginPage;

Al hacer este cambio, el Hook useAuth() siempre se llama en la línea 9, asegurando que el orden de las llamadas sea consistente en cada renderizado. Esto resuelve el error.

