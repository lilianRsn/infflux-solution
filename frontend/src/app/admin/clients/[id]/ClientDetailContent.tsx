'use client'

import Link from 'next/link'
import { 
  Building2, 
  ArrowLeft, 
  MapPin, 
  Mail, 
  Calendar,
  Layers,
  LayoutGrid,
  ChevronRight,
  Package
} from 'lucide-react'
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
  client: ClientUser
  warehouses: any[]
  adminUser: User
}

export default function ClientDetailContent({ client, warehouses, adminUser }: Props) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={adminUser} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Link
          href="/admin/clients"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium"
        >
          <ArrowLeft size={16} />
          Retour à la liste des clients
        </Link>

        <div className="bg-white border border-slate-200 rounded-xl p-8 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-slate-200">
                {(client.company_name || '??').substring(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-900">{client.company_name || 'N/A'}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-sm text-slate-600 font-medium flex items-center gap-1.5">
                    <Mail size={14} className="text-slate-400" />
                    {client.main_contact_name} ({client.main_contact_email})
                  </span>
                  <span className="text-sm text-slate-500 flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-400" />
                    Inscrit le {client.created_at ? new Date(client.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-center min-w-[100px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Entrepôts</p>
                <p className="text-xl font-black text-slate-900">{warehouses.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <Building2 size={20} className="text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900">Entrepôts du client</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {warehouses.map((wh) => (
            <div key={wh.id} className="bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-200 transition-all group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{wh.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin size={12} />
                      {wh.address}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100 text-center">
                    <Layers size={14} className="text-slate-400 mx-auto mb-1" />
                    <p className="text-[10px] font-bold text-slate-900">{wh.floors_count} étage{wh.floors_count > 1 ? 's' : ''}</p>
                  </div>
                </div>

                <Link
                  href={`/warehouse/${wh.id}`} 
                  className="w-full h-10 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold rounded-lg transition-all group/btn border border-slate-200"
                >
                  Accéder à la vue 2D
                  <ChevronRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}

          {warehouses.length === 0 && (
            <div className="col-span-full py-12 bg-white border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center">
              <Building2 size={32} className="text-slate-200 mb-2" />
              <p className="text-slate-400 text-sm font-medium">Ce client n'a pas encore configuré d'entrepôt.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
