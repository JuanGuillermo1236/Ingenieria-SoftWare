# Mejoras V2

Esta versión parte del proyecto original y conserva su arquitectura Node.js + Express + Sequelize + SQLite y frontend HTML/CSS/JS.

## Administrador
- Dashboard con métricas de expedientes.
- Reporte filtrable por texto, estado y asignación de docente, con exportación CSV.
- Tabla ampliada con tema, estado, plazo y acciones.
- Resumen de estudiantes y docentes registrados.
- Modal de detalle con documentos y dictámenes previos.

## Docente
- Dashboard con asignados, por revisar, observados, aprobados, rechazados y urgentes.
- Búsqueda y filtros por estado.
- Revisión integral: datos del expediente, documentos, historial y dictamen en una misma vista.
- Tres decisiones: aprobar, observar o rechazar.
- Aprobar exige nota de 0 a 20.
- Observar exige detalle de correcciones y habilita la subsanación del estudiante.
- Rechazar exige motivo y deja el expediente en estado final.

## Estudiante
- Muestra tema/título del proyecto y estado actual.
- Muestra avisos específicos para aprobado, observado y rechazado.
- Muestra historial de revisiones.
- No permite nuevos documentos después de aprobado/rechazado/sustentación.

## Backend y trazabilidad
- Nuevo estado `rechazado` en Expediente.
- Nuevo tipo `rechazado` en Observacion.
- El backend solo acepta dictámenes cuando el expediente está `en_comision`.
- La asignación de docente registra la transición en HistorialEstado.
- Si el expediente se crea con docente, inicia correctamente en `en_comision` y registra ambas etapas.
