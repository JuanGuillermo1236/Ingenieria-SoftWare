document.addEventListener("DOMContentLoaded", async function () {
  const usuario = requerirSesion(["estudiante"]);
  if (!usuario) return;
  pintarBarraUsuario(usuario);

  const contenido = document.getElementById("contenido-principal");

  try {
    const expedientes = await api.listarExpedientes();

    if (expedientes.length === 0) {
      contenido.innerHTML = `
        <section class="cabecera-pagina">
          <h1>Hola, ${escaparHtml(usuario.nombre)} 👋</h1>
        </section>
        <div class="estado-vacio tarjeta">Todavía no tienes un expediente de prácticas registrado. Consulta con tu facultad.</div>
      `;
      return;
    }

    const resumen = expedientes[0];
    const detalle = await api.obtenerExpediente(resumen.id);
    renderizarPagina(detalle, usuario);
  } catch (error) {
    contenido.innerHTML = `<div class="estado-vacio tarjeta">No se pudo cargar tu información: ${escaparHtml(error.message)}</div>`;
  }
});

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto == null ? "" : texto;
  return div.innerHTML;
}

const ETIQUETAS_ESTADO = {
  entregado: "Entregado",
  en_comision: "En comisión",
  observado: "Observado",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  sustentacion: "Sustentación",
};

