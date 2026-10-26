# Contexte pour les sessions Claude

Refonte du portfolio d'Alexis Labine. La source de vérité est dans les documents du projet Claude « Portfolio » : commence par `claude/00-LIRE-EN-PREMIER.md`, puis lis ceux qui servent à ta tâche (01 vision, 02 charte, 03 et 03b contenu, 04 architecture, 05 feuille de route, 06 journal, **07 plan de refonte** : ce qu'on fait de chaque fichier de la v1 et dans quelle tâche).

## Où est quoi

- **La racine est le site en refonte.** Elle part d'une copie de la v1, rangée selon l'arbre de 04 (tâche 3.1). Au départ, son contenu est encore celui de la v1 (vocabulaire, textes, clavier à code…) : les tâches 3.2 et suivantes le refont, fichier par fichier, selon 07.
- **`immersif/` est l'archive intacte de la v1.** N'y touche pas, ne la recompile pas. Sers-t'en comme référence.

```
index.html                 l'expérience (entrée → régie → matériel → mur → scène)
assets/scss/               abstracts/ (jetons, mixins) · base/ · scenes/ · composants/ · _tactile
assets/css/style.css       COMPILÉ : ne pas modifier à la main
assets/js/                 camera, portes, brume, modales, navigation ; scenes/ (regie, materiel, mur, scene-finale)
assets/img/  assets/video/ médias (encore ceux de la v1 : optimisation en 5.1)
immersif/                  archive de la v1
```

## Travailler

- **Compiler le SCSS** (depuis la racine) : `sass --no-source-map assets/scss/style.scss assets/css/style.css`. Commite le CSS compilé avec le SCSS : l'hébergement DirectAdmin ne compile rien.
- **Tester** : `python3 -m http.server` à la racine, puis ouvrir `/` (refonte) et `/immersif/` (v1). Vérifie l'ordinateur, le téléphone (mode tactile) et « moins d'animations ».
- Les scripts sont encore des scripts classiques qui partagent des variables globales ; le passage en modules ES est la tâche 3.4 (le tableau des globales est dans 07). D'ici là, garde l'ordre des `<script>` de `index.html`.
- GSAP et les polices viennent encore de CDN jusqu'à la tâche 3.3.

## Règles

- Fais UNE tâche de la feuille de route (05) par session.
- Ne modifie ni la charte (02) ni l'architecture (04) sans l'accord d'Alexis. Si une tâche l'exige, arrête-toi et explique pourquoi.
- Aucun texte inventé : les textes viennent de 03b.
- Le code est en HTML sémantique, SCSS avec jetons et JS vanilla en modules ES. Les noms sont en français, sans accents, en BEM.
- Travaille sur une branche, jamais directement sur `main`, et propose tes changements par une PR.
- À la fin : coche la tâche dans 05 et ajoute une ligne datée dans 06 (documents du projet Claude).
- Réponds en français et tutoie Alexis.
