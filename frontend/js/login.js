document.addEventListener("DOMContentLoaded", function () {
  // Si ya hay una sesión activa, no tiene sentido mostrar el login de nuevo.
  const usuarioExistente = obtenerUsuario();
  if (usuarioExistente && localStorage.getItem("token")) {
    window.location.href = rutaSegunRol(usuarioExistente.rol);
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const errorBox = document.getElementById("login-error");

  if (params.get("expirada") === "1") {
    errorBox.textContent = "Tu sesión expiró. Vuelve a iniciar sesión.";
    errorBox.classList.add("visible");
  }

  const form = document.getElementById("form-login");
  const btnLogin = document.getElementById("btn-login");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const correo = document.getElementById("correo").value.trim();
    const password = document.getElementById("password").value;

    errorBox.classList.remove("visible");
    btnLogin.disabled = true;
    btnLogin.textContent = "Ingresando...";

    try {
      const data = await api.login(correo, password);

      guardarSesion(data.token, data.usuario);
      window.location.href = rutaSegunRol(data.usuario.rol);
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.classList.add("visible");
      btnLogin.disabled = false;
      btnLogin.textContent = "Ingresar";
    }
  });
});
