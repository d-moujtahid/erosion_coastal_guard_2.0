# 🌊 Erosion-Coastal Guard

> **Système de Monitoring du Recul du Littoral — Agadir & Taghazout**
> Souss-Massa Resilience Prototype · ENSIASD Taroudant · 2025–2026

---

## 📋 Table des matières

- [À propos du projet](#-à-propos-du-projet)
- [Aperçu du dashboard](#-aperçu-du-dashboard)
- [Fonctionnalités principales](#-fonctionnalités-principales)
- [Architecture technique](#-architecture-technique)
- [Base de données](#-base-de-données)
- [Sécurité](#-sécurité)
- [Tests QA — IA vs Manuel](#-tests-qa--ia-vs-manuel)
- [Structure des fichiers](#-structure-des-fichiers)
- [Installation](#-installation)
- [Équipe](#-équipe)

---

## 🎯 À propos du projet

**Erosion-Coastal Guard** est un prototype de système d'information critique développé dans le cadre du **Sujet 9 — Monitoring du recul du littoral**. Il permet de surveiller, analyser et visualiser l'évolution de l'érosion côtière sur la région **Agadir–Taghazout** entre **2016 et 2026**.

Ce projet s'inscrit dans une simulation professionnelle comparant deux approches de développement :

| Équipe | Rôle | Méthode |
|--------|------|---------|
| 👷 **Architects** | Développement classique | Manuel |
| 🤖 **Augmenteds** | Développement assisté | Intelligence Artificielle |

### Chiffres clés du littoral surveillé

| Indicateur | Valeur |
|-----------|--------|
| 🔴 Zones critiques (RED) | 3 |
| 🟠 Zones de vigilance (ORANGE) | 2 |
| 🟢 Zones stables (GREEN) | 1 |
| 📏 Recul maximal 2026 | **3.6 m/an** (Taghazout Nord) |
| 📊 Recul moyen annuel | **2.2 m/an** |
| 🚫 Permis de construction bloqués | **6** |

---

## 🖥️ Aperçu du dashboard
Lien : https://youtu.be/fho3aFMy6dM?si=H1_JfgeiUhm4mnsb

Le dashboard est composé de **6 onglets** principaux :

### 1. 🗺️ Carte 2016 / 2026
Page d'accueil cartographique. Affiche la **superposition des deux traits de côte** (2016 en pointillés, 2026 en trait plein) sur une carte interactive Leaflet centrée sur Agadir et Taghazout. Les marqueurs colorés (🔴🟠🟢) permettent d'identifier visuellement les zones à risque. Un panneau latéral liste les statuts par zone et les alertes récentes.

### 2. 📈 Évolution 10 Ans
Graphiques en courbes montrant la **progression annuelle du recul** de 2016 à 2026 pour chaque ville (Agadir vs Taghazout) et la tendance moyenne globale. Met en évidence l'accélération du phénomène au fil des années.

### 3. 📊 Comparatif 2016 vs 2026
Graphique en **barres doubles** comparant les valeurs de recul par zone, accompagné d'un **tableau delta** récapitulatif. Permet de quantifier l'aggravation zone par zone sur 10 ans.

### 4. 📍 Zones Côtières
Fiche détaillée de chacune des **6 zones surveillées** avec coordonnées GPS, statut, indice d'érosion, permis actifs et autorisation de construction.

### 5. 🚨 Alertes
**Journal chronologique des événements** classés par niveau de criticité (CRITICAL / WARNING / INFO). Toutes les alertes sont horodatées et traçables.

### 6. 🧪 Rapport QA
Tableau comparatif des résultats obtenus par l'approche **manuelle (Architects)** versus l'approche **IA (Augmenteds)**, avec bilan de conformité au Sujet 9.

---

## ✨ Fonctionnalités principales

- **Carte interactive** avec superposition des lignes de côte 2016/2026 (Leaflet.js)
- **Calcul de distance** via l'algorithme de Haversine (précision < 0.3 m)
- **Système d'alertes automatiques** avec 3 niveaux de criticité
- **Blocage automatique des permis** de construction en zone RED
- **Graphiques dynamiques** de l'évolution temporelle (Chart.js)
- **Tableau comparatif** IA vs Manuel avec rapport de QA intégré
- **Journal d'audit** immuable pour la traçabilité complète

---

## 🏗️ Architecture technique

```
Erosion-Coastal Guard
│
├── Frontend          → React.js + Leaflet + Chart.js
├── Backend           → Node.js / Express (API REST)
├── Base de données   → MySQL (procédures stockées + triggers)
└── Sécurité          → RBAC + Audit Log + Anti-SQLi
```

### Stack technologique

| Couche | Technologie |
|--------|------------|
| Interface utilisateur | React.js |
| Cartographie | Leaflet.js |
| Graphiques | Chart.js |
| API Backend | Node.js / Express |
| Base de données | MySQL |
| Calcul de distance | Algorithme Haversine |

---

## 🗄️ Base de données

Le schéma suit la méthodologie **MERISE (MCD/MLD)** et comprend les tables principales suivantes :

```sql
-- Zones côtières surveillées
CREATE TABLE zones_cotieres (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    nom         VARCHAR(100) NOT NULL,
    localite    VARCHAR(50) NOT NULL,
    latitude    DECIMAL(9,6) NOT NULL,
    longitude   DECIMAL(9,6) NOT NULL,
    statut      ENUM('RED','ORANGE','GREEN') DEFAULT 'GREEN',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mesures GPS de recul
CREATE TABLE mesures_recul (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    zone_id     INT NOT NULL,
    annee       YEAR NOT NULL,
    recul_m_an  DECIMAL(5,2) NOT NULL,
    source      ENUM('GPS','SATELLITE','MANUEL'),
    FOREIGN KEY (zone_id) REFERENCES zones_cotieres(id)
);

-- Permis de construction
CREATE TABLE permis (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    zone_id     INT NOT NULL,
    statut      ENUM('EN_ATTENTE','AUTORISE','BLOQUE') DEFAULT 'EN_ATTENTE',
    FOREIGN KEY (zone_id) REFERENCES zones_cotieres(id)
);

-- Journal d'audit (immuable)
CREATE TABLE audit_log (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    action      VARCHAR(255) NOT NULL,
    utilisateur VARCHAR(100),
    horodatage  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Trigger de blocage automatique

```sql
-- Blocage automatique si recul > 2 m/an (zone RED)
DELIMITER $$
CREATE TRIGGER trg_block_permis
AFTER UPDATE ON zones_cotieres
FOR EACH ROW
BEGIN
    IF NEW.statut = 'RED' THEN
        UPDATE permis
        SET statut = 'BLOQUE'
        WHERE zone_id = NEW.id AND statut = 'EN_ATTENTE';
    END IF;
END$$
DELIMITER ;
```

---

## 🔐 Sécurité

La sécurité implémentée suit le principe de **sécurité minimale suffisante** :

### RBAC — Contrôle d'accès par rôle

| Rôle | Droits |
|------|--------|
| `ADMIN` | Lecture + Écriture + Gestion utilisateurs |
| `ANALYST` | Lecture + Ajout de mesures |
| `VIEWER` | Lecture seule |

### Audit Log immuable
Toutes les actions critiques (ajout de mesure, changement de statut, blocage de permis) sont enregistrées avec horodatage et identifiant utilisateur. Le log est en **écriture seule** — aucune suppression n'est autorisée.

### Protection Anti-SQLi
Toutes les requêtes utilisent des **requêtes préparées** (prepared statements) pour prévenir les injections SQL.

---

## 🧪 Tests QA — IA vs Manuel

Le Rapport QA compare les résultats des deux équipes sur 8 tests critiques :

| Test | Résultat Manuel | Résultat IA | Delta | Statut |
|------|----------------|-------------|-------|--------|
| Haversine identique | 0 | 0 | 0.00 m | ✅ PASS |
| Agadir → Taghazout | 18512.4 m | 18512.1 m | 0.3 m | ✅ PASS |
| Recul 200m / 10 ans | 200.08 | 200.04 | 0.04 m | ✅ PASS |
| Recul 50m / 10 ans | 50.03 | 50.01 | 0.02 m | ✅ PASS |
| Seuil > 2m → RED | RED | RED | Match | ✅ PASS |
| Seuil 1–2m → ORANGE | ORANGE | ORANGE | Match | ✅ PASS |
| Trigger RED block | BLOCK | BLOCK | Match | ✅ PASS |
| Coords hors Souss | REJECT | REJECT | Match | ✅ PASS |

### Synthèse

- **Précision Haversine** : IA ≈ Manuel (Δ < 0.3 m) ✅
- **Classification zones** : 100% de concordance ✅
- **Hallucinations IA** : 0 erreur critique ✅
- **Performance SQL** : < 50ms / requête ✅
- **Cohérence SGBD** : MySQL uniforme ✅

---

## 📁 Structure des fichiers

```
erosion-coastal-guard/
│
├── public/
│   └── index.html
│
├── src/
│   ├── components/
│   │   ├── MapView.jsx          # Carte Leaflet 2016/2026
│   │   ├── Evolution.jsx        # Graphiques Chart.js
│   │   ├── Comparatif.jsx       # Barres comparatives
│   │   ├── ZonesCotieres.jsx    # Fiches zones
│   │   ├── Alertes.jsx          # Journal alertes
│   │   └── RapportQA.jsx        # Rapport IA vs Manuel
│   │
│   ├── utils/
│   │   └── haversine.js         # Algorithme Haversine
│   │
│   └── App.jsx
│
├── database/
│   ├── schema.sql               # Création des tables
│   ├── seed.sql                 # Données mock GPS
│   └── triggers.sql             # Triggers et procédures
│
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/ensiasd/erosion-coastal-guard.git
cd erosion-coastal-guard

# 2. Installer les dépendances
npm install

# 3. Configurer la base de données
cp .env.example .env
# Renseigner les variables DB_HOST, DB_USER, DB_PASS, DB_NAME

# 4. Initialiser la base de données
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
mysql -u root -p < database/triggers.sql

# 5. Lancer le projet
npm start
```

Le dashboard sera disponible sur `http://localhost:3000`

---

## 👥 Équipe

| Équipe | Rôle | Description |
|--------|------|-------------|
| 👷 **Architects** | Développement Manuel | Conception BDD, SQL, logique métier |
| 🤖 **Augmenteds** | Développement IA | Génération assistée, tests, QA |

> Projet encadré dans le cadre du programme **SIBD — ENSIASD Taroudant**
> Année universitaire **2025–2026**

---

## 📜 Conformité Sujet 9

| Critère | Statut |
|---------|--------|
| Monitoring GPS côte 2016/2026 | ✅ OK |
| Procédure Haversine 10 ans | ✅ OK |
| Trigger construction RED | ✅ OK |
| Dashboard interactif | ✅ OK |
| Superposition 2016 vs 2026 | ✅ OK |
| Sécurité RBAC + audit log | ✅ OK |
| QA IA vs Manuel | ✅ OK |
| Site web scientifique | ✅ OK |

---

*🌊 Erosion-Coastal Guard — Souss-Massa Resilience Prototype — 2025/2026*
