'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  ShieldCheck, 
  Truck, 
  Mail, 
  Lock, 
  ArrowRight,
  Loader2,
  Info
} from 'lucide-react'

type Role = 'client' | 'admin' | 'partenaire'

const ROLE_CONFIG: Record<Role, { 
  label: string; 
  icon: React.ElementType;
  activeClass: string;
  hint: { email: string; password: string } 
}> = {
  client: {
    label: 'Client',
    icon: User,
    activeClass: 'border-slate-600 bg-slate-900 text-white',
    hint: { email: 'marchand-a@example.com', password: 'Pass1234!' },
  },
  admin: {
    label: 'Admin',
    icon: ShieldCheck,
    activeClass: 'border-blue-700 bg-blue-600 text-white',
    hint: { email: 'admin@infflux.com', password: 'admin123' },
  },
  partenaire: {
    label: 'Partenaire',
    icon: Truck,
    activeClass: 'border-green-700 bg-green-600 text-white',
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
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-violet-100/50 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[400px]">
        {/* Logo & Welcome */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center font-black text-white text-base shadow-sm group-hover:scale-105 transition-transform">
              IF
            </div>
            <span className="font-bold text-slate-900 text-2xl tracking-tight">Infflux</span>
          </div>
          <h1 className="text-slate-900 text-xl font-semibold mb-1">Bon retour parmi nous</h1>
          <p className="text-slate-500 text-sm">Identifiez-vous pour accéder à votre espace</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
          {/* Sélecteur de rôle */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Type de compte</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ROLE_CONFIG) as Role[]).map((role) => {
                const Icon = ROLE_CONFIG[role].icon
                const isActive = selectedRole === role
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { setSelectedRole(role); setEmail(''); setPassword(''); setError('') }}
                    className={`flex flex-col items-center gap-2 py-3 px-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? ROLE_CONFIG[role].activeClass
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    {ROLE_CONFIG[role].label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-slate-600 font-medium ml-1">
                <Mail size={14} className="text-slate-400" />
                Adresse email
              </label>
              <div className="relative group">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={config.hint.email}
                  className="w-full bg-white border border-slate-300 rounded-lg h-10 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <Lock size={14} className="text-slate-400" />
                  Mot de passe
                </label>
              </div>
              <div className="relative group">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-300 rounded-lg h-10 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 text-red-800 text-xs font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all disabled:bg-slate-400 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Connexion {config.label}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Demo autofill */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={autofill}
              className="w-full text-slate-500 hover:text-slate-900 text-xs h-9 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer font-medium flex items-center justify-center gap-2"
            >
              <Info size={14} />
              Identifiants de démonstration
            </button>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-8">
          &copy; 2026 Infflux &bull; Optimisation logistique intelligente
        </p>
      </div>
    </main>
  )
}
