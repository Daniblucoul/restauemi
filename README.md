# 🍽️ Restaurant Emi - Plateforme de Gestion de Restaurant

Une plateforme complète de gestion de restaurant avec toutes les fonctionnalités essentielles pour gérer efficacement votre établissement.

## 🚀 Fonctionnalités

### 1. **Gestion des ventes et des commandes**
- Prise de commande en temps réel
- Gestion des tables (statut : disponible, occupé, réservé)
- Suivi des commandes (en attente, en préparation, prêt, servi, payé)
- Support pour différents types de commandes (sur place, à emporter, livraison)

### 2. **Gestion des stocks**
- Suivi des ingrédients et articles
- Alertes de stock faible
- Gestion des catégories
- Calcul automatique de la valeur totale
- Historique de réapprovisionnement
- Gestion des fournisseurs

### 3. **Gestion des réservations**
- Centralisation des réservations
- Confirmation automatique
- Attribution des tables
- Suivi du statut (confirmé, installé, terminé, annulé)
- Gestion des informations clients

### 4. **Rapports et analyses**
- Dashboard avec statistiques en temps réel
- Chiffre d'affaires journalier
- Nombre de commandes
- Alertes de stock faible
- Vue d'ensemble du personnel actif

### 5. **Gestion du personnel**
- Fiche employé complète
- Planification des horaires
- Gestion des congés et absences
- Suivi des rôles (Chef, Serveur, Manager, etc.)

### 6. **Conformité HACCP**
- Contrôles de température des équipements
- Contrôles d'hygiène par zone
- Traçabilité complète
- Alertes en cas d'anomalie

## 📋 Prérequis

- Node.js (v14 ou supérieur)
- npm ou yarn

## 🛠️ Installation

1. **Installer les dépendances du serveur**
```bash
npm install
```

2. **Installer les dépendances du client**
```bash
cd client
npm install
```

## 🚀 Démarrage

### Démarrer le serveur backend (port 5000)
```bash
npm start
```

### Démarrer le client React (port 3000)
```bash
cd client
npm start
```

L'application sera accessible à l'adresse : `http://localhost:3000`

## 📁 Structure du projet

```
Restaurant Emi/
├── server/
│   ├── index.js              # Point d'entrée du serveur
│   ├── database/
│   │   └── db.js             # Configuration et schéma de la base de données
│   └── routes/
│       ├── orders.js         # Routes pour les commandes
│       ├── inventory.js      # Routes pour l'inventaire
│       ├── reservations.js   # Routes pour les réservations
│       ├── staff.js          # Routes pour le personnel
│       ├── reports.js        # Routes pour les rapports
│       ├── haccp.js          # Routes pour HACCP
│       └── tables.js         # Routes pour les tables
├── client/
│   ├── public/
│   └── src/
│       ├── components/       # Composants React
│       ├── App.js           # Composant principal
│       └── App.css          # Styles
├── package.json
└── README.md
```

## 🎨 Technologies utilisées

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **SQLite** - Base de données
- **CORS** - Gestion des requêtes cross-origin

### Frontend
- **React** - Bibliothèque UI
- **React Router** - Navigation
- **Axios** - Client HTTP
- **Recharts** - Graphiques
- **React Icons** - Icônes

## 📊 Base de données

La base de données SQLite contient les tables suivantes :
- `tables` - Tables du restaurant
- `orders` - Commandes
- `inventory` - Inventaire
- `reservations` - Réservations
- `staff` - Personnel
- `staff_schedule` - Planning du personnel
- `staff_leaves` - Congés et absences
- `haccp_temperature_logs` - Contrôles de température
- `haccp_hygiene_checks` - Contrôles d'hygiène
- `menu_items` - Articles du menu

## 🔒 Sécurité

- Variables d'environnement pour les configurations sensibles
- Validation des données côté serveur
- Protection contre les injections SQL

## 📝 API Endpoints

### Commandes
- `GET /api/orders` - Liste des commandes
- `POST /api/orders` - Créer une commande
- `PATCH /api/orders/:id/status` - Mettre à jour le statut
- `DELETE /api/orders/:id` - Supprimer une commande

### Inventaire
- `GET /api/inventory` - Liste des articles
- `POST /api/inventory` - Ajouter un article
- `PUT /api/inventory/:id` - Modifier un article
- `PATCH /api/inventory/:id/restock` - Réapprovisionner
- `DELETE /api/inventory/:id` - Supprimer un article

### Réservations
- `GET /api/reservations` - Liste des réservations
- `POST /api/reservations` - Créer une réservation
- `PUT /api/reservations/:id` - Modifier une réservation
- `PATCH /api/reservations/:id/status` - Mettre à jour le statut
- `DELETE /api/reservations/:id` - Supprimer une réservation

### Personnel
- `GET /api/staff` - Liste du personnel
- `POST /api/staff` - Ajouter un employé
- `PUT /api/staff/:id` - Modifier un employé
- `DELETE /api/staff/:id` - Supprimer un employé

### Rapports
- `GET /api/reports/dashboard` - Statistiques du dashboard
- `GET /api/reports/sales` - Rapport des ventes
- `GET /api/reports/inventory-costs` - Coûts d'inventaire

### HACCP
- `GET /api/haccp/temperature` - Contrôles de température
- `POST /api/haccp/temperature` - Ajouter un contrôle
- `GET /api/haccp/hygiene` - Contrôles d'hygiène
- `POST /api/haccp/hygiene` - Ajouter un contrôle

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.

## 📄 Licence

MIT

## 👨‍💻 Auteur

Développé avec ❤️ pour Restaurant Emi
