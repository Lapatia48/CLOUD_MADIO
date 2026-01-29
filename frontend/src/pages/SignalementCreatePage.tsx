import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { http, getApiErrorMessage } from '../api/http'
import { useAuth } from '../auth/AuthContext'
import type { EntrepriseResponse } from '../types/entreprise'
import type { SignalementCreateRequest, SignalementResponse } from '../types/signalement'

export default function SignalementCreatePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [description, setDescription] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [surfaceM2, setSurfaceM2] = useState('')
  const [budget, setBudget] = useState('')
  const [entreprises, setEntreprises] = useState<EntrepriseResponse[]>([])
  const [entreprisesLoading, setEntreprisesLoading] = useState(false)
  const [entreprisesError, setEntreprisesError] = useState<string | null>(null)
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchEntreprises() {
    setEntreprisesError(null)
    setEntreprisesLoading(true)
    try {
      const res = await http.get<EntrepriseResponse[]>('/api/entreprises')
      setEntreprises(res.data)
    } catch (err) {
      setEntreprisesError(getApiErrorMessage(err))
    } finally {
      setEntreprisesLoading(false)
    }
  }

  useEffect(() => {
    void fetchEntreprises()
  }, [])

  const canSubmit = useMemo(() => {
    if (!user) return false
    if (!latitude.trim() || !longitude.trim()) return false

    const lat = Number(latitude)
    const lng = Number(longitude)

    if (Number.isNaN(lat) || Number.isNaN(lng)) return false

    return true
  }, [user, latitude, longitude])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return

    setError(null)
    setLoading(true)

    try {
      const payload: SignalementCreateRequest = {
        description: description.trim() ? description.trim() : null,
        latitude: Number(latitude),
        longitude: Number(longitude),
        surfaceM2: surfaceM2.trim() ? Number(surfaceM2) : null,
        budget: budget.trim() ? Number(budget) : null,
        entrepriseId: selectedEntrepriseId.trim() ? Number(selectedEntrepriseId) : null,
        userId: user.id,
      }

      const res = await http.post<SignalementResponse>('/api/signalements', payload)
      navigate(`/user`, { replace: true })
      return res.data
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 16 }}>
      <h1>Nouveau signalement</h1>

      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <Link to="/user">← Retour</Link>
        <Link to="/map">Voir la carte</Link>
      </div>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            Latitude *
            <input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="ex: -18.9137" required />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            Longitude *
            <input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="ex: 47.5226" required />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            Surface (m²)
            <input value={surfaceM2} onChange={(e) => setSurfaceM2(e.target.value)} placeholder="ex: 120" />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            Budget
            <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="ex: 250000" />
          </label>
        </div>

        <label style={{ display: 'grid', gap: 6 }}>
          Entreprise (optionnel)
          <select
            value={selectedEntrepriseId}
            onChange={(e) => setSelectedEntrepriseId(e.target.value)}
            disabled={entreprisesLoading}
          >
            <option value="">Aucune</option>
            {entreprises.map((e) => (
              <option key={e.id} value={String(e.id)}>
                {e.nom}
              </option>
            ))}
          </select>
        </label>

        {entreprisesError ? <div style={{ color: 'crimson' }}>{entreprisesError}</div> : null}

        <button type="submit" disabled={loading || !canSubmit}>
          {loading ? 'Envoi...' : 'Créer'}
        </button>

        {error ? <div style={{ color: 'crimson' }}>{error}</div> : null}

        <div style={{ fontSize: 13, color: '#666' }}>
          Les champs obligatoires côté backend sont: latitude et longitude.
        </div>
      </form>
    </div>
  )
}
