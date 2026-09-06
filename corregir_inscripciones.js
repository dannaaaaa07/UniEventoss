const db = require("./database/database");

db.pragma("foreign_keys = OFF");

db.exec(`
    CREATE TABLE inscripciones_nueva (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        evento_id INTEGER NOT NULL,
        fecha_inscripcion TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'Activa',
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY (evento_id) REFERENCES eventos(id)
    );

    INSERT INTO inscripciones_nueva
    (id, usuario_id, evento_id, fecha_inscripcion, estado)
    SELECT
        id, usuario_id, evento_id, fecha_inscripcion, estado
    FROM inscripciones;

    DROP TABLE inscripciones;

    ALTER TABLE inscripciones_nueva
    RENAME TO inscripciones;
`);

db.pragma("foreign_keys = ON");

console.log("Tabla de inscripciones corregida correctamente.");