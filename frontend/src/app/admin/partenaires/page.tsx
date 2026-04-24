import React from 'react';
import { Truck, Zap, Info, CheckCircle2, ChevronRight } from 'lucide-react';

export default function AssignOrderModalMockup() {
  return (
    // Overlay simulé pour la maquette
    <div className="min-h-screen bg-slate-900/40 flex items-center justify-center p-4 font-sans text-slate-900">
      
      {/* Conteneur principal (Modale) */}
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden">
        
        {/* Header de la modale */}
        <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Attribution de commande</h2>
            <p className="text-sm text-slate-500 font-mono mt-0.5">CMD-892A4 • Réf: IDF_NORD</p>
          </div>
          <div className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-1 rounded text-xs font-medium uppercase tracking-wide">
            En attente
          </div>
        </div>

        <div className="p-5 space-y-6">
          
          {/* Section 1 : Vérification Capacité Client */}
          <section className="space-y-3">
            <h3 className="text-[15px] font-medium text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Capacité chez le client (Destinataire)
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center justify-between">
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="block text-xs text-slate-500 mb-0.5">Volume commande</span>
                  <span className="font-semibold text-slate-900">8.4 m³</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 mb-0.5">Entrepôt principal</span>
                  <span className="text-slate-900">Saint-Denis (Hub IDF_NORD)</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 mb-0.5">Dispo. projetée</span>
                  <span className="font-semibold text-green-700">42.0 m³</span>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-200" />

          {/* Section 2 : Opportunité Partenaire (La fameuse idée) */}
          <section className="space-y-3">
            <h3 className="text-[15px] font-medium text-slate-900">Choix du transporteur</h3>
            
            {/* LA CARTE PARTENAIRE (Effet "Wow" pour la démo) */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 relative overflow-hidden">
              {/* Petit accent visuel sur le bord gauche */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
              
              <div className="flex items-start gap-3">
                <div className="mt-0.5 bg-blue-100 p-1.5 rounded-md text-blue-700">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900">Opportunité de co-chargement</h4>
                      <p className="text-xs text-blue-800/80 mt-0.5">
                        Une tournée partenaire correspond à vos critères de livraison.
                      </p>
                    </div>
                    <span className="bg-white border border-blue-200 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                      MATCH LOGISTIQUE
                    </span>
                  </div>
                  
                  <div className="mt-3 bg-white/60 rounded border border-blue-100 p-2.5 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-slate-900">Transports Dubois (Partenaire)</span>
                      <span className="text-xs text-slate-600 flex items-center gap-1">
                        <span style={{ backgroundColor: 'red' }} className="w-3 h-3" /> En transit vers IDF_NORD aujourd'hui
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-slate-500 mb-0.5">Capacité restante</span>
                      <span className="text-sm font-semibold text-blue-700">14.0 m³</span>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 rounded text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm">
                      Sous-traiter à ce partenaire <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Choix Flotte Interne (Le choix par défaut si on ignore le partenaire) */}
            <div className="mt-4 pt-2">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Ou utiliser la flotte interne</label>
              <div className="flex gap-2">
                <select className="flex-1 h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600">
                  <option value="">Sélectionner un véhicule disponible...</option>
                  <option value="v1">Camion FR-123-AB (Capacité: 20m³) - Dépôt Nord</option>
                  <option value="v2">Fourgonnette AB-456-CD (Capacité: 12m³) - Dépôt Paris</option>
                </select>
                <button className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 h-9 px-4 rounded-md text-sm font-medium transition-colors">
                  Attribuer
                </button>
              </div>
            </div>

          </section>

        </div>
      </div>
    </div>
  );
}