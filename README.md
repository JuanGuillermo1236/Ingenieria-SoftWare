# 🎓 Sistema de Gestión de Prácticas Preprofesionales

Sistema web para la gestión, revisión y seguimiento de expedientes de prácticas preprofesionales.

## 📋 Descripción

El **Sistema de Gestión de Prácticas Preprofesionales** es una aplicación web desarrollada para digitalizar y centralizar el proceso de gestión de expedientes de los estudiantes.

El sistema permite registrar expedientes, gestionar documentos, realizar revisiones, registrar observaciones, presentar subsanaciones y realizar el seguimiento del estado de cada expediente.

La plataforma cuenta con tres tipos de usuarios:

- 👨‍💼 Administrador
- 👨‍🏫 Docente
- 👨‍🎓 Estudiante

Cada usuario dispone de funciones específicas de acuerdo con su rol.

---

# 🎯 1. Problema que resuelve

La gestión de expedientes de prácticas preprofesionales puede involucrar múltiples documentos, revisiones, observaciones y correcciones.

Cuando este proceso se realiza de forma manual, pueden presentarse problemas como:

- Desorganización de documentos.
- Dificultad para realizar seguimiento a los expedientes.
- Pérdida de información relacionada con las revisiones.
- Falta de trazabilidad de los cambios de estado.
- Dificultad para controlar las observaciones y subsanaciones.
- Retrasos en la comunicación entre estudiantes y docentes.

El sistema busca solucionar estos problemas centralizando la información y digitalizando el proceso de revisión y seguimiento.

---

# 🎯 2. Objetivo

## Objetivo general

Digitalizar y centralizar la gestión, revisión y seguimiento de expedientes de prácticas preprofesionales mediante una plataforma web.

## Objetivos específicos

- Gestionar usuarios según su rol.
- Registrar y administrar expedientes.
- Asignar docentes evaluadores.
- Permitir la carga y descarga de documentos.
- Facilitar la revisión de expedientes.
- Registrar dictámenes y observaciones.
- Permitir la presentación de subsanaciones.
- Mantener un historial de los cambios de estado.
- Facilitar la supervisión mediante un dashboard.
- Generar reportes de expedientes.

---

# 🛠️ 3. Tecnologías utilizadas

|Tecnología 	 |	    Función
| Node.js	 |  Entorno de ejecución del backend         |
| Express	 |  Framework para el servidor y API REST    |
| **JavaScript** |  Lenguaje utilizado en frontend y backend |
| **HTML**       |  Estructura de las interfaces             | 
| **CSS**        |  Diseño y estilos de la interfaz          |
| **SQLite**     |  Base de datos del sistema                |
| **Sequelize**  |  ORM para gestionar la base de datos      |
| **JWT**        |  Autenticación de usuarios                |
| **bcryptjs     |  Encriptación de contraseñas              |
| **Multer**     |  Gestión de archivos subidos              |
| **Nodemon**    |  Reinicio automático durante el desarrollo|

---

# 👥 4. Roles del sistema

El sistema cuenta con tres roles principales:

- 👨‍💼 Administrador
- 👨‍🏫 Docente
- 👨‍🎓 Estudiante

---

## 👨‍💼 4.1 Administrador

El administrador tiene funciones de gestión y supervisión general.

### Funciones principales

- Visualizar el dashboard.
- Consultar métricas de expedientes.
- Ver expedientes en revisión.
- Consultar expedientes observados.
- Consultar expedientes aprobados.
- Consultar expedientes rechazados.
- Identificar expedientes sin docente asignado.
- Buscar y filtrar expedientes.
- Crear usuarios.
- Crear estudiantes.
- Crear docentes.
- Crear expedientes.
- Asignar docentes evaluadores.
- Consultar información de estudiantes y docentes.
- Consultar documentos.
- Consultar dictámenes anteriores.
- Exportar reportes en formato CSV.

---

## 👨‍🏫 4.2 Docente

El docente tiene la responsabilidad de revisar y evaluar los expedientes que le fueron asignados.

### Funciones principales

- Visualizar los expedientes asignados.
- Consultar su carga de trabajo.
- Filtrar expedientes.
- Revisar documentos.
- Descargar documentos.
- Consultar el historial del expediente.
- Aprobar expedientes.
- Registrar una nota final.
- Observar expedientes.
- Registrar las correcciones solicitadas.
- Rechazar expedientes.
- Registrar el motivo del rechazo.

### Decisiones disponibles

El docente puede tomar tres decisiones:

**Aprobar**
- Requiere registrar una nota entre 0 y 20.

**Observar**
- Requiere indicar las correcciones que debe realizar el estudiante.
- Permite posteriormente realizar una subsanación.

**Rechazar**
- Requiere registrar un motivo.
- El expediente queda en un estado final.

---

## 👨‍🎓 4.3 Estudiante

El estudiante utiliza el sistema para gestionar y realizar seguimiento de su expediente.

### Funciones principales

- Consultar su expediente.
- Visualizar el tema o título del proyecto.
- Consultar el estado actual.
- Consultar el docente asignado.
- Consultar el historial.
- Revisar observaciones.
- Subir documentos.
- Descargar documentos.
- Subir documentos de subsanación cuando corresponda.

Cuando el expediente ya tiene un dictamen final, como **Aprobado** o **Rechazado**, el sistema restringe nuevas cargas de documentos.

---

## 🔄 5. Flujo del expediente

El proceso de revisión sigue el siguiente flujo:

```text
                    ESTUDIANTE
                         │
                         ▼
                Entrega documentos
                         │
                         ▼
                   ENTREGADO
                         │
                         ▼
                  EN COMISIÓN
                         │
                         ▼
                  DOCENTE REVISA
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      APROBADO       OBSERVADO      RECHAZADO
          │              │              │
          │              ▼              │
          │       ESTUDIANTE CORRIGE    │
          │              │              │
          │              ▼              │
          │       SUBE SUBSANACIÓN       │
          │              │              │
          │              ▼              │
          │       DOCENTE REVISA        │
          │        NUEVAMENTE           │
          │              │              │
          └──────────────┴──────────────┘
---

## 📂 6. Estructura del proyecto 

sistema-practicas-mejorado/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── seed.js
│   │   └── server.js
│   │
│   ├── database/
│   ├── uploads/
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── login.html
│   ├── estudiante.html
│   ├── comision.html
│   ├── admin.html
│   ├── css/
│   └── js/
│
├── docs/
│   └── ARQUITECTURA.md
│
├── MEJORAS_V2.md
└── README.md
---

##🏗️ 7. Arquitectura del sistema

El sistema utiliza una arquitectura cliente-servidor:
┌──────────────────────────────┐
│          FRONTEND                     │
│      HTML / CSS / JS                  │
└──────────────┬───────────────┘
               │
               │ HTTP / JSON
               ▼
┌──────────────────────────────┐
│           BACKEND                     │
│       Node.js + Express               │
│                                       │
│  Rutas → Controladores                │
│        → Modelos                      │
└──────────────┬───────────────┘
               │
               │ Sequelize
               ▼
┌──────────────────────────────┐
│            SQLite                     │
│        Base de datos                  │
└──────────────────────────────┘
El backend también se encarga de la autenticación, autorización y gestión de documentos.
---