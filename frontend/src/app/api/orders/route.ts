import { NextRequest } from 'next/server'
import { proxyToBackend } from '@/lib/proxy'

export function GET(req: NextRequest) {
  return proxyToBackend(req, '/api/orders')
}
