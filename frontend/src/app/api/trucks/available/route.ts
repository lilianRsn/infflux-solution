import { NextRequest } from 'next/server'
import { proxyToBackend } from '@/lib/proxy'

export function GET(req: NextRequest) {
  const url = new URL(req.url)
  return proxyToBackend(req, `/api/trucks/available${url.search}`)
}
