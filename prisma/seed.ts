import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const adminRol = await prisma.rol.upsert({
    where: { nombre: 'ADMINISTRADOR' },
    update: {},
    create: { nombre: 'ADMINISTRADOR' },
  })

  await prisma.rol.upsert({
    where: { nombre: 'USUARIO ESTANDAR' },
    update: {},
    create: { nombre: 'USUARIO ESTANDAR' },
  })

  const parametricas: { tipo: string; valores: string[] }[] = [
    {
      tipo: 'TipoInformacion',
      valores: [
        'ASIGNACION POR PAZ Y SALVO',
        'INACTIVACION',
        'PEX',
        'PROCESOS CONCURSALES',
        'DESISTIMIENTO',
        'INFORMACION COMPLETA (REQUERIMIENTO)',
        'INFORMACION INCOMPLETA (REQUERIMIENTO)',
      ],
    },
    {
      tipo: 'Zona',
      valores: [
        'ANTIOQUIA',
        'BOGOTÁ',
        'BOYACÁ',
        'CALDAS',
        'CAQUETÁ',
        'COSTA',
        'CUNDINAMARCA',
        'EJE CAFETERO',
        'HUILA',
        'META',
        'SAN ANDRES',
        'SANTANDER',
        'TOLIMA',
        'URABÁ',
        'VALLE DEL CAUCA',
      ],
    },
    {
      tipo: 'EstadoActual',
      valores: ['SI PAGÓ', 'NO PAGÓ', 'N/A', 'COMPROMISO DE PAGO', 'ACUERDO DE PAGO'],
    },
    {
      tipo: 'Etapa',
      valores: ['VERIFICACIONES', 'CULMINADOS Y TRASLADO AI', 'DESISTIMIENTO', 'INACTIVACIÓN-CONCURSAL'],
    },
    {
      tipo: 'SiNo',
      valores: ['SI', 'NO'],
    },
    {
      tipo: 'RecaudadorIdentificado',
      valores: ['RECAUDADOR', 'IDENTIFICADO'],
    },
  ]

  for (const { tipo, valores } of parametricas) {
    for (let i = 0; i < valores.length; i++) {
      await prisma.parametrica.upsert({
        where: { tipo_valor: { tipo, valor: valores[i] } },
        update: {},
        create: { tipo, valor: valores[i], orden: i },
      })
    }
  }

  const adminDoc = 999999999n
  const exists = await prisma.profesional.findUnique({ where: { documento: adminDoc } })
  if (!exists) {
    await prisma.profesional.create({
      data: {
        documento: adminDoc,
        nombre: 'Administrador del Sistema',
        correo: 'admin@asohofrucol.com.co',
        idRol: adminRol.idRol,
        passwordHash: await hash('admin', 10),
        estado: true,
      },
    })
  }

  console.log('Seed completado.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
