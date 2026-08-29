const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const sqlite3 = require("sqlite3").verbose();

const databasePath = path.join(
    __dirname,
    "database",
    "actividades.db"
);

const dataFolder = path.join(__dirname, "data");

const db = new sqlite3.Database(databasePath, (error) => {
    if (error) {
        console.error("❌ Error al conectar con SQLite:", error.message);
        return;
    }

    console.log("✅ Conectado a la base de datos.");
    iniciarImportacion();
});


// --------------------------------------------------
// FUNCIONES AUXILIARES
// --------------------------------------------------

function limpiarTexto(valor) {
    if (valor === undefined || valor === null) {
        return "";
    }

    return String(valor).trim();
}


function convertirFecha(valor) {
    if (valor === undefined || valor === null || valor === "") {
        return null;
    }

    // Si Excel entrega un número, convertir fecha serial de Excel
    if (typeof valor === "number") {
        const fecha = XLSX.SSF.parse_date_code(valor);

        if (!fecha) {
            return null;
        }

        return `${fecha.y}-${String(fecha.m).padStart(2, "0")}-${String(fecha.d).padStart(2, "0")}`;
    }

    const texto = String(valor).trim();

    // Formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        return texto;
    }

    // Formato DD/MM/YYYY
    const partes = texto.split("/");

    if (partes.length === 3) {
        let dia = partes[0];
        let mes = partes[1];
        let anio = partes[2];

        dia = dia.padStart(2, "0");
        mes = mes.padStart(2, "0");

        // Detectar años sospechosos
       if (anio.length === 4 && Number(anio) < 1900) {

    if (anio === "0206") {
        console.warn(
            `⚠️ Fecha 0206 corregida automáticamente a 2026: ${texto}`
        );

        anio = "2026";
    } else {
        console.warn(
            `⚠️ Fecha sospechosa encontrada: ${texto}`
        );

        return null;
    }
}

        if (anio.length === 2) {
            anio = "20" + anio;
        }

        return `${anio}-${mes}-${dia}`;
    }

    return null;
}


function convertirHora(valor) {
    if (valor === undefined || valor === null || valor === "") {
        return null;
    }

    // Excel puede guardar la hora como número decimal
    if (typeof valor === "number") {
        const totalMinutos = Math.round(valor * 24 * 60);

        const horas = Math.floor(totalMinutos / 60) % 24;
        const minutos = totalMinutos % 60;

        return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:00`;
    }

    const texto = String(valor).trim();

    // HH:MM
    if (/^\d{1,2}:\d{2}$/.test(texto)) {
        return texto + ":00";
    }

    // HH:MM:SS
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(texto)) {
        return texto;
    }

    return null;
}


function obtenerIdClasificacion(nombre) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT id_clasificacion
             FROM clasificacion
             WHERE nombre = ?`,
            [nombre],
            (error, fila) => {

                if (error) {
                    reject(error);
                    return;
                }

                if (!fila) {
                    reject(
                        new Error(
                            `No existe la clasificación: ${nombre}`
                        )
                    );
                    return;
                }

                resolve(fila.id_clasificacion);
            }
        );
    });
}


function obtenerIdTipo(nombre) {
    return new Promise((resolve, reject) => {
        if (!nombre) {
            resolve(null);
            return;
        }

        db.get(
            `SELECT id_tipo
             FROM tipo
             WHERE nombre = ?`,
            [nombre],
            (error, fila) => {

                if (error) {
                    reject(error);
                    return;
                }

                if (!fila) {
                    reject(
                        new Error(
                            `No existe el tipo: ${nombre}`
                        )
                    );
                    return;
                }

                resolve(fila.id_tipo);
            }
        );
    });
}


