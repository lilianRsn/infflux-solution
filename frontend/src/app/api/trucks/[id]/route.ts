import { NextRequest } from 'next/server'
import { proxyToBackend } from '@/lib/proxy'

type Ctx = { params: Promise<{ id: string }> }

export function PATCH(req: NextRequest, { params }: Ctx) {
  return params.then(({ id }) => proxyToBackend(req, `/api/trucks/${id}`))
}

export function DELETE(req: NextRequest, { params }: Ctx) {
  return params.then(({ id }) => proxyToBackend(req, `/api/trucks/${id}`))
}