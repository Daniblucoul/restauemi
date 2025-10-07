# Middlewares - Restaurant Emi

Ce dossier contient les middlewares personnalisés utilisés dans l'application Restaurant Emi.

## 📁 Fichiers

### 1. `validation.js` - Validation des Données

Middleware de validation pour sécuriser les entrées API.

#### Fonctions Disponibles

##### `validateOrder(req, res, next)`
Valide les données de création de commande :
- `items` : Array non vide avec id, quantity, price valides
- `total_amount` : Nombre >= 0
- `status` : Parmi les valeurs autorisées
- `order_type` : 'dine-in', 'takeaway', ou 'delivery'

**Exemple d'utilisation :**
```javascript
router.post('/orders', validateOrder, (req, res) => {
  // La validation est déjà passée
});
```

##### `validateInventoryItem(req, res, next)`
Valide les articles d'inventaire :
- `item_name` : String non vide (requis)
- `unit` : String non vide (requis)
- `quantity` : Nombre >= 0
- `min_quantity` : Nombre >= 0
- `cost_per_unit` : Nombre >= 0

##### `validateReservation(req, res, next)`
Valide les réservations :
- `customer_name` : String non vide (requis)
- `phone_number` : String non vide (requis)
- `reservation_time` : Date valide (requis)
- `party_size` : Nombre > 0
- `status` : Parmi les valeurs autorisées

##### `validateStaff(req, res, next)`
Valide les informations du personnel :
- `first_name` : String non vide (requis)
- `last_name` : String non vide (requis)
- `role` : String non vide (requis)
- `status` : 'active', 'inactive', ou 'on_leave'

##### `validateMenuItem(req, res, next)`
Valide les items de menu :
- `name` : String non vide (requis)
- `price` : Nombre >= 0 (requis)
- `category` : String non vide (requis)

##### `validateHACCPLog(req, res, next)`
Valide les logs HACCP :
- `log_type` : 'temperature', 'cleaning', 'receiving', 'storage', ou 'other' (requis)
- `description` : String non vide (requis)
- `temperature` : Nombre (optionnel)
- `status` : 'ok', 'warning', ou 'critical'

##### `validateIdParam(req, res, next)`
Valide le paramètre ID dans l'URL :
- Doit être un entier positif
- Convertit automatiquement en nombre

**Exemple d'utilisation :**
```javascript
router.get('/orders/:id', validateIdParam, (req, res) => {
  // req.params.id est maintenant un nombre
});
```

#### Format des Erreurs de Validation

```json
{
  "error": "Validation failed",
  "details": [
    "Item name is required and must be a non-empty string",
    "Quantity must be a number >= 0"
  ]
}
```

---

### 2. `errorHandler.js` - Gestion des Erreurs

Middleware centralisé pour gérer toutes les erreurs de l'application.

#### Classes et Fonctions

##### `AppError` - Classe d'Erreur Personnalisée

Crée des erreurs structurées avec code de statut.

```javascript
const { AppError } = require('../middleware/errorHandler');

// Créer une erreur
throw new AppError('Resource not found', 404);

// Avec détails additionnels
throw new AppError('Validation failed', 400, ['Field x is required']);
```

**Propriétés :**
- `message` : Message d'erreur
- `statusCode` : Code HTTP (défaut: 500)
- `details` : Détails additionnels (optionnel)
- `isOperational` : true (pour distinguer des erreurs système)

##### `asyncHandler(fn)` - Wrapper Asynchrone

Évite les try-catch répétitifs dans les routes async.

**Sans asyncHandler :**
```javascript
router.get('/data', async (req, res) => {
  try {
    const data = await fetchData();
    res.json(data);
  } catch (error) {
    next(error);
  }
});
```

**Avec asyncHandler :**
```javascript
router.get('/data', asyncHandler(async (req, res) => {
  const data = await fetchData();
  res.json(data);
  // Les erreurs sont automatiquement catchées
}));
```

##### `errorHandler(err, req, res, next)` - Handler Global

