# Rapport de transparence AI - Prompts de developpement

Date: 2026-04-14
Projet: Erosion Coastal Guard
Perimetre: prompts utilises pendant le developpement du projet (hors prompts de ce chat)

## 1) Objet

Ce document presente une vision consolidee des prompts de developpement utilises sur le projet.
Il ne reproduit pas les prompts bruts mot a mot, mais decrit les familles de demandes, les resultats obtenus, les erreurs observees et les corrections appliquees.

## 2) Prompts de developpement

### 2.1 Backend API et architecture

Intentions de prompts:

- Generer/adapter des routes REST pour segments, mesures, alertes, users, audit, sensors, permits.
- Structurer controllers/models/routes avec separation des responsabilites.

Corrections appliquees:

- Reactivation de routes manquantes (dashboard).
- Alignement des reponses API avec les besoins UI.

### 2.2 RBAC, JWT et securite applicative

Intentions de prompts:

- Implementer auth JWT et permissions par role.
- Rendre le RBAC pilote par base (et non hardcode frontend).

Corrections appliquees:

- Suppression des mappings statiques de roles cote UI.
- Ajustement des droits de lecture/ecriture selon roles effectifs.

### 2.3 Dashboard data-driven et visualisation

Intentions de prompts:

- Remplacer les valeurs fixes par des donnees SQL reelles.
- Connecter KPI, graphiques et rapports a l'API.

Corrections appliquees:

- Correction des glitches cartographiques (isolation des couches Leaflet).
- Stabilisation du rendu chart apres chargement asynchrone.

### 2.4 Logique metier recul cotier

Intentions de prompts:

- Calculer correctement le recul annuel a partir de coordonnees GPS.
- Synchroniser segments/mesures/dashboard avec la derniere mesure valide.

Corrections appliquees:

- Correction des cas ou le recul restait a 0.
- Priorisation de la derniere mesure par identifiant metier.

### 2.5 Integrite des donnees et automatisations SQL

Intentions de prompts:

- Eviter les zones sans point courant.
- Auto-creer des points dans certains workflows.

Corrections appliquees:

- Renforcement des scenarios transactionnels de suppression/edition.

### 2.6 Audit et tracabilite

Intentions de prompts:

- Tracer les actions critiques (users/segments/mesures/alertes/login).
- Exposer une lecture securisee des logs d'audit.

Corrections appliquees:

- Ajout d'une vue admin en lecture seule pour audit logs.

### 2.7 UX admin et productivite front

Intentions de prompts:

- Remplacer prompts natifs(HTML) par formulaires/modales propres.
- Ajouter console admin pour users/segments/sensors/permits.

Corrections appliquees:

- Realignement des boutons/actions selon permissions RBAC.
- Restauration de session JWT au refresh.

## 3) Erreurs/hallucinations de generation detectees (niveau projet)

- Valeurs hardcodees cote UI en contradiction avec la base.
- Incoherences de permissions entre token, backend et frontend.
- Cas metiers incomplets (zone creee sans point courant).
- Incoherence de selection de mesure (pas toujours la plus recente metier).
- Endpoints prevus mais non exposes initialement.

## 4) Corrections structurelles appliquees

- Passage a une logique principalement DB-driven (donnees + permissions).
- Renforcement RBAC sur endpoints sensibles.
- Uniformisation des flux API vers frontend.
- Ajout/extension de modules sensors et permits.
- Durcissement de la suppression et de l audit.

## 5) Impact sur le livrable QA

Etat courant de verification:

- Total checks: 15
- Valides: 15
- Non valides: 0
