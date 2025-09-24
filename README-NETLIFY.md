# InstaScraper - Version Netlify

Une application de scraping Instagram adaptée pour fonctionner sur Netlify avec des fonctions serverless.

## 🚀 Fonctionnalités

- **Scraping Instagram** : Extraction de données de posts par hashtag via Apify
- **Authentification JWT** : Système d'authentification sécurisé
- **Gestion des crédits** : Système de crédits pour limiter l'usage
- **Abonnements Stripe** : Paiements récurrents pour acheter des crédits
- **Export de données** : Téléchargement des résultats en CSV ou Excel
- **Interface moderne** : Frontend React avec Tailwind CSS

## 🛠️ Architecture Netlify

L'application a été adaptée de Replit vers Netlify :

- **Frontend** : React + Vite (déployé sur Netlify CDN)
- **Backend** : Fonctions serverless Netlify (dans `/netlify/functions/`)
- **Base de données** : PostgreSQL (compatible avec Neon, Supabase, etc.)
- **Authentification** : JWT avec sessions
- **Paiements** : Stripe avec webhooks

## 📁 Structure du projet

```
├── client/                 # Frontend React
│   ├── src/
│   └── index.html
├── netlify/
│   └── functions/         # Fonctions serverless
│       ├── auth-login.mts
│       ├── campaigns.mts
│       ├── stripe-webhook.mts
│       └── ...
├── server/                # Code partagé backend
│   ├── services/
│   ├── storage.ts
│   └── netlifyAuth.ts
├── shared/                # Types partagés
├── netlify.toml          # Configuration Netlify
└── package.json
```

## 🚀 Déploiement sur Netlify

### 1. Prérequis

- Compte Netlify
- Base de données PostgreSQL (Neon, Supabase, etc.)
- Compte Apify pour le scraping
- Compte Stripe pour les paiements

### 2. Installation locale

```bash
# Cloner le projet
git clone <votre-repo>
cd instascraper-netlify

# Installer les dépendances
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos vraies valeurs
```

### 3. Configuration des variables d'environnement

Dans Netlify Dashboard > Site settings > Environment variables :

```
DATABASE_URL=postgresql://user:password@host:port/database
APIFY_API_TOKEN=your_apify_token
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
JWT_SECRET=your_secure_jwt_secret
```

### 4. Déploiement

```bash
# Développement local
npm run dev

# Build de production
npm run build

# Déployer sur Netlify (via Git ou CLI)
netlify deploy --prod
```

### 5. Configuration Stripe

1. Créer un webhook endpoint dans Stripe Dashboard
2. URL : `https://votre-site.netlify.app/api/stripe-webhook`
3. Événements : `invoice.payment_succeeded`
4. Copier le secret du webhook dans les variables d'environnement

## 🔧 Développement local

```bash
# Démarrer le serveur de développement
npm run dev

# Le site sera disponible sur http://localhost:8888
# Les fonctions sur http://localhost:8888/.netlify/functions/
```

## 📊 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion utilisateur
- `GET /api/auth/user` - Informations utilisateur

### Campagnes
- `GET /api/campaigns` - Liste des campagnes
- `POST /api/campaigns` - Créer une campagne
- `GET /api/campaigns/:id` - Détails d'une campagne
- `POST /api/campaigns/:id/check-status` - Vérifier le statut
- `GET /api/campaigns/:id/download` - Télécharger les résultats

### Crédits et paiements
- `GET /api/credits/transactions` - Historique des transactions
- `POST /api/create-subscription` - Créer un abonnement Stripe
- `POST /api/stripe-webhook` - Webhook Stripe

### Statistiques
- `GET /api/stats` - Statistiques utilisateur

## 🔐 Sécurité

- Authentification JWT avec expiration
- Variables d'environnement pour les secrets
- Validation des données avec Zod
- CORS configuré pour les domaines autorisés

## 🐛 Dépannage

### Problèmes courants

1. **Erreur de base de données** : Vérifier `DATABASE_URL`
2. **Fonctions qui ne répondent pas** : Vérifier les logs Netlify
3. **Erreur Stripe** : Vérifier les clés et webhooks
4. **Erreur Apify** : Vérifier le token et les quotas

### Logs

```bash
# Voir les logs des fonctions
netlify functions:log

# Voir les logs de build
netlify build:log
```

## 📝 Migration depuis Replit

Les principales adaptations effectuées :

1. **Serveur Express → Fonctions serverless**
2. **Authentification Replit → JWT**
3. **Sessions en mémoire → JWT stateless**
4. **Fichiers temporaires → Buffers en mémoire**
5. **Variables d'environnement Netlify**

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commit les changements
4. Push vers la branche
5. Créer une Pull Request

## 📄 License

MIT License - voir le fichier LICENSE pour plus de détails.
