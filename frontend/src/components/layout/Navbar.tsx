'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { User } from '@/types/auth'

interface NavLink {
  href: string
  label: string
}

const ROLE_NAV: Record<string, NavLink[]> = {
  admin: [
    { href: '/admin/dashboard', label: 'Dashboard'  },
    { href: '/admin/flotte',    label: 'Flotte'      },
    { href: '/admin/clients',   label: 'Clients'     },
    { href: '/warehouse',       label: 'Entrepôts'   },
  ],
  client: [
    { href: '/client/commande', label: 'Commander' },
    { href: '/client/warehouses', label: 'Mes entrepôts' },
  ],
  partenaire: [
    { href: '/partenaire/dashboard', label: 'Dashboard' },
  ],
}

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  client: 'bg-slate-700 text-slate-100 border-slate-600',
  partenaire: 'bg-green-500/10 text-green-400 border-green-500/20',
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  client: 'Client',
  partenaire: 'Partenaire',
}

interface Props {
  readonly user: User
}

const ROLE_HOME: Record<string, string> = {
  admin: '/admin/dashboard',
  client: '/client/commande',
  partenaire: '/partenaire/dashboard',
}

export default function Navbar({ user }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const links = ROLE_NAV[user.role] ?? []
  const homeHref = ROLE_HOME[user.role] ?? '/'

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-slate-950 border-b border-slate-800 px-6 h-14 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href={homeHref} className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-md bg-violet-600 flex items-center justify-center font-black text-white text-xs">
            IF
          </div>
          <span className="font-semibold text-white tracking-tight">Infflux</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 h-8 inline-flex items-center rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-200 hover:text-white hover:bg-slate-900'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold border ${ROLE_BADGE[user.role]}`}>
            {ROLE_LABELS[user.role]}
          </span>
          <span className="text-sm text-slate-100 font-medium">{user.name}</span>
        </div>
        
        <div className="w-px h-4 bg-slate-800 mx-1" />

        <button
          onClick={handleLogout}
          className="text-xs text-slate-200 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
        >
          <span>Déconnexion</span>
        </button>
      </div>
    </nav>
  )
}
