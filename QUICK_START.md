# 🚀 Démarrage Rapide - InstaScraper sur Netlify

## ✅ Checklist de déploiement

### 1. Prérequis
- [ ] Compte Netlify
- [ ] Base de données PostgreSQL (Neon/Supabase recommandé)
- [ ] Compte Apify avec API token
- [ ] Compte Stripe avec clés API

### 2. Installation locale

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos vraies valeurs

# 3. Démarrer en développement
npm run dev
```

### 3. Variables d'environnement requises

Dans Netlify Dashboard > Site settings > Environment variables :

```env
DATABASE_URL=postgresql://user:password@host:port/database
APIFY_API_TOKEN=apify_api_your_token_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
```

### 4. Configuration Stripe

1. **Créer un produit** dans Stripe Dashboard
2. **Configurer un webhook** :
   - URL : `https://votre-site.netlify.app/api/stripe-webhook`
   - Événements : `invoice.payment_succeeded`
3. **Copier le secret** du webhook dans les variables d'environnement

### 5. Base de données

Exécuter les migrations Drizzle :

```bash
npm run db:push
```

### 6. Déploiement Netlify

#### Option A : Via Git (Recommandé)
1. Push le code sur GitHub/GitLab
2. Connecter le repo à Netlify
3. Configurer les variables d'environnement
4. Déployer automatiquement

#### Option B : Via CLI
```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Déployer
netlify deploy --prod
```

## 🔧 Fonctionnalités adaptées pour Netlify

### ✅ Ce qui fonctionne
- ✅ Authentification JWT (remplace Replit Auth)
- ✅ Fonctions serverless (remplace Express)
- ✅ Scraping Instagram via Apify
- ✅ Paiements Stripe avec webhooks
- ✅ Export CSV/Excel en mémoire
- ✅ Gestion des crédits utilisateur
- ✅ Interface React moderne

### 🔄 Principales adaptations
- **Serveur Express** → **Fonctions serverless Netlify**
- **Sessions en mémoire** → **JWT stateless**
- **Fichiers temporaires** → **Buffers en mémoire**
- **Auth Replit** → **Auth JWT personnalisée**
- **Variables d'env Replit** → **Variables d'env Netlify**

## 🐛 Dépannage

### Erreurs courantes

**1. Erreur de base de données**
```
Error: connect ECONNREFUSED
```
→ Vérifier `DATABASE_URL` dans les variables d'environnement

**2. Fonctions qui ne répondent pas**
```
Function invocation failed
```
→ Vérifier les logs : `netlify functions:log`

**3. Erreur Stripe**
```
No such customer
```
→ Vérifier les clés Stripe et la configuration webhook

**4. Erreur Apify**
```
Invalid API token
```
→ Vérifier `APIFY_API_TOKEN` et les quotas

### Logs utiles

```bash
# Logs des fonctions
netlify functions:log

# Logs de build
netlify build:log

# Développement local avec logs
netlify dev --debug
```

## 📊 Endpoints API

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/auth/login` | POST | Connexion utilisateur |
| `/api/auth/user` | GET | Infos utilisateur |
| `/api/campaigns` | GET/POST | Gestion campagnes |
| `/api/campaigns/:id/check-status` | POST | Statut campagne |
| `/api/campaigns/:id/download` | GET | Télécharger résultats |
| `/api/create-subscription` | POST | Abonnement Stripe |
| `/api/stripe-webhook` | POST | Webhook Stripe |
| `/api/stats` | GET | Statistiques |

## 🎯 Prochaines étapes

1. **Tester l'authentification** avec un utilisateur test
2. **Créer une campagne** de scraping
3. **Vérifier les paiements** Stripe
4. **Configurer le monitoring** Netlify
5. **Optimiser les performances** des fonctions

## 💡 Conseils de production

- Utiliser des **clés Stripe live** en production
- Configurer des **alertes de monitoring**
- Mettre en place des **limites de rate**
- Sauvegarder régulièrement la **base de données**
- Monitorer les **quotas Apify**

---

🎉 **Votre InstaScraper est maintenant prêt pour Netlify !**
