import { NextRequest } from 'next/server'
import { proxyToBackend } from '@/lib/proxy'

export function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  return params.then(({ orderId }) =>
    proxyToBackend(req, `/api/delivery-plans/orders/${orderId}/reprogram`)
  )
}
