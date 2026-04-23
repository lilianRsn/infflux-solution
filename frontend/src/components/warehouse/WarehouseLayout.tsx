'use client'

import { useState } from 'react'
import type { ClientWarehouse } from '@/lib/warehouse-data'
import InteriorTab from './InteriorTab'
import ExteriorTab from './ExteriorTab'

type Tab = 'interior' | 'exterior'

const TABS: { id: Tab; label: string }[] = [
  { id: 'interior', label: 'Intérieur' },
  { id: 'exterior', label: 'Extérieur' },
]

export default function WarehouseLayout({ warehouse }: { warehouse: ClientWarehouse }) {
  const [activeTab, setActiveTab] = useState<Tab>('interior')

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{warehouse.name}</h2>
        <p className="text-sm text-slate-500">{warehouse.address}</p>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-slate-800 text-slate-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'interior' ? (
        <InteriorTab warehouse={warehouse} />
      ) : (
        <ExteriorTab warehouse={warehouse} />
      )}
    </div>
  )
}
