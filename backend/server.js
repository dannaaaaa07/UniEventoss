const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const db = require("../database/database");

const app = express();
const PORT = 3000;
// Sesiones activas
const sesiones = new Map();

// Verificar contraseña protegida
function verificarPassword(password, passwordGuardado) {
    const partes = passwordGuardado.split(":");

    if (partes.length !== 2) {
        return false;
    }

    const salt = partes[0];
    const hashGuardado = partes[1];

    const hash = crypto.scryptSync(password, salt, 64).toString("hex");

    const bufferHash = Buffer.from(hash, "hex");
    const bufferGuardado = Buffer.from(hashGuardado, "hex");

    if (bufferHash.length !== bufferGuardado.length) {
        return false;
    }

    return crypto.timingSafeEqual(bufferHash, bufferGuardado);
}

// ================================
// MIDDLEWARES
// ================================

app.use(cors());
app.use(express.json());
// LOGIN
app.post("/api/login", (req, res) => {
    try {
        const { correo, password } = req.body;

        if (!correo || !password) {
            return res.status(400).json({
                error: "El correo y la contraseña son obligatorios."
            });
        }

        const usuario = db.prepare(`
            SELECT 
                usuarios.id,
                usuarios.nombre,
                usuarios.correo,
                usuarios.password,
                roles.nombre AS rol
            FROM usuarios
            INNER JOIN roles ON usuarios.rol_id = roles.id
            WHERE usuarios.correo = ?
        `).get(correo);

        if (!usuario) {
            return res.status(401).json({
                error: "Correo o contraseña incorrectos."
            });
        }

        const passwordCorrecta = verificarPassword(
            password,
            usuario.password
        );

        if (!passwordCorrecta) {
            return res.status(401).json({
                error: "Correo o contraseña incorrectos."
            });
        }

        // Crear token de sesión
        const token = crypto.randomBytes(32).toString("hex");

        sesiones.set(token, {
            usuarioId: usuario.id,
            expira: Date.now() + (2 * 60 * 60 * 1000)
        });

        res.json({
            mensaje: "Inicio de sesión exitoso.",
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Error interno del servidor."
        });
    }
});
// CERRAR SESIÓN
app.post("/api/logout", (req, res) => {
    const auth = req.headers.authorization || "";

    if (auth.startsWith("Bearer ")) {
        const token = auth.substring(7);
        sesiones.delete(token);
    }

    res.json({
        mensaje: "Sesión cerrada correctamente."
    });
});
// ================================
// MIDDLEWARE DE ROLES
// ================================

function verificarRol(rolesPermitidos) {
    return (req, res, next) => {
        const usuarioId = req.headers["usuario-id"];

        if (!usuarioId) {
            return res.status(401).json({
                error: "Usuario no autenticado"
            });
        }

        const usuario = db.prepare(`
            SELECT
                usuarios.id,
                usuarios.nombre,
                usuarios.correo,
                roles.nombre AS rol
            FROM usuarios
            INNER JOIN roles
                ON usuarios.rol_id = roles.id
            WHERE usuarios.id = ?
        `).get(usuarioId);

        if (!usuario) {
            return res.status(401).json({
                error: "Usuario no encontrado"
            });
        }

        if (!rolesPermitidos.includes(usuario.rol)) {
            return res.status(403).json({
                error: "No tiene permisos para realizar esta acción"
            });
        }

        req.usuario = usuario;
        next();
    };
}

// ================================
// RUTA PRINCIPAL
// ================================

app.get("/", (req, res) => {
    res.json({
        mensaje: "API de UniEventos funcionando correctamente"
    });
});

// ================================
// ESTADO DE LA API
// ================================

app.get("/api/estado", (req, res) => {
    res.json({
        proyecto: "UniEventos",
        estado: "Funcionando",
        servidor: "Express",
        puerto: PORT
    });
});

// ================================
// ROLES
// ================================

app.get("/api/roles", (req, res) => {
    try {
        const roles = db.prepare(`
            SELECT *
            FROM roles
            ORDER BY id ASC
        `).all();

        res.json(roles);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "No se pudieron consultar los roles"
        });
    }
});

// ================================
// CATEGORÍAS
// ================================

app.get("/api/categorias", (req, res) => {
    try {
        const categorias = db.prepare(`
            SELECT *
            FROM categorias
            ORDER BY id ASC
        `).all();

        res.json(categorias);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "No se pudieron consultar las categorías"
        });
    }
});

