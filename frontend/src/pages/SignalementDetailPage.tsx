import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import '../assets/css/SignalementDetail.css';

// Fix Leaflet icons
const defaultIconPrototype = L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void };
if (defaultIconPrototype._getIconUrl) delete defaultIconPrototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type Entreprise = { 
  id: number; 
  nom: string;
  adresse?: string;
  telephone?: string;
};

type Signalement = {
  id: number;
  description?: string;
  latitude: number;
  longitude: number;
  status: string;
  avancement?: number;
  surfaceM2?: number | null;
  budget?: number | null;
  photoBase64?: string;
  photoUrl?: string;
  dateSignalement?: string;
  date_signalement?: string;
  entreprise?: Entreprise | null;
  id_entreprise?: number | null;
  user?: { id: number; email: string; nom?: string; prenom?: string } | null;
  firebaseDocId?: string;
};

const SignalementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [signalement, setSignalement] = useState<Signalement | null>(null);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncingFirebase, setSyncingFirebase] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [editForm, setEditForm] = useState({
    description: '',
    status: 'NOUVEAU',
    avancement: 0,
    surfaceM2: '',
    budget: '',
    idEntreprise: '' as string | number,
  });

  useEffect(() => {
    fetchSignalement();
    fetchEntreprises();
  }, [id]);

  const fetchSignalement = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/signalements/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSignalement(data);
        setEditForm({
          description: data.description || '',
          status: data.status || 'NOUVEAU',
          avancement: data.avancement ?? getAvancementFromStatus(data.status),
          surfaceM2: data.surfaceM2?.toString() || '',
          budget: data.budget?.toString() || '',
          idEntreprise: data.entreprise?.id || data.id_entreprise || '',
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntreprises = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/entreprises');
      if (response.ok) {
        const data = await response.json();
        setEntreprises(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erreur chargement entreprises:', error);
    }
  };

  const getAvancementFromStatus = (status: string): number => {
    switch (status) {
      case 'NOUVEAU': return 0;
      case 'EN_COURS': return 50;
      case 'TERMINE': return 100;
      default: return 0;
    }
  };

  const getStatusFromAvancement = (avancement: number): string => {
    if (avancement === 0) return 'NOUVEAU';
    if (avancement === 100) return 'TERMINE';
    return 'EN_COURS';
  };

  const handleAvancementChange = (value: number) => {
    setEditForm({
      ...editForm,
      avancement: value,
      status: getStatusFromAvancement(value),
    });
  };

  const handleSaveEdit = async () => {
    if (!signalement) return;
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('managerToken');
      
      // Sauvegarder dans PostgreSQL
      const response = await fetch(`http://localhost:8080/api/signalements/${signalement.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          description: editForm.description,
          status: editForm.status,
          avancement: editForm.avancement,
          latitude: signalement.latitude,
          longitude: signalement.longitude,
          surfaceM2: editForm.surfaceM2 ? parseFloat(editForm.surfaceM2) : null,
          budget: editForm.budget ? parseFloat(editForm.budget) : null,
          idEntreprise: editForm.idEntreprise ? Number(editForm.idEntreprise) : null,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setSignalement(updated);
        setIsEditing(false);
        setMessage({ type: 'success', text: '✅ Signalement mis à jour dans PostgreSQL!' });
        
        // Rafraîchir les données
        await fetchSignalement();
      } else {
        setMessage({ type: 'error', text: '❌ Erreur lors de la modification' });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({ type: 'error', text: '❌ Erreur de connexion' });
    } finally {
      setSaving(false);
    }
  };

  // Synchroniser vers Firebase (pour que le mobile voie les mises à jour)
  const syncToFirebase = async () => {
    if (!signalement) return;
    setSyncingFirebase(true);
    setMessage(null);

    try {
      const response = await fetch(`http://localhost:8080/api/firebase/sync/signalement/${signalement.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setMessage({ type: 'success', text: '🔥 Synchronisé vers Firebase! Les utilisateurs mobiles verront les mises à jour.' });
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: `❌ Erreur: ${error}` });
      }
    } catch (error) {
      console.error('Erreur sync Firebase:', error);
      setMessage({ type: 'error', text: '❌ Erreur de connexion à Firebase' });
    } finally {
      setSyncingFirebase(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOUVEAU': return '#e74c3c';
      case 'EN_COURS': return '#f39c12';
      case 'TERMINE': return '#27ae60';
      default: return '#3498db';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NOUVEAU': return '🔴 Nouveau (0%)';
      case 'EN_COURS': return '🟠 En cours (50%)';
      case 'TERMINE': return '🟢 Terminé (100%)';
      default: return status;
    }
  };

  const formatDate = (dateStr?: string) => {
    const d = dateStr || signalement?.date_signalement;
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Récupérer la photo (base64 ou URL)
  const getPhotoSrc = (): string | null => {
    if (signalement?.photoBase64) {
      // Si c'est déjà une data URL complète
      if (signalement.photoBase64.startsWith('data:')) {
        return signalement.photoBase64;
      }
      // Sinon, ajouter le préfixe
      return `data:image/jpeg;base64,${signalement.photoBase64}`;
    }
    if (signalement?.photoUrl) {
      return signalement.photoUrl;
    }
    return null;
  };

  if (loading) {
    return <div className="detail-page"><div className="loading">⏳ Chargement...</div></div>;
  }

  if (!signalement) {
    return (
      <div className="detail-page">
        <div className="not-found">
          <h2>😕 Signalement non trouvé</h2>
          <button onClick={() => navigate('/manager')}>Retour à la carte</button>
        </div>
      </div>
    );
  }

  const photoSrc = getPhotoSrc();

  return (
    <div className="detail-page">
      {/* Carte à gauche */}
      <div className="detail-map">
        <MapContainer
          center={[signalement.latitude, signalement.longitude]}
          zoom={15}
          className="map"
          scrollWheelZoom={true}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          <Circle
            center={[signalement.latitude, signalement.longitude]}
            radius={50}
            pathOptions={{
              color: getStatusColor(signalement.status),
              fillColor: getStatusColor(signalement.status),
              fillOpacity: 0.3,
              weight: 3,
            }}
          />
          
          <Marker position={[signalement.latitude, signalement.longitude]} />
        </MapContainer>

        {/* Photo du signalement (si disponible) */}
        {photoSrc && (
          <div className="photo-section">
            <h4>📷 Photo du problème</h4>
            <img src={photoSrc} alt="Photo du signalement" className="signalement-photo" />
          </div>
        )}
      </div>

      {/* Panel de détails à droite */}
      <div className="detail-panel">
        <button className="btn-back" onClick={() => navigate('/manager')}>
          ← Retour à la carte
        </button>

        {/* Message */}
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
            <button className="close-btn" onClick={() => setMessage(null)}>×</button>
          </div>
        )}

        <div className="detail-header">
          <span className="status-badge" style={{ background: getStatusColor(signalement.status) }}>
            {getStatusLabel(signalement.status)}
          </span>
          <h1>{signalement.description || 'Sans description'}</h1>
        </div>

        {/* Barre de progression */}
        <div className="progress-section">
          <label>Avancement</label>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${signalement.avancement ?? editForm.avancement}%`,
                backgroundColor: getStatusColor(signalement.status)
              }}
            />
          </div>
          <span className="progress-label">{signalement.avancement ?? editForm.avancement}%</span>
        </div>

        <div className="detail-info">
          <div className="info-card">
            <span className="info-icon">📅</span>
            <div>
              <label>Date de signalement</label>
              <strong>{formatDate(signalement.dateSignalement)}</strong>
            </div>
          </div>

          <div className="info-card">
            <span className="info-icon">📐</span>
            <div>
              <label>Surface</label>
              <strong>{signalement.surfaceM2 ? `${signalement.surfaceM2} m²` : 'Non renseignée'}</strong>
            </div>
          </div>

          <div className="info-card">
            <span className="info-icon">💰</span>
            <div>
              <label>Budget</label>
              <strong>{signalement.budget ? `${signalement.budget.toLocaleString()} Ar` : 'Non renseigné'}</strong>
            </div>
          </div>

          <div className="info-card">
            <span className="info-icon">🏢</span>
            <div>
              <label>Entreprise assignée</label>
              <strong>{signalement.entreprise?.nom || 'Aucune'}</strong>
            </div>
          </div>

          <div className="info-card">
            <span className="info-icon">📍</span>
            <div>
              <label>Coordonnées GPS</label>
              <strong>{signalement.latitude.toFixed(6)}, {signalement.longitude.toFixed(6)}</strong>
            </div>
          </div>

          {signalement.user && (
            <div className="info-card">
              <span className="info-icon">👤</span>
              <div>
                <label>Signalé par</label>
                <strong>{signalement.user.email}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Section Manager - Modification */}
        <div className="manager-section">
          <h3>🔧 Gestion du signalement</h3>
          
          {!isEditing ? (
            <div className="manager-actions">
              <button className="btn-edit" onClick={() => setIsEditing(true)}>
                ✏️ Modifier
              </button>
              <button 
                className="btn-firebase" 
                onClick={syncToFirebase}
                disabled={syncingFirebase}
              >
                {syncingFirebase ? '⏳ Sync...' : '🔥 Sync vers Firebase'}
              </button>
            </div>
          ) : (
            <div className="edit-form">
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Avancement</label>
                <div className="avancement-buttons">
                  <button 
                    type="button"
                    className={`avancement-btn ${editForm.avancement === 0 ? 'active nouveau' : ''}`}
                    onClick={() => handleAvancementChange(0)}
                  >
                    🔴 Nouveau (0%)
                  </button>
                  <button 
                    type="button"
                    className={`avancement-btn ${editForm.avancement === 50 ? 'active en-cours' : ''}`}
                    onClick={() => handleAvancementChange(50)}
                  >
                    🟠 En cours (50%)
                  </button>
                  <button 
                    type="button"
                    className={`avancement-btn ${editForm.avancement === 100 ? 'active termine' : ''}`}
                    onClick={() => handleAvancementChange(100)}
                  >
                    🟢 Terminé (100%)
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Entreprise responsable</label>
                <select
                  value={editForm.idEntreprise}
                  onChange={(e) => setEditForm({ ...editForm, idEntreprise: e.target.value })}
                >
                  <option value="">-- Sélectionner une entreprise --</option>
                  {entreprises.map((e) => (
                    <option key={e.id} value={e.id}>{e.nom}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Surface (m²)</label>
                  <input
                    type="number"
                    value={editForm.surfaceM2}
                    onChange={(e) => setEditForm({ ...editForm, surfaceM2: e.target.value })}
                    placeholder="Ex: 150"
                  />
                </div>
                <div className="form-group">
                  <label>Budget (Ar)</label>
                  <input
                    type="number"
                    value={editForm.budget}
                    onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                    placeholder="Ex: 500000"
                  />
                </div>
              </div>

              <div className="edit-actions">
                <button className="btn-save" onClick={handleSaveEdit} disabled={saving}>
                  {saving ? '⏳ Enregistrement...' : '💾 Enregistrer'}
                </button>
                <button className="btn-cancel" onClick={() => setIsEditing(false)}>
                  ❌ Annuler
                </button>
              </div>

              <p className="sync-hint">
                💡 Après enregistrement, cliquez sur "Sync vers Firebase" pour notifier les utilisateurs mobiles
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignalementDetailPage;
