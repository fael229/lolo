import React from 'react'

export default function AdminSettings() {
  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="section-title text-2xl">Paramètres</h1>
          <p className="section-subtitle">Gérez les paramètres de votre plateforme</p>
        </div>
      </div>
      
      <div className="card">
        <h2 className="font-sora font-bold text-slate-900 mb-4">Préférences générales</h2>
        <div className="space-y-4">
          <div>
            <label className="input-label">Nom de la plateforme</label>
            <input type="text" className="input max-w-md" defaultValue="ImmoGest" />
          </div>
          <div>
            <label className="input-label">Devise par défaut</label>
            <select className="select max-w-md">
              <option value="FCFA">FCFA</option>
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dollar ($)</option>
            </select>
          </div>
          <button className="btn-primary mt-4">Enregistrer les modifications</button>
        </div>
      </div>
    </div>
  )
}
