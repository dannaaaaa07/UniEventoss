const Database = require("better-sqlite3");
const path = require("path");

// Crear/abrir la base de datos
const dbPath = path.join(__dirname, "unievientos.db");
const db = new Database(dbPath);

// Crear las tablas principales
db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        correo TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        rol_id INTEGER NOT NULL,
        FOREIGN KEY (rol_id) REFERENCES roles(id)
    );

    CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS eventos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descripcion TEXT,
        fecha TEXT NOT NULL,
        hora TEXT NOT NULL,
        lugar TEXT NOT NULL,
        cupo_maximo INTEGER NOT NULL,
        cupos_disponibles INTEGER NOT NULL,
        estado TEXT NOT NULL DEFAULT 'Borrador',
        categoria_id INTEGER,
        organizador_id INTEGER,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id),
        FOREIGN KEY (organizador_id) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS inscripciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        evento_id INTEGER NOT NULL,
        fecha_inscripcion TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'Activa',
        UNIQUE(usuario_id, evento_id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY (evento_id) REFERENCES eventos(id)
    );

    CREATE TABLE IF NOT EXISTS asistencias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inscripcion_id INTEGER NOT NULL,
        fecha_registro TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'Asistente',
        FOREIGN KEY (inscripcion_id) REFERENCES inscripciones(id)
    );

    CREATE TABLE IF NOT EXISTS auditoria (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        accion TEXT NOT NULL,
        fecha TEXT NOT NULL,
        descripcion TEXT,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
`);

console.log("Base de datos de UniEventos creada correctamente.");

module.exports = db;