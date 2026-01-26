create database routes;
\c routes;

-- Table des utilisateurs
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Mot de passe haché
    nom VARCHAR(100),
    prenom VARCHAR(100),
    role VARCHAR(20) DEFAULT 'USER', -- 'VISITOR', 'USER', 'MANAGER'
    is_blocked BOOLEAN DEFAULT FALSE,
    failed_attempts INT DEFAULT 0,
    firebase_uid VARCHAR(255) -- Pour la synchronisation
);

-- Table des sessions (pour gérer la durée de vie)
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);


create table entreprises (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    adresse VARCHAR(255),
    telephone VARCHAR(20),
    email VARCHAR(255)
);

-- Table des signalements
CREATE TABLE signalements (
    id SERIAL PRIMARY KEY,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status VARCHAR(20) DEFAULT 'NOUVEAU', -- 'NOUVEAU', 'EN_COURS', 'TERMINE'
    surface_m2 DECIMAL(10,2),
    budget DECIMAL(15,2),
    id_entreprise INT REFERENCES entreprises(id),
    date_signalement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT REFERENCES users(id) -- Qui a signalé ?
);