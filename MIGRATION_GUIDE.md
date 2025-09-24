# 📦 Guide de Migration : Replit → Netlify

## 🔄 Résumé des changements

Cette migration transforme votre application InstaScraper de Replit vers Netlify avec les adaptations suivantes :

### Architecture
- **Avant** : Serveur Express monolithique sur Replit
- **Après** : Fonctions serverless sur Netlify + Frontend statique

### Authentification
- **Avant** : Replit Auth avec sessions
- **Après** : JWT avec authentification personnalisée

### Déploiement
- **Avant** : Replit avec hot-reload automatique
- **Après** : Netlify avec déploiement Git/CLI

## 📋 Checklist de migration

### ✅ Code adapté

- [x] **Serveur Express** → **Fonctions serverless**
  - `server/index.ts` → `netlify/functions/*.mts`
  - Chaque route devient une fonction séparée

- [x] **Authentification Replit** → **JWT**
  - `server/replitAuth.ts` → `server/netlifyAuth.ts`
  - Sessions → Tokens JWT stateless

- [x] **Variables d'environnement**
  - `.replit` → `netlify.toml` + variables Netlify
  - `process.env.REPL_*` → `Netlify.env.get()`

- [x] **Export de fichiers**
  - Fichiers temporaires → Buffers en mémoire
  - `exportService.exportToExcel()` → `exportService.exportToExcelBuffer()`

- [x] **Configuration build**
  - Scripts npm adaptés pour Netlify
  - Vite config simplifié

### 🔧 Fonctions créées

| Fonction | Route | Description |
|----------|-------|-------------|
| `auth-login.mts` | `/api/auth/login` | Connexion utilisateur |
| `auth-user.mts` | `/api/auth/user` | Infos utilisateur |
| `campaigns.mts` | `/api/campaigns` | CRUD campagnes |
| `campaign-detail.mts` | `/api/campaigns/*` | Détail campagne |
| `campaign-status.mts` | `/api/campaigns/*/check-status` | Statut |
| `campaign-download.mts` | `/api/campaigns/*/download` | Téléchargement |
| `credit-transactions.mts` | `/api/credits/transactions` | Historique |
| `create-subscription.mts` | `/api/create-subscription` | Stripe |
| `stripe-webhook.mts` | `/api/stripe-webhook` | Webhook |
| `stats.mts` | `/api/stats` | Statistiques |

### 📦 Dépendances ajoutées

```json
{
  "@netlify/functions": "^2.8.1",
  "jsonwebtoken": "^9.0.2",
  "netlify-cli": "^17.36.2",
  "@types/jsonwebtoken": "^9.0.7"
}
```

### 🗂️ Structure finale

```
├── client/                 # Frontend React (inchangé)
├── netlify/
│   └── functions/         # Fonctions serverless (NOUVEAU)
├── server/                # Code backend partagé
│   ├── services/         # Services (adaptés)
│   ├── netlifyAuth.ts    # Auth JWT (NOUVEAU)
│   └── storage.ts        # Storage (étendu)
├── netlify.toml          # Config Netlify (NOUVEAU)
├── .env.example          # Variables d'env (NOUVEAU)
└── README-NETLIFY.md     # Documentation (NOUVEAU)
```

## 🚀 Étapes de déploiement

### 1. Préparer l'environnement

```bash
# Installer les nouvelles dépendances
npm install

# Copier les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs
```

### 2. Migrer les données

Si vous avez des données existantes sur Replit :

```bash
# Exporter depuis Replit (si nécessaire)
pg_dump $DATABASE_URL > backup.sql

# Importer vers la nouvelle DB
psql $NEW_DATABASE_URL < backup.sql
```

### 3. Configurer Netlify

1. **Créer un site Netlify**
2. **Connecter votre repo Git**
3. **Configurer les variables d'environnement**
4. **Déployer**

### 4. Tester la migration

```bash
# Test local
npm run dev

# Test des fonctions
curl http://localhost:8888/api/auth/user

# Test de build
npm run build
```

## ⚠️ Points d'attention

### Différences importantes

1. **Cold starts** : Les fonctions serverless ont un délai de démarrage
2. **Timeouts** : 10s max par fonction (vs serveur permanent)
3. **État** : Pas de mémoire partagée entre les requêtes
4. **Fichiers** : Pas de système de fichiers persistant

### Optimisations appliquées

1. **Buffers en mémoire** pour l'export de fichiers
2. **JWT stateless** pour éviter les sessions
3. **Code partagé** pour réduire la taille des fonctions
4. **Validation** côté client et serveur

## 🔍 Vérification post-migration

### Tests à effectuer

- [ ] **Authentification** : Login/logout fonctionne
- [ ] **Campagnes** : Création et suivi de campagnes
- [ ] **Paiements** : Abonnements Stripe
- [ ] **Export** : Téléchargement CSV/Excel
- [ ] **Webhooks** : Réception des événements Stripe

### Métriques à surveiller

- **Temps de réponse** des fonctions
- **Taux d'erreur** des API
- **Utilisation** des quotas Apify
- **Performance** du frontend

## 🆘 Rollback

En cas de problème, vous pouvez revenir à Replit :

1. Garder l'ancien code Replit en backup
2. Restaurer la base de données si nécessaire
3. Reconfigurer les webhooks Stripe

## 📞 Support

- **Logs Netlify** : Dashboard > Functions > Logs
- **Monitoring** : Intégrations tierces (Sentry, etc.)
- **Documentation** : [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)

---

✅ **Migration terminée avec succès !**

Votre InstaScraper fonctionne maintenant sur Netlify avec une architecture serverless moderne et scalable.
