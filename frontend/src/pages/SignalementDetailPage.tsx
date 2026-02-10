import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

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

  // Niveau signalement
  const [niveauValue, setNiveauValue] = useState<number>(5);
  const [niveauExistant, setNiveauExistant] = useState<{ niveau: number } | null>(null);
  const [savingNiveau, setSavingNiveau] = useState(false);

  // Prix metre carre
  const [prixMetreCarre, setPrixMetreCarre] = useState<number | null>(null);

  useEffect(() => {
    fetchSignalement();
    fetchEntreprises();
    fetchNiveau();
    fetchPrixMetreCarre();
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

  const fetchNiveau = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/niveau-signalement/signalement/${id}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.niveau) {
          setNiveauExistant(data);
          setNiveauValue(data.niveau);
        }
      }
    } catch (error) {
      console.error('Erreur chargement niveau:', error);
    }
  };

  const fetchPrixMetreCarre = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/prix-metre-carre/current');
      if (response.ok) {
        const data = await response.json();
        if (data && data.prix) {
          setPrixMetreCarre(parseFloat(data.prix));
        }
      }
    } catch (error) {
      console.error('Erreur chargement prix metre carre:', error);
    }
  };

  const handleSaveNiveau = async () => {
    if (!signalement || niveauExistant) return;
    setSavingNiveau(true);
    setMessage(null);
    try {
      const response = await fetch('http://localhost:8080/api/niveau-signalement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idSignalement: signalement.id,
          niveau: niveauValue,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setNiveauExistant(data);
        setMessage({ type: 'success', text: 'Niveau ' + niveauValue + ' attribue avec succes !' });
      } else {
        const errText = await response.text();
        setMessage({ type: 'error', text: errText || 'Erreur lors de l\'attribution du niveau' });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setSavingNiveau(false);
    }
  };

  // Calcul automatique du budget
  const calculatedBudget = (() => {
    const surface = editForm.surfaceM2 ? parseFloat(editForm.surfaceM2) : null;
    if (surface && prixMetreCarre) {
      return surface * prixMetreCarre;
    }
    return null;
  })();

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
        setMessage({ type: 'success', text: 'Signalement mis a jour dans PostgreSQL !' });
        await fetchSignalement();
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la modification' });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setSaving(false);
    }
  };

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
        setMessage({ type: 'success', text: 'Synchronise vers Firebase !' });
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: 'Erreur : ' + error });
      }
    } catch (error) {
      console.error('Erreur sync Firebase:', error);
      setMessage({ type: 'error', text: 'Erreur de connexion a Firebase' });
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
      case 'NOUVEAU': return 'Nouveau (0%)';
      case 'EN_COURS': return 'En cours (50%)';
      case 'TERMINE': return 'Termine (100%)';
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

  const getPhotoSrc = (): string | null => {
    if (signalement?.photoBase64) {
      if (signalement.photoBase64.startsWith('data:')) {
        return signalement.photoBase64;
      }
      return `data:image/jpeg;base64,${signalement.photoBase64}`;
    }
    if (signalement?.photoUrl) {
      return signalement.photoUrl;
    }
    return null;
  };

  if (loading) {
    return <div className="detail-page-wrapper"><div className="loading">Chargement...</div></div>;
  }

  if (!signalement) {
    return (
      <div className="detail-page-wrapper">
        <div className="not-found">
          <h2>Signalement non trouve</h2>
          <button onClick={() => navigate('/manager')}>Retour a la carte</button>
        </div>
      </div>
    );
  }

  const photoSrc = getPhotoSrc();

  return (
    <div className="detail-page-wrapper">
      <div className="detail-page-container">
        <div className="detail-map">
          <MapContainer
            center={[signalement.latitude, signalement.longitude]}
            zoom={15}
            className="map"
            style={{ height: '100%', width: '100%' }}
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

          {photoSrc && (
            <div className="photo-section">
              <h4>Photo du probleme</h4>
              <img src={photoSrc} alt="Photo du signalement" className="signalement-photo" />
            </div>
          )}
        </div>

        <div className="detail-panel">
          <button className="btn-back" onClick={() => navigate('/manager')}>
            &#8592; Retour a la carte
          </button>

          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
              <button className="close-btn" onClick={() => setMessage(null)}>&#215;</button>
            </div>
          )}

          <div className="detail-header">
            <span className="status-badge" style={{ background: getStatusColor(signalement.status) }}>
              {getStatusLabel(signalement.status)}
            </span>
            <h1>{signalement.description || 'Sans description'}</h1>
          </div>

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
              <span className="info-icon"></span>
              <div>
                <label>Date de signalement</label>
                <strong>{formatDate(signalement.dateSignalement)}</strong>
              </div>
            </div>

            <div className="info-card">
              <span className="info-icon"></span>
              <div>
                <label>Surface</label>
                <strong>{signalement.surfaceM2 ? `${signalement.surfaceM2} m2` : 'Non renseignee'}</strong>
              </div>
            </div>

            <div className="info-card">
              <span className="info-icon"></span>
              <div>
                <label>Budget</label>
                <strong>{signalement.budget ? `${signalement.budget.toLocaleString()} Ar` : 'Non renseigne'}</strong>
              </div>
            </div>

            <div className="info-card">
              <span className="info-icon"></span>
              <div>
                <label>Entreprise assignee</label>
                <strong>{signalement.entreprise?.nom || 'Aucune'}</strong>
              </div>
            </div>

            <div className="info-card">
              <span className="info-icon"></span>
              <div>
                <label>Coordonnees GPS</label>
                <strong>{signalement.latitude.toFixed(6)}, {signalement.longitude.toFixed(6)}</strong>
              </div>
            </div>

            {signalement.user && (
              <div className="info-card">
                <span className="info-icon"></span>
                <div>
                  <label>Signale par</label>
                  <strong>{signalement.user.email}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="manager-section">
            <h3>Gestion du signalement</h3>
            
            {!isEditing ? (
              <div className="manager-actions">
                <button className="btn-edit" onClick={() => setIsEditing(true)}>
                  Modifier
                </button>
                <button 
                  className="btn-firebase" 
                  onClick={syncToFirebase}
                  disabled={syncingFirebase}
                >
                  {syncingFirebase ? 'Sync...' : 'Sync vers Firebase'}
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
                      Nouveau (0%)
                    </button>
                    <button 
                      type="button"
                      className={`avancement-btn ${editForm.avancement === 50 ? 'active en-cours' : ''}`}
                      onClick={() => handleAvancementChange(50)}
                    >
                      En cours (50%)
                    </button>
                    <button 
                      type="button"
                      className={`avancement-btn ${editForm.avancement === 100 ? 'active termine' : ''}`}
                      onClick={() => handleAvancementChange(100)}
                    >
                      Termine (100%)
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Entreprise responsable</label>
                  <select
                    value={editForm.idEntreprise}
                    onChange={(e) => setEditForm({ ...editForm, idEntreprise: e.target.value })}
                  >
                    <option value="">-- Selectionner une entreprise --</option>
                    {entreprises.map((e) => (
                      <option key={e.id} value={e.id}>{e.nom}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Surface (m2)</label>
                    <input
                      type="number"
                      value={editForm.surfaceM2}
                      onChange={(e) => {
                        const newSurface = e.target.value;
                        const surfaceNum = newSurface ? parseFloat(newSurface) : null;
                        const autoBudget = (surfaceNum && prixMetreCarre) ? (surfaceNum * prixMetreCarre).toString() : '';
                        setEditForm({ ...editForm, surfaceM2: newSurface, budget: autoBudget });
                      }}
                      placeholder="Ex: 150"
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      {'Budget (Ar) '}
                      {prixMetreCarre ? '- auto: surface x ' + prixMetreCarre.toLocaleString() + ' Ar/m2' : ''}
                    </label>
                    <input
                      type="number"
                      value={editForm.budget}
                      onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                      placeholder="Ex: 500000"
                    />
                    {calculatedBudget !== null && (
                      <small style={{ color: '#7f8c8d', marginTop: 4 }}>
                        Budget calcule : {calculatedBudget.toLocaleString()} Ar
                      </small>
                    )}
                  </div>
                </div>

                <div className="edit-actions">
                  <button className="btn-save" onClick={handleSaveEdit} disabled={saving}>
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button className="btn-cancel" onClick={() => setIsEditing(false)}>
                    Annuler
                  </button>
                </div>

                <p className="sync-hint">
                  Apres enregistrement, cliquez sur Sync vers Firebase pour notifier les utilisateurs mobiles
                </p>
              </div>
            )}

            {/* Section Niveau */}
            <div className="niveau-section" style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#fff', borderRadius: 12, border: '1px solid rgba(74,144,226,0.12)' }}>
              <h3 style={{ marginBottom: '1rem' }}>Niveau du signalement</h3>
              {niveauExistant ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: 60, height: 60, borderRadius: '50%',
                      background: 'hsl(' + ((10 - niveauExistant.niveau) * 12) + ', 80%, 50%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 700, fontSize: '1.5rem'
                    }}>
                      {niveauExistant.niveau}
                    </div>
                    <div>
                      <strong>Niveau {niveauExistant.niveau}/10</strong>
                      <p style={{ color: '#7f8c8d', margin: 0, fontSize: '0.85rem' }}>
                        Le niveau a deja ete attribue et ne peut plus etre modifie.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', marginBottom: 8 }}>Attribuer un niveau (1 = mineur, 10 = critique)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: 600, minWidth: 20 }}>1</span>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={niveauValue}
                      onChange={(e) => setNiveauValue(parseInt(e.target.value))}
                      style={{ flex: 1, accentColor: 'hsl(' + ((10 - niveauValue) * 12) + ', 80%, 50%)' }}
                    />
                    <span style={{ fontWeight: 600, minWidth: 20 }}>10</span>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'hsl(' + ((10 - niveauValue) * 12) + ', 80%, 50%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 700, fontSize: '1.2rem'
                    }}>
                      {niveauValue}
                    </div>
                  </div>
                  <button
                    onClick={handleSaveNiveau}
                    disabled={savingNiveau}
                    style={{
                      marginTop: 12, padding: '0.6rem 1.5rem',
                      background: 'linear-gradient(135deg, #4A90E2, #6AA8F4)',
                      color: '#fff', border: 'none', borderRadius: 10,
                      fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem'
                    }}
                  >
                    {savingNiveau ? 'Enregistrement...' : 'Attribuer le niveau'}
                  </button>
                  <p style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: 6 }}>
                    Attention : le niveau ne peut etre attribue qu une seule fois.
                  </p>
                </div>
              )}
            </div>

            {/* Lien Photos et Niveau */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button
                onClick={() => navigate('/signalement/' + id + '/photos-niveau')}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'linear-gradient(135deg, #8E44AD, #9B59B6)',
                  color: '#fff', border: 'none', borderRadius: 10,
                  fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem',
                  boxShadow: '0 2px 8px rgba(142,68,173,0.3)'
                }}
              >
                Photos et Niveau
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalementDetailPage;
