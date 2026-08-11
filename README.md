# Sistema de Revisión de Prácticas Profesionales

> **Versión mejorada V2.** Esta edición conserva el proyecto original y amplía el panel del administrador y el flujo de evaluación docente.
> Incluye dashboard de expedientes, filtros de reporte, revisión integral de documentos, historial de dictámenes y la nueva decisión **Rechazado**.

Proyecto completo (backend + base de datos + frontend + login) para gestionar
la revisión de expedientes de prácticas profesionales entre estudiantes,
docentes (comisión evaluadora) y un administrador.

- **Backend:** Node.js + Express + Sequelize
- **Base de datos:** SQLite (un solo archivo, no necesitas instalar nada aparte)
- **Autenticación:** JWT + contraseñas encriptadas con bcrypt
- **Frontend:** HTML + CSS + JavaScript puro (sin frameworks), consumiendo la API con `fetch`
- **Roles:** estudiante, docente, administrador

---

## 1. Requisitos

- [Node.js](https://nodejs.org/) versión 18 o superior (incluye `npm`)
- [Visual Studio Code](https://code.visualstudio.com/) (o cualquier editor)

Para comprobar que tienes Node instalado, abre una terminal y escribe:

```bash
node --version
```

Si te muestra un número como `v18.x.x` o mayor, estás listo.

---

## 2. Abrir el proyecto en VS Code

1. Descomprime el archivo `.zip` en cualquier carpeta.
2. Abre VS Code.
3. Ve a **Archivo → Abrir carpeta...** y selecciona la carpeta `sistema-practicas` (la que contiene `backend/`, `frontend/` y este README).

---

## 3. Instalar y configurar el backend

Abre una terminal dentro de VS Code (**Terminal → Nueva Terminal**) y ejecuta:

```bash
cd backend
npm install
```

Esto descarga todas las dependencias (puede tardar 1-2 minutos).

Ahora crea tu archivo de variables de entorno copiando el ejemplo:

```bash
# En Mac/Linux:
cp .env.example .env

# En Windows (PowerShell):
copy .env.example .env
```

(También puedes hacerlo a mano: clic derecho en `.env.example` → Copiar → Pegar → renombrar a `.env`)

---

## 4. Crear la base de datos con datos de prueba

Este comando crea el archivo de base de datos (`backend/database/practicas.sqlite`)
y lo llena con usuarios y expedientes de ejemplo:

```bash
npm run seed
```

Al terminar, la terminal te mostrará una lista de **correos y contraseñas de prueba** para cada rol. Guárdalos ahí mismo, o revisa la sección de credenciales más abajo.

⚠️ Ejecutar `npm run seed` de nuevo **borra y vuelve a crear** toda la base de datos. Úsalo cuando quieras reiniciar todo desde cero.

---

## 5. Levantar el proyecto

```bash
npm start
```

Deberías ver algo como:

```
✅ Conexión a la base de datos establecida.
✅ Modelos sincronizados con la base de datos.
🚀 Servidor corriendo en http://localhost:4000
   Frontend: http://localhost:4000/login.html
   API:      http://localhost:4000/api
```

Abre tu navegador en **http://localhost:4000** (te redirige automáticamente al login).

Para desarrollo, también puedes usar `npm run dev`, que reinicia el servidor solo cada vez que guardas un cambio (usa `nodemon`).

Para detener el servidor, vuelve a la terminal y presiona `Ctrl + C`.

---

## 6. Credenciales de prueba

| Rol | Correo | Contraseña | Qué puede hacer |
|---|---|---|---|
| Administrador | `admin@practicas.edu.pe` | `admin123` | Dashboard, reporte de expedientes, crear usuarios/expedientes y asignar docentes |
| Docente | `maria.lopez@practicas.edu.pe` | `docente123` | Revisar documentos e historial; aprobar, observar o rechazar |
| Docente | `jorge.salinas@practicas.edu.pe` | `docente123` | Revisar documentos e historial; aprobar, observar o rechazar |
| Estudiante | `carla.ramos@alumno.edu.pe` | `estudiante123` | Ver su expediente (viene **observado**, para probar la subida de subsanación) |
| Estudiante | `jorge.huaman@alumno.edu.pe` | `estudiante123` | Ver su expediente (viene urgente, casi al límite del plazo) |
| Estudiante | `rosa.quispe@alumno.edu.pe` | `estudiante123` | Ver su expediente |
| Estudiante | `luis.fernandez@alumno.edu.pe` | `estudiante123` | Ver su expediente |

---

## 7. Cómo probar el flujo completo

1. Entra como **docente** (`maria.lopez@practicas.edu.pe`) → verás tu bandeja
   con los expedientes asignados, ordenados por urgencia. Dale clic a
   **"Revisar y dictaminar"** en uno que esté "En comisión", revisa sus documentos
   y guarda un dictamen: **Aprobado** con nota, **Observado** con correcciones o
   **Rechazado** con un motivo obligatorio.
2. Cierra sesión y entra como el **estudiante** dueño de ese expediente →
   verás la línea de tiempo actualizada con el nuevo estado. Si quedó
   "Observado", podrás subir un documento de subsanación real (se guarda en
   `backend/uploads/`), y el expediente vuelve automáticamente a "En comisión".
3. Entra como **admin** (`admin@practicas.edu.pe`) → puedes crear un usuario
   nuevo, registrar un expediente nuevo asignándolo a un estudiante, y asignar
   un docente evaluador.

---

## 8. Estructura del proyecto

```
sistema-practicas/
├── backend/
│   ├── src/
│   │   ├── server.js         → arranque del servidor
│   │   ├── config/            → conexión a la base de datos
│   │   ├── models/             → tablas: Usuario, Expediente, Observacion...
│   │   ├── controllers/         → lógica de negocio
│   │   ├── routes/               → definición de endpoints
│   │   ├── middleware/            → autenticación JWT, roles, subida de archivos
│   │   ├── utils/                  → cálculo de días hábiles, JWT
│   │   └── seed.js                  → datos de prueba
│   ├── database/                      → aquí se crea el archivo .sqlite (se genera solo)
│   ├── uploads/                        → aquí se guardan los documentos subidos
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── login.html
│   ├── estudiante.html
│   ├── comision.html
│   ├── admin.html
│   ├── css/diseno.css
│   └── js/
├── docs/
│   └── ARQUITECTURA.md         → explicación técnica más a fondo + cómo escalarlo
└── README.md                    → este archivo
```

---

## 8.1. Mejoras incorporadas en esta versión

- **Administrador:** tarjetas con total de expedientes, en revisión, observados, aprobados, rechazados y sin docente; búsqueda y filtros en el reporte; exportación CSV; resumen de estudiantes/docentes; detalle de documentos y dictámenes.
- **Docente:** dashboard de carga de trabajo; filtros; revisión integral por expediente; documentos e historial en una sola ventana; decisiones **Aprobar**, **Observar** y **Rechazar**.
- **Estudiante:** visualización del tema, estado final aprobado/rechazado, historial de revisiones y bloqueo de nuevas cargas cuando el expediente ya tiene dictamen final.
- **Trazabilidad:** la asignación de docente registra el cambio `entregado → en_comision` en el historial.

---

## 9. Preguntas frecuentes

**"Error: no se pudo conectar" al abrir el navegador**
Asegúrate de que la terminal siga mostrando el mensaje `🚀 Servidor corriendo...`. Si la cerraste, corre `npm start` de nuevo dentro de `backend/`.

**Al iniciar sesión aparece "Failed to execute 'json' on 'Response': Unexpected end of JSON input"**
Esto pasa cuando el navegador le pide el login a un servidor que no es el backend, o cuando la conexión se corta a mitad de la respuesta. Dos causas típicas:
1. Estás abriendo `login.html` con la extensión **Live Server** de VS Code (puerto 5500) u otro servidor estático, en vez de entrar por **http://localhost:4000/login.html**. El frontend y el backend deben verse desde el mismo puerto (el 4000), porque el propio backend sirve el frontend.
2. Si usas `npm run dev` (nodemon), cada vez que se guardaba un archivo dentro de `backend/uploads` o `backend/database` (por ejemplo al subir un documento), nodemon reiniciaba el servidor completo y cortaba cualquier petición que estuviera en curso en ese momento — por eso fallaba de forma intermitente y no en un usuario fijo. Ya se agregó `backend/nodemon.json` para que solo reinicie el servidor cuando cambie código dentro de `backend/src`, y no por archivos subidos o por escrituras en la base de datos.

Además, ahora el frontend (`api.js`) muestra un mensaje claro en vez del error críptico del navegador si esto vuelve a pasar.

**Quiero ver los datos "crudos" de la base de datos**
Instala la extensión de VS Code **"SQLite Viewer"** y abre el archivo `backend/database/practicas.sqlite` directamente.

**Quiero borrar todo y empezar de cero**
Corre `npm run seed` otra vez (backend). Esto recrea la base de datos completa.

**¿Por qué SQLite y no MySQL/PostgreSQL?**
Para que el proyecto corra sin instalar un servidor de base de datos aparte. El código usa Sequelize (un ORM), así que cambiar a PostgreSQL en el futuro es solo cuestión de cambiar la configuración — el resto del código no cambia. Ver `docs/ARQUITECTURA.md`.

**¿Es seguro para producción tal cual está?**
No — es un proyecto académico. En `docs/ARQUITECTURA.md` hay una lista de mejoras concretas para llevarlo a producción real (migraciones, refresh tokens, almacenamiento de archivos en la nube, etc.).
