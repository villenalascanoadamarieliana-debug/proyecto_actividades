PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clasificacion (
    id_clasificacion INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tipo (
    id_tipo INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS actividad (
    id_actividad INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    actividad TEXT NOT NULL,
    duracion TEXT,
    id_tipo INTEGER,
    id_clasificacion INTEGER NOT NULL,

    FOREIGN KEY (id_tipo)
        REFERENCES tipo(id_tipo),

    FOREIGN KEY (id_clasificacion)
        REFERENCES clasificacion(id_clasificacion)
);
CREATE TABLE IF NOT EXISTS horario (
    id_horario INTEGER PRIMARY KEY AUTOINCREMENT,
    actividad TEXT NOT NULL,
    tiempo TEXT,
    durante TEXT,
    id_clasificacion INTEGER NOT NULL,

    FOREIGN KEY (id_clasificacion)
        REFERENCES clasificacion(id_clasificacion)
);
INSERT OR IGNORE INTO clasificacion (nombre)
VALUES ('REGISTRO');

INSERT OR IGNORE INTO clasificacion (nombre)
VALUES ('HABITO');

INSERT OR IGNORE INTO clasificacion (nombre)
VALUES ('TO DO');

INSERT OR IGNORE INTO tipo (nombre)
VALUES ('PRODUCTIVO');

INSERT OR IGNORE INTO tipo (nombre)
VALUES ('NO PRODUCTIVO');