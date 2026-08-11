// Notificación flotante reutilizable en todas las páginas.
let toastTimeout;

function mostrarToast(mensaje, tipo = "exito") {
  const toast = document.getElementById("toast");
  const texto = document.getElementById("toast-texto");
  if (!toast || !texto) return;

  texto.textContent = mensaje;
  toast.classList.toggle("error", tipo === "error");
  toast.classList.add("visible");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("visible"), 3500);
}
