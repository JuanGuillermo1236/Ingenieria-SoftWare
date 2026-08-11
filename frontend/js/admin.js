let expedientesAdmin = [];
let usuariosAdmin = [];

const ETIQUETAS_ESTADO = {
  entregado: "Entregado",
  en_comision: "En comisión",
  observado: "Observado",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  sustentacion: "Sustentación",
};

document.addEventListener("DOMContentLoaded", async function () {
  const usuario = requerirSesion(["admin"]);
  if (!usuario) return;
  pintarBarraUsuario(usuario);

  configurarTabs();
  configurarFormularioUsuario();
  configurarFormularioExpediente();
  configurarModalDocumentos();
  configurarFiltros();
  document.getElementById("btn-exportar-csv").addEventListener("click", exportarReporteCSV);

  await Promise.all([cargarExpedientes(), cargarUsuarios(), cargarSelects()]);
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

// ---------------------------------------------------------
// Tabs
// ---------------------------------------------------------
function configurarTabs() {
  const botones = document.querySelectorAll(".tab-btn");
  botones.forEach((btn) => {
    btn.addEventListener("click", () => {
      botones.forEach((b) => b.classList.remove("activo"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.add("oculto"));
      btn.classList.add("activo");
      document.getElementById(btn.dataset.tab).classList.remove("oculto");
    });
  });
}

// ---------------------------------------------------------
// Dashboard + reporte
// ---------------------------------------------------------
async function cargarExpedientes() {
  const tbody = document.getElementById("tabla-expedientes-body");
  try {
    expedientesAdmin = await api.listarExpedientes();
    actualizarMetricas();
    renderizarReporte();
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="7" class="spinner-carga">Error: ${escaparHtml(error.message)}</td></tr>`;
  }
}

function actualizarMetricas() {
  const total = expedientesAdmin.length;
  const revision = expedientesAdmin.filter((e) => ["entregado", "en_comision"].includes(e.estado)).length;
  const observados = expedientesAdmin.filter((e) => e.estado === "observado").length;
  const aprobados = expedientesAdmin.filter((e) => e.estado === "aprobado" || e.estado === "sustentacion").length;
  const rechazados = expedientesAdmin.filter((e) => e.estado === "rechazado").length;
  const sinDocente = expedientesAdmin.filter((e) => !e.docente).length;

  document.getElementById("metrica-total").textContent = total;
  document.getElementById("metrica-revision").textContent = revision;
  document.getElementById("metrica-observados").textContent = observados;
  document.getElementById("metrica-aprobados").textContent = aprobados;
  document.getElementById("metrica-rechazados").textContent = rechazados;
  document.getElementById("metrica-sin-docente").textContent = sinDocente;
}

function configurarFiltros() {
  ["filtro-busqueda", "filtro-estado", "filtro-asignacion"].forEach((id) => {
    const control = document.getElementById(id);
    control.addEventListener(id === "filtro-busqueda" ? "input" : "change", renderizarReporte);
  });

  document.getElementById("btn-limpiar-filtros").addEventListener("click", () => {
    document.getElementById("filtro-busqueda").value = "";
    document.getElementById("filtro-estado").value = "";
    document.getElementById("filtro-asignacion").value = "";
    renderizarReporte();
  });
}

function obtenerExpedientesFiltrados() {
  const busqueda = document.getElementById("filtro-busqueda").value.trim().toLowerCase();
  const estado = document.getElementById("filtro-estado").value;
  const asignacion = document.getElementById("filtro-asignacion").value;

  return expedientesAdmin.filter((exp) => {
    const texto = [
      exp.codigo,
      exp.tema,
      exp.estudiante ? exp.estudiante.nombre : "",
      exp.docente ? exp.docente.nombre : "",
    ]
      .join(" ")
      .toLowerCase();

    const coincideBusqueda = !busqueda || texto.includes(busqueda);
    const coincideEstado = !estado || exp.estado === estado;
    const coincideAsignacion =
      !asignacion ||
      (asignacion === "asignado" && !!exp.docente) ||
      (asignacion === "sin_asignar" && !exp.docente);

    return coincideBusqueda && coincideEstado && coincideAsignacion;
  });
}

function renderizarReporte() {
  const tbody = document.getElementById("tabla-expedientes-body");
  const expedientes = obtenerExpedientesFiltrados();
  document.getElementById("contador-reporte").textContent = `${expedientes.length} resultado${expedientes.length === 1 ? "" : "s"}`;

  if (expedientes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="spinner-carga">No hay expedientes que coincidan con los filtros.</td></tr>`;
    return;
  }

  tbody.innerHTML = expedientes
    .map((exp) => {
      const plazo = ["aprobado", "rechazado", "sustentacion"].includes(exp.estado)
        ? "Finalizado"
        : exp.diasRestantes < 0
        ? "Vencido"
        : `${exp.diasRestantes} días`;

      return `
        <tr>
          <td><strong>${escaparHtml(exp.codigo)}</strong></td>
          <td>${exp.estudiante ? escaparHtml(exp.estudiante.nombre) : "-"}</td>
          <td class="celda-tema">${escaparHtml(exp.tema)}</td>
          <td>${exp.docente ? escaparHtml(exp.docente.nombre) : `<span class="chip chip-gris">Sin asignar</span>`}</td>
          <td>${chipEstado(exp.estado)}</td>
          <td>${plazo}</td>
          <td class="acciones-tabla">
            ${
              !exp.docente
                ? `<button class="boton boton-secundario btn-asignar" data-id="${exp.id}">Asignar</button>`
                : ""
            }
            <button class="boton boton-texto btn-documentos"
              data-id="${exp.id}"
              data-codigo="${escaparHtml(exp.codigo)}"
              data-estudiante="${exp.estudiante ? escaparHtml(exp.estudiante.nombre) : ""}">
              Ver detalle
            </button>
          </td>
        </tr>`;
    })
    .join("");

  document.querySelectorAll(".btn-asignar").forEach((btn) => {
    btn.addEventListener("click", () => asignarDocentePrompt(btn.dataset.id));
  });

  document.querySelectorAll(".btn-documentos").forEach((btn) => {
    btn.addEventListener("click", () =>
      abrirModalDocumentos(btn.dataset.id, btn.dataset.codigo, btn.dataset.estudiante)
    );
  });
}

async function asignarDocentePrompt(expedienteId) {
  try {
    const docentes = await api.listarUsuarios("docente");
    if (docentes.length === 0) {
      mostrarToast("No hay docentes registrados todavía.", "error");
      return;
    }

    const opciones = docentes.map((d, i) => `${i + 1}) ${d.nombre}`).join("\n");
    const seleccion = window.prompt(`¿A qué docente asignar este expediente?\n\n${opciones}\n\nEscribe el número:`);
    const indice = parseInt(seleccion, 10) - 1;

    if (isNaN(indice) || !docentes[indice]) return;

    await api.asignarDocente(expedienteId, docentes[indice].id);
    mostrarToast(`Docente ${docentes[indice].nombre} asignado correctamente.`);
    await cargarExpedientes();
  } catch (error) {
    mostrarToast(error.message, "error");
  }
}



function exportarReporteCSV() {
  const expedientes = obtenerExpedientesFiltrados();
  if (expedientes.length === 0) {
    mostrarToast("No hay expedientes para exportar.", "error");
    return;
  }

  const escaparCsv = (valor) => `"${String(valor == null ? "" : valor).replace(/"/g, '""')}"`;
  const filas = [
    ["Código", "Estudiante", "Tema", "Docente", "Estado", "Fecha entrega", "Fecha límite", "Días restantes"],
    ...expedientes.map((exp) => [
      exp.codigo,
      exp.estudiante ? exp.estudiante.nombre : "",
      exp.tema,
      exp.docente ? exp.docente.nombre : "Sin asignar",
      ETIQUETAS_ESTADO[exp.estado] || exp.estado,
      exp.fechaEntrega,
      exp.fechaLimite,
      exp.diasRestantes,
    ]),
  ];

  const contenido = "\uFEFF" + filas.map((fila) => fila.map(escaparCsv).join(";")).join("\n");
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `reporte-expedientes-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
  mostrarToast("Reporte CSV generado correctamente.");
}

// ---------------------------------------------------------
// Usuarios
// ---------------------------------------------------------
async function cargarUsuarios() {
  const tbody = document.getElementById("tabla-usuarios-body");
  try {
    usuariosAdmin = await api.listarUsuarios();
    document.getElementById("total-estudiantes").textContent = usuariosAdmin.filter((u) => u.rol === "estudiante").length;
    document.getElementById("total-docentes").textContent = usuariosAdmin.filter((u) => u.rol === "docente").length;

    tbody.innerHTML = usuariosAdmin
      .map(
        (u) => `
        <tr>
          <td>${escaparHtml(u.nombre)}</td>
          <td>${escaparHtml(u.correo)}</td>
          <td><span class="chip chip-gris">${escaparHtml(u.rol)}</span></td>
          <td>${fechaCorta(u.createdAt)}</td>
        </tr>`
      )
      .join("");
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="4" class="spinner-carga">Error: ${escaparHtml(error.message)}</td></tr>`;
  }
}

async function cargarSelects() {
  try {
    const [estudiantes, docentes] = await Promise.all([
      api.listarUsuarios("estudiante"),
      api.listarUsuarios("docente"),
    ]);

    const selectEstudiante = document.getElementById("exp-estudiante");
    selectEstudiante.innerHTML = estudiantes
      .map((e) => `<option value="${e.id}">${escaparHtml(e.nombre)}</option>`)
      .join("");

    const selectDocente = document.getElementById("exp-docente");
    selectDocente.innerHTML =
      `<option value="">Sin asignar todavía</option>` +
      docentes.map((d) => `<option value="${d.id}">${escaparHtml(d.nombre)}</option>`).join("");
  } catch (error) {
    mostrarToast("No se pudieron cargar las listas de usuarios: " + error.message, "error");
  }
}

// ---------------------------------------------------------
// Formularios
// ---------------------------------------------------------
function configurarFormularioUsuario() {
  const form = document.getElementById("form-usuario");
  const btn = document.getElementById("btn-crear-usuario");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const datos = {
      nombre: document.getElementById("user-nombre").value.trim(),
      correo: document.getElementById("user-correo").value.trim(),
      password: document.getElementById("user-password").value,
      rol: document.getElementById("user-rol").value,
    };

    btn.disabled = true;
    btn.textContent = "Creando...";

    try {
      await api.crearUsuario(datos);
      mostrarToast(`Usuario "${datos.nombre}" creado correctamente.`);
      form.reset();
      await Promise.all([cargarUsuarios(), cargarSelects()]);
    } catch (error) {
      mostrarToast(error.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Crear usuario";
    }
  });
}

function configurarFormularioExpediente() {
  const form = document.getElementById("form-expediente");
  const btn = document.getElementById("btn-crear-expediente");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const datos = {
      codigo: document.getElementById("exp-codigo").value.trim(),
      tema: document.getElementById("exp-tema").value.trim(),
      estudianteId: document.getElementById("exp-estudiante").value,
      docenteId: document.getElementById("exp-docente").value || null,
      fechaEntrega: document.getElementById("exp-fecha").value,
    };

    btn.disabled = true;
    btn.textContent = "Creando...";

    try {
      await api.crearExpediente(datos);
      mostrarToast(`Expediente "${datos.codigo}" creado correctamente.`);
      form.reset();
      await cargarExpedientes();
    } catch (error) {
      mostrarToast(error.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Crear expediente";
    }
  });
}

