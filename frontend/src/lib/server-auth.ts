import { cookies } from 'next/headers'
import type { User } from '@/types/auth'

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('infflux_token')?.value
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { user?: User }
    return decoded.user ?? null
  } catch {
    return null
  }
}
