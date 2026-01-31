-- Création des tables
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    libelle VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    id_role INTEGER REFERENCES roles(id),
    is_blocked BOOLEAN DEFAULT FALSE,
    failed_attempts INT DEFAULT 0,
    firebase_uid VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS entreprises (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    adresse VARCHAR(255),
    telephone VARCHAR(20),
    email VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS signalements (
    id SERIAL PRIMARY KEY,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status VARCHAR(20) DEFAULT 'NOUVEAU',
    surface_m2 DECIMAL(10,2),
    budget DECIMAL(15,2),
    id_entreprise INT REFERENCES entreprises(id),
    date_signalement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT REFERENCES users(id)
);

-- Insertion des rôles
INSERT INTO roles (libelle) VALUES ('ADMIN'), ('MANAGER'), ('USER')
ON CONFLICT DO NOTHING;

-- Insertion des entreprises
INSERT INTO entreprises (nom, adresse, telephone, email) VALUES
    ('MADIO Construction', 'Lot IB 123 Analakely, Antananarivo', '+261 34 12 345 67', 'contact@madio-construction.mg'),
    ('Travaux Plus', 'Avenue de l''Indépendance, Antananarivo', '+261 33 98 765 43', 'info@travauxplus.mg')
ON CONFLICT DO NOTHING;
