// =========================================================
// Módulo de comunicación con la API del backend
// =========================================================

const API_BASE = "/api";

function obtenerToken() {
  return localStorage.getItem("token");
}

// Lee el cuerpo de una respuesta como JSON de forma segura.
// Si el servidor no devolvió JSON (p. ej. se cayó a mitad de la petición,
// devolvió una página de error HTML, o el puerto no corresponde a esta API),
// en vez de dejar que el navegador lance "Unexpected end of JSON input"
// (un mensaje que no le dice nada al usuario), mostramos un error claro.
async function leerCuerpoJSON(respuesta) {
  const texto = await respuesta.text();

  if (!texto) {
    // Cuerpo vacío: normalmente pasa cuando el servidor se reinició o
    // se cortó la conexión a mitad de la respuesta.
    throw new Error(
      "El servidor no respondió. Verifica que el backend esté corriendo y que estés " +
        "entrando por http://localhost:4000 (no por otro puerto, como el de Live Server)."
    );
  }

  try {
    return JSON.parse(texto);
  } catch (error) {
    throw new Error("El servidor respondió con un formato inesperado. Revisa la consola del backend.");
  }
}

// Petición genérica con JSON. Lanza un Error con el mensaje del backend si falla.
async function apiFetch(ruta, opciones = {}) {
  const token = obtenerToken();

  const headers = {
    "Content-Type": "application/json",
    ...(opciones.headers || {}),
  };

  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  let respuesta;
  try {
    respuesta = await fetch(API_BASE + ruta, {
      ...opciones,
      headers,
    });
  } catch (error) {
    throw new Error("No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté encendido.");
  }

  const cuerpo = await leerCuerpoJSON(respuesta);

  if (!respuesta.ok) {
    const mensaje = (cuerpo && cuerpo.error) || "Ocurrió un error inesperado.";
    if (respuesta.status === 401) {
      // Token vencido o inválido: mandamos al login.
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.location.href = "/login.html?expirada=1";
    }
    throw new Error(mensaje);
  }

  return cuerpo;
}

// Petición con archivo (multipart/form-data). No fijamos Content-Type:
// el navegador lo arma solo con el boundary correcto.
async function apiFetchArchivo(ruta, formData) {
  const token = obtenerToken();

  let respuesta;
  try {
    respuesta = await fetch(API_BASE + ruta, {
      method: "POST",
      headers: token ? { Authorization: "Bearer " + token } : {},
      body: formData,
    });
  } catch (error) {
    throw new Error("No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté encendido.");
  }

  const cuerpo = await leerCuerpoJSON(respuesta);

  if (!respuesta.ok) {
    throw new Error((cuerpo && cuerpo.error) || "No se pudo subir el archivo.");
  }

  return cuerpo;
}

const api = {
  login: (correo, password) =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ correo, password }) }),

  me: () => apiFetch("/auth/me"),

  listarExpedientes: () => apiFetch("/expedientes"),

  obtenerExpediente: (id) => apiFetch(`/expedientes/${id}`),

  dictaminar: (id, datos) =>
    apiFetch(`/expedientes/${id}/dictamen`, { method: "POST", body: JSON.stringify(datos) }),

  subirDocumento: (id, formData) => apiFetchArchivo(`/expedientes/${id}/documentos`, formData),

  listarUsuarios: (rol) => apiFetch(rol ? `/usuarios?rol=${rol}` : "/usuarios"),

  crearUsuario: (datos) => apiFetch("/usuarios", { method: "POST", body: JSON.stringify(datos) }),

  crearExpediente: (datos) => apiFetch("/expedientes", { method: "POST", body: JSON.stringify(datos) }),

  asignarDocente: (id, docenteId) =>
    apiFetch(`/expedientes/${id}/asignar-docente`, { method: "PATCH", body: JSON.stringify({ docenteId }) }),
};
