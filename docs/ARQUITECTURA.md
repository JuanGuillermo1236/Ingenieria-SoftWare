# Arquitectura del proyecto

## Visión general

Este proyecto sigue una arquitectura **cliente-servidor de 2 capas**, pensada para
ser pequeña pero honesta sobre cómo escalaría a un sistema real:

```
┌─────────────────┐        HTTP/JSON (REST)        ┌──────────────────────┐
│  Frontend        │  ───────────────────────────►  │  Backend (Express)   │
│  HTML/CSS/JS     │  ◄───────────────────────────  │  Controllers/Routes  │
│  (estático)      │                                 │  Middleware (auth)   │
└─────────────────┘                                 └──────────┬───────────┘
                                                                 │ Sequelize (ORM)
                                                                 ▼
                                                      ┌──────────────────────┐
                                                      │  SQLite (archivo)     │
                                                      │  practicas.sqlite     │
                                                      └──────────────────────┘
```

El **mismo servidor Express** sirve tanto la API (`/api/...`) como los archivos
estáticos del frontend, para que el proyecto corra con **un solo comando y un
solo puerto**. Esto es una decisión de simplicidad para el alcance académico;
en un proyecto más grande normalmente el frontend se despliega aparte (Vercel,
Netlify, un CDN) y el backend en otro servicio.

## Capas del backend

```
src/
├── server.js         # arranque, middlewares globales, montaje de rutas
├── config/            # conexión a la base de datos
├── models/             # tablas y relaciones (Sequelize)
├── middleware/         # auth (JWT), roles, subida de archivos, errores
├── controllers/        # lógica de negocio (qué hace cada endpoint)
├── routes/              # qué URL llama a qué controlador
├── utils/                # funciones auxiliares (fechas hábiles, JWT)
└── seed.js               # datos de prueba
```

Esta separación (rutas ↔ controladores ↔ modelos) es el patrón estándar de
Express y es lo que permite que el proyecto **escale**: si mañana el sistema
crece, cada capa se puede dividir más (por ejemplo, sacar la lógica de negocio
de los controladores hacia una capa de "servicios" adicional) sin tener que
reescribir todo desde cero.

## Modelo de datos

```
Usuario (estudiante | docente | admin)
   │
   ├── 1:N ── Expediente (como estudiante)
   ├── 1:N ── Expediente (como docente asignado)
   │
Expediente
   │
   ├── 1:N ── Observacion   (cada dictamen: aprobado/observado)
   ├── 1:N ── Documento      (archivos subidos, ej. subsanaciones)
   └── 1:N ── HistorialEstado (auditoría: quién cambió qué estado y cuándo)
```

El `HistorialEstado` es lo que alimenta la línea de tiempo (stepper) que ve el
estudiante: en vez de calcularla "a ojo" en el frontend, cada cambio de estado
queda registrado como un hecho en la base de datos, con fecha y autor. Esto es
clave para la trazabilidad que pedía el proyecto original.

## Autenticación y autorización

- **Autenticación:** JWT firmado con `JWT_SECRET`. El token se guarda en
  `localStorage` en el navegador y se manda en cada petición como
  `Authorization: Bearer <token>`.
- **Autorización:** cada endpoint decide qué roles pueden entrar
  (`requiereRol("admin")`, etc.) y además revisa, dentro del controlador, que
  el usuario sea *dueño* del recurso (un estudiante solo puede ver/subir
  documentos a su propio expediente; un docente solo puede dictaminar los
  expedientes que tiene asignados).

## Cómo escalar esto a un sistema en producción

Ideas concretas si este proyecto creciera:

1. **Base de datos:** cambiar `dialect: "sqlite"` por `"postgres"` en
   `config/database.js` e instalar `pg` — el resto del código (modelos,
   controladores) prácticamente no cambia gracias a Sequelize.
2. **Migraciones:** reemplazar `sequelize.sync()` por migraciones con
   `sequelize-cli`, para no arriesgar la base de datos real cada vez que se
   cambia un modelo.
3. **Refresh tokens:** hoy el JWT expira y obliga a volver a iniciar sesión;
   se podría añadir un refresh token de larga duración.
4. **Paginación:** `GET /api/expedientes` hoy devuelve todo; con miles de
   expedientes convendría agregar `?pagina=1&porPagina=20`.
5. **Tests automatizados:** agregar Jest + Supertest para probar los
   controladores sin tener que probar todo a mano.
6. **Subida de archivos:** hoy se guardan en el disco del servidor; en
   producción normalmente se usaría un bucket (S3, Cloud Storage) y el archivo
   se serviría con URLs firmadas y temporales, no de forma pública.
7. **Notificaciones:** enviar un correo real (o push) al estudiante cuando su
   expediente sea observado, y al docente cuando le asignen uno nuevo.
