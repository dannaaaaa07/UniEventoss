const db = require("./database");

const eventos = [
    {
        titulo: "Taller de Inteligencia Artificial",
        descripcion: "Taller práctico sobre inteligencia artificial y sus aplicaciones.",
        fecha: "2026-10-20",
        hora: "09:00",
        lugar: "Laboratorio de Sistemas UMB",
        cupo_maximo: 30,
        categoria_id: 4,
        organizador_id: 2
    },
    {
        titulo: "Torneo de Fútbol UMB",
        descripcion: "Torneo deportivo entre estudiantes de la Universidad Manuela Beltrán.",
        fecha: "2026-10-22",
        hora: "14:00",
        lugar: "Cancha deportiva UMB",
        cupo_maximo: 100,
        categoria_id: 3,
        organizador_id: 2
    },
    {
        titulo: "Semana Cultural UMB",
        descripcion: "Actividad cultural con música, arte, danza y participación estudiantil.",
        fecha: "2026-10-25",
        hora: "10:00",
        lugar: "Plaza Central UMB",
        cupo_maximo: 150,
        categoria_id: 2,
        organizador_id: 2
    },
    {
        titulo: "Feria de Emprendimiento",
        descripcion: "Espacio para conocer proyectos y emprendimientos desarrollados por estudiantes.",
        fecha: "2026-10-28",
        hora: "11:00",
        lugar: "Auditorio Principal UMB",
        cupo_maximo: 80,
        categoria_id: 1,
        organizador_id: 2
    },
    {
        titulo: "Conferencia de Ciberseguridad",
        descripcion: "Conferencia sobre seguridad informática, amenazas digitales y protección de datos.",
        fecha: "2026-11-02",
        hora: "15:00",
        lugar: "Auditorio UMB",
        cupo_maximo: 70,
        categoria_id: 4,
        organizador_id: 2
    },
    {
        titulo: "Jornada de Bienestar Universitario",
        descripcion: "Actividad enfocada en bienestar, salud y convivencia de la comunidad universitaria.",
        fecha: "2026-11-05",
        hora: "08:30",
        lugar: "Zona de Bienestar UMB",
        cupo_maximo: 60,
        categoria_id: 5,
        organizador_id: 2
    },
    {
        titulo: "Taller de Programación Web",
        descripcion: "Taller introductorio de desarrollo web utilizando HTML, CSS y JavaScript.",
        fecha: "2026-11-08",
        hora: "13:00",
        lugar: "Sala de Sistemas 2",
        cupo_maximo: 40,
        categoria_id: 4,
        organizador_id: 2
    },
    {
        titulo: "Festival de Danza Universitaria",
        descripcion: "Presentación artística con diferentes grupos de danza de la universidad.",
        fecha: "2026-11-12",
        hora: "16:00",
        lugar: "Auditorio Principal UMB",
        cupo_maximo: 120,
        categoria_id: 2,
        organizador_id: 2
    },
    {
        titulo: "Charla sobre Innovación Tecnológica",
        descripcion: "Espacio académico para conocer nuevas tendencias y tecnologías.",
        fecha: "2026-11-15",
        hora: "10:30",
        lugar: "Sala de Conferencias UMB",
        cupo_maximo: 50,
        categoria_id: 4,
        organizador_id: 2
    }
];

const insertarEvento = db.prepare(`
    INSERT INTO eventos (
        titulo,
        descripcion,
        fecha,
        hora,
        lugar,
        cupo_maximo,
        cupos_disponibles,
        estado,
        categoria_id,
        organizador_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const evento of eventos) {
    insertarEvento.run(
        evento.titulo,
        evento.descripcion,
        evento.fecha,
        evento.hora,
        evento.lugar,
        evento.cupo_maximo,
        evento.cupo_maximo,
        "Publicado",
        evento.categoria_id,
        evento.organizador_id
    );
}

console.log("======================================");
console.log("Nuevos eventos agregados correctamente");
console.log("Total de eventos agregados:", eventos.length);
console.log("======================================");