function fechaFormateada(fechaISO) {
  if (!fechaISO) return "";
  const fecha = new Date(String(fechaISO).length === 10 ? `${fechaISO}T12:00:00` : fechaISO);
  return fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

function buscarFechaHistorial(historial, estadoNuevo) {
  const registros = historial.filter((h) => h.estadoNuevo === estadoNuevo);
  const registro = registros[registros.length - 1];
  return registro ? fechaFormateada(registro.createdAt) : null;
}

function renderizarPagina(expediente, usuario) {
  const contenido = document.getElementById("contenido-principal");
  const estaObservado = expediente.estado === "observado";
  const estaRechazado = expediente.estado === "rechazado";
  const esFinal = ["aprobado", "rechazado", "sustentacion"].includes(expediente.estado);
  const ultimaDecision = (expediente.observaciones || [])[0] || null;
  const ultimaObservacion = (expediente.observaciones || []).find((o) => o.tipo === "observado");
  const ultimoRechazo = (expediente.observaciones || []).find((o) => o.tipo === "rechazado");

  contenido.innerHTML = `
    <section class="cabecera-pagina">
      <h1>Hola, ${escaparHtml(usuario.nombre)} 👋</h1>
      <p class="subtitulo">Consulta el estado, los documentos y las observaciones de tu expediente de prácticas.</p>
    </section>

    ${estaObservado ? renderizarAvisoObservado(expediente, ultimaObservacion) : ""}
    ${estaRechazado ? renderizarAvisoRechazado(ultimoRechazo) : ""}
    ${expediente.estado === "aprobado" ? renderizarAvisoAprobado(ultimaDecision) : ""}

    <section class="tarjeta">
      <h2 class="tarjeta-titulo">Trazabilidad del expediente</h2>
      ${renderizarStepper(expediente)}
    </section>

    <section class="tarjeta">
      <h2 class="tarjeta-titulo">Detalle del expediente</h2>
      <div class="detalle-grid">
        <div>
          <small>Código de expediente</small>
          <p>${escaparHtml(expediente.codigo)}</p>
        </div>
        <div>
          <small>Tema o título del proyecto</small>
          <p>${escaparHtml(expediente.tema)}</p>
        </div>
        <div>
          <small>Estado actual</small>
          <p><span class="chip ${claseEstado(expediente.estado)}">${ETIQUETAS_ESTADO[expediente.estado] || expediente.estado}</span></p>
        </div>
        <div>
          <small>Docente asignado</small>
          <p>${expediente.docente ? escaparHtml(expediente.docente.nombre) : "Por asignar"}</p>
        </div>
        <div>
          <small>Última observación</small>
          <p>${ultimaObservacion ? escaparHtml(ultimaObservacion.detalle) : "Sin observaciones registradas."}</p>
        </div>
      </div>

      ${
        !esFinal
          ? `<button class="boton boton-primario" id="btn-subsanacion">${
              estaObservado ? "Subir documento de subsanación" : "Subir documento"
            }</button>
             <input type="file" id="input-subsanacion" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" hidden>
             <p class="texto-ayuda" style="margin-top:10px;">Formatos permitidos: PDF, Word e imágenes. Máximo 10 MB.</p>`
          : `<p class="texto-ayuda">El expediente tiene un dictamen final y ya no admite nuevos documentos.</p>`
      }
    </section>

    ${renderizarDocumentos(expediente)}
    ${renderizarHistorialDictamenes(expediente)}
  `;

  if (!esFinal) {
    document.getElementById("btn-subsanacion").addEventListener("click", () => {
      document.getElementById("input-subsanacion").click();
    });
    document.getElementById("input-subsanacion").addEventListener("change", (e) => manejarSubidaArchivo(e, expediente.id));
  }
}

function claseEstado(estado) {
  if (["aprobado", "sustentacion"].includes(estado)) return "chip-verde";
  if (estado === "observado") return "chip-amarillo";
  if (estado === "rechazado") return "chip-rojo";
  return "chip-gris";
}

function renderizarAvisoObservado(expediente, ultimaObservacion) {
  const dias = expediente.diasRestantes;
  const textoDias = dias < 0 ? "Plazo vencido" : dias;
  return `
    <section class="aviso aviso-observado">
      <div class="aviso-icono">⚠</div>
      <div class="aviso-texto">
        <h2>Tu expediente fue observado</h2>
        <p>${ultimaObservacion ? escaparHtml(ultimaObservacion.detalle) : "Debes subsanar las observaciones indicadas por el docente."}</p>
      </div>
      <div class="aviso-contador">
        <span class="contador-numero">${textoDias}</span>
        <span class="contador-label">${dias < 0 ? "" : "días hábiles restantes"}</span>
      </div>
    </section>
  `;
}

function renderizarAvisoRechazado(rechazo) {
  return `
    <section class="aviso aviso-rechazado">
      <div class="aviso-icono">✕</div>
      <div class="aviso-texto">
        <h2>Tu expediente fue rechazado</h2>
        <p>${rechazo && rechazo.detalle ? escaparHtml(rechazo.detalle) : "El docente registró un dictamen final negativo."}</p>
      </div>
    </section>
  `;
}

function renderizarAvisoAprobado(dictamen) {
  return `
    <section class="aviso aviso-aprobado">
      <div class="aviso-icono">✓</div>
      <div class="aviso-texto">
        <h2>Tu expediente fue aprobado</h2>
        <p>${dictamen && dictamen.nota != null ? `Nota registrada: ${dictamen.nota}.` : "El docente emitió un dictamen favorable."}</p>
      </div>
    </section>
  `;
}

function renderizarStepper(expediente) {
  const historial = expediente.historial || [];
  const estado = expediente.estado;

  const indiceActual = {
    entregado: 0,
    en_comision: 1,
    observado: 2,
    aprobado: 2,
    rechazado: 2,
    sustentacion: 3,
  }[estado] ?? 0;

  let evaluacionEtiqueta = "Evaluación";
  if (estado === "aprobado" || estado === "sustentacion") evaluacionEtiqueta = "Aprobado";
  if (estado === "rechazado") evaluacionEtiqueta = "Rechazado";
  if (estado === "observado") evaluacionEtiqueta = "Observado";

  const estadoEvaluacion = ["aprobado", "rechazado", "observado"].includes(estado) ? estado : "observado";

  const pasos = [
    { etiqueta: "Entregado", fecha: buscarFechaHistorial(historial, "entregado") },
    { etiqueta: "En comisión", fecha: buscarFechaHistorial(historial, "en_comision") },
    { etiqueta: evaluacionEtiqueta, fecha: buscarFechaHistorial(historial, estadoEvaluacion) },
    { etiqueta: "Sustentación", fecha: buscarFechaHistorial(historial, "sustentacion") },
  ];

  return `<ol class="stepper">${pasos
    .map((paso, i) => {
      let clase = "pendiente";
      let circulo = String(i + 1);

      if (i < indiceActual) {
        clase = "completado";
        circulo = "✓";
      } else if (i === indiceActual) {
        if (estado === "rechazado" && i === 2) {
          clase = "actual rechazado";
          circulo = "✕";
        } else if (estado === "observado" && i === 2) {
          clase = "actual";
          circulo = "!";
        } else if (["aprobado", "sustentacion"].includes(estado)) {
          clase = "completado";
          circulo = "✓";
        } else {
          clase = "actual";
        }
      }

      const lineaHtml = i < pasos.length - 1 ? '<span class="step-linea"></span>' : "";
      return `
        <li class="step ${clase}">
          <span class="step-circulo">${circulo}</span>
          ${lineaHtml}
          <div class="step-info">
            <strong>${paso.etiqueta}</strong>
            <small>${paso.fecha || "Pendiente"}</small>
          </div>
        </li>`;
    })
    .join("")}</ol>`;
}

function renderizarDocumentos(expediente) {
  const documentos = expediente.documentos || [];

  if (documentos.length === 0) {
    return `
      <section class="tarjeta">
        <h2 class="tarjeta-titulo">Documentos subidos</h2>
        <p class="subtitulo" style="margin:0;">Todavía no has subido ningún documento.</p>
      </section>`;
  }

  const items = documentos
    .map(
      (doc) => `
      <li>
        <span>📄 ${escaparHtml(doc.nombreOriginal)}</span>
        <span>
          <a href="/uploads/${encodeURIComponent(doc.nombreArchivo)}" target="_blank" class="boton boton-texto">Ver</a>
          <a href="/uploads/${encodeURIComponent(doc.nombreArchivo)}" download="${escaparHtml(doc.nombreOriginal)}" class="boton boton-texto">Descargar</a>
        </span>
      </li>`
    )
    .join("");

  return `
    <section class="tarjeta">
      <h2 class="tarjeta-titulo">Documentos subidos</h2>
      <ul class="lista-simple">${items}</ul>
    </section>`;
}

function renderizarHistorialDictamenes(expediente) {
  const items = expediente.observaciones || [];
  if (items.length === 0) return "";

  return `
    <section class="tarjeta">
      <h2 class="tarjeta-titulo">Historial de revisiones</h2>
      <div class="historial-lista">
        ${items
          .map((item) => {
            const contenido = item.tipo === "aprobado" ? `Nota final: ${item.nota}` : escaparHtml(item.detalle || "");
            return `
              <article class="historial-item">
                <div class="historial-item-cabecera">
                  <span class="chip ${claseEstado(item.tipo)}">${ETIQUETAS_ESTADO[item.tipo] || item.tipo}</span>
                  <small>${fechaFormateada(item.createdAt)}</small>
                </div>
                <p>${contenido}</p>
                <small>${item.autor ? escaparHtml(item.autor.nombre) : "Docente"}</small>
              </article>`;
          })
          .join("")}
      </div>
    </section>`;
}

async function manejarSubidaArchivo(evento, expedienteId) {
  const input = evento.target;
  if (input.files.length === 0) return;

  const archivo = input.files[0];
  const formData = new FormData();
  formData.append("archivo", archivo);

  const btn = document.getElementById("btn-subsanacion");
  btn.disabled = true;
  btn.textContent = "Subiendo...";

  try {
    await api.subirDocumento(expedienteId, formData);
    mostrarToast(`Documento "${archivo.name}" subido correctamente.`);
    const detalle = await api.obtenerExpediente(expedienteId);
    renderizarPagina(detalle, obtenerUsuario());
  } catch (error) {
    mostrarToast(error.message, "error");
    btn.disabled = false;
    btn.textContent = "Subir documento";
  }
}
