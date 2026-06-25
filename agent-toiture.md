# Agent de soumission - toiture en bardeaux

Ce dossier contient une version locale d'un estimateur pour toiture en bardeaux, avec une configuration d'application mobile installable.
Ouvre `index.html` dans un navigateur pour entrer les mesures, les produits, les heures et les metriques de profit.

## Entrees prevues

- Plans, devis ou notes de projet.
- Sauvegarde locale de projets dans le navigateur.
- Import et export de projets en fichier JSON.
- Surface de toiture en pieds carres.
- Longueur de faite, aretes, noues, demarreur et bord de mur.
- Nombre de ventilateurs.
- Nombre d'events de plomberie.
- Produits: bardeau, bardeau de faitiere, membrane synthetique, membrane autocollante, noue, bord de mur, clous, agrafes, ventilateurs, events de plomberie et pitch.
- Heures prevues.
- Main-d'oeuvre, disposition et frais fixes.
- Profit en pourcentage.
- Profit cible par heure.

## Liste de materiaux

L'application calcule maintenant une liste de materiaux de base:

- Paquets de bardeaux.
- Rouleaux de membrane synthetique.
- Rouleaux de membrane glace et eau.
- Cap de faite / aretes.
- Demarreur.
- Bord de mur.
- Noues.
- Ventilateurs.
- Events de plomberie.
- Pitch.
- Boites de clous.
- Boites d'agrafes.
- Conteneur / disposition.

La liste peut etre copiee ou exportee en CSV.

## Logique de calcul

1. Paquets de bardeaux = surface toiture / couverture par paquet, arrondi au paquet superieur.
2. Les quantites de produits sont calculees depuis les mesures et les couvertures.
3. Cout direct = produits + main-d'oeuvre + disposition + frais fixes.
4. Profit retenu = le plus eleve entre profit % et profit cible par heure.
5. Sous-total = cout direct + profit.
6. Total = sous-total + taxes.

## Prochaine etape IA

Pour transformer cette base en vrai agent qui lit automatiquement des PDF, images ou devis Word, il faudra ajouter:

- Extraction de texte PDF et OCR pour images.
- Detection structuree des mesures.
- Validation avec questions de clarification quand une mesure manque.
- Sauvegarde des tarifs par fournisseur.
- Export PDF de la soumission.

## Installation sur cellulaire

Pour un usage mobile complet, publie le dossier sur un petit hebergement web ou ouvre-le depuis un serveur local.
Ensuite:

- Android/Chrome: menu du navigateur, puis `Ajouter a l'ecran d'accueil`.
- iPhone/Safari: bouton de partage, puis `Sur l'ecran d'accueil`.

Le mode hors ligne fonctionne quand l'application est servie en `https://` ou depuis un serveur local; il ne s'active pas depuis une simple ouverture `file://`.
