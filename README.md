# 🌊 EROSION-COASTAL GUARD

> **Monitoring du Recul du Trait de Côte — Agadir & Taghazout**  
> Analyse décennale 2016 → 2026 · Souss-Massa Resilience Prototype

---

[![ENSIASD Taroudant](https://img.shields.io/badge/École-ENSIASD%20Taroudant-0057A8?style=flat-square)](https://ensiasd.ma)
[![MySQL 8.0](https://img.shields.io/badge/SGBD-MySQL%208.0+-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://dev.mysql.com)
[![Leaflet.js](https://img.shields.io/badge/Carte-Leaflet.js-199900?style=flat-square)](https://leafletjs.com)
[![Statut](https://img.shields.io/badge/Statut-Phases%201%20à%208%20complètes-brightgreen?style=flat-square)]()

---

## 📋 Informations Académiques

| Champ                | Valeur                                            |
|----------------------|---------------------------------------------------|
| **Projet**           | Erosion-Coastal Guard — Sujet 9                   |
| **Programme**        | Souss-Massa Resilience Prototype                  |
| **Encadrant**        | Pr. S. EL-ATEIF                                   |
| **Année**            | 2025 – 2026                                       |
| **Période analysée** | 2016 → 2026 (10 ans de recul côtier)              |
| **Soumission**       | Février 2026                                      |
| **SGBD**             | MySQL 8.0+                                        |
| **Frontend**         | HTML + Leaflet.js + Chart.js                      |
| **Sécurité**         | JWT + RBAC + Audit Log + Anti-SQLi                |

---

## 👥 Équipes du Projet

### 🏛️ Équipe Architects — Conception & Développement Manuel
> Dossier : `architects/` · Branche : `main`

Responsabilités : MCD/MLD MERISE, schéma MySQL 8.0, procédures stockées Haversine, triggers de sécurité, API Node.js/Express, dashboard frontend Leaflet + Chart.js, middleware JWT + RBAC 5 rôles.

| Nom | Rôle |
|-----|------|
| **MOUJTAHID Donia** | Lead Architect — BDD & API |
| **MZILI Amal** | Conception MCD/MLD & SQL |
| **NAJIBE Ghizlane** | Frontend & Documentation |

---

### 🤖 Équipe IA-Augmented — Développement Assisté par IA
> Dossier : `ia-augmented/` · Branche : `main`

Responsabilités : génération de code assistée par IA (Python/Flask), SQL schema IA-généré, frontend IA, rapport de transparence IA, analyse comparative Augmenteds vs Architects.

| Nom | Rôle |
|-----|------|
| **NAJIM H. M. HAYTEM** | Lead IA — Backend Python |
| **OTMANE Salma** | Génération SQL & Prompts IA |
| **OUDAOUD O. NAJAT** | Frontend IA & Rapport transparence |

---

### 🔴 Équipe Red Team — Audit & Attaque
> Branche : `Red-Team-Audit`

Responsabilités : tests de pénétration, audit des vulnérabilités SQL (injection, contournement RBAC), rapport d'attaque, identification des failles dans les triggers et l'API.

| Nom | Rôle |
|-----|------|
| **UDRA Youssef** | Lead Red Team — Pentest |
| **OUTAKHROUFT Y.** | Audit SQL & Rapport d'attaque |

---

### 🔵 Équipe Blue Team — Configuration & Défense
> Branche : `Blue-Team-Modification`

Responsabilités : hardening de la sécurité, protection brute-force (`bruteForce.js`), sécurisation JWT (`jwtSecurity.js`), middleware de défense (`security.js`), configuration production.

| Nom | Rôle |
|-----|------|
| **QOLQAZI Anas** | Lead Blue Team — Sécurité |
| **RAMI Saad** | Hardening & Configuration défensive |

---

### 🟢 Équipe QA Engineers — Tests & Validation IA
> Dossier : `qa-reports/` · Branche : `First-QA-Action`

Responsabilités : tests unitaires Haversine T1→T8, rapport QA comparatif IA vs Manuel, checklist de recette, rapport de précision GPS, validation de la conformité au Sujet 9, rapport de transparence IA.

| Nom | Rôle |
|-----|------|
| **RARHAI Houssam** | Lead QA — Tests Haversine & Validation |
| **SABRI Ahmed Amine** | Rapport QA & Transparence IA |

**Livrables QA (branche `First-QA-Action`) :**
- `rapport_qa.md` — Tests unitaires T1→T8 complets
- `rapport_precision_gps.md` — Validation coordonnées GPS Agadir/Taghazout
- `checklist_recette.md` — Conformité complète Sujet 9
- `rapport_transparence_ai.md` — Analyse comparative IA vs Manuel

---

## 🏗️ Architecture du Repo

```
erosion_coastal_guard_2/
│
├── 🏛️ architects/              ← Équipe Architects (Node.js/Express)
│   ├── config/database.js       Pool MySQL — connexion partagée
│   ├── controllers/             alerteController, authController, ...
│   ├── database/                schema.sql · triggers.sql · seed.sql
│   ├── docs/                    MCD, MLD, analyse-besoin
│   ├── frontend/                Leaflet + Chart.js (dashboard)
│   ├── middleware/              auth.js (JWT) · rbac.js (5 rôles)
│   ├── models/ + routes/        MVC complet
│   └── server.js                API Express — port 5000
│
├── 🤖 ia-augmented/            ← Équipe IA-Augmented (Python/Flask)
│   ├── backend/                 app.py · test_api.py
│   ├── frontend/                Version HTML générée par IA
│   ├── sql/                     01-schema.sql (version IA)
│   └── docs/                    Rapport transparence IA
│
├── 🟢 qa-reports/              ← Équipe QA Engineers
│   ├── rapport_qa.md            Tests T1→T8
│   ├── rapport_precision_gps.md Validation GPS
│   ├── checklist_recette.md     Conformité Sujet 9
│   └── rapport_transparence_ai.md
│
├── First-QA-Action/            ← Contenu branche QA intégré
│
├── README.md
└── .gitignore
```

---

## 🗄️ Stack Technique

| Couche | Équipe | Technologie | Usage |
|--------|--------|-------------|-------|
| **SGBD** | Architects | MySQL 8.0+ | Schéma, procédures, triggers |
| **Backend** | Architects | Node.js / Express | API REST, JWT, RBAC |
| **Backend IA** | IA-Augmented | Python / Flask | API générée par IA |
| **Frontend** | Architects | HTML + Leaflet.js + Chart.js | Dashboard interactif |
| **Algorithme** | Architects | Haversine | Calcul recul GPS (m/an) |
| **Sécurité** | Blue Team | JWT + bruteForce + RBAC | Hardening complet |
| **Tests** | QA Engineers | Tests manuels T1→T8 | Validation Haversine |
| **Audit** | Red Team | Pentest SQL/API | Détection vulnérabilités |

---

## 🔐 Sécurité — RBAC Minimal (5 rôles)

| Rôle | Lecture | Écriture | Admin | Audit |
|------|:-------:|:--------:|:-----:|:-----:|
| `super_admin` | ✅ | ✅ | ✅ | ✅ |
| `scientist` | ✅ | ✅ | ❌ | ❌ |
| `analyst` | ✅ | ❌ | ❌ | ❌ |
| `operator` | ✅ | ✅ | ❌ | ❌ |
| `viewer` | ✅ | ❌ | ❌ | ❌ |

---

## 🧮 Seuils de Classification Côtière

| Recul annuel | Classification | Action |
|---|---|---|
| `< 1.0 m/an` | 🟢 **GREEN** | Surveillance normale |
| `1.0 – 2.0 m/an` | 🟠 **ORANGE** | Alerte — surveillance renforcée |
| `> 2.0 m/an` | 🔴 **RED** | Critique — permis bloqués automatiquement |

---

## 🧪 Tests QA — Résultats (Équipe QA Engineers)

| Test | Description | Résultat |
|------|-------------|----------|
| T1 | Distance nulle → 0 m/an | ✅ GREEN |
| T2 | Recul < 1.0 m/an | ✅ GREEN |
| T3 | Recul 1.0 – 2.0 m/an | ✅ ORANGE |
| T4 | Recul > 2.0 m/an | ✅ RED + alerte |
| T5 | `p_years = 0` → SIGNAL erreur | ✅ SQLSTATE 45000 |
| T6 | Permis en zone RED → bloqué | ✅ BEFORE INSERT |
| T7 | Audit log AFTER UPDATE | ✅ IF OLD <> NEW |
| T8 | Anti-SQLi Node.js paramétré | ✅ SQLSTATE géré |

---

## ⚙️ Installation

```bash
# 1. Cloner le repo
git clone https://github.com/d-moujtahid/erosion_coastal_guard_2.git
cd erosion_coastal_guard_2/architects

# 2. Base de données (XAMPP démarré)
mysql -u root -p < database/schema.sql
mysql -u root -p erosion_coastal_guard < database/triggers.sql
mysql -u root -p erosion_coastal_guard < database/seed.sql

# 3. Backend
npm install
cp .env.example .env
node server.js
# → http://localhost:5000
```

---

## ✅ Conformité Sujet 9

| Exigence | Implémentation | Statut |
|----------|---------------|--------|
| Monitoring côte 2016→2026 | `coastline_history` + `coastline_points` | ✅ |
| Procédure Haversine | `calculate_retreat(lat_2016, lat_2026)` | ✅ |
| Trigger zone RED | `trg_block_red_zone_permit` | ✅ |
| Dashboard interactif | Leaflet + Chart.js | ✅ |
| Superposition 2016/2026 | Carte couches historique/actuelle | ✅ |
| Sécurité RBAC + audit | 5 rôles + audit_log immutable | ✅ |
| QA IA vs Manuel | Tests T1→T8 + rapport comparatif | ✅ |

---
---

## 🎥 Démonstration vidéo
### 🏛️ Équipe Architects : https://youtu.be/fho3aFMy6dM?si=PgFCRQMXiBc_P47M
### 🤖 Équipe IA-Augmented  : https://youtu.be/ydt-AJuuXa4?si=8G1uCs06GYY4h1Kr

---
*Projet académique — ENSIASD Taroudant · Souss-Massa Resilience Prototype · 2025–2026*  
*Encadrant : Pr. S. EL-ATEIF | Module SIBD*