Gère toutes les erreurs de l'application :
- Convertit les erreurs DB en messages utilisateurs
- Log les erreurs dans `server.log`
- Formate la réponse JSON
- Inclut stack trace en développement

**Format de réponse :**
```json
{
  "status": "error",
  "message": "User-friendly error message",
  "details": ["Optional", "additional", "details"],
  "stack": "Only in development mode"
}
```

##### `notFoundHandler(req, res, next)` - Route 404

Gère les routes non définies.

**Réponse :**
```json
{
  "status": "error",
  "message": "Cannot GET /api/unknown - Route not found"
}
```

##### `handleDatabaseError(error)` - Traducteur d'Erreurs DB

Convertit les erreurs SQLite en messages clairs :
- `SQLITE_CONSTRAINT: UNIQUE` → "This record already exists"
- `SQLITE_CONSTRAINT: FOREIGN KEY` → "Cannot perform this operation due to related records"
- `SQLITE_CONSTRAINT: NOT NULL` → "Required field is missing"
- `SQLITE_CONSTRAINT: CHECK` → "Data validation failed"
- `SQLITE_BUSY` → "Database is busy, please try again"

#### Logging des Erreurs

Toutes les erreurs sont automatiquement loggées dans `server.log` avec :
- Timestamp
- Méthode HTTP et URL
- Message d'erreur
- Stack trace
- Corps de la requête

**Format du log :**
```
[2025-10-05T23:00:00.000Z] ERROR
Method: POST
URL: /api/orders
Message: Insufficient stock for Tomatoes
Stack: Error: Insufficient stock...
Body: {"items":[...]}
-------------------
```

## 🔧 Configuration dans server/index.js

```javascript
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Routes
app.use('/api/orders', ordersRouter);
// ... autres routes

// 404 handler (doit être après toutes les routes)
app.use(notFoundHandler);

// Error handler global (doit être en dernier)
app.use(errorHandler);
```

## 💡 Bonnes Pratiques

### 1. Toujours utiliser asyncHandler pour les routes async
```javascript
router.get('/', asyncHandler(async (req, res) => {
  // Code async
}));
```

### 2. Utiliser AppError pour les erreurs intentionnelles
```javascript
if (!user) {
  throw new AppError('User not found', 404);
}
```

### 3. Laisser les erreurs système se propager
```javascript
// Ne pas catcher les erreurs de programmation
const result = someFunction(); // Laisse l'erreur remonter
```

### 4. Combiner validation et routes
```javascript
router.post('/items', validateInventoryItem, asyncHandler(async (req, res) => {
  // Données déjà validées
}));
```

### 5. Vérifier les opérations DB
```javascript
db.run(query, params, function(err) {
  if (err) {
    throw new AppError('Operation failed', 500, err.message);
  }
  if (this.changes === 0) {
    throw new AppError('Resource not found', 404);
  }
  // Succès
});
```

## 📊 Codes de Statut HTTP Utilisés

- `200` : OK - Succès
- `201` : Created - Ressource créée
- `400` : Bad Request - Validation échouée
- `404` : Not Found - Ressource introuvable
- `409` : Conflict - Conflit (unique, foreign key)
- `500` : Internal Server Error - Erreur serveur
- `503` : Service Unavailable - DB busy

## 🧪 Tests

### Tester la validation
```bash
curl -X POST http://localhost:5001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"items": []}'
```

### Tester les erreurs 404
```bash
curl http://localhost:5001/api/nonexistent
```

### Tester la gestion d'erreur DB
```bash
# Créer un doublon
curl -X POST http://localhost:5001/api/inventory \
  -H "Content-Type: application/json" \
  -d '{"item_name": "Existing Item", ...}'
```

## 🔍 Debugging

1. **Vérifier server.log** pour les erreurs détaillées
2. **Mode développement** : Les stack traces sont incluses dans les réponses
3. **Console serveur** : Les erreurs sont loggées avec contexte
4. **Format standardisé** : Toutes les erreurs suivent le même format JSON