// ================================
// USUARIOS
// ================================

app.get("/api/usuarios", (req, res) => {
    try {
        const usuarios = db.prepare(`
            SELECT
                usuarios.id,
                usuarios.nombre,
                usuarios.correo,
                roles.nombre AS rol
            FROM usuarios
            INNER JOIN roles
                ON usuarios.rol_id = roles.id
            ORDER BY usuarios.id ASC
        `).all();

        res.json(usuarios);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "No se pudieron consultar los usuarios"
        });
    }
});

// ================================
// CONSULTAR EVENTOS
// ================================

app.get("/api/eventos", (req, res) => {
    try {
        const { fecha, categoria_id } = req.query;

        let sql = `
            SELECT
                eventos.id,
                eventos.titulo,
                eventos.descripcion,
                eventos.fecha,
                eventos.hora,
                eventos.lugar,
                eventos.cupo_maximo,
                eventos.cupos_disponibles,
                eventos.estado,
                categorias.nombre AS categoria
            FROM eventos
            LEFT JOIN categorias
                ON eventos.categoria_id = categorias.id
            WHERE 1 = 1
        `;

        const parametros = [];

        if (fecha) {
            sql += ` AND eventos.fecha = ?`;
            parametros.push(fecha);
        }

        if (categoria_id) {
            sql += ` AND eventos.categoria_id = ?`;
            parametros.push(categoria_id);
        }

        sql += ` ORDER BY eventos.fecha ASC`;

        const eventos = db.prepare(sql).all(...parametros);

        res.json(eventos);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "No se pudieron consultar los eventos"
        });
    }
});

// ================================
// CREAR EVENTO
// ================================

app.post("/api/eventos", (req, res) => {
    try {
        const {
            titulo,
            descripcion,
            fecha,
            hora,
            lugar,
            cupo_maximo,
            categoria_id,
            organizador_id
        } = req.body;

        if (
            !titulo ||
            !fecha ||
            !hora ||
            !lugar ||
            !cupo_maximo ||
            !categoria_id ||
            !organizador_id
        ) {
            return res.status(400).json({
                error: "Los datos obligatorios del evento son requeridos"
            });
        }

        if (Number(cupo_maximo) <= 0) {
            return res.status(422).json({
                error: "El cupo máximo debe ser mayor que cero"
            });
        }

        const categoria = db.prepare(`
            SELECT *
            FROM categorias
            WHERE id = ?
        `).get(categoria_id);

        if (!categoria) {
            return res.status(404).json({
                error: "La categoría no existe"
            });
        }

        const organizador = db.prepare(`
            SELECT
                usuarios.id,
                usuarios.nombre,
                roles.nombre AS rol
            FROM usuarios
            INNER JOIN roles
                ON usuarios.rol_id = roles.id
            WHERE usuarios.id = ?
        `).get(organizador_id);

        if (!organizador) {
            return res.status(404).json({
                error: "El organizador no existe"
            });
        }

        if (organizador.rol !== "Organizador") {
            return res.status(403).json({
                error: "El usuario no tiene rol de organizador"
            });
        }

        const insertarEvento = db.prepare(`
            INSERT INTO eventos
            (
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
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Borrador', ?, ?)
        `);

        const resultado = insertarEvento.run(
            titulo,
            descripcion || "",
            fecha,
            hora,
            lugar,
            Number(cupo_maximo),
            Number(cupo_maximo),
            categoria_id,
            organizador_id
        );

        res.status(201).json({
            mensaje: "Evento creado correctamente",
            id: resultado.lastInsertRowid,
            estado: "Borrador"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "No se pudo crear el evento"
        });
    }
});

// ================================
// EDITAR EVENTO
// ================================

