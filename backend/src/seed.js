require("dotenv").config();

const bcrypt = require("bcryptjs");
const { sequelize, Usuario, Expediente, Observacion, HistorialEstado } = require("./models");
const { sumarDiasHabiles, formatoFecha } = require("./utils/fechas");

const DIAS_PLAZO_EVALUACION = parseInt(process.env.DIAS_PLAZO_EVALUACION || "15", 10);
const DIAS_PLAZO_SUBSANACION = parseInt(process.env.DIAS_PLAZO_SUBSANACION || "5", 10);

async function crearUsuario({ nombre, correo, password, rol }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return Usuario.create({ nombre, correo, passwordHash, rol });
}

async function seed() {
  console.log("⏳ Reiniciando base de datos y cargando datos de prueba...\n");

  // force: true = borra y vuelve a crear las tablas. Solo se usa en desarrollo/seed.
  await sequelize.sync({ force: true });

  // ---------- Usuarios ----------
  const admin = await crearUsuario({
    nombre: "Administrador del Sistema",
    correo: "admin@practicas.edu.pe",
    password: "admin123",
    rol: "admin",
  });

  const docenteMaria = await crearUsuario({
    nombre: "Ing. María López",
    correo: "maria.lopez@practicas.edu.pe",
    password: "docente123",
    rol: "docente",
  });

  const docenteJorge = await crearUsuario({
    nombre: "Ing. Jorge Salinas",
    correo: "jorge.salinas@practicas.edu.pe",
    password: "docente123",
    rol: "docente",
  });

  const carla = await crearUsuario({
    nombre: "Carla Ramos",
    correo: "carla.ramos@alumno.edu.pe",
    password: "estudiante123",
    rol: "estudiante",
  });

  const jorgeH = await crearUsuario({
    nombre: "Jorge Huamán",
    correo: "jorge.huaman@alumno.edu.pe",
    password: "estudiante123",
    rol: "estudiante",
  });

  const rosa = await crearUsuario({
    nombre: "Rosa Quispe",
    correo: "rosa.quispe@alumno.edu.pe",
    password: "estudiante123",
    rol: "estudiante",
  });

  const luis = await crearUsuario({
    nombre: "Luis Fernández",
    correo: "luis.fernandez@alumno.edu.pe",
    password: "estudiante123",
    rol: "estudiante",
  });

  // ---------- Expediente 1: Carla Ramos -> OBSERVADO (con historial completo) ----------
  const hace12Dias = new Date();
  hace12Dias.setDate(hace12Dias.getDate() - 12);
  const fechaEntregaCarla = formatoFecha(hace12Dias);

  const expCarla = await Expediente.create({
    codigo: "EXP-2026-0145",
    tema: "Modelado de base de datos con PostgreSQL",
    estudianteId: carla.id,
    docenteId: docenteMaria.id,
    estado: "observado",
    fechaEntrega: fechaEntregaCarla,
    fechaLimite: formatoFecha(sumarDiasHabiles(new Date(), 3)), // 3 días hábiles restantes
  });

  await HistorialEstado.bulkCreate([
    { expedienteId: expCarla.id, estadoAnterior: null, estadoNuevo: "entregado", cambiadoPorId: carla.id },
    { expedienteId: expCarla.id, estadoAnterior: "entregado", estadoNuevo: "en_comision", cambiadoPorId: admin.id },
    { expedienteId: expCarla.id, estadoAnterior: "en_comision", estadoNuevo: "observado", cambiadoPorId: docenteMaria.id },
  ]);

  await Observacion.create({
    expedienteId: expCarla.id,
    autorId: docenteMaria.id,
    tipo: "observado",
    detalle: "Falta anexar la constancia de horas de práctica firmada por el jefe inmediato.",
  });

  // ---------- Expediente 2: Jorge Huamán -> EN COMISIÓN, urgente (14/15 días) ----------
  const hace14Dias = new Date();
  hace14Dias.setDate(hace14Dias.getDate() - 14);

  const expJorge = await Expediente.create({
    codigo: "EXP-2026-0098",
    tema: "Sistema de monitoreo agrícola",
    estudianteId: jorgeH.id,
    docenteId: docenteMaria.id,
    estado: "en_comision",
    fechaEntrega: formatoFecha(hace14Dias),
    fechaLimite: formatoFecha(new Date()), // vence hoy/mañana -> urgente
  });

  await HistorialEstado.bulkCreate([
    { expedienteId: expJorge.id, estadoAnterior: null, estadoNuevo: "entregado", cambiadoPorId: jorgeH.id },
    { expedienteId: expJorge.id, estadoAnterior: "entregado", estadoNuevo: "en_comision", cambiadoPorId: admin.id },
  ]);

  // ---------- Expediente 3: Rosa Quispe -> EN COMISIÓN, atención (11/15 días) ----------
  const hace11Dias = new Date();
  hace11Dias.setDate(hace11Dias.getDate() - 11);

  const expRosa = await Expediente.create({
    codigo: "EXP-2026-0112",
    tema: "App móvil de trazabilidad",
    estudianteId: rosa.id,
    docenteId: docenteJorge.id,
    estado: "en_comision",
    fechaEntrega: formatoFecha(hace11Dias),
    fechaLimite: formatoFecha(sumarDiasHabiles(new Date(), 2)),
  });

  await HistorialEstado.bulkCreate([
    { expedienteId: expRosa.id, estadoAnterior: null, estadoNuevo: "entregado", cambiadoPorId: rosa.id },
    { expedienteId: expRosa.id, estadoAnterior: "entregado", estadoNuevo: "en_comision", cambiadoPorId: admin.id },
  ]);

  // ---------- Expediente 4: Luis Fernández -> EN COMISIÓN, recién entregado ----------
  const hace2Dias = new Date();
  hace2Dias.setDate(hace2Dias.getDate() - 2);

  const expLuis = await Expediente.create({
    codigo: "EXP-2026-0150",
    tema: "Plataforma de ventas online",
    estudianteId: luis.id,
    docenteId: docenteJorge.id,
    estado: "en_comision",
    fechaEntrega: formatoFecha(hace2Dias),
    fechaLimite: formatoFecha(sumarDiasHabiles(new Date(), 13)),
  });

  await HistorialEstado.bulkCreate([
    { expedienteId: expLuis.id, estadoAnterior: null, estadoNuevo: "entregado", cambiadoPorId: luis.id },
    { expedienteId: expLuis.id, estadoAnterior: "entregado", estadoNuevo: "en_comision", cambiadoPorId: admin.id },
  ]);

  console.log("✅ Base de datos creada con datos de prueba.\n");
  console.log("=========================================================");
  console.log(" CREDENCIALES DE PRUEBA");
  console.log("=========================================================");
  console.log(" ADMIN");
  console.log("   correo: admin@practicas.edu.pe        password: admin123");
  console.log("");
  console.log(" DOCENTES");
  console.log("   correo: maria.lopez@practicas.edu.pe   password: docente123");
  console.log("   correo: jorge.salinas@practicas.edu.pe password: docente123");
  console.log("");
  console.log(" ESTUDIANTES");
  console.log("   correo: carla.ramos@alumno.edu.pe      password: estudiante123  (expediente OBSERVADO)");
  console.log("   correo: jorge.huaman@alumno.edu.pe     password: estudiante123  (expediente urgente)");
  console.log("   correo: rosa.quispe@alumno.edu.pe      password: estudiante123");
  console.log("   correo: luis.fernandez@alumno.edu.pe   password: estudiante123");
  console.log("=========================================================\n");

  await sequelize.close();
}

seed().catch((error) => {
  console.error("❌ Error al ejecutar el seed:", error);
  process.exit(1);
});
