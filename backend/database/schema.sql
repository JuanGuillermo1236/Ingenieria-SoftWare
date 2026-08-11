-- =============================================
-- SISTEMA PRACTICA - Esquema de base de datos
-- =============================================

-- 🔥 Limpieza total: borra la BD completa para evitar
-- residuos de esquemas anteriores (tablas, FKs, vistas)
DROP DATABASE IF EXISTS sistema_practica;

CREATE DATABASE sistema_practica
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE sistema_practica;

SET NAMES utf8mb4;

-- TABLA: USUARIOS
CREATE TABLE usuarios (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(191) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('estudiante', 'docente', 'admin') NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ultimo_acceso DATETIME NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_usuarios_email (email),
    KEY idx_usuarios_rol_activo (rol, activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: EXPEDIENTES
CREATE TABLE expedientes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(30) NOT NULL,
    estudiante_id BIGINT UNSIGNED NOT NULL,
    docente_id BIGINT UNSIGNED NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NULL,
    estado ENUM(
        'borrador', 'enviado', 'en_revision', 'dictaminado', 'archivado'
    ) NOT NULL DEFAULT 'borrador',
    dictamen_estado ENUM('aprobado', 'observado', 'rechazado') NULL,
    dictamen_texto TEXT NULL,
    dictamen_docente_id BIGINT UNSIGNED NULL,
    dictamen_fecha DATETIME NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_expedientes_codigo (codigo),
    KEY idx_expedientes_estudiante (estudiante_id),
    KEY idx_expedientes_docente (docente_id),
    KEY idx_expedientes_dictamen_docente (dictamen_docente_id),
    KEY idx_expedientes_estado (estado),
    KEY idx_expedientes_creado_en (creado_en),

    CONSTRAINT fk_expedientes_estudiante
        FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_expedientes_docente
        FOREIGN KEY (docente_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_expedientes_dictamen_docente
        FOREIGN KEY (dictamen_docente_id) REFERENCES usuarios(id) ON DELETE RESTRICT,

    CONSTRAINT chk_expediente_dictamen_completo CHECK (
        estado <> 'dictaminado'
        OR (
            dictamen_estado IS NOT NULL
            AND dictamen_texto IS NOT NULL
            AND dictamen_docente_id IS NOT NULL
            AND dictamen_fecha IS NOT NULL
        )
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: DOCUMENTOS
CREATE TABLE documentos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    expediente_id BIGINT UNSIGNED NOT NULL,
    usuario_id BIGINT UNSIGNED NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    nombre_almacenado VARCHAR(150) NOT NULL,
    ruta TEXT NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    size_bytes BIGINT UNSIGNED NOT NULL,
    sha256 CHAR(64) NULL,
    version INT UNSIGNED NOT NULL DEFAULT 1,
    estado ENUM('activo', 'eliminado') NOT NULL DEFAULT 'activo',
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    eliminado_en DATETIME NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_documentos_expediente_nombre_almacenado (expediente_id, nombre_almacenado),
    KEY idx_documentos_usuario (usuario_id),
    KEY idx_documentos_estado (estado),

    CONSTRAINT fk_documentos_expediente
        FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_documentos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT chk_documentos_version CHECK (version >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: EXPEDIENTE_HISTORIAL
CREATE TABLE expediente_historial (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    expediente_id BIGINT UNSIGNED NOT NULL,
    usuario_id BIGINT UNSIGNED NOT NULL,
    evento ENUM(
        'creacion', 'actualizacion', 'envio', 'dictamen',
        'subida_documento', 'descarga_documento', 'cambio_estado',
        'archivado', 'rechazo'
    ) NOT NULL,
    estado_anterior VARCHAR(30) NULL,
    estado_nuevo VARCHAR(30) NULL,
    dictamen_anterior VARCHAR(20) NULL,
    dictamen_nuevo VARCHAR(20) NULL,
    comentario TEXT NULL,
    ip VARCHAR(45) NULL,
    user_agent TEXT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_historial_expediente (expediente_id),
    KEY idx_historial_usuario (usuario_id),
    KEY idx_historial_creado_en (creado_en),

    CONSTRAINT fk_historial_expediente
        FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_historial_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- VISTA útil para dashboard
CREATE OR REPLACE VIEW v_dashboard_resumen AS
SELECT
    (SELECT COUNT(*) FROM usuarios WHERE activo = TRUE) AS usuarios_activos,
    (SELECT COUNT(*) FROM usuarios WHERE rol = 'estudiante') AS total_estudiantes,
    (SELECT COUNT(*) FROM usuarios WHERE rol = 'docente') AS total_docentes,
    (SELECT COUNT(*) FROM usuarios WHERE rol = 'admin') AS total_admins,
    (SELECT COUNT(*) FROM expedientes) AS total_expedientes,
    (SELECT COUNT(*) FROM expedientes WHERE estado = 'borrador') AS expedientes_borrador,
    (SELECT COUNT(*) FROM expedientes WHERE estado = 'enviado') AS expedientes_enviados,
    (SELECT COUNT(*) FROM expedientes WHERE estado = 'en_revision') AS expedientes_en_revision,
    (SELECT COUNT(*) FROM expedientes WHERE estado = 'dictaminado') AS expedientes_dictaminados,
    (SELECT COUNT(*) FROM expedientes WHERE estado = 'archivado') AS expedientes_archivados,
    (SELECT COUNT(*) FROM expedientes WHERE dictamen_estado = 'aprobado') AS dictamenes_aprobados,
    (SELECT COUNT(*) FROM expedientes WHERE dictamen_estado = 'observado') AS dictamenes_observados,
    (SELECT COUNT(*) FROM expedientes WHERE dictamen_estado = 'rechazado') AS dictamenes_rechazados,
    (SELECT COUNT(*) FROM documentos WHERE estado = 'activo') AS documentos_activos;