app.put("/api/eventos/:id", (req, res) => {
    try {
        const id = req.params.id;

        const {
            titulo,
            descripcion,
            fecha,
            hora,
            lugar,
            cupo_maximo,
            categoria_id
        } = req.body;

        const evento = db.prepare(`
            SELECT *
            FROM eventos
            WHERE id = ?
        `).get(id);

        if (!evento) {
            return res.status(404).json({
                error: "El evento no existe"
            });
        }

        if (
            !titulo ||
            !fecha ||
            !hora ||
            !lugar ||
            !cupo_maximo ||
            !categoria_id
        ) {
            return res.status(400).json({
                error: "Los datos obligatorios son requeridos"
            });
        }

        if (Number(cupo_maximo) <= 0) {
            return res.status(422).json({
                error: "El cupo máximo debe ser mayor que cero"
            });
        }

        const actualizar = db.prepare(`
            UPDATE eventos
            SET
                titulo = ?,
                descripcion = ?,
                fecha = ?,
                hora = ?,
                lugar = ?,
                cupo_maximo = ?,
                categoria_id = ?
            WHERE id = ?
        `);

        actualizar.run(
            titulo,
            descripcion || "",
            fecha,
            hora,
            lugar,
            Number(cupo_maximo),
            categoria_id,
            id
        );

        res.json({
            mensaje: "Evento actualizado correctamente",
            id: Number(id)
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "No se pudo actualizar el evento"
        });
    }
});

// ================================
// PUBLICAR EVENTO
// ================================

app.post("/api/eventos/:id/publicar", (req, res) => {
    try {
        const id = req.params.id;

        const evento = db.prepare(`
            SELECT *
            FROM eventos
            WHERE id = ?
        `).get(id);

        if (!evento) {
            return res.status(404).json({
                error: "El evento no existe"
            });
        }

        db.prepare(`
            UPDATE eventos
            SET estado = 'Publicado'
            WHERE id = ?
        `).run(id);

        res.json({
            mensaje: "Evento publicado correctamente",
            id: Number(id),
            estado: "Publicado"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "No se pudo publicar el evento"
        });
    }
});

// ================================
// CANCELAR EVENTO
// ================================

app.post("/api/eventos/:id/cancelar", (req, res) => {
    try {
        const id = req.params.id;

        const evento = db.prepare(`
            SELECT *
            FROM eventos
            WHERE id = ?
        `).get(id);

        if (!evento) {
            return res.status(404).json({
                error: "El evento no existe"
            });
        }

        db.prepare(`
            UPDATE eventos
            SET estado = 'Cancelado'
            WHERE id = ?
        `).run(id);

        res.json({
            mensaje: "Evento cancelado correctamente",
            id: Number(id),
            estado: "Cancelado"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "No se pudo cancelar el evento"
        });
    }
});

// ================================
// CONSULTAR INSCRIPCIONES
// ================================

app.get("/api/inscripciones", (req, res) => {
    try {
        const inscripciones = db.prepare(`
            SELECT
                inscripciones.id,
                usuarios.nombre AS usuario,
                eventos.titulo AS evento,
                inscripciones.fecha_inscripcion,
                inscripciones.estado
            FROM inscripciones
            INNER JOIN usuarios
                ON inscripciones.usuario_id = usuarios.id
            INNER JOIN eventos
                ON inscripciones.evento_id = eventos.id
            ORDER BY inscripciones.id ASC
        `).all();

        res.json(inscripciones);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "No se pudieron consultar las inscripciones"
        });
    }
});

// ================================
// CREAR INSCRIPCIÓN
// ================================

app.post("/api/inscripciones", (req, res) => {
    try {
        const { usuario_id, evento_id } = req.body;

        if (!usuario_id || !evento_id) {
            return res.status(400).json({
                error: "usuario_id y evento_id son obligatorios"
            });
        }

        const evento = db.prepare(`
            SELECT *
            FROM eventos
            WHERE id = ?
        `).get(evento_id);

        if (!evento) {
            return res.status(404).json({
                error: "El evento no existe"
            });
        }

        if (evento.cupos_disponibles <= 0) {
            return res.status(422).json({
                error: "No hay cupos disponibles para este evento"
            });
        }

        const usuario = db.prepare(`
            SELECT *
            FROM usuarios
            WHERE id = ?
        `).get(usuario_id);

        if (!usuario) {
            return res.status(404).json({
                error: "El usuario no existe"
            });
        }

        const duplicada = db.prepare(`
            SELECT *
            FROM inscripciones
            WHERE usuario_id = ?
            AND evento_id = ?
            AND estado = 'Activa'
        `).get(usuario_id, evento_id);

        if (duplicada) {
            return res.status(422).json({
                error: "El usuario ya está inscrito en este evento"
            });
        }

        const fecha = new Date().toISOString();

        const insertar = db.prepare(`
            INSERT INTO inscripciones
            (
                usuario_id,
                evento_id,
                fecha_inscripcion,
                estado
            )
            VALUES (?, ?, ?, 'Activa')
        `);

        const actualizarCupo = db.prepare(`
            UPDATE eventos
            SET cupos_disponibles = cupos_disponibles - 1
            WHERE id = ?
        `);

        const registrarAuditoria = db.prepare(`
            INSERT INTO auditoria
            (
                usuario_id,
                accion,
                fecha,
                descripcion
            )
            VALUES (?, ?, ?, ?)
        `);

        const transaccion = db.transaction(() => {
            const resultado = insertar.run(
                usuario_id,
                evento_id,
                fecha
            );

            actualizarCupo.run(evento_id);

            registrarAuditoria.run(
                usuario_id,
                "CREAR_INSCRIPCION",
                fecha,
                `Inscripción ${resultado.lastInsertRowid} creada para el evento ${evento_id}`
            );

            return resultado;
        });

        const resultado = transaccion();

        const eventoActualizado = db.prepare(`
            SELECT cupos_disponibles
            FROM eventos
            WHERE id = ?
        `).get(evento_id);

        res.status(201).json({
            mensaje: "Inscripción realizada correctamente",
            id: resultado.lastInsertRowid,
            cupos_disponibles: eventoActualizado.cupos_disponibles
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "No se pudo realizar la inscripción"
        });
    }
});

