# Rapport QA - Erosion Coastal Guard

Date: 2026-04-14

## Synthese

- Total des verifications checklist: 15
- Validees: 5
- Non validees: 10

---

## RQA-01 - Initialisation plateforme (DB + Seeds + Backend + Frontend)

Objectif:
Verifier en un seul scenario que la base est installee, les seeds sont charges, le backend demarre correctement et le frontend est accessible.

Etapes:

1. Verifier l'acces a la base de donnees et aux tables principales.
2. Confirmer la presence des donnees de seed minimales.
3. Demarrer le backend et verifier les logs de demarrage.
4. Ouvrir l'URL du frontend et verifier le chargement initial.

Resultat attendu:
La base est accessible, les seeds sont presents, le backend repond sans erreur et le frontend est charge correctement.

Application:
VALIDE

---

## RQA-05 - Comptes de test disponibles

Objectif:
Verifier la disponibilite des comptes de test.

Etapes:

1. Tenter l'authentification avec les comptes de test.
2. Verifier les roles associes.

Resultat attendu:
Les comptes se connectent avec les permissions attendues.

Application:
VALIDE

---

## RQA-06 - Creer une zone

Objectif:
Verifier la creation d'une zone.

Etapes:

1. Ouvrir le formulaire de creation zone.
2. Saisir les champs requis.
3. Valider.

Resultat attendu:
La zone est enregistree avec confirmation utilisateur.

Application:
NON VALIDE

---

## RQA-07 - Creation automatique du point courant

Objectif:
Verifier la creation automatique du point courant apres creation d'une zone.

Etapes:

1. Creer une zone.
2. Verifier les donnees associees du point courant.

Resultat attendu:
Un point courant est cree automatiquement pour la zone.

Application:
NON VALIDE

---

## RQA-08 - Ajouter une historique

Objectif:
Verifier l'ajout d'une historique.

Etapes:

1. Ouvrir la zone.
2. Ajouter une historique.
3. Enregistrer.

Resultat attendu:
L'historique est ajoutee et persistante.

Application:
NON VALIDE

---

## RQA-09 - Modifier une historique

Objectif:
Verifier la modification d'une historique.

Etapes:

1. Ouvrir une historique existante.
2. Modifier les champs.
3. Sauvegarder.

Resultat attendu:
Les changements sont enregistres correctement.

Application:
NON VALIDE

---

## RQA-10 - Modifier un point courant

Objectif:
Verifier la modification d'un point courant.

Etapes:

1. Ouvrir un point courant.
2. Modifier les coordonnees.
3. Sauvegarder.

Resultat attendu:
Le point courant est mis a jour en base.

Application:
NON VALIDE

---

## RQA-11 - Mise a jour du recul

Objectif:
Verifier le recalcul et la mise a jour du recul apres ecriture.

Etapes:

1. Effectuer une mise a jour geospatiale.
2. Verifier la nouvelle mesure de recul.

Resultat attendu:
Le recul est recalcule et la nouvelle valeur est visible.

Application:
NON VALIDE

---

## RQA-12 - Dashboard coherent

Objectif:
Verifier la coherence des valeurs du dashboard.

Etapes:

1. Ouvrir le dashboard.
2. Comparer les valeurs avec la base.

Resultat attendu:
Les KPI et valeurs affichees sont coherentes.

Application:
NON EVALUE

---

## RQA-13 - Gestion capteur GPS

Objectif:
Verifier la gestion des capteurs GPS.

Etapes:

1. Creer ou modifier un capteur.
2. Verifier son affichage.

Resultat attendu:
Les operations capteur sont appliquees et traquees.

Application:
NON VALIDE

---

## RQA-14 - Gestion permis de construction

Objectif:
Verifier la gestion des permis (approbation/rejet).

Etapes:

1. Ouvrir la section permis.
2. Approuver ou rejeter un permis.

Resultat attendu:
Le statut du permis est mis a jour et l'action est journalisee.

Application:
NON VALIDE

---

## RQA-15 - Refus d'acces hors role

Objectif:
Verifier le controle d'acces par role.

Etapes:

1. Tenter une action reservee.
2. Observer la reponse API/UI.

Resultat attendu:
L'acces est refuse avec une erreur d'autorisation.

Application:
NON VALIDE

---

## RQA-16 - Logs d'audit

Objectif:
Verifier la tracabilite via les logs d'audit.

Etapes:

1. Executer creation/modification.
2. Consulter les logs d'audit.

Resultat attendu:
Les logs contiennent utilisateur, action, ressource et timestamp.

Application:
VALIDE

---

## RQA-17 - Integrite des donnees

Objectif:
Verifier l'integrite et la coherence des donnees.

Etapes:

1. Verifier les relations entre entites.
2. Confirmer que la derniere mesure est celle affichee.
3. Verifier l'evolution du statut de zone apres recalcul.

Resultat attendu:
Relations coherentes, affichage base sur la derniere mesure, statut de zone coherent.

Application:
PARTIELLEMENT VALIDE

---

## Conclusion

Le rapport QA base sur la checklist indique une validation partielle (5/15).
Les points non valides concernent la creation de zone, la creation automatique du point courant, plusieurs operations fonctionnelles (historique, point courant, recul, capteur, permis), le refus d'acces hors role et la verification de la derniere mesure affichee.
Les controles d'integrite sont partiellement valides: les relations entre entites et l'evolution du statut de zone sont valides, mais la regle sur la derniere mesure utilisee pour l'affichage reste a corriger.
