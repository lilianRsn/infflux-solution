'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, Building2, ExternalLink, Search, Mail } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import type { User } from '@/types/auth'

interface ClientUser {
  id: string
  company_name: string
  main_contact_name: string
  main_contact_email: string
  warehouse_count?: number
  created_at: string
}

interface Props {
  initialClients: ClientUser[]
  adminUser: User
}

export default function ClientsContent({ initialClients, adminUser }: Props) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredClients = initialClients.filter(c => 
    (c.company_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (c.main_contact_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={adminUser} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="text-blue-600" size={24} />
              Gestion des clients
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Consultez et gérez l'ensemble des clients utilisant la plateforme.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg h-10 pl-10 pr-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Entreprise</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contact Principal</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Entrepôts</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date d'inscription</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-100">
                        {(client.company_name || '??').substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-900 text-sm">{client.company_name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-700 font-medium">{client.main_contact_name || 'N/A'}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Mail size={12} />
                        {client.main_contact_email || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={14} className="text-slate-400" />
                      <span className="text-sm font-bold text-slate-700">{client.warehouse_count ?? 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                    {client.created_at ? new Date(client.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all border border-slate-200 hover:border-blue-200 shadow-sm"
                    >
                      Détails
                      <ExternalLink size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredClients.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-slate-300" />
              </div>
              <p className="text-slate-400 text-sm font-medium">Aucun client ne correspond à votre recherche.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
