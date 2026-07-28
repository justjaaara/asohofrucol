/**
 * Script de importación de UNA SOLA VEZ del Excel histórico de verificaciones.
 * Uso: pnpm import:xlsx "/ruta/al/archivo.xlsx"
 *
 * No es una funcionalidad de la aplicación — se ejecuta manualmente y no queda
 * referenciado desde ningún endpoint ni pantalla.
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Prisma } from '@prisma/client'
import * as XLSX from 'xlsx'
import { loadEnvIfPresent } from '../lib/loadEnv'

loadEnvIfPresent()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// Documentos inventados a falta de la cédula real — reemplazar cuando se conozca.
const PROFESIONAL_POR_NOMBRE: Record<string, bigint> = {
  'ANGIE ELIANA NAVARRO FIESCO': 111111111n,
  'JULIAN ANDRES LLANOS': 222222222n,
}

// Alias de zona detectados en el archivo que no calzan exactamente con las
// paramétricas ya sembradas (después de recortar espacios).
const ZONA_ALIAS: Record<string, string> = {
  'BOGOTA D,C': 'BOGOTÁ',
}

const AÑOS_VIGENCIA = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]

function normalizarTexto(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const texto = String(value).replace(/\s+/g, ' ').trim()
  return texto === '' ? null : texto
}

function normalizarZona(value: unknown): string | null {
  const texto = normalizarTexto(value)
  if (!texto) return null
  return ZONA_ALIAS[texto] ?? texto
}

function parseFecha(value: unknown): Date | null {
  const texto = normalizarTexto(value)
  if (!texto || texto.toUpperCase() === 'N/A') return null
  const match = texto.match(/^(\d{1,2})\s+(\d{1,2})\s+(\d{4})$/)
  if (!match) {
    console.warn(`  ! Fecha no reconocida, se guarda como null: "${texto}"`)
    return null
  }
  const [, dia, mes, anio] = match
  return new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia)))
}

function parseDecimal(value: unknown): Prisma.Decimal | null {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isNaN(num) ? null : new Prisma.Decimal(num)
}

function parsePorcentaje(value: unknown): Prisma.Decimal | null {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  if (Number.isNaN(num)) return null
  return new Prisma.Decimal(Math.round(num * 100 * 100) / 100)
}

function resolverProfesional(nombreCrudo: unknown): bigint | null {
  const nombre = normalizarTexto(nombreCrudo)
  if (!nombre) return null
  const documento = PROFESIONAL_POR_NOMBRE[nombre.toUpperCase()]
  if (!documento) {
    throw new Error(`Profesional sin documento mapeado: "${nombre}". Agrégalo a PROFESIONAL_POR_NOMBRE.`)
  }
  return documento
}

function leerFilaCaso(row: unknown[], etapa: string) {
  const vigenciasMarcadas = AÑOS_VIGENCIA.filter((_, i) => Boolean(row[10 + i]))

  return {
    etapa,
    idProfesionalRecaudador: resolverProfesional(row[1]),
    idProfesionalVerificacion: resolverProfesional(row[2]),
    tipoInformacion: normalizarTexto(row[3]),
    zona: normalizarZona(row[4]),
    fechaEntregaInformacion: parseFecha(row[5]),
    fechaAsignacion: parseFecha(row[6]),
    recaudadorIdentificado: normalizarTexto(row[7]),
    nit: row[8] === null || row[8] === undefined ? null : BigInt(row[8] as number),
    razonSocial: normalizarTexto(row[9]),
    vigencias: vigenciasMarcadas,
    informacionCompleta: normalizarTexto(row[21]),
    fechaCulminacion: parseFecha(row[22]),
    fechaTrasladoRecaudador: parseFecha(row[23]),
    fechaTrasladoAuditoria: parseFecha(row[24]),
    valorPendienteCapital: parseDecimal(row[25]),
    valorPendienteIntereses: parseDecimal(row[26]),
    valorSaldoFavor: parseDecimal(row[27]),
    estadoActual: normalizarTexto(row[28]),
    detalleCertificacion: normalizarTexto(row[29]),
    usoPTNuevo: normalizarTexto(row[30]),
    porcentajeAvance: parsePorcentaje(row[31]),
    observacionProfesional: normalizarTexto(row[32]),
    biable: normalizarTexto(row[33]),
    correo: normalizarTexto(row[34]),
    digitacion: normalizarTexto(row[35]),
    motivoRequerimiento: normalizarTexto(row[36]),
    envioRequerimiento: normalizarTexto(row[37]),
    programacionGestionPresencial: normalizarTexto(row[38]),
    verificacionContable: normalizarTexto(row[39]),
  }
}

async function importarProfesionales() {
  const rolEstandar = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'USUARIO ESTANDAR' } })

  for (const [nombre, documento] of Object.entries(PROFESIONAL_POR_NOMBRE)) {
    await prisma.profesional.upsert({
      where: { documento },
      update: {},
      create: {
        documento,
        nombre: nombre
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        idRol: rolEstandar.idRol,
        estado: true,
        passwordHash: null,
      },
    })
    console.log(`  Profesional listo: ${nombre} -> documento ${documento}`)
  }
}

async function importarHojaCasos(wb: XLSX.WorkBook, hoja: string, etapa: string) {
  const ws = wb.Sheets[hoja]
  if (!ws) {
    console.warn(`Hoja no encontrada: ${hoja}`)
    return 0
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null })
  // Filas "en blanco" del Excel a veces traen espacios no separables (\xa0) en
  // vez de celdas vacías reales; exigir un NIT numérico evita colarlas.
  const filasDatos = rows.slice(2).filter((r) => typeof r[8] === 'number')

  let creados = 0
  for (const row of filasDatos) {
    const fila = leerFilaCaso(row, etapa)

    if (fila.nit === null || !fila.idProfesionalVerificacion || !fila.idProfesionalRecaudador || !fila.tipoInformacion) {
      console.warn(`  ! Fila incompleta en "${hoja}", se omite:`, row.slice(0, 10))
      continue
    }

    await prisma.verificacion.create({
      data: {
        idProfesionalRecaudador: fila.idProfesionalRecaudador,
        idProfesionalVerificacion: fila.idProfesionalVerificacion,
        tipoInformacion: fila.tipoInformacion,
        zona: fila.zona,
        fechaEntregaInformacion: fila.fechaEntregaInformacion,
        fechaAsignacion: fila.fechaAsignacion,
        recaudadorIdentificado: fila.recaudadorIdentificado,
        nit: fila.nit,
        razonSocial: fila.razonSocial,
        informacionCompleta: fila.informacionCompleta,
        fechaCulminacion: fila.fechaCulminacion,
        fechaTrasladoRecaudador: fila.fechaTrasladoRecaudador,
        fechaTrasladoAuditoria: fila.fechaTrasladoAuditoria,
        valorPendienteCapital: fila.valorPendienteCapital,
        valorPendienteIntereses: fila.valorPendienteIntereses,
        valorSaldoFavor: fila.valorSaldoFavor,
        estadoActual: fila.estadoActual,
        detalleCertificacion: fila.detalleCertificacion,
        usoPTNuevo: fila.usoPTNuevo,
        porcentajeAvance: fila.porcentajeAvance,
        observacionProfesional: fila.observacionProfesional,
        biable: fila.biable,
        correo: fila.correo,
        digitacion: fila.digitacion,
        motivoRequerimiento: fila.motivoRequerimiento,
        envioRequerimiento: fila.envioRequerimiento,
        programacionGestionPresencial: fila.programacionGestionPresencial,
        verificacionContable: fila.verificacionContable,
        etapa: fila.etapa,
        usuarioCreacion: fila.idProfesionalVerificacion,
        vigencias: {
          create: fila.vigencias.map((anio) => ({ anio, marcado: true })),
        },
      },
    })
    creados++
  }

  console.log(`  ${hoja}: ${creados} verificación(es) creada(s)`)
  return creados
}

async function importarMaraton(wb: XLSX.WorkBook) {
  const ws = wb.Sheets['PROGRAMACIÓN MARATÓN']
  if (!ws) {
    console.warn('Hoja PROGRAMACIÓN MARATÓN no encontrada')
    return 0
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null })
  // Fila 10 (índice 9) en adelante contiene los datos; columna C = NIT del bloque programación.
  // Exigir tipo numérico evita colar filas "en blanco" con \xa0 en vez de null.
  const filasDatos = rows.slice(9).filter((r) => typeof r[2] === 'number')

  let creados = 0
  for (const row of filasDatos) {
    const nit = BigInt(row[2] as number)
    const fechaMaraton = parseFecha(row[1])
    const razonSocial = normalizarTexto(row[3])
    const recaudadorIdentificado = normalizarTexto(row[4])
    const numeroVigencias = row[5] === null ? null : Number(row[5])
    const porcentajeEstadoVerificacion = parsePorcentaje(row[7])
    const culminado = normalizarTexto(row[12])
    const porcentajeAvance = parsePorcentaje(row[14])
    const totalAvance = parsePorcentaje(row[15])
    const valorPendienteCapital = parseDecimal(row[16])
    const valorPendienteIntereses = parseDecimal(row[17])
    const valorSaldoFavor = parseDecimal(row[18])
    const usoPTNuevo = normalizarTexto(row[19])
    const observacionCulminacion = normalizarTexto(row[21])
    const observacionCoordinacion = normalizarTexto(row[22])

    // La hoja de maratón no trae nombre de profesional; se asume el mismo
    // verificador que atendió el caso equivalente en Verificaciones (mismo NIT).
    const usuarioCreacion = PROFESIONAL_POR_NOMBRE['ANGIE ELIANA NAVARRO FIESCO']

    await prisma.maraton.create({
      data: {
        fechaMaraton,
        nit,
        razonSocial,
        recaudadorIdentificado,
        numeroVigencias,
        porcentajeEstadoVerificacion,
        culminado,
        porcentajeAvance,
        totalAvance,
        valorPendienteCapital,
        valorPendienteIntereses,
        valorSaldoFavor,
        usoPTNuevo,
        observacionCulminacion,
        observacionCoordinacion,
        usuarioCreacion,
      },
    })
    creados++
  }

  console.log(`  Maratón: ${creados} registro(s) creado(s)`)
  return creados
}

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Uso: pnpm import:xlsx "/ruta/al/archivo.xlsx"')
    process.exit(1)
  }

  const existentes = await prisma.verificacion.count()
  if (existentes > 0 && !process.argv.includes('--force')) {
    console.error(
      `Ya existen ${existentes} verificaciones en la base de datos. ` +
        'Este script es de una sola ejecución; pásale --force si de verdad quieres reimportar.'
    )
    process.exit(1)
  }

  const wb = XLSX.readFile(filePath)

  console.log('Profesionales...')
  await importarProfesionales()

  console.log('Verificaciones...')
  let total = 0
  total += await importarHojaCasos(wb, 'VERIFICACIONES', 'VERIFICACIONES')
  total += await importarHojaCasos(wb, 'CULMINADOS Y TRASLADO AI', 'CULMINADOS Y TRASLADO AI')
  total += await importarHojaCasos(wb, 'INACTIVACIÓN-CONCURSAL', 'INACTIVACIÓN-CONCURSAL')
  total += await importarHojaCasos(wb, 'DESISTIMIENTO', 'DESISTIMIENTO')

  console.log('Maratón...')
  const maratonCreados = await importarMaraton(wb)

  console.log(`\nImportación completada: ${total} verificación(es), ${maratonCreados} registro(s) de maratón.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
