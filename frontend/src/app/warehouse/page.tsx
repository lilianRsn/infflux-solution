import { MOCK_WAREHOUSE } from '@/lib/warehouse-data'
import WarehouseLayout from '@/components/warehouse/WarehouseLayout'

export default function WarehousePage() {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <WarehouseLayout warehouse={MOCK_WAREHOUSE} />
      </div>
    </main>
  )
}
