const API = "https://proyecto-actividades.onrender.com";

// =====================================
// CONSULTAR ACTIVIDADES
// =====================================

async function consultarActividades() {

    const fecha =
        document.getElementById("fechaConsulta").value;

    const hora =
        document.getElementById("horaConsulta").value;
        
        const clasificacion =
    document.getElementById("clasificacionConsulta").value;

   let url =
    `${API}/api/actividades?`;

const parametros = [];

if (fecha) {

    parametros.push(
        `fecha=${encodeURIComponent(fecha)}`
    );

}

if (hora) {

    parametros.push(
        `hora=${encodeURIComponent(hora)}`
    );

}

if (clasificacion) {

    parametros.push(
        `clasificacion=${encodeURIComponent(clasificacion)}`
    );

}

url += parametros.join("&");

    // IMPORTANTE:
    // El HTML entrega HH:MM.
    // La base de datos usa HH:MM:SS.
    // Agregamos los segundos.

    if (hora) {

        const horaCompleta =
            hora.length === 5
                ? `${hora}:00`
                : hora;

        url += `&hora=${encodeURIComponent(horaCompleta)}`;
    }


    try {

        const respuesta =
            await fetch(url);


        if (!respuesta.ok) {

            throw new Error(
                `Error HTTP: ${respuesta.status}`
            );
        }


        const actividades =
            await respuesta.json();


        mostrarActividades(actividades);

    }

    catch (error) {

        console.error(error);

        alert(
            "No se pudieron consultar las actividades."
        );
    }
}


// =====================================
// MOSTRAR ACTIVIDADES
// =====================================

function mostrarActividades(actividades) {

    const cuerpo =
        document.getElementById("tablaActividades");


    cuerpo.innerHTML = "";


    if (
        !actividades ||
        actividades.length === 0
    ) {

        cuerpo.innerHTML = `
            <tr>
                <td colspan="6">
                    No hay actividades registradas.
                </td>
            </tr>
        `;

        return;
    }


    actividades.forEach(item => {

        const fila =
            document.createElement("tr");


        fila.innerHTML = `

            <td>
                ${item.fecha ?? ""}
            </td>

            <td>
                ${item.hora ?? ""}
            </td>

            <td>
                ${item.actividad ?? ""}
            </td>

            <td>
                ${item.duracion ?? ""}
            </td>

            <td>
                ${item.clasificacion ?? item.id_clasificacion ?? ""}
            </td>

            <td>
                ${item.tipo ?? item.id_tipo ?? ""}
            </td>

        `;


        cuerpo.appendChild(fila);

    });
}


// =====================================
// REGISTRAR ACTIVIDAD
// =====================================

async function registrarActividad(event) {

    event.preventDefault();


    const fecha =
        document.getElementById("fecha").value;

    const hora =
        document.getElementById("hora").value;

    const actividad =
        document.getElementById("actividad").value;

    const duracion =
        document.getElementById("duracion").value;

    const idClasificacion =
        document.getElementById(
            "id_clasificacion"
        ).value;

    const idTipo =
        document.getElementById(
            "id_tipo"
        ).value;


    if (
        !fecha ||
        !hora ||
        !actividad ||
        !idClasificacion ||
        !idTipo
    ) {

        alert(
            "Completa todos los campos obligatorios."
        );

        return;
    }


    // Convertimos HH:MM a HH:MM:SS

    const horaCompleta =
        hora.length === 5
            ? `${hora}:00`
            : hora;


    const datos = {

        fecha: fecha,

        hora: horaCompleta,

        actividad: actividad,

        duracion: duracion,

        id_clasificacion:
            Number(idClasificacion),

        id_tipo:
            Number(idTipo),

        origen: "HTML"

    };


    try {

        const respuesta =
            await fetch("https://proyecto-actividades.onrender.com/api/actividades",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(datos)
                }
            );


        const resultado =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                resultado.error ||
                "No se pudo registrar."
            );
        }


        alert(
            "Actividad registrada correctamente."
        );


        document.getElementById(
            "formActividad"
        ).reset();


        consultarActividades();

    }

    catch (error) {

        console.error(error);

        alert(
            `Error: ${error.message}`
        );
    }
}// =====================================
// CARGAR CLASIFICACIONES
// =====================================

async function cargarClasificaciones() {

    try {

        const respuesta =
            await fetch("https://proyecto-actividades.onrender.com/api/clasificaciones");

        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron cargar las clasificaciones."
            );
        }

        const datos =
            await respuesta.json();


        // Selector para REGISTRAR actividad
        const selectRegistro =
            document.getElementById(
                "id_clasificacion"
            );


        // Selector para CONSULTAR actividades
        const selectConsulta =
            document.getElementById(
                "clasificacionConsulta"
            );


        datos.forEach(item => {

            // Opción para REGISTRAR
            const opcionRegistro =
                document.createElement("option");

            opcionRegistro.value =
                item.id_clasificacion;

            opcionRegistro.textContent =
                item.nombre;

            selectRegistro.appendChild(
                opcionRegistro
            );


            // Opción para CONSULTAR
            const opcionConsulta =
                document.createElement("option");

            opcionConsulta.value =
                item.id_clasificacion;

            opcionConsulta.textContent =
                item.nombre;

            selectConsulta.appendChild(
                opcionConsulta
            );

        });

    } catch (error) {

        console.error(error);

    }
}

// =====================================
// CARGAR TIPOS
// =====================================

async function cargarTipos() {

    try {

        const respuesta =
            await fetch("https://proyecto-actividades.onrender.com/api/tipos");

        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron cargar los tipos."
            );
        }

        const datos =
            await respuesta.json();

        const select =
            document.getElementById("id_tipo");

        datos.forEach(item => {

            const opcion =
                document.createElement("option");

            opcion.value =
                item.id_tipo;

            opcion.textContent =
                item.nombre;

            select.appendChild(opcion);

        });

    } catch (error) {

        console.error(error);

    }
}



// =====================================
// INICIAR APLICACIÓN
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        cargarClasificaciones();

        cargarTipos();

    }
);