-- ============================================
-- CLOUD MADIO - Données de test
-- 2 utilisateurs : mimi@gmail.com, valy1@gmail.com
-- Mot de passe : password123 (bcrypt)
-- ============================================

INSERT INTO users (id, created_at, email, failed_attempts, firebase_uid, is_blocked, nom, password, prenom, role, id_role)
VALUES
  (3, NOW(), 'mimi@gmail.com', 0, '', false, 'Mimi', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Mimi', 'USER', NULL),
  (4, NOW(), 'valy1@gmail.com', 0, '', false, 'Valy', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Valy', 'USER', NULL)
ON CONFLICT (id) DO NOTHING;
