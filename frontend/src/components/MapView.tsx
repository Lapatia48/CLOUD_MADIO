import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';

// Fix pour les icônes Leaflet avec Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Configurer les icônes par défaut
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Centre d'Antananarivo
const ANTANANARIVO_CENTER: LatLngExpression = [-18.8792, 47.5079];
const DEFAULT_ZOOM = 13;

// URL du serveur de tuiles local (tileserver-gl)
const LOCAL_TILE_SERVER = 'http://localhost:8081/styles/osm-bright/{z}/{x}/{y}.png';
// Fallback vers OpenStreetMap en ligne si le serveur local n'est pas disponible
const OSM_TILE_SERVER = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

interface MapViewProps {
  center?: LatLngExpression;
  zoom?: number;
  markers?: Array<{
    position: LatLngExpression;
    title: string;
    description?: string;
  }>;
  useLocalTiles?: boolean;
  height?: string;
}

const MapView = ({ 
  center = ANTANANARIVO_CENTER, 
  zoom = DEFAULT_ZOOM,
  markers = [],
  useLocalTiles = false,
  height = '500px'
}: MapViewProps) => {
  
  const tileUrl = useLocalTiles ? LOCAL_TILE_SERVER : OSM_TILE_SERVER;
  const attribution = useLocalTiles 
    ? '&copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution={attribution}
          url={tileUrl}
        />
        
        {/* Marqueur central d'Antananarivo */}
        <Marker position={ANTANANARIVO_CENTER}>
          <Popup>
            <strong>Antananarivo</strong>
            <br />
            Capitale de Madagascar
          </Popup>
        </Marker>

        {/* Marqueurs personnalisés */}
        {markers.map((marker, index) => (
          <Marker key={index} position={marker.position}>
            <Popup>
              <strong>{marker.title}</strong>
              {marker.description && <><br />{marker.description}</>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
export { ANTANANARIVO_CENTER, DEFAULT_ZOOM };
