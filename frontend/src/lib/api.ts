type LoginPayload = {
  email: string
  password: string
}

type LoginResponse = {
  user: {
    id: string
    email: string
    name: string
    role: 'admin' | 'client' | 'partenaire'
  }
  redirect: string
}

async function clientFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    ...init,
  })

  if (!response.ok) {
    let errorMessage = `Error: ${response.status} ${response.statusText}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.message || errorMessage
    } catch {}
    throw new Error(errorMessage)
  }

  return response.json() as Promise<T>
}

export function login(body: LoginPayload) {
  return clientFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getOrders() {
  return clientFetch('/api/orders')
}

export function getClients() {
  return clientFetch('/api/users/clients')
}

export function getWarehousesAvailability() {
  return clientFetch('/api/client-warehouses/availability')
}
