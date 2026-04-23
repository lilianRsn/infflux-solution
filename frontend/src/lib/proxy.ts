import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

const BACKEND_URL = getBackendUrl()

export async function proxyToBackend(
  request: NextRequest,
  backendPath: string,
  overrideMethod?: string,
): Promise<NextResponse> {
  const token  = request.cookies.get('infflux_token')?.value
  const method = overrideMethod ?? request.method

  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const options: RequestInit = { method, headers }

  if (method !== 'GET' && method !== 'HEAD') {
    const text = await request.text()
    if (text) options.body = text
  }

  const res  = await fetch(`${BACKEND_URL}${backendPath}`, options)
  const data = await res.json().catch(() => null)
  return NextResponse.json(data, { status: res.status })
}