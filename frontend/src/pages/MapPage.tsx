import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MapView from '../components/MapView';
import { useAuth } from '../auth/AuthContext';
import type { LatLngTuple } from 'leaflet';

// Quelques points d'intérêt à Antananarivo
const POINTS_OF_INTEREST = [
  {
    position: [-18.9137, 47.5226] as LatLngTuple,
    title: 'Palais de la Reine (Rova)',
    description: 'Site historique royal'
  },
  {
    position: [-18.8982, 47.5214] as LatLngTuple,
    title: 'Lac Anosy',
    description: 'Lac emblématique de la ville'
  },
  {
    position: [-18.8792, 47.5079] as LatLngTuple,
    title: 'Centre-ville',
    description: 'Quartier des affaires'
  },
  {
    position: [-18.8556, 47.4786] as LatLngTuple,
    title: 'Aéroport Ivato',
    description: 'Aéroport international'
  }
];

const MapPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showMarkers, setShowMarkers] = useState(true);
  const [useLocalTiles, setUseLocalTiles] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>🗺️ Carte d'Antananarivo</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user && <span>Bonjour, {user.email}</span>}
          <button 
            onClick={() => navigate(user?.role === 'MANAGER' ? '/admin' : '/user')}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            ← Retour
          </button>
          {user && (
            <button 
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                background: '#e74c3c',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Déconnexion
            </button>
          )}
        </div>
      </header>

      {/* Controls */}
      <div style={{ 
        padding: '1rem 2rem', 
        background: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        gap: '2rem',
        alignItems: 'center'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={showMarkers} 
            onChange={(e) => setShowMarkers(e.target.checked)}
          />
          Afficher les points d'intérêt
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={useLocalTiles} 
            onChange={(e) => setUseLocalTiles(e.target.checked)}
          />
          Utiliser serveur de tuiles local (offline)
        </label>
        <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>
          📍 Centre: Antananarivo, Madagascar
        </span>
      </div>

      {/* Map */}
      <div style={{ flex: 1, padding: '1rem' }}>
        <MapView 
          markers={showMarkers ? POINTS_OF_INTEREST : []}
          useLocalTiles={useLocalTiles}
          height="calc(100vh - 180px)"
        />
      </div>
    </div>
  );
};

export default MapPage;
