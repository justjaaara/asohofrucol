-- CreateTable
CREATE TABLE "Roles" (
    "idRol" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("idRol")
);

-- CreateTable
CREATE TABLE "Profesionales" (
    "documento" BIGINT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT,
    "zona" TEXT,
    "idRol" INTEGER NOT NULL,
    "passwordHash" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Profesionales_pkey" PRIMARY KEY ("documento")
);

-- CreateTable
CREATE TABLE "Parametricas" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Parametricas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verificaciones" (
    "idVerificacion" SERIAL NOT NULL,
    "idProfesionalRecaudador" BIGINT NOT NULL,
    "idProfesionalVerificacion" BIGINT NOT NULL,
    "tipoInformacion" TEXT NOT NULL,
    "zona" TEXT,
    "fechaEntregaInformacion" DATE,
    "fechaAsignacion" DATE,
    "recaudadorIdentificado" TEXT,
    "nit" BIGINT NOT NULL,
    "razonSocial" TEXT,
    "informacionCompleta" TEXT,
    "fechaCulminacion" DATE,
    "fechaTrasladoRecaudador" DATE,
    "fechaTrasladoAuditoria" DATE,
    "valorPendienteCapital" DECIMAL(18,2),
    "valorPendienteIntereses" DECIMAL(18,2),
    "valorSaldoFavor" DECIMAL(18,2),
    "estadoActual" TEXT,
    "detalleCertificacion" TEXT,
    "usoPTNuevo" TEXT,
    "porcentajeAvance" DECIMAL(5,2),
    "observacionProfesional" TEXT,
    "biable" TEXT,
    "correo" TEXT,
    "digitacion" TEXT,
    "motivoRequerimiento" TEXT,
    "envioRequerimiento" TEXT,
    "programacionGestionPresencial" TEXT,
    "verificacionContable" TEXT,
    "etapa" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioCreacion" BIGINT NOT NULL,
    "fechaModificacion" TIMESTAMP(3),
    "usuarioModificacion" BIGINT,

    CONSTRAINT "Verificaciones_pkey" PRIMARY KEY ("idVerificacion")
);

-- CreateTable
CREATE TABLE "VigenciasVerificacion" (
    "idVigencia" SERIAL NOT NULL,
    "idVerificacion" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "marcado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VigenciasVerificacion_pkey" PRIMARY KEY ("idVigencia")
);

-- CreateTable
CREATE TABLE "Maraton" (
    "idMaraton" SERIAL NOT NULL,
    "fechaMaraton" DATE,
    "idProfesionalRecaudador" BIGINT,
    "idProfesionalVerificacion" BIGINT,
    "recaudadorIdentificado" TEXT,
    "nit" BIGINT NOT NULL,
    "razonSocial" TEXT,
    "numeroVigencias" INTEGER,
    "porcentajeEstadoVerificacion" DECIMAL(5,2),
    "culminado" TEXT,
    "porcentajeAvance" DECIMAL(5,2),
    "totalAvance" DECIMAL(5,2),
    "valorPendienteCapital" DECIMAL(18,2),
    "valorPendienteIntereses" DECIMAL(18,2),
    "valorSaldoFavor" DECIMAL(18,2),
    "usoPTNuevo" TEXT,
    "observacionCulminacion" TEXT,
    "observacionCoordinacion" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioCreacion" BIGINT NOT NULL,
    "fechaModificacion" TIMESTAMP(3),
    "usuarioModificacion" BIGINT,

    CONSTRAINT "Maraton_pkey" PRIMARY KEY ("idMaraton")
);

-- CreateTable
CREATE TABLE "VigenciasMaraton" (
    "idVigenciaMaraton" SERIAL NOT NULL,
    "idMaraton" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "marcado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VigenciasMaraton_pkey" PRIMARY KEY ("idVigenciaMaraton")
);

-- CreateIndex
CREATE UNIQUE INDEX "Roles_nombre_key" ON "Roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Parametricas_tipo_valor_key" ON "Parametricas"("tipo", "valor");

-- CreateIndex
CREATE UNIQUE INDEX "VigenciasVerificacion_idVerificacion_anio_key" ON "VigenciasVerificacion"("idVerificacion", "anio");

-- CreateIndex
CREATE UNIQUE INDEX "VigenciasMaraton_idMaraton_anio_key" ON "VigenciasMaraton"("idMaraton", "anio");

-- AddForeignKey
ALTER TABLE "Profesionales" ADD CONSTRAINT "Profesionales_idRol_fkey" FOREIGN KEY ("idRol") REFERENCES "Roles"("idRol") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Verificaciones" ADD CONSTRAINT "Verificaciones_idProfesionalRecaudador_fkey" FOREIGN KEY ("idProfesionalRecaudador") REFERENCES "Profesionales"("documento") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Verificaciones" ADD CONSTRAINT "Verificaciones_idProfesionalVerificacion_fkey" FOREIGN KEY ("idProfesionalVerificacion") REFERENCES "Profesionales"("documento") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Verificaciones" ADD CONSTRAINT "Verificaciones_usuarioCreacion_fkey" FOREIGN KEY ("usuarioCreacion") REFERENCES "Profesionales"("documento") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "VigenciasVerificacion" ADD CONSTRAINT "VigenciasVerificacion_idVerificacion_fkey" FOREIGN KEY ("idVerificacion") REFERENCES "Verificaciones"("idVerificacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maraton" ADD CONSTRAINT "Maraton_idProfesionalRecaudador_fkey" FOREIGN KEY ("idProfesionalRecaudador") REFERENCES "Profesionales"("documento") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Maraton" ADD CONSTRAINT "Maraton_idProfesionalVerificacion_fkey" FOREIGN KEY ("idProfesionalVerificacion") REFERENCES "Profesionales"("documento") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Maraton" ADD CONSTRAINT "Maraton_usuarioCreacion_fkey" FOREIGN KEY ("usuarioCreacion") REFERENCES "Profesionales"("documento") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "VigenciasMaraton" ADD CONSTRAINT "VigenciasMaraton_idMaraton_fkey" FOREIGN KEY ("idMaraton") REFERENCES "Maraton"("idMaraton") ON DELETE CASCADE ON UPDATE CASCADE;
