import { NextRequest } from 'next/server'
import { proxyToBackend } from '@/lib/proxy'

export function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => proxyToBackend(req, `/api/delivery-plans/${id}/status`))
}