# Guide de Déploiement Backend sur Render

## Étape 1: Vérifier l'état du déploiement actuel

1. Allez sur https://dashboard.render.com
2. Connectez-vous avec votre compte
3. Cherchez votre service backend (probablement nommé "ecole-primaire-mont-sinai-backend" ou similaire)
4. Cliquez sur le service
5. Regardez la page "Deploys" (ou la page principale du service)
6. Vérifiez :
   - Quel commit est actuellement "Live" (en vert)
   - La date du dernier déploiement
   - Si le dernier déploiement a réussi ou échoué

## Étape 2: Déploiement Manuel (Recommandé)

Si le déploiement automatique n'est pas configuré ou ne fonctionne pas :

1. Sur la page du service, cliquez sur "Manual Deploy"
2. Dans le menu déroulant, choisissez "Deploy latest commit"
3. Cliquez sur "Deploy"
4. Attendez que le déploiement se termine (2-5 minutes)
5. Vérifiez que le statut passe à "Live"

## Étape 3: Vérifier que le déploiement a réussi

1. Une fois le déploiement terminé, cliquez sur le dernier déploiement
2. Vérifiez les logs :
   - Pas d'erreurs de build
   - Le service démarre correctement
   - Pas de crash

## Étape 4: Tester en production

1. Allez sur https://ecole-primaire-mont-sinai.onrender.com/api/health
2. Vous devriez voir : `{"status":"ok","message":"Server is running"}`
3. Essayez de vous connecter sur https://ecole-primaire-mont-sinai-frontend-git-main-bayalalandry.vercel.app
4. Vérifiez que les corrections sont appliquées

## Configuration recommandée pour le déploiement automatique

Si vous voulez activer le déploiement automatique depuis GitHub :

1. Sur la page du service Render
2. Cliquez sur "Settings"
3. Cherchez "Auto-Deploy"
4. Activez "Auto-Deploy from GitHub"
5. Sélectionnez votre dépôt GitHub : `Bayalalandry/ecole-primaire-mont-sinai`
6. Sélectionnez la branche : `main`
7. Configurez :
   - **Root Directory:** `backend`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`

## Problèmes courants

### Si le build échoue :
- Vérifiez que `backend/package.json` existe
- Vérifiez que toutes les dépendances sont installées
- Vérifiez que TypeScript compile sans erreur (`npm run build`)

### Si le service crash au démarrage :
- Vérifiez les logs Render
- Vérifiez que les variables d'environnement sont correctes (SUPABASE_URL, SUPABASE_ANON_KEY, JWT_SECRET)

### Si le backend compile mais ne répond pas :
- Vérifiez que le port est correct (5000)
- Vérifiez que CORS est configuré correctement

## Déploiement alternatif (via Render CLI)

Si l'interface web ne fonctionne pas :

```bash
# Installer Render CLI
npm install -g @render/cli

# Se connecter
render login

# Déployer manuellement
render deploy backend --cwd "C:\Users\landr\Desktop\Ecole Primaire"
```

## Contact Support

Si vous avez toujours des problèmes :
- Support Render : https://community.render.com
- Documentation : https://render.com/docs