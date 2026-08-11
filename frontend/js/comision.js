let expedienteSeleccionadoId = null;
let expedientesDocente = [];

const ETIQUETAS_ESTADO = {
  entregado: "Entregado",
  en_comision: "En comisión",
  observado: "Observado",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  sustentacion: "Sustentación",
};

document.addEventListener("DOMContentLoaded", async function () {
  const usuario = requerirSesion(["docente", "admin"]);
  if (!usuario) return;
  pintarBarraUsuario(usuario);

  configurarModalRevision();
  configurarFiltros();
  await cargarTabla();
});

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto == null ? "" : texto;
  return div.innerHTML;
}

function fechaCorta(fechaISO) {
  if (!fechaISO) return "-";
  const fecha = new Date(String(fechaISO).length === 10 ? `${fechaISO}T12:00:00` : fechaISO);
  if (Number.isNaN(fecha.getTime())) return fechaISO;
  return fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

function claseEstado(estado) {
  if (estado === "aprobado" || estado === "sustentacion") return "chip-verde";
  if (estado === "observado") return "chip-amarillo";
  if (estado === "rechazado") return "chip-rojo";
  return "chip-gris";
}

function chipEstado(estado) {
  return `<span class="chip ${claseEstado(estado)}">${ETIQUETAS_ESTADO[estado] || escaparHtml(estado)}</span>`;
}

async function cargarTabla() {
  const tbody = document.getElementById("tabla-body");
  try {
    expedientesDocente = await api.listarExpedientes();
    actualizarMetricasDocente();
    renderizarTabla();
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="6" class="spinner-carga">No se pudo cargar la bandeja: ${escaparHtml(error.message)}</td></tr>`;
  }
}

function actualizarMetricasDocente() {
  const pendientes = expedientesDocente.filter((e) => e.estado === "en_comision").length;
  const observados = expedientesDocente.filter((e) => e.estado === "observado").length;
  const aprobados = expedientesDocente.filter((e) => ["aprobado", "sustentacion"].includes(e.estado)).length;
  const rechazados = expedientesDocente.filter((e) => e.estado === "rechazado").length;
  const urgentes = expedientesDocente.filter(
    (e) => e.estado === "en_comision" && e.diasRestantes <= 1
  ).length;

  document.getElementById("doc-total").textContent = expedientesDocente.length;
  document.getElementById("doc-pendientes").textContent = pendientes;
  document.getElementById("doc-observados").textContent = observados;
  document.getElementById("doc-aprobados").textContent = aprobados;
  document.getElementById("doc-rechazados").textContent = rechazados;
  document.getElementById("doc-urgentes").textContent = urgentes;
}

function configurarFiltros() {
  document.getElementById("doc-busqueda").addEventListener("input", renderizarTabla);
  document.getElementById("doc-estado").addEventListener("change", renderizarTabla);
  document.getElementById("doc-limpiar").addEventListener("click", () => {
    document.getElementById("doc-busqueda").value = "";
    document.getElementById("doc-estado").value = "";
    renderizarTabla();
  });
}

function expedientesFiltrados() {
  const busqueda = document.getElementById("doc-busqueda").value.trim().toLowerCase();
  const estado = document.getElementById("doc-estado").value;

  return expedientesDocente.filter((exp) => {
    const texto = [exp.codigo, exp.tema, exp.estudiante ? exp.estudiante.nombre : ""]
      .join(" ")
      .toLowerCase();
    return (!busqueda || texto.includes(busqueda)) && (!estado || exp.estado === estado);
  });
}

function renderizarTabla() {
  const tbody = document.getElementById("tabla-body");
  const expedientes = expedientesFiltrados();
  document.getElementById("doc-contador").textContent = `${expedientes.length} resultado${expedientes.length === 1 ? "" : "s"}`;

  if (expedientes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="spinner-carga">No hay expedientes que coincidan con los filtros.</td></tr>`;
    return;
  }

  tbody.innerHTML = expedientes.map(filaExpediente).join("");

  document.querySelectorAll(".btn-revisar").forEach((btn) => {
    btn.addEventListener("click", () => abrirRevision(btn.dataset.id));
  });
}

function claseUrgencia(expediente) {
  if (expediente.estado !== "en_comision") return "";
  if (expediente.diasRestantes <= 1) return "fila-urgente";
  if (expediente.diasRestantes <= 4) return "fila-atencion";
  return "";
}

function chipPlazo(expediente) {
  if (["aprobado", "rechazado", "sustentacion"].includes(expediente.estado)) {
    return `<span class="chip chip-gris">Finalizado</span>`;
  }

  if (expediente.estado === "observado") {
    const texto = expediente.diasRestantes < 0 ? "Subsanación vencida" : `${expediente.diasRestantes} días para subsanar`;
    return `<span class="chip ${expediente.diasRestantes <= 1 ? "chip-rojo" : "chip-amarillo"}">${texto}</span>`;
  }

  const dias = expediente.diasRestantes;
  let clase = "chip-verde";
  if (dias <= 1) clase = "chip-rojo";
  else if (dias <= 4) clase = "chip-amarillo";

  const texto = dias < 0 ? "Plazo vencido" : `${dias} días hábiles`;
  return `<span class="chip ${clase}">${texto}</span>`;
}

function filaExpediente(expediente) {
  const etiquetaBoton = expediente.estado === "en_comision" ? "Revisar y dictaminar" : "Ver revisión";

  return `
    <tr class="${claseUrgencia(expediente)}" id="fila-${expediente.id}">
      <td><strong>${escaparHtml(expediente.codigo)}</strong></td>
      <td>${expediente.estudiante ? escaparHtml(expediente.estudiante.nombre) : "-"}</td>
      <td class="celda-tema">${escaparHtml(expediente.tema)}</td>
      <td>${chipPlazo(expediente)}</td>
      <td>${chipEstado(expediente.estado)}</td>
      <td><button class="boton ${expediente.estado === "en_comision" ? "boton-secundario" : "boton-texto"} btn-revisar" data-id="${expediente.id}">${etiquetaBoton}</button></td>
    </tr>
  `;
}

// ---------------------------------------------------------
// Modal de revisión integral
// ---------------------------------------------------------
function configurarModalRevision() {
  const modal = document.getElementById("modal-revision");
  const cerrar = () => {
    modal.classList.remove("abierto");
    expedienteSeleccionadoId = null;
    reiniciarFormularioDictamen();
  };

  document.getElementById("cerrar-revision").addEventListener("click", cerrar);
  document.getElementById("cancelar-revision").addEventListener("click", cerrar);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) cerrar();
  });

  document.querySelectorAll('input[name="dictamen"]').forEach((radio) => {
    radio.addEventListener("change", actualizarCamposDictamen);
  });

  document.getElementById("guardar-dictamen").addEventListener("click", guardarDictamenActual);
}

