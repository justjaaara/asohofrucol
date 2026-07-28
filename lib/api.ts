import { NextResponse } from 'next/server'
import { serialize } from './serialize'

export function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(serialize(data), { status })
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function notFound(message = 'No encontrado') {
  return errorResponse(message, 404)
}

export function unauthorized(message = 'No autorizado') {
  return errorResponse(message, 401)
}

export function forbidden(message = 'Acceso denegado') {
  return errorResponse(message, 403)
}
