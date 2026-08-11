// =========================================================
// Manejo de sesión en el navegador
// =========================================================
// NOTA de seguridad para cuando este proyecto crezca:
// guardar el JWT en localStorage es válido para un prototipo académico,
// pero es vulnerable a ataques XSS. En un sistema en producción se
// recomienda usar cookies httpOnly + Secure en su lugar.

function guardarSesion(token, usuario) {
  localStorage.setItem("token", token);
  localStorage.setItem("usuario", JSON.stringify(usuario));
}

function obtenerUsuario() {
  const crudo = localStorage.getItem("usuario");
  return crudo ? JSON.parse(crudo) : null;
}

function cerrarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "/login.html";
}

// Llamar al inicio de cada página protegida.
// rolesPermitidos: array de roles que pueden ver esta página, ej. ["docente", "admin"]
function requerirSesion(rolesPermitidos) {
  const token = localStorage.getItem("token");
  const usuario = obtenerUsuario();

  if (!token || !usuario) {
    window.location.href = "/login.html";
    return null;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    // Usuario autenticado pero sin permiso para esta pantalla:
    // lo mandamos a la pantalla que sí le corresponde.
    window.location.href = rutaSegunRol(usuario.rol);
    return null;
  }

  return usuario;
}

function rutaSegunRol(rol) {
  if (rol === "estudiante") return "/estudiante.html";
  if (rol === "docente") return "/comision.html";
  if (rol === "admin") return "/admin.html";
  return "/login.html";
}

function pintarBarraUsuario(usuario) {
  const nombreEl = document.getElementById("usuario-nombre-topbar");
  if (nombreEl) nombreEl.textContent = usuario.nombre;

  const salirBtn = document.getElementById("btn-salir");
  if (salirBtn) salirBtn.addEventListener("click", cerrarSesion);
}
