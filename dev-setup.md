# 🔧 Configuration de Développement

## Problème MIME Type Résolu

Le problème de MIME type vient du conflit entre Netlify Dev et Vite. Voici la solution :

### Option 1: Développement Séparé (Recommandé)

```bash
# Terminal 1: Frontend Vite
cd client && npm run dev
# ➜ http://localhost:5173

# Terminal 2: Fonctions Netlify
netlify functions:serve
# ➜ http://localhost:9999/.netlify/functions/
```

### Option 2: Développement Vite Seul

```bash
# Développement frontend uniquement
cd client && vite
# ➜ http://localhost:5173

# Pour tester les fonctions, utiliser la production ou Netlify Dev
```

### Option 3: Configuration Proxy Vite

Ajouter dans `client/vite.config.ts` :

```typescript
export default defineConfig({
  // ... autres configs
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:9999/.netlify/functions',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

## Solution Temporaire

Pour le moment, utilisez :

```bash
# Frontend seul
cd client && vite

# Ou build et servir statiquement
npm run build
cd dist/public && python -m http.server 8000
```

Le déploiement en production sur Netlify fonctionnera parfaitement sans ces problèmes de développement local.