// ================================
// CANCELAR INSCRIPCIÓN
// ================================

app.delete("/api/inscripciones/:id", (req, res) => {
    try {
        const id = req.params.id;

        const inscripcion = db.prepare(`
            SELECT *
            FROM inscripciones
            WHERE id = ?
        `).get(id);

        if (!inscripcion) {
            return res.status(404).json({
                error: "La inscripción no existe"
            });
        }

        if (inscripcion.estado === "Cancelada") {
            return res.status(422).json({
                error: "La inscripción ya estaba cancelada"
            });
        }

        const fecha = new Date().toISOString();

        const cancelar = db.prepare(`
            UPDATE inscripciones
            SET estado = 'Cancelada'
            WHERE id = ?
        `);

        const actualizarCupo = db.prepare(`
            UPDATE eventos
            SET cupos_disponibles = cupos_disponibles + 1
            WHERE id = ?
        `);

        const registrarAuditoria = db.prepare(`
            INSERT INTO auditoria
            (
                usuario_id,
                accion,
                fecha,
                descripcion
            )
            VALUES (?, ?, ?, ?)
        `);

        const transaccion = db.transaction(() => {
            cancelar.run(id);

            actualizarCupo.run(inscripcion.evento_id);

            registrarAuditoria.run(
                inscripcion.usuario_id,
                "CANCELAR_INSCRIPCION",
                fecha,
                `Inscripción ${id} cancelada`
            );
        });

        transaccion();

        const evento = db.prepare(`
            SELECT cupos_disponibles
            FROM eventos
            WHERE id = ?
        `).get(inscripcion.evento_id);

        res.json({
            mensaje: "Inscripción cancelada correctamente",
            id: Number(id),
            cupos_disponibles: evento.cupos_disponibles
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "No se pudo cancelar la inscripción"
        });
    }
});

// ================================
// REGISTRAR ASISTENCIA
// ================================

app.post("/api/asistencias", (req, res) => {
    try {
        const { inscripcion_id } = req.body;

        if (!inscripcion_id) {
            return res.status(400).json({
                error: "inscripcion_id es obligatorio"
            });
        }

        const inscripcion = db.prepare(`
            SELECT *
            FROM inscripciones
            WHERE id = ?
        `).get(inscripcion_id);

        if (!inscripcion) {
            return res.status(404).json({
                error: "La inscripción no existe"
            });
        }

        if (inscripcion.estado !== "Activa") {
            return res.status(422).json({
                error: "La inscripción no está activa"
            });
        }

        const asistenciaExistente = db.prepare(`
            SELECT *
            FROM asistencias
            WHERE inscripcion_id = ?
        `).get(inscripcion_id);

        if (asistenciaExistente) {
            return res.status(422).json({
                error: "La asistencia ya fue registrada"
            });
        }

        const fecha = new Date().toISOString();

        const registrarAsistencia = db.prepare(`
            INSERT INTO asistencias
            (
                inscripcion_id,
                fecha_registro,
                estado
            )
            VALUES (?, ?, 'Asistente')
        `);

        const registrarAuditoria = db.prepare(`
            INSERT INTO auditoria
            (
                usuario_id,
                accion,
                fecha,
                descripcion
            )
            VALUES (?, ?, ?, ?)
        `);

        const transaccion = db.transaction(() => {
            registrarAsistencia.run(
                inscripcion_id,
                fecha
            );

            registrarAuditoria.run(
                inscripcion.usuario_id,
                "REGISTRO_ASISTENCIA",
                fecha,
                `Se registró asistencia para la inscripción ${inscripcion_id}`
            );
        });

        transaccion();

        res.status(201).json({
            mensaje: "Asistencia registrada correctamente",
            inscripcion_id: Number(inscripcion_id),
            estado: "Asistente"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "No se pudo registrar la asistencia"
        });
    }
});

