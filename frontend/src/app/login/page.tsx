'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Role = 'client' | 'admin' | 'partenaire'

const ROLE_CONFIG: Record<Role, {
  label: string
  color: string
  accent: string
  border: string
  icon: string
  hint: { email: string; password: string }
}> = {
  client: {
    label: 'Client',
    color: 'text-sky-400',
    accent: 'bg-sky-500 hover:bg-sky-400',
    border: 'border-sky-500/40 focus:border-sky-400',
    icon: '📦',
    hint: { email: 'client@demo.com', password: 'client123' },
  },
  admin: {
    label: 'Administrateur',
    color: 'text-violet-400',
    accent: 'bg-violet-600 hover:bg-violet-500',
    border: 'border-violet-500/40 focus:border-violet-400',
    icon: '⚙️',
    hint: { email: 'admin@infflux.com', password: 'admin123' },
  },
  partenaire: {
    label: 'Partenaire logistique',
    color: 'text-emerald-400',
    accent: 'bg-emerald-600 hover:bg-emerald-500',
    border: 'border-emerald-500/40 focus:border-emerald-400',
    icon: '🚛',
    hint: { email: 'partenaire@translog.com', password: 'partenaire123' },
  },
}

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [selectedRole, setSelectedRole] = useState<Role>('client')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const config = ROLE_CONFIG[selectedRole]

  function autofill() {
    setEmail(config.hint.email)
    setPassword(config.hint.password)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? 'Erreur de connexion')
          return
        }

        router.push(data.redirect)
      } catch {
        setError('Impossible de contacter le serveur')
      }
    })
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-violet-900/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-sky-900/15 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center font-black text-white text-sm">
              IF
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">Infflux</span>
          </div>
          <p className="text-zinc-500 text-sm">Plateforme logistique unifiée</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl p-8 shadow-2xl">

          {/* Sélecteur de rôle */}
          <div className="mb-7">
            <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3 font-medium">
              Vous êtes
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ROLE_CONFIG) as Role[]).map((role) => {
                const c = ROLE_CONFIG[role]
                const active = selectedRole === role
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role)
                      setEmail('')
                      setPassword('')
                      setError('')
                    }}
                    className={`
                      flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium
                      transition-all duration-200 cursor-pointer
                      ${active
                        ? `border-zinc-600 bg-zinc-800 ${c.color}`
                        : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                      }
                    `}
                  >
                    <span className="text-lg">{c.icon}</span>
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-xs uppercase tracking-widest mb-1.5 font-medium">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={config.hint.email}
                className={`
                  w-full bg-zinc-950 border rounded-xl px-4 py-3 text-white text-sm
                  placeholder:text-zinc-700 outline-none transition-colors duration-200
                  ${config.border}
                `}
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-xs uppercase tracking-widest mb-1.5 font-medium">
                Mot de passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`
                  w-full bg-zinc-950 border rounded-xl px-4 py-3 text-white text-sm
                  placeholder:text-zinc-700 outline-none transition-colors duration-200
                  ${config.border}
                `}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-950/60 border border-red-800/50 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className={`
                w-full py-3 rounded-xl text-white font-semibold text-sm
                transition-all duration-200 cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed
                ${config.accent}
              `}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Connexion…
                </span>
              ) : `Se connecter en tant que ${config.label}`}
            </button>
          </form>

          {/* Demo autofill */}
          <div className="mt-5 pt-5 border-t border-zinc-800">
            <p className="text-zinc-600 text-xs text-center mb-2">Mode démo hackathon</p>
            <button
              type="button"
              onClick={autofill}
              className="w-full text-zinc-500 hover:text-zinc-300 text-xs py-2 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
            >
              Remplir avec les identifiants {config.label}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-700 text-xs mt-6">
          Infflux © 2025 — Solution d'optimisation logistique
        </p>
      </div>
    </main>
  )
}
