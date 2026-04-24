import { NextRequest } from 'next/server'
import { proxyToBackend } from '@/lib/proxy'

export function GET(req: NextRequest, { params }: { params: Promise<{ warehouseId: string }> }) {
  return params.then(({ warehouseId }) =>
    proxyToBackend(req, `/api/orders/warehouse/${warehouseId}`)
  )
}