function actualizarCamposDictamen() {
  const tipo = document.querySelector('input[name="dictamen"]:checked').value;
  const campoNota = document.getElementById("campo-nota");
  const campoDetalle = document.getElementById("campo-detalle");
  const labelDetalle = document.getElementById("label-detalle");
  const textarea = document.getElementById("detalle-dictamen");

  campoNota.classList.toggle("oculto", tipo !== "aprobado");
  campoDetalle.classList.toggle("oculto", tipo === "aprobado");

  if (tipo === "observado") {
    labelDetalle.textContent = "Detalle de correcciones";
    textarea.placeholder = "Indica claramente qué debe corregir el estudiante antes de volver a presentar...";
  } else if (tipo === "rechazado") {
    labelDetalle.textContent = "Motivo del rechazo";
    textarea.placeholder = "Explica de forma clara por qué el expediente es rechazado...";
  }
}

function reiniciarFormularioDictamen() {
  const aprobado = document.querySelector('input[name="dictamen"][value="aprobado"]');
  aprobado.checked = true;
  document.getElementById("nota").value = "";
  document.getElementById("detalle-dictamen").value = "";
  actualizarCamposDictamen();
}

async function abrirRevision(expedienteId) {
  expedienteSeleccionadoId = expedienteId;
  const modal = document.getElementById("modal-revision");
  const documentos = document.getElementById("rev-documentos");
  const observaciones = document.getElementById("rev-observaciones");
  const resumen = document.getElementById("rev-resumen");
  const bloqueDictamen = document.getElementById("bloque-dictamen");
  const panelFinal = document.getElementById("estado-final-panel");

  documentos.innerHTML = "<li>Cargando...</li>";
  observaciones.innerHTML = '<p class="texto-ayuda">Cargando...</p>';
  resumen.innerHTML = "";
  bloqueDictamen.classList.add("oculto");
  panelFinal.classList.add("oculto");
  modal.classList.add("abierto");

  try {
    const expediente = await api.obtenerExpediente(expedienteId);
    document.getElementById("rev-codigo").textContent = expediente.codigo;
    document.getElementById("rev-estudiante").textContent = expediente.estudiante ? expediente.estudiante.nombre : "-";

    resumen.innerHTML = `
      <div><small>Tema</small><p>${escaparHtml(expediente.tema)}</p></div>
      <div><small>Estado actual</small><p>${chipEstado(expediente.estado)}</p></div>
      <div><small>Fecha de entrega</small><p>${fechaCorta(expediente.fechaEntrega)}</p></div>
      <div><small>Fecha límite</small><p>${fechaCorta(expediente.fechaLimite)}</p></div>
    `;

    renderizarDocumentosRevision(expediente.documentos || []);
    renderizarObservacionesRevision(expediente.observaciones || []);

    if (expediente.estado === "en_comision") {
      bloqueDictamen.classList.remove("oculto");
      panelFinal.classList.add("oculto");
      reiniciarFormularioDictamen();
    } else {
      bloqueDictamen.classList.add("oculto");
      panelFinal.classList.remove("oculto");
      panelFinal.innerHTML = mensajeEstadoNoEditable(expediente.estado);
    }
  } catch (error) {
    documentos.innerHTML = `<li>No se pudo cargar el expediente: ${escaparHtml(error.message)}</li>`;
    observaciones.innerHTML = "";
  }
}

