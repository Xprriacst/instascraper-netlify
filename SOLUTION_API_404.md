# 🔧 Solution API 404 - InstaScraper

## ❌ Problème
```
Error code: 404
Message: File not found.
```

Quand on clique sur "Se connecter", le frontend essaie d'appeler `/api/auth/login` mais il n'y a pas de serveur backend.

## ✅ Solutions

### Option 1: Netlify Dev (Recommandé pour tester les APIs)

```bash
# Arrêter le serveur Python
# Ctrl+C dans le terminal du serveur

# Démarrer Netlify Dev
netlify dev --port 8888

# Si problème MIME, utiliser:
netlify dev --port 8888 --offline
```

➜ Ouvre http://localhost:8888
- Frontend + Fonctions serverless disponibles
- APIs `/api/*` fonctionnelles

### Option 2: Frontend Seul (Pour tester l'interface)

```bash
# Continuer avec le serveur Python actuel
# ➜ http://localhost:6000

# Les boutons de connexion donneront 404
# Mais l'interface est visible et testable
```

### Option 3: Développement Séparé

```bash
# Terminal 1: Frontend Vite
cd client && vite --port 5173

# Terminal 2: Fonctions Netlify
netlify functions:serve --port 9999

# Configurer proxy dans vite.config.ts
```

## 🎯 Recommandation

**Pour tester complètement l'app :**

1. **Arrêter** le serveur Python actuel
2. **Lancer** `netlify dev --port 8888`
3. **Ouvrir** http://localhost:8888
4. **Tester** la connexion et toutes les fonctionnalités

## 🚀 En Production

Sur Netlify, **tout fonctionne automatiquement** :
- Frontend servi par CDN
- APIs routées vers les fonctions serverless
- Aucun problème 404

## 💡 Note

Le serveur Python simple ne peut que servir des fichiers statiques.
Pour les APIs, il faut Netlify Dev ou déployer en production.
