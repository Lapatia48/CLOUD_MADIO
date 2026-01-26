# Téléchargement des tuiles pour Antananarivo

## Option 1: Télécharger les tuiles MBTiles (Recommandé)

### Depuis OpenMapTiles
1. Aller sur https://data.maptiler.com/downloads/planet/
2. Chercher "Madagascar" ou télécharger la région Afrique
3. Placer le fichier .mbtiles dans le dossier `map-data/`

### Depuis Protomaps (plus léger)
```bash
# Installer pmtiles CLI
npm install -g pmtiles

# Télécharger les tuiles d'Antananarivo (zone approximative)
# Bounds: [47.4, -19.0, 47.6, -18.8] (lon_min, lat_min, lon_max, lat_max)
```

## Option 2: Générer les tuiles depuis OSM PBF

### Télécharger le fichier PBF de Madagascar
```bash
# Télécharger Madagascar depuis Geofabrik
curl -O https://download.geofabrik.de/africa/madagascar-latest.osm.pbf
```

### Convertir en MBTiles avec tilemaker
```bash
docker run -v $(pwd):/data ghcr.io/systemed/tilemaker:master \
  --input /data/madagascar-latest.osm.pbf \
  --output /data/map-data/antananarivo.mbtiles \
  --bbox 47.4,-19.0,47.6,-18.8
```

## Option 3: Utiliser les tuiles en ligne temporairement

Pour le développement, l'application est configurée pour utiliser OpenStreetMap en ligne 
si le serveur de tuiles local n'est pas disponible.

## Coordonnées d'Antananarivo
- Centre: Latitude -18.8792, Longitude 47.5079
- Bounding Box: [47.4, -19.0, 47.6, -18.8]

## Lancer le serveur de tuiles
```bash
docker compose up -d tileserver
```

Le serveur sera accessible sur http://localhost:8081
