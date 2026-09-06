const crypto = require("crypto");
const db = require("./database");

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");

    return `${salt}:${hash}`;
}

// Roles
const insertarRol = db.prepare(
    "INSERT OR IGNORE INTO roles (nombre) VALUES (?)"
);

insertarRol.run("Administrador");
insertarRol.run("Organizador");
insertarRol.run("Participante");

// Categorías
const insertarCategoria = db.prepare(
    "INSERT OR IGNORE INTO categorias (nombre) VALUES (?)"
);

insertarCategoria.run("Académico");
insertarCategoria.run("Cultural");
insertarCategoria.run("Deportivo");
insertarCategoria.run("Tecnología");
insertarCategoria.run("Bienestar");

// Usuarios con contraseñas protegidas
const insertarUsuario = db.prepare(
    "INSERT OR IGNORE INTO usuarios (nombre, correo, password, rol_id) VALUES (?, ?, ?, ?)"
);

insertarUsuario.run(
    "Administrador UniEventos",
    "admin@unievientos.com",
    hashPassword("Admin123"),
    1
);

insertarUsuario.run(
    "Organizador UniEventos",
    "organizador@unievientos.com",
    hashPassword("Organizador123"),
    2
);

insertarUsuario.run(
    "Participante UniEventos",
    "participante@unievientos.com",
    hashPassword("Participante123"),
    3
);

// Evento inicial
const insertarEvento = db.prepare(
    "INSERT INTO eventos (titulo, descripcion, fecha, hora, lugar, cupo_maximo, cupos_disponibles, estado, categoria_id, organizador_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);
insertarEvento.run(
    "Seminario de Inteligencia Artificial",
    "Seminario sobre inteligencia artificial y sus aplicaciones en la ingeniería.",
    "2026-10-20",
    "14:00",
    "Auditorio Principal UMB",
    80,
    80,
    "Publicado",
    4,
    2
);

insertarEvento.run(
    "Torneo Universitario de Fútbol",
    "Actividad deportiva para estudiantes de la universidad.",
    "2026-10-22",
    "09:00",
    "Cancha Deportiva UMB",
    30,
    30,
    "Publicado",
    3,
    2
);

insertarEvento.run(
    "Taller de Desarrollo Web",
    "Taller práctico sobre HTML, CSS, JavaScript y desarrollo de aplicaciones web.",
    "2026-10-25",
    "10:00",
    "Laboratorio de Sistemas",
    25,
    25,
    "Publicado",
    1,
    2
);

insertarEvento.run(
    "Festival Cultural UMB",
    "Espacio universitario para música, danza y expresiones artísticas.",
    "2026-10-28",
    "16:00",
    "Plaza Central UMB",
    100,
    100,
    "Publicado",
    2,
    2
);

insertarEvento.run(
    "Jornada de Bienestar Universitario",
    "Actividad enfocada en bienestar, hábitos saludables y convivencia universitaria.",
    "2026-11-03",
    "08:00",
    "Sala de Bienestar",
    60,
    60,
    "Publicado",
    5,
    2
);

insertarEvento.run(
    "Conferencia de Ciberseguridad",
    "Conferencia sobre seguridad informática, privacidad y protección de datos.",
    "2026-11-05",
    "13:00",
    "Auditorio UMB",
    70,
    70,
    "Publicado",
    4,
    2
);

insertarEvento.run(
    "Feria de Proyectos de Ingeniería",
    "Exposición de proyectos desarrollados por estudiantes de ingeniería.",
    "2026-11-10",
    "10:00",
    "Bloque de Ingeniería",
    120,
    120,
    "Publicado",
    1,
    2
);

insertarEvento.run(
    "Taller de Liderazgo",
    "Actividad para fortalecer habilidades de liderazgo y trabajo en equipo.",
    "2026-11-15",
    "15:00",
    "Salón Múltiple",
    40,
    40,
    "Publicado",
    5,
    2
);

insertarEvento.run(
    "Feria de Tecnología UMB",
    "Evento universitario sobre tecnología e innovación.",
    "2026-10-15",
    "10:00",
    "Auditorio UMB",
    50,
    50,
    "Publicado",
    4,
    2
);

console.log("Datos iniciales cargados correctamente.");