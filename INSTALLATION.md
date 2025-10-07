# 🚀 Guide d'installation - Restaurant Emi

## Étapes d'installation rapide

### 1. Installer les dépendances du serveur
Ouvrez un terminal dans le dossier `Restaurant Emi` et exécutez :
```bash
npm install
```

### 2. Installer les dépendances du client
```bash
cd client
npm install
cd ..
```

### 3. Démarrer le serveur backend
Dans le terminal, exécutez :
```bash
npm start
```
Le serveur démarrera sur http://localhost:5000

### 4. Démarrer le client React
Ouvrez un NOUVEAU terminal dans le dossier `Restaurant Emi` et exécutez :
```bash
cd client
npm start
```
Le client démarrera sur http://localhost:3000

## ✅ Vérification

Une fois les deux serveurs démarrés :
- Ouvrez votre navigateur à l'adresse : http://localhost:3000
- Vous devriez voir le tableau de bord de Restaurant Emi
- La base de données SQLite sera créée automatiquement avec des données de démonstration

## 📊 Données de démonstration

L'application inclut des données de test :
- 8 tables de restaurant
- 9 articles du menu
- 6 articles d'inventaire
- 4 membres du personnel

## 🔧 Dépannage

### Le serveur ne démarre pas
- Vérifiez que le port 5000 n'est pas déjà utilisé
- Assurez-vous que toutes les dépendances sont installées

### Le client ne démarre pas
- Vérifiez que le port 3000 n'est pas déjà utilisé
- Supprimez le dossier `node_modules` et réinstallez : `npm install`

### Erreur de connexion à l'API
- Vérifiez que le serveur backend est bien démarré sur le port 5000
- Le proxy est configuré dans `client/package.json`

## 📝 Commandes utiles

```bash
# Installer toutes les dépendances (serveur + client)
npm run install-all

# Démarrer le serveur en mode développement avec auto-reload
npm run dev

# Démarrer uniquement le client
npm run client
```

## 🎯 Prochaines étapes

1. Explorez les différents modules de l'application
2. Testez la création de commandes, réservations, etc.
3. Personnalisez les données selon vos besoins
4. Ajoutez vos propres articles de menu et inventaire

Bon développement ! 🍽️
