'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, ExternalLink, Search, Mail, ShoppingCart } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import type { User } from '@/types/auth'

interface ClientUser {
  id: string
  company_name: string
  main_contact_name: string
  main_contact_email: string
  order_count: number
  created_at: string
}

interface Props {
  initialClients: ClientUser[]
  adminUser: User
}

export default function ClientsContent({ initialClients, adminUser }: Props) {
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = initialClients.filter((c) =>
    (c.company_name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (c.main_contact_name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (c.main_contact_email?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={adminUser} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Clients</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {initialClients.length} client{initialClients.length > 1 ? 's' : ''} enregistré{initialClients.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg h-9 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-6 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Entreprise</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Commandes</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Inscrit le</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs shrink-0">
                        {(client.company_name ?? '??').substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {client.company_name ?? 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700 font-medium">{client.main_contact_name ?? 'N/A'}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Mail size={11} />
                      {client.main_contact_email ?? 'N/A'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <ShoppingCart size={13} className="text-slate-400" />
                      <span className="text-sm font-semibold text-slate-900">{client.order_count}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {client.created_at
                      ? new Date(client.created_at).toLocaleDateString('fr-FR')
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="inline-flex items-center gap-1.5 px-3 h-7 text-xs font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md border border-slate-200 hover:border-blue-200 transition-all"
                    >
                      Détails
                      <ExternalLink size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Users size={28} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Aucun client ne correspond à la recherche.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
