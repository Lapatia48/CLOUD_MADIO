create database routes;
\c routes;

--Table role
-- 'USER', 'VISITOR', 'USER', 'MANAGER'
create table roles(
    id SERIAL PRIMARY KEY,
    libelle varchar(20)
);

INSERT INTO roles (libelle) VALUES
    ('USER'),
    ('MANAGER'),
    ('ADMIN');

-- Table des utilisateurs
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Mot de passe haché
    nom VARCHAR(100),
    prenom VARCHAR(100),
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
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

outes=# select * from entreprises;
 id | adresse | email | nom | telephone
----+---------+-------+-----+-----------
(0 ligne)
insert into entreprises(nom, adresse, telephone, email) 
VALUES ('Entreprise Colas', 'Analakely, Antananarivo', '0331499704', 'contact@entreprise.mg');
