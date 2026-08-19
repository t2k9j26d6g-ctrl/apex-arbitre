# APEX Arbitre V1.9.1 — Sync automatique

## Objectif
V1.9.1 conserve `apex_v1_data` comme cache local et utilise Supabase comme copie centrale synchronisée.

## Comportement
- session Supabase persistante dans le navigateur ;
- envoi automatique après une modification locale ;
- si le réseau est indisponible, la modification reste locale et est renvoyée au retour du réseau ;
- vérification du cloud à l'ouverture / reconnexion / retour dans l'onglet ;
- commandes manuelles Appareil → Cloud et Cloud → Appareil conservées ;
- sauvegarde locale avant une réception cloud qui remplace les blocs synchronisés ;
- arbitrage V1.8 (accepter/refuser l'adaptation APEX) conservé.

## Données synchronisées
- check-ins + décision APEX du jour ;
- planning ;
- séances/débriefs ;
- réglages principaux.

Les anciens blocs Mental/TOP locaux sont préservés pendant le pilote.

## Installation sur le PC actuel
Remplacer les fichiers de la version actuelle dans le même dossier. Ne pas supprimer le dossier ni le stockage du navigateur.

## Sécurité
La Publishable key Supabase est une clé client. Les données sont protégées par l'authentification et les politiques RLS configurées dans Supabase. Ne jamais ajouter une Secret key ou une service_role key dans ce dossier.

## Publication web
Ce dossier est statique et peut être publié tel quel sur GitHub Pages. Pour une publication publique, ne jamais ajouter de fichier d'export APEX JSON au dépôt.

## V2.0 - Saison rugby
- Le plan continue après le test Yo-Yo du 29/08/2026.
- Nouvelles briques saison : S1 endurance aérobie, S2 intermittent entretien arbitre.
- Barre Pilates recentrée sur le matériel réel : B1 corps entier, B2 stabilité hanche/genou, B3 haut du corps + tronc, B4 activation courte.
- Les visuels Pilates proviennent du guide fourni avec la barre et sont utilisés comme repères d'exécution.
- Migration non destructive : les données existantes et la synchronisation Supabase sont conservées.
