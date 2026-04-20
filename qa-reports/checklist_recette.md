# Checklist de recette

## Controle initial
- [x] Base de donnees,Seeds charges,Backend demarre correctement avec un Frontend accessible
- [x] Comptes de test disponibles

## Validation fonctionnelle
- [ ] Creer une zone
- [ ] Verifier la creation automatique du point courant
- [ ] Ajouter une historique
- [ ] Modifier une historique
- [ ] Modifier un point courant
- [ ] Verifier la mise a jour du recul
- [ ] Gerer un capteur GPS
- [ ] Gerer un permis de construction

## Validation securite
- [ ] Verifier le refus d'acces hors role
- [x] Verifier les logs d'audit

## Validation data integrity
- [x] Verifier les relations entre zone, point, historique et recul
- [ ] Verifier que la derniere mesure est bien celle utilisee pour l'affichage
- [x] Verifier que le statut de zone evolue apres recalcul
