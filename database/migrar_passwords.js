const crypto = require("crypto");
const db = require("./database");

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");

    return `${salt}:${hash}`;
}

const actualizar = db.prepare(`
    UPDATE usuarios
    SET password = ?
    WHERE correo = ?
`);

actualizar.run(
    hashPassword("Admin123"),
    "admin@unievientos.com"
);

actualizar.run(
    hashPassword("Organizador123"),
    "organizador@unievientos.com"
);

actualizar.run(
    hashPassword("Participante123"),
    "participante@unievientos.com"
);

console.log("Contraseñas actualizadas y protegidas correctamente.");