# 🌊 Erosion Coastal Guard

> Plateforme de monitoring du recul du trait de côte pour **Agadir** et **Taghazout**.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8+-4479A1?style=flat-square&logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-F7B731?style=flat-square&logo=jsonwebtokens&logoColor=white)
![License](https://img.shields.io/badge/Licence-ISC-blue?style=flat-square)

---

## 📌 Présentation

**Erosion Coastal Guard** est un prototype de résilience littorale orienté exploitation terrain et pilotage décisionnel. Le système fournit une vue opérationnelle et scientifique sur :

- 🟢 Les **segments côtiers** et leur statut (stable, modéré, critique)
- 📍 Les **mesures GPS** et le recul annuel estimé
- 🔔 Les **alertes** et la traçabilité des opérations via un journal d'audit

### Périmètre géographique & temporel

| Aspect | Détail |
|---|---|
| Zones couvertes | Agadir, Taghazout |
| Période analysée | 2016 – 2026 |

---

## 🛠️ Stack Technique

| Couche | Technologie |
|---|---|
| Backend | Node.js, Express |
| Base de données | MySQL 8+ |
| Authentification | JWT |
| Autorisation | RBAC (rôles en base) |
| Frontend | HTML, CSS, JavaScript (Leaflet, Chart.js) |

---

## 🚀 Démarrage Rapide

### Prérequis

- Node.js **18+**
- npm
- MySQL **8+**

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer les variables d'environnement

Copier `.env.example` vers `.env` et renseigner les valeurs :

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=erosion_coastal_guard
DB_USER=root
DB_PASSWORD=

JWT_SECRET=change_me
JWT_EXPIRES_IN=8h

FRONTEND_URL=http://localhost:5000
```

### 3. Initialiser la base de données

Exécuter les scripts **dans cet ordre** :

```bash
# 1. Créer le schéma
mysql -u root -p < database/schema.sql

# 2. Injecter les données de seed
mysql -u root -p < database/seed.sql
```

> 💡 Des variantes **scénario B** sont également disponibles dans le dossier `database/`.

### 4. Lancer l'application

```bash
# Mode production
npm start

# Mode développement (nodemon)
npm run dev
```

Ouvrir ensuite : [http://localhost:5000](http://localhost:5000)

---

## 👤 Comptes de Test (QA)

**Mot de passe commun :** `Test2025!`

| Email | Rôle |
|---|---|
| admin@erosion.ma | super_admin |
| scientist@erosion.ma | scientist |
| analyst@erosion.ma | analyst |
| operator@erosion.ma | operator |
| viewer@erosion.ma | viewer |

---

## 🔐 Rôles & Permissions (RBAC)

| Rôle | Lecture | Écriture | Administration | Audit |
|---|:---:|:---:|:---:|:---:|
| `super_admin` | ✅ | ✅ | ✅ | ✅ |
| `scientist` | ✅ | ✅ (métier) | ❌ | ❌ |
| `operator` | ✅ | ✅ (alertes/mesures) | ❌ | ❌ |
| `analyst` | ✅ | ❌ | ❌ | ❌ |
| `viewer` | ✅ | ❌ | ❌ | ❌ |

> Le contrôle d'accès est vérifié côté API via middleware RBAC dynamique.

---

## ✨ Fonctionnalités Principales

- **Authentification** sécurisée par JWT
- **RBAC dynamique** chargé depuis la base de données
- **Tableau de bord** : KPI, indicateurs de recul, statut des zones
- **Cartographie interactive** (Leaflet) avec couches de visualisation
- **Suivi des segments** côtiers avec niveaux de risque
- **Gestion des mesures GPS** et visualisations associées
- **Gestion des alertes** et suivi de traitement
- **Journal d'audit** pour la traçabilité complète des opérations
- **Console administrateur** pour la gouvernance des utilisateurs

---

## 📁 Structure du Projet

```
erosion-coastal-guard/
├── config/          # Configuration technique (connexion BDD)
├── controllers/     # Orchestration des règles métier
├── middleware/      # Auth, autorisation (JWT + RBAC)
├── models/          # Accès aux données, requêtes SQL
├── routes/          # Exposition des endpoints API
├── database/        # schema.sql, seed.sql, triggers
└── frontend/        # Interface de supervision (HTML/CSS/JS)
```

### Organisation fonctionnelle

| Domaine | Composants |
|---|---|
| Auth & Sécurité | JWT, RBAC, journal d'audit |
| Données métier | Segments, mesures GPS, alertes |
| Reporting | KPI, visualisations, synthèses |
| Administration | Gestion utilisateurs, consultation logs |

---

## 🧪 Checklist QA — Branche `First-QA-Action`

- [ ] Connexion avec chaque rôle de test
- [ ] Vérification des permissions par rôle (pages + actions)
- [ ] Création, édition, suppression des entités autorisées
- [ ] Présence des traces dans les journaux d'audit
- [ ] Affichage correct des cartes et graphiques après navigation

---

## 🔧 Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| Erreur accès MySQL refusé | Mauvaises credentials BDD | Vérifier `DB_USER` / `DB_PASSWORD` dans `.env` |
| Erreur JWT | Secret absent ou invalide | Vérifier `JWT_SECRET` et relancer le serveur |
| Page vide / données absentes | Migration non appliquée | Réappliquer `schema.sql` puis `seed.sql` ; tester `/api/health` |

---

## 🔒 Sécurité — Recommandations Production

- Remplacer `JWT_SECRET` par une valeur aléatoire forte (min. 64 caractères)
- Modifier tous les mots de passe des comptes de seed
- Restreindre `FRONTEND_URL` au domaine de production
- Limiter les accès réseau à la base de données (firewall, VPC)

---

## 📜 Licence

Distribué sous licence **ISC**.