// ================================
// CONSULTAR ASISTENCIAS
// ================================

app.get("/api/asistencias", (req, res) => {
    try {
        const asistencias = db.prepare(`
            SELECT
                asistencias.id,
                asistencias.inscripcion_id,
                usuarios.nombre AS usuario,
                eventos.titulo AS evento,
                asistencias.fecha_registro,
                asistencias.estado
            FROM asistencias
            INNER JOIN inscripciones
                ON asistencias.inscripcion_id = inscripciones.id
            INNER JOIN usuarios
                ON inscripciones.usuario_id = usuarios.id
            INNER JOIN eventos
                ON inscripciones.evento_id = eventos.id
            ORDER BY asistencias.id ASC
        `).all();

        res.json(asistencias);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "No se pudieron consultar las asistencias"
        });
    }
});

// ================================
// REPORTE DE INSCRITOS
// ================================

app.get("/api/reportes/inscritos", (req, res) => {
    try {
        const reporte = db.prepare(`
            SELECT
                eventos.id AS evento_id,
                eventos.titulo AS evento,
                eventos.fecha,
                eventos.cupo_maximo,
                eventos.cupos_disponibles,
                COUNT(inscripciones.id) AS total_inscritos
            FROM eventos
            LEFT JOIN inscripciones
                ON eventos.id = inscripciones.evento_id
                AND inscripciones.estado = 'Activa'
            GROUP BY eventos.id
            ORDER BY eventos.fecha ASC
        `).all();

        res.json(reporte);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "No se pudo generar el reporte de inscritos"
        });
    }
});

// ================================
// REPORTE DE ASISTENCIA
// ================================

app.get("/api/reportes/asistencia", (req, res) => {
    try {
        const reporte = db.prepare(`
            SELECT
                eventos.id AS evento_id,
                eventos.titulo AS evento,
                eventos.fecha,
                COUNT(asistencias.id) AS total_asistentes
            FROM eventos
            LEFT JOIN inscripciones
                ON eventos.id = inscripciones.evento_id
            LEFT JOIN asistencias
                ON inscripciones.id = asistencias.inscripcion_id
            GROUP BY eventos.id
            ORDER BY eventos.fecha ASC
        `).all();

        res.json(reporte);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "No se pudo generar el reporte de asistencia"
        });
    }
});

// ================================
// PRUEBA DE ACCESO ADMINISTRADOR
// ================================

app.get(
    "/api/admin/prueba",
    verificarRol(["Administrador"]),
    (req, res) => {
        res.json({
            mensaje: "Acceso de administrador autorizado",
            usuario: req.usuario.nombre,
            rol: req.usuario.rol
        });
    }
);

// ================================
// PRUEBA DE ACCESO PARTICIPANTE
// ================================

app.get(
    "/api/participante/prueba",
    verificarRol(["Participante"]),
    (req, res) => {
        res.json({
            mensaje: "Acceso de participante autorizado",
            usuario: req.usuario.nombre,
            rol: req.usuario.rol
        });
    }
);

// ================================
// CONSULTAR AUDITORÍA
// ================================

app.get("/api/auditoria", (req, res) => {
    try {
        const registros = db.prepare(`
            SELECT
                auditoria.id,
                usuarios.nombre AS usuario,
                auditoria.accion,
                auditoria.fecha,
                auditoria.descripcion
            FROM auditoria
            LEFT JOIN usuarios
                ON auditoria.usuario_id = usuarios.id
            ORDER BY auditoria.id DESC
        `).all();

        res.json(registros);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "No se pudo consultar la auditoría"
        });
    }
});

// ================================
// SERVIDOR
// ================================

app.listen(PORT, () => {
    console.log(
        `Servidor de UniEventos ejecutándose en http://localhost:${PORT}`
    );
});