// ---------------------------------------------------------
// Detalle de expediente
// ---------------------------------------------------------
function configurarModalDocumentos() {
  const modal = document.getElementById("modal-documentos");
  const cerrar = document.getElementById("cerrar-modal-documentos");

  cerrar.addEventListener("click", () => modal.classList.remove("abierto"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("abierto");
  });
}

async function abrirModalDocumentos(expedienteId, codigo, estudiante) {
  const modal = document.getElementById("modal-documentos");
  const lista = document.getElementById("modal-doc-lista");
  const resumen = document.getElementById("modal-admin-resumen");
  const observaciones = document.getElementById("modal-admin-observaciones");

  document.getElementById("modal-doc-codigo").textContent = codigo;
  document.getElementById("modal-doc-estudiante").textContent = estudiante;
  lista.innerHTML = "<li>Cargando...</li>";
  resumen.innerHTML = "";
  observaciones.innerHTML = '<p class="texto-ayuda">Cargando...</p>';
  modal.classList.add("abierto");

  try {
    const expediente = await api.obtenerExpediente(expedienteId);
    const documentos = expediente.documentos || [];
    const dictamenes = expediente.observaciones || [];

    resumen.innerHTML = `
      <div><small>Tema</small><p>${escaparHtml(expediente.tema)}</p></div>
      <div><small>Estado</small><p>${chipEstado(expediente.estado)}</p></div>
      <div><small>Docente</small><p>${expediente.docente ? escaparHtml(expediente.docente.nombre) : "Sin asignar"}</p></div>
      <div><small>Fecha de entrega</small><p>${fechaCorta(expediente.fechaEntrega)}</p></div>
    `;

    if (documentos.length === 0) {
      lista.innerHTML = "<li>El estudiante todavía no ha subido ningún documento.</li>";
    } else {
      lista.innerHTML = documentos
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
    }

    if (dictamenes.length === 0) {
      observaciones.innerHTML = '<p class="texto-ayuda">Aún no se han registrado dictámenes.</p>';
    } else {
      observaciones.innerHTML = dictamenes
        .map((item) => {
          const detalle = item.tipo === "aprobado" ? `Nota: ${item.nota}` : escaparHtml(item.detalle || "");
          return `
            <article class="historial-item">
              <div>
                ${chipEstado(item.tipo)}
                <strong>${item.autor ? escaparHtml(item.autor.nombre) : "Docente"}</strong>
              </div>
              <p>${detalle}</p>
              <small>${fechaCorta(item.createdAt)}</small>
            </article>`;
        })
        .join("");
    }
  } catch (error) {
    lista.innerHTML = `<li>No se pudieron cargar los documentos: ${escaparHtml(error.message)}</li>`;
    observaciones.innerHTML = "";
  }
}
