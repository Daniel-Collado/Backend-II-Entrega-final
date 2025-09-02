# Disquería Back

Es una plataforma e-commerce de una disquería, construida con Node.js y Express.js. Este proyecto incluye gestión de productos con filtros, carritos de compra, autenticación de usuarios (con roles de "user" y "admin") y una arquitectura de capas clara y escalable.

## 🚀 Tecnologías Utilizadas

- **Node.js**: Entorno de ejecución de JavaScript.
- **Express.js**: Framework de Node.js para el back-end.
- **MongoDB**: Base de datos NoSQL para la persistencia de datos.
- **Mongoose**: Modelado de objetos para MongoDB.
- **Handlebars.js (hbs)**: Motor de plantillas para renderizar las vistas.
- **Passport.js**: Middleware de autenticación con JWT (JSON Web Tokens) basado en cookies.
- **Cloudinary**: Servicio para almacenar y gestionar imágenes de los productos.
- **Multer**: Middleware para el manejo de `multipart/form-data`, usado para la subida de imágenes.
- **SweetAlert2**: Librería para alertas personalizadas en el front-end.

## 📋 Requisitos

- Node.js (v18 o superior recomendado)
- MongoDB (instalación local o un cluster en la nube como MongoDB Atlas)
- Una cuenta de Cloudinary para el almacenamiento de imágenes.

## ⚙️ Configuración y Ejecución

1.  Clona el repositorio:

    ```bash
    git clone <URL_DE_TU_REPOSITORIO>
    cd nombre-del-repositorio
    ```

2.  Crea un archivo `.env` en la raíz del proyecto y añade tus variables de entorno. Puedes usar el siguiente como ejemplo:

    ```
    PORT=8080
    MONGO_URL="<TU_URL_DE_CONEXION_A_MONGO>"
    JWT_SECRET="<TU_CLAVE_SECRETA_JWT>"
    CLOUDINARY_CLOUD_NAME="<TU_CLOUD_NAME>"
    CLOUDINARY_API_KEY="<TU_API_KEY>"
    CLOUDINARY_API_SECRET="<TU_API_SECRET>"
    ```

3.  Instala las dependencias:

    ```bash
    npm install
    ```

4.  Inicia el servidor:

    ```bash
    npm start
    ```

5.  El servidor se ejecutará en `http://localhost:8080`.

## 📂 Estructura del Proyecto

- `src/controllers/`: Maneja la lógica de las solicitudes HTTP (controladores).
- `src/services/`: Contiene la lógica de negocio.
- `src/repositories/`: Abstrae la comunicación con la capa de datos.
- `src/daos/`: Interactúa directamente con la base de datos (Data Access Objects).
- `src/routes/`: Define las rutas de la API.
- `src/models/`: Esquemas de Mongoose para los datos.
- `src/public/`: Archivos estáticos como CSS, JS del front-end e imágenes.
- `src/views/`: Archivos de plantillas de Handlebars (`.hbs`).

## 🗺️ Endpoints de la API

| Método   | Endpoint                        | Descripción                                             | Roles Requeridos |
| -------- | ------------------------------- | ------------------------------------------------------- | ---------------- |
| `GET`    | `/api/products`                 | Obtiene todos los productos (con filtros y paginación). | `user`, `admin`  |
| `GET`    | `/api/products/:pid`            | Obtiene un producto por su ID.                          | `user`, `admin`  |
| `POST`   | `/api/products`                 | Crea un nuevo producto.                                 | `admin`          |
| `PUT`    | `/api/products/:pid`            | Actualiza un producto existente.                        | `admin`          |
| `DELETE` | `/api/products/:pid`            | Elimina un producto.                                    | `admin`          |
| `POST`   | `/api/carts/:cid/products/:pid` | Agrega un producto a un carrito.                        | `user`           |
| `POST`   | `/api/sessions/register`        | Registra un nuevo usuario.                              | `public`         |
| `POST`   | `/api/sessions/login`           | Autentica a un usuario y genera una sesión.             | `public`         |
| `GET`    | `/api/tickets`                  | Obtiene todos los tickets de compra.                    | `admin`          |
| `GET`    | `/api/tickets/user/:uid`        | Obtiene los tickets de compra de un usuario específico. | `user`           |

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si encuentras un bug o tienes una idea para una nueva característica, enviame un mensaje : )

## 📝 Licencia

https://danielcolladodev.com.ar
