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

type UserInfo = {
  userId: number;
  email: string;
  role: string;
  id_role?: number;
};

type Signalement = {
  id: number;
  description?: string;
  latitude: number;
  longitude: number;
  status: string;
  surfaceM2?: number | null;
  budget?: number | null;
  dateSignalement?: string;
  date_signalement?: string;
  entreprise?: { id: number; nom: string } | null;
  user?: { id: number; email: string; nom?: string; prenom?: string } | null;
};

const SignalementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [signalement, setSignalement] = useState<Signalement | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    description: '',
    status: '',
    surfaceM2: '',
    budget: '',
  });
  const [saving, setSaving] = useState(false);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.id_role === 3;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Erreur parsing user:', e);
      }
    }
    fetchSignalement();
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
          surfaceM2: data.surfaceM2?.toString() || '',
          budget: data.budget?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!signalement) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/signalements/${signalement.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          description: editForm.description,
          status: editForm.status,
          latitude: signalement.latitude,
          longitude: signalement.longitude,
          surfaceM2: editForm.surfaceM2 ? parseFloat(editForm.surfaceM2) : null,
          budget: editForm.budget ? parseFloat(editForm.budget) : null,
        }),
      });
      if (response.ok) {
        const updated = await response.json();
        setSignalement(updated);
        setIsEditing(false);
        alert('✅ Signalement modifié avec succès !');
      } else {
        alert('❌ Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de la modification');
    } finally {
      setSaving(false);
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
      case 'NOUVEAU': return '🔴 Nouveau';
      case 'EN_COURS': return '🟠 En cours';
      case 'TERMINE': return '🟢 Terminé';
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

  if (loading) {
    return <div className="detail-page"><div className="loading">⏳ Chargement...</div></div>;
  }

  if (!signalement) {
    return (
      <div className="detail-page">
        <div className="not-found">
          <h2>😕 Signalement non trouvé</h2>
          <button onClick={() => navigate('/')}>Retour à la carte</button>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <div className="detail-map">
        <MapContainer
          center={[signalement.latitude, signalement.longitude]}
          zoom={15}
          className="map"
          scrollWheelZoom={true}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* Cercle coloré pour visualiser la zone */}
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
          
          {/* Marqueur standard Leaflet */}
          <Marker position={[signalement.latitude, signalement.longitude]} />
        </MapContainer>
      </div>

      <div className="detail-panel">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Retour à la carte
        </button>

        <div className="detail-header">
          <span className="status-badge" style={{ background: getStatusColor(signalement.status) }}>
            {getStatusLabel(signalement.status)}
          </span>
          <h1>{signalement.description || 'Sans description'}</h1>
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
              <label>Budget estimé</label>
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
                <strong>{signalement.user.prenom} {signalement.user.nom}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Section Admin - Modification */}
        {isAdmin && (
          <div className="admin-section">
            <h3>🔧 Administration</h3>
            {!isEditing ? (
              <button className="btn-edit" onClick={() => setIsEditing(true)}>
                ✏️ Modifier le signalement
              </button>
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
                  <label>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="NOUVEAU">🔴 Nouveau</option>
                    <option value="EN_COURS">🟠 En cours</option>
                    <option value="TERMINE">🟢 Terminé</option>
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SignalementDetailPage;