function renderizarDocumentosRevision(documentos) {
  const contenedor = document.getElementById("rev-documentos");
  if (documentos.length === 0) {
    contenedor.innerHTML = "<li>El estudiante todavía no ha subido documentos.</li>";
    return;
  }

  contenedor.innerHTML = documentos
    .map(
      (doc) => `
      <li>
        <div>
          <strong>📄 ${escaparHtml(doc.nombreOriginal)}</strong>
          <small class="documento-meta">Subido ${fechaCorta(doc.createdAt)}</small>
        </div>
        <span>
          <a href="/uploads/${encodeURIComponent(doc.nombreArchivo)}" target="_blank" class="boton boton-texto">Ver</a>
          <a href="/uploads/${encodeURIComponent(doc.nombreArchivo)}" download="${escaparHtml(doc.nombreOriginal)}" class="boton boton-texto">Descargar</a>
        </span>
      </li>`
    )
    .join("");
}

function renderizarObservacionesRevision(items) {
  const contenedor = document.getElementById("rev-observaciones");
  if (items.length === 0) {
    contenedor.innerHTML = '<p class="texto-ayuda">Aún no existen dictámenes previos.</p>';
    return;
  }

  contenedor.innerHTML = items
    .map((item) => {
      const contenido = item.tipo === "aprobado" ? `Nota final: ${item.nota}` : escaparHtml(item.detalle || "");
      return `
        <article class="historial-item">
          <div class="historial-item-cabecera">
            ${chipEstado(item.tipo)}
            <small>${fechaCorta(item.createdAt)}</small>
          </div>
          <p>${contenido}</p>
          <small>${item.autor ? escaparHtml(item.autor.nombre) : "Docente"}</small>
        </article>`;
    })
    .join("");
}

function mensajeEstadoNoEditable(estado) {
  const mensajes = {
    observado: "Este expediente está observado y espera que el estudiante cargue una subsanación.",
    aprobado: "Este expediente ya fue aprobado. El dictamen queda disponible en el historial.",
    rechazado: "Este expediente fue rechazado. El motivo queda registrado en el historial.",
    sustentacion: "Este expediente ya avanzó a la etapa de sustentación.",
    entregado: "Este expediente todavía no está en comisión para ser dictaminado.",
  };
  return `<strong>${ETIQUETAS_ESTADO[estado] || estado}</strong><p>${mensajes[estado] || "El expediente no admite un nuevo dictamen en su estado actual."}</p>`;
}

async function guardarDictamenActual() {
  if (!expedienteSeleccionadoId) return;

  const tipo = document.querySelector('input[name="dictamen"]:checked').value;
  const nota = document.getElementById("nota").value;
  const detalle = document.getElementById("detalle-dictamen").value.trim();
  const payload = { tipo };

  if (tipo === "aprobado") {
    payload.nota = Number(nota);
  } else {
    payload.detalle = detalle;
  }

  if (tipo === "rechazado") {
    const confirmar = window.confirm(
      "¿Confirmas el rechazo? Este dictamen será final y el estudiante ya no podrá subir nuevos documentos."
    );
    if (!confirmar) return;
  }

  const boton = document.getElementById("guardar-dictamen");
  boton.disabled = true;
  boton.textContent = "Guardando...";

  try {
    const respuesta = await api.dictaminar(expedienteSeleccionadoId, payload);
    mostrarToast(respuesta.mensaje || "Dictamen guardado correctamente.");
    document.getElementById("modal-revision").classList.remove("abierto");
    expedienteSeleccionadoId = null;
    reiniciarFormularioDictamen();
    await cargarTabla();
  } catch (error) {
    mostrarToast(error.message, "error");
  } finally {
    boton.disabled = false;
    boton.textContent = "Guardar dictamen";
  }
}
