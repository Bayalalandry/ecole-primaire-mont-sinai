/**
 * Routes pour gérer les abonnements Web Push
 */

import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import {
  registerPushSubscription,
  unregisterPushSubscription,
  getUserPushSubscriptions,
  getVapidPublicKey,
} from '../services/pushService';

const router = Router();

/**
 * Obtenir la clé publique VAPID (nécessaire pour le frontend)
 */
router.get('/vapid-public-key', (req, res) => {
  try {
    const publicKey = getVapidPublicKey();
    res.json({ publicKey });
  } catch (error: any) {
    console.error('Error getting VAPID public key:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la clé VAPID' });
  }
});

/**
 * Enregistrer un abonnement push
 */
router.post('/subscribe', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const { endpoint, keys, userAgent } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: 'Données d\'abonnement invalides' });
    }

    await registerPushSubscription({
      user_id: req.user.id,
      endpoint,
      p256dh_key: keys.p256dh,
      auth_key: keys.auth,
      user_agent: userAgent,
    });

    res.json({ message: 'Abonnement enregistré avec succès' });
  } catch (error: any) {
    console.error('Error subscribing to push:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de l\'abonnement' });
  }
});

/**
 * Désenregistrer un abonnement push
 */
router.post('/unsubscribe', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint manquant' });
    }

    await unregisterPushSubscription(endpoint);

    res.json({ message: 'Abonnement désenregistré avec succès' });
  } catch (error: any) {
    console.error('Error unsubscribing from push:', error);
    res.status(500).json({ error: 'Erreur lors du désabonnement' });
  }
});

/**
 * Récupérer les abonnements push de l'utilisateur connecté
 */
router.get('/subscriptions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const subscriptions = await getUserPushSubscriptions(req.user.id);

    res.json({ subscriptions });
  } catch (error: any) {
    console.error('Error getting push subscriptions:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des abonnements' });
  }
});

export default router;
