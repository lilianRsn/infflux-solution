import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/server-auth'
import Navbar from '@/components/layout/Navbar'
import type { User } from '@/types/auth'

interface PageCard {
  href: string
  title: string
  description: string
  tag: string
}

function getRoleConfig(user: User): { subtitle: string; cards: PageCard[] } {
  switch (user.role) {
    case 'admin':
      return {
        subtitle: "Vue d'ensemble de la plateforme",
        cards: [
          {
            href: '/admin/dashboard',
            title: 'Dashboard',
            description: 'Vue globale des opérations, tournées, planification et reporting.',
            tag: 'Administration',
          },
          {
            href: '/warehouse',
            title: 'Entrepôts clients',
            description: 'Visualisation de la capacité de stockage et des docks de déchargement.',
            tag: 'Visualisation',
          },
        ],
      }
    case 'client':
      return {
        subtitle: 'Gérez vos commandes et votre espace de stockage',
        cards: [
          {
            href: '/client/commande',
            title: 'Passer une commande',
            description: 'Créez une nouvelle commande et choisissez vos options de livraison.',
            tag: 'Commandes',
          },
          {
            href: '/client/warehouses',
            title: 'Mes entrepôts',
            description: 'Gérez et visualisez vos espaces de stockage et docks de déchargement.',
            tag: 'Entrepôt',
          },
        ],
      }
    case 'partenaire':
      return {
        subtitle: 'Consultez vos tournées et capacités disponibles',
        cards: [
          {
            href: '/partenaire/dashboard',
            title: 'Dashboard',
            description: 'Déclarez vos tournées et consultez les affectations de colis.',
            tag: 'Partenaire',
          },
        ],
      }
  }
}

export default async function HomePage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const { subtitle, cards } = getRoleConfig(user)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="max-w-4xl mx-auto px-6 pt-14 pb-12">
        <div className="mb-10">
          <p className="text-sm text-slate-500 mb-1">Bonjour, {user.name}</p>
          <h1 className="text-2xl font-semibold text-slate-900">{subtitle}</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  {card.tag}
                </span>
                <span className="text-slate-300 group-hover:text-slate-500 transition-colors text-base leading-none">
                  →
                </span>
              </div>
              <h2 className="text-base font-semibold text-slate-900 mb-1.5">{card.title}</h2>
              <p className="text-sm text-slate-500 leading-relaxed">{card.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
