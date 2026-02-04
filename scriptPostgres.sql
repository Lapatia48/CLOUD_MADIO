-- Script d'initialisation PostgreSQL pour MADIO
-- Ce script est exécuté automatiquement lors du docker-compose up

-- ===========================================
-- SUPPRESSION DES TABLES EXISTANTES
-- ===========================================
DROP TABLE IF EXISTS signalements CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS entreprises CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ===========================================
-- TABLE ROLES
-- ===========================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    libelle VARCHAR(20) NOT NULL
);

INSERT INTO roles (libelle) VALUES
    ('USER'),
    ('MANAGER'),
    ('ADMIN');

-- ===========================================
-- TABLE ENTREPRISES
-- ===========================================
CREATE TABLE entreprises (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    adresse VARCHAR(255),
    telephone VARCHAR(20),
    email VARCHAR(255)
);

INSERT INTO entreprises (nom, adresse, telephone, email) VALUES
    ('Entreprise Colas', 'Analakely, Antananarivo', '0331499704', 'contact@colas.mg'),
    ('SOGEA SATOM', 'Ankorondrano, Antananarivo', '0341234567', 'contact@sogea.mg'),
    ('CRBC Madagascar', 'Ivandry, Antananarivo', '0331112233', 'contact@crbc.mg');

-- ===========================================
-- TABLE USERS (mot de passe en clair, pas de hash)
-- ===========================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email VARCHAR(255) UNIQUE NOT NULL,
    failed_attempts INT NOT NULL DEFAULT 0,
    firebase_uid VARCHAR(255),
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    nom VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    prenom VARCHAR(100),
    role VARCHAR(20),
    id_role INTEGER REFERENCES roles(id) ON DELETE SET NULL
);

-- Utilisateur Manager (mot de passe en clair: "manager")
INSERT INTO users (email, password, nom, prenom, id_role, failed_attempts, is_blocked) VALUES
    ('manager@gmail.com', 'manager', 'Manager', 'Admin', 2, 0, false);

-- Utilisateur Admin (mot de passe en clair: "admin")
INSERT INTO users (email, password, nom, prenom, id_role, failed_attempts, is_blocked) VALUES
    ('admin@gmail.com', 'admin', 'Admin', 'System', 3, 0, false);

-- ===========================================
-- TABLE SESSIONS
-- ===========================================
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE
);

-- ===========================================
-- TABLE SIGNALEMENTS
-- ===========================================
CREATE TABLE signalements (
    id SERIAL PRIMARY KEY,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status VARCHAR(20) DEFAULT 'NOUVEAU',
    avancement INTEGER DEFAULT 0,
    surface_m2 DECIMAL(10,2),
    budget DECIMAL(15,2),
    photo_base64 TEXT,
    photo_url VARCHAR(500),
    id_entreprise INTEGER REFERENCES entreprises(id) ON DELETE SET NULL,
    date_signalement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Quelques signalements de test
INSERT INTO signalements (description, latitude, longitude, status, avancement, surface_m2, budget, id_entreprise) VALUES
    ('Nid de poule route principale Analakely', -18.9137, 47.5255, 'NOUVEAU', 0, 15.5, 500000, 1),
    ('Fissures profondes RN7 km 15', -18.8792, 47.5079, 'EN_COURS', 50, 45.0, 1500000, 2);

-- ===========================================
-- INDEX POUR PERFORMANCE
-- ===========================================
CREATE INDEX idx_signalements_status ON signalements(status);
CREATE INDEX idx_signalements_coords ON signalements(latitude, longitude);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_token ON sessions(token);