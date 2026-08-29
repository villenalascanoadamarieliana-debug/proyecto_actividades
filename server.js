const express = require("express");
const cors = require("cors");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 3000;

const databasePath = path.join(
    __dirname,
    "database",
    "actividades.db"
);

const db = new sqlite3.Database(
    databasePath,
    (error) => {
        if (error) {
            console.error(
                "❌ Error al conectar con SQLite:",
                error.message
            );
        } else {
            console.log(
                "✅ Conectado a la base de datos SQLite."
            );
        }
    }
);

// -----------------------------------------
// CONFIGURACIÓN
// -----------------------------------------

app.use(cors());
app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// -----------------------------------------
// RUTA PRINCIPAL
// -----------------------------------------

app.get("/", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );
});


// -----------------------------------------
// OBTENER CLASIFICACIONES
// -----------------------------------------

app.get(
    "/api/clasificaciones",
    (req, res) => {

        const sql = `
            SELECT
                id_clasificacion,
                nombre
            FROM clasificacion
            ORDER BY nombre
        `;

        db.all(
            sql,
            [],
            (error, filas) => {

                if (error) {
                    return res.status(500).json({
                        error: error.message
                    });
                }

                res.json(filas);
            }
        );
    }
);


// -----------------------------------------
// OBTENER TIPOS
// -----------------------------------------

app.get(
    "/api/tipos",
    (req, res) => {

        const sql = `
            SELECT
                id_tipo,
                nombre
            FROM tipo
            ORDER BY nombre
        `;

        db.all(
            sql,
            [],
            (error, filas) => {

                if (error) {
                    return res.status(500).json({
                        error: error.message
                    });
                }

                res.json(filas);
            }
        );
    }
);


// -----------------------------------------
// CONSULTAR ACTIVIDADES POR FECHA
// -----------------------------------------

app.get(
    "/api/actividades",
    (req, res) => {

        const {
            fecha,
            hora
        } = req.query;

        let sql = `
            SELECT
                a.id_actividad,
                a.fecha,
                a.hora,
                a.actividad,
                a.duracion,
                c.nombre AS clasificacion,
                t.nombre AS tipo
            FROM actividad a

            INNER JOIN clasificacion c
                ON a.id_clasificacion =
                   c.id_clasificacion

            LEFT JOIN tipo t
                ON a.id_tipo =
                   t.id_tipo
        `;

        const parametros = [];

        // Buscar por fecha
        if (fecha) {

            sql += `
                WHERE a.fecha = ?
            `;

            parametros.push(fecha);
        }

       // Buscar por fecha y hora
if (fecha && hora) {

    sql += `
        AND substr(a.hora, 1, 5) = ?
    `;

    parametros.push(
        hora.substring(0, 5)
    );
}

        sql += `
            ORDER BY
                a.fecha,
                a.hora
        `;

        db.all(
            sql,
            parametros,
            (error, filas) => {

                if (error) {
                    return res.status(500).json({
                        error: error.message
                    });
                }

                res.json(filas);
            }
        );
    }
);


// -----------------------------------------
// REGISTRAR UNA NUEVA ACTIVIDAD
// -----------------------------------------

app.post(
    "/api/actividades",
    (req, res) => {

        const {
            fecha,
            hora,
            actividad,
            duracion,
            id_tipo,
            id_clasificacion
        } = req.body;

        // Validar campos obligatorios
       if (
    !fecha ||
    !hora ||
    !actividad ||
    !id_clasificacion ||
    !id_tipo
) {

    return res.status(400).json({
        error:
            "Fecha, hora, actividad, clasificación y tipo son obligatorios."
    });

}

        const sql = `
            INSERT INTO actividad
            (
                fecha,
                hora,
                actividad,
                duracion,
                id_tipo,
                id_clasificacion,
                origen
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

       const horaCompleta =
    hora.length === 5
        ? `${hora}:00`
        : hora;


const parametros = [
    fecha,
    horaCompleta,
    actividad,
    duracion || null,
    id_tipo || null,
    id_clasificacion,
    "HTML"
];

        db.run(
            sql,
            parametros,
            function (error) {

                if (error) {

                    console.error(
                        "❌ Error al guardar:",
                        error.message
                    );

                    return res.status(500).json({
                        error: error.message
                    });
                }

                res.status(201).json({
                    mensaje:
                        "Actividad registrada correctamente.",
                    id_actividad:
                        this.lastID
                });
            }
        );
    }
);


// -----------------------------------------
// INICIAR SERVIDOR
// -----------------------------------------

app.listen(
    PORT,
    () => {

        console.log(
            `🚀 Servidor funcionando en http://localhost:${PORT}`
        );

    }
);