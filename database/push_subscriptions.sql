-- ============================================
-- Table pour stocker les abonnements Web Push
-- ============================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Commentaire pour documentation
COMMENT ON TABLE push_subscriptions IS 'Stocke les abonnements Web Push pour envoyer des notifications push aux utilisateurs';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'URL du endpoint de push du service push';
COMMENT ON COLUMN push_subscriptions.p256dh_key IS 'Clé publique de l''abonnement (P-256 ECDH)';
COMMENT ON COLUMN push_subscriptions.auth_key IS 'Clé d''authentification de l''abonnement';
COMMENT ON COLUMN push_subscriptions.user_agent IS 'User agent du navigateur (pour identifier l''appareil)';
