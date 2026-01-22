create database cloud_db;
\c cloud_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('VISITOR', 'USER', 'MANAGER');
CREATE TYPE signalement_status AS ENUM ('NOUVEAU', 'EN_COURS', 'TERMINE');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    role user_role NOT NULL DEFAULT 'USER',
    blocked BOOLEAN NOT NULL DEFAULT FALSE,
    login_attempts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sessions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE auth_config (
    id SERIAL PRIMARY KEY,
    max_attempts INT NOT NULL DEFAULT 3,
    session_duration_minutes INT NOT NULL DEFAULT 60
);

INSERT INTO auth_config (max_attempts, session_duration_minutes)
VALUES (3, 60);


CREATE TABLE signalements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    date_signalement DATE NOT NULL DEFAULT CURRENT_DATE,
    statut signalement_status NOT NULL DEFAULT 'NOUVEAU',
    surface_m2 DOUBLE PRECISION,
    budget DOUBLE PRECISION,
    entreprise VARCHAR(150),
    user_id UUID,

    CONSTRAINT fk_signalement_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);


CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_signalements_status ON signalements(statut);
CREATE INDEX idx_signalements_user ON signalements(user_id);


INSERT INTO users (
    email,
    password_hash,
    nom,
    prenom,
    role
) VALUES (
    'manager@admin.com',
    '$2a$10$HASH_A_REMPLACER',
    'Admin',
    'Manager',
    'MANAGER'
);


  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VybGFwYXRpYUBleGFtcGxlLmNvbSIsImlhdCI6MTc2ODg5Njc2MCwiZXhwIjoxNzY4OTgzMTYwfQ.nlYQ2YGg_x9K3Csm7EckKiaY2eGBil2Kk3SDFgpk0e8",