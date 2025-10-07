# Guide de Migration - Phase 1 Améliorations

## ⚠️ Important : Changements Breaking

Les améliorations apportées incluent des changements dans le format des réponses API. Voici ce que vous devez savoir :

## 🔄 Changements de Format API

### Ancien Format
```javascript
// GET /api/orders
res.json([...orders])

// POST /api/inventory
res.json({ id: 1, message: '...' })
```

### Nouveau Format
```javascript
// GET /api/orders
res.json({ status: 'success', data: [...orders] })

// POST /api/inventory
res.json({ status: 'success', data: { id: 1, message: '...' } })
```

## 📝 Migration du Frontend

### Composant Orders.js

**Avant :**
```javascript
const response = await axios.get('/api/orders');
setOrders(response.data);
```

**Après :**
```javascript
const response = await axios.get('/api/orders');
setOrders(response.data.data); // Notez le .data.data
```

### Composant Inventory.js

**Avant :**
```javascript
const response = await axios.get('/api/inventory');
setInventory(response.data);
```

**Après :**
```javascript
const response = await axios.get('/api/inventory');
setInventory(response.data.data);
```

### Gestion d'Erreurs Améliorée

**Avant :**
```javascript
try {
  await axios.post('/api/orders', orderData);
} catch (error) {
  console.error(error);
}
```

**Après :**
```javascript
try {
  await axios.post('/api/orders', orderData);
} catch (error) {
  // Les erreurs ont maintenant un format standardisé
  if (error.response) {
    const { message, details } = error.response.data;
    console.error(message);
    if (details) {
      details.forEach(detail => console.error(detail));
    }
  }
}
```

## 🗄️ Migration de la Base de Données

### Option 1 : Nouvelle Installation (Recommandé pour développement)

1. **Arrêtez le serveur**
2. **Sauvegardez** la base de données existante :
   ```bash
   cp server/database/restaurant.db server/database/restaurant.db.backup
   ```
3. **Supprimez** la base actuelle :
   ```bash
   rm server/database/restaurant.db
   ```
4. **Redémarrez** le serveur - le nouveau schéma sera créé automatiquement

### Option 2 : Migration des Données (Production)

Si vous avez des données en production, utilisez ce script SQL pour migrer :

```sql
-- 1. Activer les foreign keys
PRAGMA foreign_keys = ON;

-- 2. Créer de nouvelles tables temporaires avec le nouveau schéma
-- (voir server/database/db.js pour le schéma complet)

-- 3. Copier les données
INSERT INTO new_orders SELECT * FROM orders;
-- Répéter pour chaque table

-- 4. Remplacer les anciennes tables
DROP TABLE orders;
ALTER TABLE new_orders RENAME TO orders;
-- Répéter pour chaque table

-- 5. Créer les indexes
CREATE INDEX idx_orders_status ON orders(status);
-- etc.
```

## 🔧 Modifications Nécessaires dans le Frontend

### 1. Adapter axios interceptors (optionnel mais recommandé)

Créez `client/src/utils/axiosConfig.js` :

```javascript
import axios from 'axios';

// Response interceptor pour gérer le nouveau format
axios.interceptors.response.use(
  (response) => {
    // Si la réponse a le format { status, data }, extraire data
    if (response.data && response.data.status === 'success') {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    // Gestion d'erreur standardisée
    if (error.response && error.response.data) {
      const { message, details } = error.response.data;
      error.message = message || error.message;
      error.details = details;
    }
    return Promise.reject(error);
  }
);

export default axios;
```

Puis dans vos composants :
```javascript
import axios from './utils/axiosConfig'; // au lieu de 'axios'
```

### 2. Ou modifier manuellement chaque appel API

Dans chaque composant, ajoutez `.data` après `response.data` :

**Fichiers à modifier :**
- `client/src/components/Orders.js`
- `client/src/components/Inventory.js`
- `client/src/components/Dashboard.js`
- `client/src/components/Reservations.js`
- `client/src/components/Staff.js`
- `client/src/components/HACCP.js`
- `client/src/components/POS.js`

## ✅ Checklist de Migration

- [ ] Sauvegarder la base de données existante
- [ ] Mettre à jour le code du serveur (déjà fait)
- [ ] Redémarrer le serveur avec le nouveau schéma
- [ ] Tester l'API avec le health check : `http://localhost:5001/api/health`
- [ ] Adapter le frontend (Option 1 ou 2)
- [ ] Tester toutes les fonctionnalités principales
- [ ] Vérifier les logs d'erreur dans `server.log`

## 🧪 Tester les Améliorations

### 1. Tester la validation

Essayez de créer une commande avec des données invalides :
```bash
curl -X POST http://localhost:5001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"items": [], "total_amount": -10}'
```

Vous devriez recevoir une erreur détaillée avec les champs invalides.

### 2. Tester la gestion de stock

Essayez de créer une commande qui nécessite plus de stock que disponible.
Le système devrait rejeter la commande avec un message clair.

### 3. Tester les contraintes de base de données

Essayez de créer deux tables avec le même numéro - devrait échouer.

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez `server.log` pour les erreurs détaillées
2. Vérifiez que le port 5001 est correct dans `.env` et le proxy client
3. Assurez-vous que toutes les dépendances sont installées
4. Vérifiez la console du navigateur pour les erreurs frontend

## 🚀 Avantages Après Migration

- ✅ Validation automatique des données
- ✅ Messages d'erreur clairs et utiles
- ✅ Protection contre les stocks négatifs
- ✅ Transactions atomiques sécurisées
- ✅ Meilleure performance avec indexes
- ✅ Code plus maintenable
