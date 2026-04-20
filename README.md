# 🌊 EROSION-COASTAL GUARD

> **Monitoring du Recul du Trait de Côte — Agadir & Taghazout**  
> Analyse décennale 2016 → 2026 · Souss-Massa Resilience Prototype

---

[![ENSIASD Taroudant](https://img.shields.io/badge/École-ENSIASD%20Taroudant-0057A8?style=flat-square)](https://ensiasd.ma)
[![MySQL 8.0](https://img.shields.io/badge/SGBD-MySQL%208.0+-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://dev.mysql.com)
[![React 18](https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Leaflet.js](https://img.shields.io/badge/Carte-Leaflet.js-199900?style=flat-square)](https://leafletjs.com)
[![Statut](https://img.shields.io/badge/Statut-Phases%201%20à%208%20complètes-brightgreen?style=flat-square)]()

---

## 📋 Informations Académiques

| Champ              | Valeur                                          |
|--------------------|-------------------------------------------------|
| **Projet**         | Erosion-Coastal Guard — Sujet 9                 |
| **Programme**      | Souss-Massa Resilience Prototype                |
| **Module**         | SIBD — Systèmes d'Information & Bases de Données |
| **Encadrant**      | Pr. S. EL-ATEIF                                 |
| **Équipe**         | Équipe 9 · Architects + Augmenteds              |
| **Année**          | 2025 – 2026                                     |
| **Période analysée** | 2016 → 2026 (10 ans de recul côtier)          |
| **Soumission**     | Février 2026                                    |

---

## 🎯 Objectif du Projet

Ce projet constitue une **simulation professionnelle de grande envergure** pour le module SIBD. L'objectif est de concevoir un **prototype de système d'information critique** pour le monitoring du recul du littoral dans la région d'**Agadir & Taghazout**.

Le projet compare deux approches méthodologiques :

- 🏛️ **Architects (Manuel)** — Conception traditionnelle, rigueur de conformité, cohérence SGBD, nommage précis des colonnes temporelles (`lat_2016` / `lat_2026`), tests unitaires systématiques.
- 🤖 **Augmenteds (IA)** — Génération accélérée par IA, production rapide de code SQL/React, nécessitant une validation humaine pour la conformité au sujet.

> **Conclusion comparative** : L'IA reste un outil d'accélération puissant. La supervision humaine est indispensable pour la rigueur scientifique et académique.

---

## 🏗️ Architecture du Système

```
erosion-coastal-guard/
│
├── 📁 database/
│   ├── schema.sql            # 10 tables MySQL 8.0, index GPS, seeds zones
│   ├── procedures.sql        # Haversine, calculate_retreat(), triggers RBAC
│   └── seeds.sql             # Données mockées 2016/2026 — Agadir & Taghazout
│
├── 📁 backend/
│   ├── server.js             # API Node.js (requêtes paramétrées anti-SQLi)
│   ├── rbac.js               # RBAC minimal — 5 rôles, audit_log immutable
│   └── routes/
│       ├── zones.js
│       ├── measurements.js
│       └── alerts.js
│
├── 📁 frontend/
│   ├── src/
│   │   ├── Dashboard.jsx     # Dashboard scientifique — 6 onglets
│   │   ├── CoastalMap.jsx    # Carte Leaflet — superposition 2016 vs 2026
│   │   └── Charts.jsx        # Recharts — évolution décennale + comparatif
│   └── public/
│
├── 📁 docs/
│   ├── MCD_MERISE.png        # Modèle Conceptuel de Données (9 entités)
│   ├── MLD_3FN.png           # Modèle Logique de Données (10 tables, 3FN)
│   └── Rapport_QA_IA_vs_Manuel.md
│
├── 📁 tests/
│   └── haversine_tests.md    # Tests T1 → T8 (validation calcul recul GPS)
│
└── README.md
```

---

## 🗄️ Stack Technique

| Couche         | Technologie                    | Usage                                         |
|----------------|-------------------------------|-----------------------------------------------|
| **SGBD**       | MySQL 8.0+                    | Schéma, procédures, triggers, RBAC            |
| **Backend**    | Node.js / Express             | API REST, anti-SQLi, gestion des rôles        |
| **Frontend**   | React 18                      | Dashboard scientifique interactif             |
| **Cartographie** | Leaflet.js                  | Superposition lignes de côte 2016 / 2026      |
| **Graphiques** | Recharts                      | Évolution décennale, comparatif zones          |
| **Algorithme** | Haversine                     | Calcul de distance GPS (recul en m/an)         |
| **Sécurité**   | RBAC + Audit Log + Anti-SQLi  | Sécurité minimale conforme au sujet            |

---

## 📦 Phases du Projet

### Phase 1 — Analyse & Conception
- **Tâche 1** — MCD MERISE : 9 entités, associations, cardinalités
- **Tâche 2** — MLD 3FN : 10 tables, règles de passage MCD → MLD

> Les entités clés : `COASTAL_ZONES`, `COASTLINE_HISTORY` (tracé GPS 2016), `COASTLINE_POINTS` (mesures 2026), `ALERTS`, `USERS`, `ROLES`, `PERMITS`, `MEASUREMENTS`, `IOT_SENSORS`, `AUDIT_LOG`.

### Phase 2 — Base de Données SQL
- **Tâche 3** — Schéma complet MySQL 8.0 : 10 tables, index GPS, seeds zones Agadir/Taghazout

### Phase 3 — Logique Métier (Procédures Stockées)
- **Tâche 4** — Fonction Haversine : `fn_haversine()` + `proc_calcul_recul` 2016 → 2026
- **Tâche 5** — Classification automatique : `GREEN` / `ORANGE` / `RED` + alerte auto
- **Tâche 6** — Pipeline complet : `compute_and_store_retreat()`

> Seuils de classification :  
> 🟢 `< 1.0 m/an` = **GREEN** · 🟠 `1.0 – 2.0 m/an` = **ORANGE** · 🔴 `> 2.0 m/an` = **RED**

### Phase 4 — Sécurité (Triggers MySQL)
- **Tâche 7** — `BEFORE INSERT` : blocage permis en zone RED (`trg_block_red_zone_permit`)
- **Tâche 8** — `AFTER UPDATE` : audit log + déclenchement alerte IoT

### Phase 5 — Sécurité Avancée
- **Tâche 9** — RBAC minimal : 5 rôles, audit log immutable
- **Tâche 10** — Anti-injection SQL : requêtes paramétrées Node.js

### Phase 6 — Frontend Dashboard
- **Tâche 11** — Carte interactive SVG : superposition lignes de côte **2016 vs 2026**
- **Tâche 12** — Graphiques Recharts : évolution décennale + tableau comparatif delta

### Phase 7 — QA & Tests
- **Tâche 13** — Tests Haversine T1 → T8 (validation calcul recul GPS 2016 → 2026)



---

## 🔐 Sécurité (RBAC Minimal)

Cinq rôles sont définis avec des permissions par flag booléen :

| Rôle              | Lecture | Écriture | Admin | Alerte | Audit |
|-------------------|:-------:|:--------:|:-----:|:------:|:-----:|
| `admin`           | ✅      | ✅       | ✅    | ✅     | ✅    |
| `scientist`       | ✅      | ✅       | ❌    | ✅     | ❌    |
| `operator`        | ✅      | ✅       | ❌    | ❌     | ❌    |
| `viewer`          | ✅      | ❌       | ❌    | ❌     | ❌    |
| `auditor`         | ✅      | ❌       | ❌    | ❌     | ✅    |

**Mesures de sécurité appliquées :**
- Audit log immutable (INSERT uniquement, pas de UPDATE/DELETE)
- Requêtes paramétrées Node.js (protection anti-SQLi)
- Trigger `BEFORE INSERT` bloquant les permis en zone RED

---

## 🧮 Algorithme Haversine

Le recul côtier est calculé par la formule de **Haversine** qui mesure la distance orthodromique entre deux points GPS (2016 et 2026) sur la surface de la Terre.

```sql
-- Exemple d'appel MySQL
CALL calculate_retreat(
  p_lat_2016 => 30.4278,  -- Latitude Agadir 2016
  p_lon_2016 => -9.5981,
  p_lat_2026 => 30.4265,  -- Latitude Agadir 2026 (recul simulé)
  p_lon_2026 => -9.5990,
  p_years    => 10
);
-- Résultat : recul en m/an → classification GREEN/ORANGE/RED
```

**Tests de validation (T1 → T8) :** distances connues, cas limites (`p_years = 0` → signal d'erreur SQLSTATE 45000), cohérence 2016/2026.

---

## 🗺️ Dashboard — Aperçu des Fonctionnalités

Le dashboard React comporte **6 onglets** :

1. **🗺️ Carte Côtière** — Superposition SVG ligne 2016 (bleue) vs ligne 2026 (rouge) avec zones de recul colorées
2. **📈 Évolution Décennale** — Graphique Recharts : recul moyen annuel par zone
3. **⚠️ Alertes Actives** — Liste des zones RED avec timestamp et cause
4. **📊 Comparatif Zones** — Tableau delta recul par zone (Agadir / Taghazout)
5. **🔐 Audit Log** — Journal d'accès et modifications (rôle `auditor` uniquement)

---

## ⚙️ Installation & Démarrage

### Prérequis
- Node.js 18+
- MySQL 8.0+
- npm ou yarn

### 1. Cloner le dépôt
```bash
git clone https://github.com/equipe9-ensiasd/erosion-coastal-guard.git
cd erosion-coastal-guard
```

### 2. Base de données
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p erosion_db < database/procedures.sql
mysql -u root -p erosion_db < database/seeds.sql
```

### 3. Backend
```bash
cd backend
npm install
cp .env.example .env   # Configurer DB_HOST, DB_USER, DB_PASS
node server.js
```

### 4. Frontend
```bash
cd frontend
npm install
npm start
# → http://localhost:3000
```

---

## 🧪 Tests QA — Rapport Comparatif

| Test | Composant                  | Résultat  | Note                                     |
|------|---------------------------|-----------|------------------------------------------|
| T1   | Haversine distance nulle  | ✅ PASS   | 0 m/an → GREEN                          |
| T2   | Recul < 1.0 m/an          | ✅ PASS   | Classification GREEN correcte           |
| T3   | Recul 1.0 – 2.0 m/an      | ✅ PASS   | Classification ORANGE correcte          |
| T4   | Recul > 2.0 m/an          | ✅ PASS   | Classification RED + alerte déclenchée  |
| T5   | `p_years = 0`             | ✅ PASS   | SIGNAL SQLSTATE 45000 levé              |
| T6   | Permis en zone RED        | ✅ PASS   | Trigger BEFORE INSERT bloque            |
| T7   | Audit log AFTER UPDATE    | ✅ PASS   | Condition `IF OLD <> NEW` vérifiée      |
| T8   | Anti-SQLi Node.js         | ✅ PASS   | Requête paramétrée, SQLSTATE géré       |

---


---

## ✅ Conformité Sujet 9

| Exigence                   | Implémentation                        | Statut   |
|----------------------------|---------------------------------------|----------|
| Monitoring côte 2016→2026  | GPS `coastline_history` + `coastline_points` | ✅ OK |
| Procédure recul Haversine  | `calculate_retreat(lat_2016, lat_2026)` | ✅ OK  |
| Trigger construction RED   | `trg_block_red_zone_permit`           | ✅ OK    |
| Dashboard interactif       | `ErosionDashboard.jsx` — 6 onglets    | ✅ OK    |
| Superposition 2016/2026    | SVG coast2016 + coast2026 + zone recul | ✅ OK   |
| Sécurité RBAC + audit      | 5 rôles + audit_log immutable         | ✅ OK    |
| QA IA vs Manuel            | Tests T1→T8 + rapport comparatif      | ✅ OK    |
| Site web scientifique      | React + Recharts + Leaflet            | ✅ OK    |

---

## 👥 Équipe

**Équipe 9 — ENSIASD Taroudant**

| Pôle          | Responsabilités                                      |
|---------------|------------------------------------------------------|
| 🏛️ **Architects** | MCD/MLD, SQL MySQL, triggers, tests QA, conformité sujet |

**Encadrant :** Pr. S. EL-ATEIF — Module SIBD 2025-2026

---

## 📄 Licence

Projet académique — **ENSIASD Taroudant** · Souss-Massa Resilience Prototype  
Usage pédagogique uniquement · Année 2025–2026

---
