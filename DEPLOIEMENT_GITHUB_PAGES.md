# Déploiement APEX sur GitHub Pages

1. Créer un dépôt GitHub dédié, par exemple `apex-arbitre`.
2. Mettre uniquement le contenu de ce dossier APEX_V1 à la racine du dépôt (`index.html`, `app.js`, `styles.css`, README...).
3. Ne jamais déposer un export JSON APEX, un mot de passe Supabase, une Secret key ou une service_role key.
4. Dans GitHub : Settings > Pages > Build and deployment > Source : Deploy from a branch.
5. Choisir la branche `main` et le dossier `/ (root)`, puis Save.
6. Attendre la publication puis ouvrir l'URL GitHub Pages fournie par GitHub.
7. Se connecter à APEX avec le compte Supabase puis vérifier le statut `SYNC ✓`.
8. Sur un nouvel appareil, APEX doit récupérer le cloud après connexion.

Important : le site GitHub Pages lui-même est publiquement accessible. Les données personnelles APEX restent dans Supabase derrière Auth + RLS, mais le code et les séances statiques embarquées dans l'application sont visibles dans les fichiers servis au navigateur.
