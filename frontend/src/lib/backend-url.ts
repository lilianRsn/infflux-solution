const DEFAULT_BACKEND_URL = 'http://localhost:3001'

export function getBackendUrl() {
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_BACKEND_URL
  )
}
