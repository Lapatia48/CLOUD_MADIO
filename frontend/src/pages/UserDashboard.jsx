import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './UserDashboard.css';

// Fix pour les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [signalements, setSignalements] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSignalement, setNewSignalement] = useState({
    description: '',
    latitude: null,
    longitude: null
  });

  useEffect(() => {
    // Charger les données utilisateur depuis le localStorage ou API
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    
    // Charger les signalements
    fetchSignalements();
  }, []);

  const fetchSignalements = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/signalements');
      const data = await response.json();
      setSignalements(data);
    } catch (error) {
      console.error('Erreur chargement signalements:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        if (showAddForm) {
          setNewSignalement({
            ...newSignalement,
            latitude: e.latlng.lat,
            longitude: e.latlng.lng
          });
        }
      }
    });
    return null;
  };

  const handleAddSignalement = async (e) => {
    e.preventDefault();
    if (!newSignalement.latitude || !newSignalement.longitude) {
      alert('Cliquez sur la carte pour sélectionner un emplacement');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/signalements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSignalement,
          user: { id: user?.userId }
        })
      });

      if (response.ok) {
        setShowAddForm(false);
        setNewSignalement({ description: '', latitude: null, longitude: null });
        fetchSignalements();
      }
    } catch (error) {
      console.error('Erreur ajout signalement:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'NOUVEAU': return '#e74c3c';
      case 'EN_COURS': return '#f39c12';
      case 'TERMINE': return '#27ae60';
      default: return '#3498db';
    }
  };

  return (
    <div className="dashboard-container">
      {/* Carte à gauche */}
      <div className="map-section">
        <MapContainer
          center={[-18.8792, 47.5079]} // Antananarivo
          zoom={13}
          className="map-container"
        >
          <TileLayer
            url="http://localhost:8085/data/antananarivo/{z}/{x}/{y}.pbf"
            attribution="&copy; OpenStreetMap"
          />
          {/* Fallback vers OSM en ligne si tileserver ne marche pas */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          
          <MapClickHandler />

          {/* Marqueur pour nouveau signalement */}
          {newSignalement.latitude && newSignalement.longitude && (
            <Marker position={[newSignalement.latitude, newSignalement.longitude]}>
              <Popup>Nouveau signalement ici</Popup>
            </Marker>
          )}

          {/* Marqueurs des signalements existants */}
          {signalements.map((sig) => (
            <Marker
              key={sig.id}
              position={[sig.latitude, sig.longitude]}
              icon={L.divIcon({
                className: 'custom-marker',
                html: `<div style="background-color: ${getStatusColor(sig.status)}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`
              })}
            >
              <Popup>
                <strong>{sig.description}</strong><br />
                Status: {sig.status}<br />
                {sig.surfaceM2 && `Surface: ${sig.surfaceM2} m²`}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Panneau latéral droit */}
      <div className="sidebar">
        {/* Infos utilisateur */}
        <div className="user-info">
          <h2>👤 Espace utilisateur</h2>
          {user && (
            <div className="user-details">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Nom:</strong> {user.nom || 'N/A'}</p>
              <p><strong>Prénom:</strong> {user.prenom || 'N/A'}</p>
              <p><strong>Rôle:</strong> {user.role}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="actions">
          <button
            className={`btn btn-primary ${showAddForm ? 'active' : ''}`}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '✕ Annuler' : '➕ Ajouter signalement'}
          </button>

          <button className="btn btn-secondary" onClick={fetchSignalements}>
            🔄 Rafraîchir
          </button>

          <button className="btn btn-danger" onClick={handleLogout}>
            🚪 Déconnexion
          </button>
        </div>

        {/* Formulaire d'ajout */}
        {showAddForm && (
          <div className="add-form">
            <h3>Nouveau signalement</h3>
            <p className="hint">👆 Cliquez sur la carte pour marquer l'emplacement</p>
            <form onSubmit={handleAddSignalement}>
              <textarea
                placeholder="Description du problème..."
                value={newSignalement.description}
                onChange={(e) => setNewSignalement({
                  ...newSignalement,
                  description: e.target.value
                })}
                required
              />
              {newSignalement.latitude && (
                <p className="coords">
                  📍 {newSignalement.latitude.toFixed(5)}, {newSignalement.longitude.toFixed(5)}
                </p>
              )}
              <button type="submit" className="btn btn-success">
                ✓ Enregistrer
              </button>
            </form>
          </div>
        )}

        {/* Liste des signalements */}
        <div className="signalements-list">
          <h3>📋 Signalements ({signalements.length})</h3>
          {signalements.length === 0 ? (
            <p className="empty">Aucun signalement</p>
          ) : (
            <ul>
              {signalements.slice(0, 10).map((sig) => (
                <li key={sig.id} className={`status-${sig.status.toLowerCase()}`}>
                  <span className="status-dot" style={{ backgroundColor: getStatusColor(sig.status) }}></span>
                  <div>
                    <strong>{sig.description?.substring(0, 30)}...</strong>
                    <small>{sig.status}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
