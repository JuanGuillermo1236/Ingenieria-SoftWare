// =========================================================
// Cálculo de días hábiles (lunes a viernes, sin feriados).
// Para un sistema real de una universidad, aquí se agregaría
// una tabla de feriados y se excluirían también esos días.
// =========================================================

function sumarDiasHabiles(fechaInicio, cantidadDias) {
  const fecha = new Date(fechaInicio);
  let diasSumados = 0;

  while (diasSumados < cantidadDias) {
    fecha.setDate(fecha.getDate() + 1);
    const diaSemana = fecha.getDay(); // 0 = domingo, 6 = sábado
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasSumados++;
    }
  }

  return fecha;
}

function diasHabilesRestantes(fechaLimite) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(fechaLimite);
  limite.setHours(0, 0, 0, 0);

  let dias = 0;
  const cursor = new Date(hoy);

  while (cursor < limite) {
    cursor.setDate(cursor.getDate() + 1);
    const diaSemana = cursor.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) {
      dias++;
    }
  }

  // Si ya se pasó la fecha límite, devolvemos un número negativo
  // para que el frontend pueda mostrar "plazo vencido".
  return hoy > limite ? -dias : dias;
}

function formatoFecha(fecha) {
  return new Date(fecha).toISOString().split("T")[0];
}

module.exports = { sumarDiasHabiles, diasHabilesRestantes, formatoFecha };
