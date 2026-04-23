import { NextRequest } from 'next/server'
import { proxyToBackend } from '@/lib/proxy'

export function POST(req: NextRequest) { return proxyToBackend(req, '/api/delivery-plans/generate') }