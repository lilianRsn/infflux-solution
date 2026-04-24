import { NextRequest } from 'next/server'
import { proxyToBackend } from '@/lib/proxy'

export function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) =>
    proxyToBackend(req, `/api/client-warehouses/${id}/hub-alternatives`)
  )
}