function insertarActividad(
    fecha,
    hora,
    actividad,
    duracion,
    tipo,
    clasificacion
) {
    return new Promise(async (resolve, reject) => {

        try {
            const idClasificacion =
                await obtenerIdClasificacion(clasificacion);

            const idTipo =
                await obtenerIdTipo(tipo);

            db.get(
                `SELECT id_actividad
                 FROM actividad
                 WHERE fecha = ?
                   AND hora = ?
                   AND actividad = ?
                   AND id_clasificacion = ?
                   AND (
                       id_tipo = ?
                       OR (id_tipo IS NULL AND ? IS NULL)
                   )`,
                [
                    fecha,
                    hora,
                    actividad,
                    idClasificacion,
                    idTipo,
                    idTipo
                ],
                (error, fila) => {

                    if (error) {
                        reject(error);
                        return;
                    }

                    // Si ya existe, no lo volvemos a insertar
                    if (fila) {
                        resolve(fila.id_actividad);
                        return;
                    }

                    // Si no existe, lo insertamos
                    db.run(
                        `INSERT INTO actividad
                        (
                            fecha,
                            hora,
                            actividad,
                            duracion,
                            id_tipo,
                            id_clasificacion,
                            origen
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            fecha,
                            hora,
                            actividad,
                            duracion || null,
                            idTipo,
                            idClasificacion,
                            clasificacion
                        ],
                        function (error) {

                            if (error) {
                                reject(error);
                                return;
                            }

                            resolve(this.lastID);
                        }
                    );
                }
            );

        } catch (error) {
            reject(error);
        }
    });
}


function insertarHorario(
    actividad,
    tiempo,
    durante
) {
    return new Promise(async (resolve, reject) => {

        try {
            const idClasificacion =
                await obtenerIdClasificacion("TO DO");

            db.run(
                `INSERT INTO horario
                (
                    actividad,
                    tiempo,
                    durante,
                    id_clasificacion
                )
                VALUES (?, ?, ?, ?)`,
                [
                    actividad,
                    tiempo,
                    durante,
                    idClasificacion
                ],
                function (error) {

                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve(this.lastID);
                }
            );

        } catch (error) {
            reject(error);
        }
    });
}


// --------------------------------------------------
// IMPORTAR REGISTRO TIPO BASE DE DATOS
// --------------------------------------------------

async function importarRegistroTipo() {

    const archivo = path.join(
        dataFolder,
        "REGISTRO TIPO BASE DE DATOS .xlsx"
    );

    console.log("\n📥 Importando REGISTRO TIPO BASE DE DATOS...");

    if (!fs.existsSync(archivo)) {
        console.log("⚠️ No se encontró:", archivo);
        return;
    }

    const workbook = XLSX.readFile(archivo);
    const hoja = workbook.Sheets[workbook.SheetNames[0]];

    const datos = XLSX.utils.sheet_to_json(hoja, {
        defval: ""
    });

    let importados = 0;
    let rechazados = 0;

    for (const fila of datos) {

        const fecha = convertirFecha(fila.FECHA);
        const hora = convertirHora(fila.HORA);
        const actividad = limpiarTexto(fila.ACTIVIDAD);
        const tipoOriginal = limpiarTexto(fila.TIPO);

        if (!fecha || !hora || !actividad) {
            rechazados++;
            continue;
        }

        let tipo = tipoOriginal
            .replace(/,$/, "")
            .trim()
            .toUpperCase();

       if (
          tipo !== "PRODUCTIVO" &&
          tipo !== "NO PRODUCTIVO" &&
          tipo !== "DORMIR"
     ) {
            console.warn(
                `⚠️ Tipo desconocido: ${tipoOriginal}`
            );

            rechazados++;
            continue;
        }

        try {
            await insertarActividad(
                fecha,
                hora,
                actividad,
                null,
                tipo,
                "REGISTRO"
            );

            importados++;

        } catch (error) {
            console.error(
                "❌ Error al importar actividad:",
                error.message
            );

            rechazados++;
        }
    }

    console.log(
        `✅ REGISTRO: ${importados} importados, ${rechazados} rechazados.`
    );
}


// --------------------------------------------------
// IMPORTAR HÁBITOS
// --------------------------------------------------

async function importarHabitos() {

    const archivo = path.join(
        dataFolder,
        "HABITOS .xlsx"
    );

    console.log("\n📥 Importando HÁBITOS...");

    if (!fs.existsSync(archivo)) {
        console.log("⚠️ No se encontró:", archivo);
        return;
    }

    const workbook = XLSX.readFile(archivo);
    const hoja = workbook.Sheets[workbook.SheetNames[0]];

    const datos = XLSX.utils.sheet_to_json(hoja, {
        defval: ""
    });

    let importados = 0;
    let rechazados = 0;

    for (const fila of datos) {

        const fecha = convertirFecha(fila["FECHA "]);
        const hora = convertirHora(fila["HORA "]);
        const duracion = limpiarTexto(fila["DURACION "]);
        const actividad = limpiarTexto(fila["ACTIVIDAD"]);

        if (!fecha || !hora || !actividad) {
            rechazados++;
            continue;
        }

        try {
            await insertarActividad(
                fecha,
                hora,
                actividad,
                duracion,
                null,
                "HABITO"
            );

            importados++;

        } catch (error) {
            console.error(
                "❌ Error al importar hábito:",
                error.message
            );

            rechazados++;
        }
    }

    console.log(
        `✅ HÁBITOS: ${importados} importados, ${rechazados} rechazados.`
    );
}


// --------------------------------------------------
// IMPORTAR LISTA TO DO - ACTIVIDADES
// --------------------------------------------------

async function importarTodoActividades() {

    const archivo = path.join(
        dataFolder,
        "Lista to do oficial .xlsx"
    );

    console.log("\n📥 Importando TO DO → ACTIVIDADES...");

    if (!fs.existsSync(archivo)) {
        console.log("⚠️ No se encontró:", archivo);
        return;
    }

    const workbook = XLSX.readFile(archivo);

    if (!workbook.Sheets["ACTIVIDADES"]) {
        console.log(
            "⚠️ No existe la hoja ACTIVIDADES."
        );
        return;
    }

    const hoja = workbook.Sheets["ACTIVIDADES"];

    const datos = XLSX.utils.sheet_to_json(hoja, {
        defval: ""
    });

    let importados = 0;
    let rechazados = 0;

    for (const fila of datos) {

        const fecha = convertirFecha(fila["FECHA "]);
        const hora = convertirHora(fila["HORA "]);
        const actividad = limpiarTexto(fila["ACTIVIDAD "]);

        if (!fecha || !hora || !actividad) {
            rechazados++;
            continue;
        }

        try {
            await insertarActividad(
                fecha,
                hora,
                actividad,
                null,
                null,
                "TO DO"
            );

            importados++;

        } catch (error) {
            console.error(
                "❌ Error al importar TO DO:",
                error.message
            );

            rechazados++;
        }
    }

    console.log(
        `✅ TO DO ACTIVIDADES: ${importados} importados, ${rechazados} rechazados.`
    );
}


// --------------------------------------------------
// IMPORTAR LISTA TO DO - HORARIO
// --------------------------------------------------

async function importarTodoHorario() {

    const archivo = path.join(
        dataFolder,
        "Lista to do oficial .xlsx"
    );

    console.log("\n📥 Importando TO DO → HORARIO...");

    if (!fs.existsSync(archivo)) {
        console.log("⚠️ No se encontró:", archivo);
        return;
    }

    const workbook = XLSX.readFile(archivo);

    if (!workbook.Sheets["Horario"]) {
        console.log(
            "⚠️ No existe la hoja Horario."
        );
        return;
    }

    const hoja = workbook.Sheets["Horario"];

    const datos = XLSX.utils.sheet_to_json(hoja, {
        defval: ""
    });

    let importados = 0;
    let rechazados = 0;

    for (const fila of datos) {

        const actividad =
            limpiarTexto(fila["ACTIVIDAD "]);

        const tiempo =
            limpiarTexto(fila["Tiempo"]);

        const durante =
            limpiarTexto(fila["Durante"]);

        if (!actividad) {
            rechazados++;
            continue;
        }

        try {
            await insertarHorario(
                actividad,
                tiempo,
                durante
            );

            importados++;

        } catch (error) {
            console.error(
                "❌ Error al importar horario:",
                error.message
            );

            rechazados++;
        }
    }

    console.log(
        `✅ HORARIO: ${importados} importados, ${rechazados} rechazados.`
    );
}


// --------------------------------------------------
// INICIAR IMPORTACIÓN
// --------------------------------------------------

async function iniciarImportacion() {

    try {

        await importarRegistroTipo();

        await importarHabitos();

        await importarTodoActividades();

        await importarTodoHorario();

        console.log("\n==================================");
        console.log("🎉 IMPORTACIÓN TERMINADA");
        console.log("==================================");
        console.log("📌 La hoja REGISTRO de TO DO NO fue importada.");
        console.log("📌 Las actividades fueron clasificadas.");
        console.log("📌 Los horarios fueron guardados.");
        console.log("==================================\n");

    } catch (error) {

        console.error(
            "\n❌ Error general:",
            error.message
        );

    } finally {

        db.close((error) => {

            if (error) {
                console.error(
                    "Error cerrando SQLite:",
                    error.message
                );
            } else {
                console.log(
                    "🔒 Conexión SQLite cerrada."
                );
            }

        });
    }
}