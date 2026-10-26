/* ============================================================
   MUR-ENQUETE.JS — Bloc 4 : le mur d'enquête (Réalisations)
   ============================================================
   1. Les PROJETS : textes, images et vidéos de chaque projet
   2. Les FILS : quels polaroïds sont reliés, et comment
   3. Les plans de caméra, un par dossier
   4. Examiner un polaroïd : gros plan puis rapport du projet
*/

const sceneMur = document.getElementById("mur-enquete");
const cameraMur = new Camera(sceneMur);

/* ------------------------------------------------------------
   PARTIE 1 — LES PROJETS
   ------------------------------------------------------------
   medias : les pièces du dossier, dans l'ordre. Les polaroïds
   pointent vers l'une d'elles avec data-media="0", "1"...
   lien   : (facultatif) le projet en ligne.
*/
const DOSSIER_IMG = "assets/img/projets/";
const DOSSIER_VIDEO = "assets/video/"; // les vidéos ont leur propre dossier (04)

const PROJETS = {
  "timeline-zero": {
    numero: "Dossier 01 — Pièces A à D",
    titre: "Timeline : Zero",
    type: "Concept de jeu vidéo — direction artistique complète",
    outils: "Photoshop (photomontage), typographie",
    description:
      "Un jeu cyberpunk imaginé de A à Z. Vous êtes le Sujet Alpha, une arme vivante de la corpo " +
      "Shanghai Dynamics. En pleine mission, votre interface neurale est piratée… par vous-même, dix ans " +
      "dans le futur : un hologramme glitché qui a survécu à l'apocalypse que vous êtes sur le point de " +
      "déclencher. Tout part d'un moodboard, qui devient une scène d'interface, puis une affiche et une " +
      "jaquette Xbox.",
    fil:
      "Le moodboard puise dans Watch Dogs, Tron et Halo. Le photomontage « Ville néon » explore la " +
      "même ambiance. Et l'univers du jeu vidéo relie ce dossier au Game Jam et à Abysscore.",
    medias: [
      { type: "image", src: "timeline-zero/moodboard.jpg", legende: "Le moodboard : références, couleurs et typographies." },
      { type: "image", src: "timeline-zero/scene.jpg", legende: "La scène : Alpha face à Zero, son double du futur." },
      { type: "image", src: "timeline-zero/affiche.jpg", legende: "L'affiche du jeu." },
      { type: "image", src: "timeline-zero/jaquette.jpg", legende: "La jaquette Xbox : dos, tranche et face." },
    ],
  },

  "ville-neon": {
    numero: "Dossier 01 — Pièce annexe",
    titre: "Ville néon",
    type: "Photomontage",
    outils: "Photoshop",
    description:
      "Une ville cyberpunk sous la pluie, entre enseignes lumineuses et voitures volantes : un " +
      "photomontage construit calque par calque, inspiré de l'univers de Watch Dogs.",
    fil: "Watch Dogs se retrouve aussi dans le moodboard de Timeline : Zero : même inspiration, même nuit néon.",
    medias: [{ type: "image", src: "ville-neon/ville-neon.jpg", legende: "Ville néon — photomontage final." }],
  },

  "game-jam": {
    numero: "Dossier 02 — Pièces A et B",
    titre: "Game Jam",
    type: "Affiche événementielle, puis mapping vidéo",
    outils: "Photoshop, Illustrator (titre), After Effects",
    description:
      "L'affiche du Game Jam d'Intégration multimédia : « 5 jours, 1 jeu », du 7 au 11 avril 2025. " +
      "Le style arcade des années 80-90 domine : néons bleu et rose, pixel art, Mario, Sonic, " +
      "Donkey Kong et Pac-Man, et une typographie en blocs. L'affiche est ensuite reprise en mapping " +
      "vidéo : chaque élément apparaît en musique, comme sur un écran de borne d'arcade.",
    fil: "Même projet, deux formats : l'affiche imprimée devient une animation. Le rose et le cyan annoncent déjà le Festival.",
    medias: [
      { type: "image", src: "game-jam/affiche.jpg", legende: "L'affiche : style arcade, néons et pixel art." },
      { type: "video", src: "game-jam/mapping.mp4", apercu: "game-jam/mapping-apercu.jpg", legende: "Le mapping vidéo : l'affiche prend vie (30 s)." },
    ],
  },

  abysscore: {
    numero: "Dossier 03 — Pièces A à D",
    titre: "Abysscore",
    type: "Interface de jeu vidéo (menu et écran de mission)",
    outils: "Adobe XD (zoning), Photoshop, Illustrator (logo et titre)",
    description:
      "L'interface d'un jeu d'exploration sous-marine. D'abord le zoning, pour placer chaque zone " +
      "(boutons, personnage, statistiques). Puis le rendu final : un écran titre (Campagne, Multijoueur, " +
      "Options, Quitter l'abysse) et un écran d'inventaire avec armes, accessoires et statistiques.",
    fil: "Du plan filaire au rendu final : les deux étapes sont épinglées côte à côte.",
    medias: [
      { type: "image", src: "abysscore/zoning-menu.jpg", legende: "Zoning du menu principal." },
      { type: "image", src: "abysscore/zoning-mission.jpg", legende: "Zoning de l'écran de mission." },
      { type: "image", src: "abysscore/menu.jpg", legende: "Le menu principal." },
      { type: "image", src: "abysscore/mission.jpg", legende: "L'écran d'inventaire et de mission." },
    ],
  },

  // ===== L'AFFAIRE PRINCIPALE : le festival De l'âme à l'écran (DAE) =====
  "dae-festival": {
    numero: "Dossier 04 — L'affaire principale",
    titre: "De l'âme à l'écran",
    type: "Festival intercollégial de courts métrages — Cégep de Jonquière",
    outils: "Coordination, communication, graphisme, logistique, terrain",
    description:
      "Le DAE, c'est le plus grand rendez-vous de la relève cinématographique au Cégep de Jonquière : " +
      "depuis 23 ans, des étudiants de partout au Québec y présentent leurs courts métrages pendant " +
      "trois jours de projections, d'ateliers et de conférences. Pour l'édition 2026 (20 au 22 mars), " +
      "j'étais dans l'équipe Organisation, sur trois fronts à la fois. " +
      "AIDE-COORDONNATEUR : suivi des échéanciers, plans de communication et logistique du festival " +
      "(accueil, hébergement, horaire des salles). " +
      "GRAPHISME : conception du matériel promotionnel et des produits de l'édition avec l'équipe. " +
      "GO (gentil organisateur) : sur le terrain pendant les trois jours, à l'accueil des festivaliers, " +
      "au soutien des bénévoles et à la gestion des imprévus, y compris les urgences sur les réseaux sociaux. " +
      "C'est exactement l'idée de ce portfolio : le cerveau derrière l'événement.",
    fil:
      "Tout est relié : le site actuel, le nouveau thème que je code et le matériel graphique " +
      "servent le même festival. Et ma cocarde « Organisation », sur le bureau de la salle de crise, " +
      "vient de là.",
    lien: { url: "https://www.delamealecran.com/", texte: "Visiter le site du festival" },
    medias: [
      { type: "image", src: "dae/evenement-projection.jpg", legende: "Soirée de projection, samedi : l'animation sur scène." },
      { type: "image", src: "dae/evenement-atelier.jpg", legende: "Vendredi : un atelier avec un professionnel de l'industrie." },
      { type: "image", src: "dae/site-a-propos.jpg", legende: "L'esprit du festival : 23 ans de relève cinématographique." },
    ],
  },

  "dae-site": {
    numero: "Dossier 04 — Pièce A : le site actuel",
    titre: "delamealecran.com",
    type: "Refonte du site web du festival (en ligne)",
    outils: "PHP, base de données MySQL, SCSS, JavaScript",
    description:
      "Le site en ligne de l'édition 2026. Avec l'équipe, j'ai participé à sa refonte : une " +
      "architecture en SCSS et un contenu tiré d'une base de données. La sélection officielle se " +
      "filtre par catégorie (fiction, animation, expérimental, documentaire), l'horaire est présenté " +
      "jour par jour, et les pages Jury, Équipe, Archives (2019 à 2025) et Regard sont générées en PHP. " +
      "Un compte à rebours annonce l'ouverture du festival.",
    fil:
      "Ce site est celui qu'on voit aujourd'hui. Le nouveau thème (pièce B) le remplacera : le " +
      "portfolio montre donc les deux versions, avant et après.",
    lien: { url: "https://www.delamealecran.com/", texte: "Visiter le site" },
    medias: [
      { type: "image", src: "dae/site-haut.jpg", legende: "L'accueil : vidéo d'ambiance et appel à l'action." },
      { type: "image", src: "dae/site-selection.jpg", legende: "La sélection 2026, filtrable par catégorie." },
      { type: "image", src: "dae/site-horaire.jpg", legende: "La programmation officielle, jour par jour." },
      { type: "image", src: "dae/site-equipe.jpg", legende: "L'équipe 2026, filtrable par département." },
      { type: "image", src: "dae/site-archives.jpg", legende: "Les archives des éditions précédentes." },
      { type: "image", src: "dae/site-regard.jpg", legende: "Le partenariat DAE × Regard." },
    ],
  },

  "dae-theme": {
    numero: "Dossier 04 — Pièce B : le nouveau thème",
    titre: "DAE 2026 — nouveau thème",
    type: "Nouveau thème du site + back-office (en développement)",
    outils: "PHP (PDO), MySQL, Bootstrap 5 en SCSS, JavaScript, FontAwesome",
    description:
      "Le site qui prendra le relais. " +
      "L'identité change complètement : une palette « cinéma » de sept couleurs (violet nuit, rouge " +
      "rideau, rose néon, bleu projecteur…) branchée dans Bootstrap, un seul fichier de variables, " +
      "aucune couleur écrite en dur, et une structure SCSS en couches (abstracts, base, components, " +
      "layout, pages). Côté PHP : des gabarits réutilisables (carte de film, carte de membre), des " +
      "requêtes préparées partout et une protection XSS sur chaque affichage. Surtout, un back-office " +
      "sécurisé (mots de passe hachés, session régénérée à la connexion) permet à l'équipe de gérer " +
      "elle-même la sélection, le jury, l'horaire et l'équipe, sans toucher au code.",
    fil:
      "Au moment de la remise de ce portfolio, ce thème sera en ligne sur delamealecran.com : " +
      "la pièce A deviendra l'archive, la pièce B le site officiel.",
    lien: { url: "https://www.delamealecran.com/", texte: "Voir le site du festival" },
    medias: [
      { type: "image", src: "dae/theme-palette.jpg", legende: "La palette de l'édition 2026, telle que déclarée dans le SCSS." },
      { type: "image", src: "dae/theme-code.jpg", legende: "Extrait du back-office : connexion sécurisée (auth.php)." },
    ],
  },

  "rentree-magique": {
    numero: "Dossier 05 — Pièces A à E",
    titre: "Rentrée Magique 101",
    type: "Site WordPress — projet final, Système de gestion de contenu 1",
    outils: "WordPress (thème Frost), CSS personnalisé, extension HurryTimer",
    description:
      "Un guide de survie immersif pour les nouveaux élèves d'une école de sorcellerie : la lettre " +
      "d'admission, le Chemin de Traverse, le train de la rentrée, la répartition dans les maisons et " +
      "un blogue. Le thème Frost est transformé en CSS pour une esthétique « Dark Academia », et un " +
      "compte à rebours affiche le temps restant avant le départ du train.",
    fil: "Même réflexe que ce portfolio : raconter une histoire pour guider le visiteur.",
    lien: { url: "https://alexis-labine.techniquesmedia.com/sgc1/rm101/", texte: "Visiter le site" },
    medias: [
      { type: "image", src: "rentree-magique/site-accueil.jpg", legende: "L'accueil : la lettre d'admission." },
      { type: "image", src: "rentree-magique/moodboard.jpg", legende: "Le moodboard : typographies, blasons et palette." },
      { type: "image", src: "rentree-magique/site-chemin.jpg", legende: "Le Chemin de Traverse." },
      { type: "image", src: "rentree-magique/site-express.jpg", legende: "Le Poudlard Express." },
      { type: "image", src: "rentree-magique/site-repartition.jpg", legende: "La répartition dans les maisons." },
    ],
  },

  phoenix: {
    numero: "Dossier 06 — Pièces A et B",
    titre: "Phoenix",
    type: "Logo de studio et animation",
    outils: "Illustrator, After Effects",
    description:
      "Un logo de studio en forme de phénix, dessiné en vectoriel, puis animé : le phénix s'embrase " +
      "et se reflète sur un sol texturé, avec un habillage sonore.",
    fil: "Le logo et son animation : la même pièce, en image fixe puis en mouvement.",
    medias: [
      { type: "image", src: "phoenix/logo.jpg", legende: "Le logo vectoriel." },
      { type: "video", src: "phoenix/animation.mp4", apercu: "phoenix/animation-apercu.jpg", legende: "L'animation du logo (8 s)." },
    ],
  },

  nova: {
    numero: "Dossier 06 — Pièce C",
    titre: "NOVA",
    type: "Affiche publicitaire",
    outils: "Photomontage",
    description:
      "Une affiche pour NOVA, une voiture électrique concept : 80 % de recharge en 10 minutes, " +
      "850 km d'autonomie, zéro émission. La voiture surgit d'un tunnel de lumière.",
    fil: "",
    medias: [{ type: "image", src: "nova/affiche.jpg", legende: "L'affiche NOVA." }],
  },
};

/* ------------------------------------------------------------
   PARTIE 2 — LES FILS
   ------------------------------------------------------------
   rouge = étapes d'un même projet
   rose  = piste commune (le jeu vidéo)
   cyan  = même inspiration
*/
const FILS = [
  { de: "p-tz-moodboard", vers: "p-tz-scene", type: "rouge" },
  { de: "p-tz-scene", vers: "p-tz-affiche", type: "rouge" },
  { de: "p-tz-affiche", vers: "p-tz-jaquette", type: "rouge" },
  { de: "p-gj-affiche", vers: "p-gj-mapping", type: "rouge" },
  { de: "p-ab-zoning", vers: "p-ab-menu", type: "rouge" },
  { de: "p-ab-menu", vers: "p-ab-mission", type: "rouge" },
  { de: "p-dae-festival", vers: "p-dae-site", type: "rouge" },
  { de: "p-dae-site", vers: "p-dae-theme", type: "rouge" },
  { de: "p-rm-moodboard", vers: "p-rm-site", type: "rouge" },
  { de: "p-phoenix-logo", vers: "p-phoenix-animation", type: "rouge" },
  // decalage = déplacement de l'étiquette (en px), pour qu'elle ne cache pas un polaroïd
  { de: "p-ville-neon", vers: "p-tz-moodboard", type: "cyan", etiquette: "Même inspiration : Watch Dogs", decalage: { x: 0, y: 90 } },
  { de: "p-tz-jaquette", vers: "p-gj-affiche", type: "rose", etiquette: "Piste : le jeu vidéo", decalage: { x: 100, y: 150 } },
  { de: "p-gj-affiche", vers: "p-ab-menu", type: "rose" },
];

// Position de l'épingle d'un polaroïd sur le liège (en haut, au centre).
function positionEpingle(polaroid) {
  const style = getComputedStyle(polaroid);
  return {
    x: parseFloat(style.getPropertyValue("--bx")),
    y: parseFloat(style.getPropertyValue("--by")) - polaroid.offsetHeight / 2 + 14,
  };
}

// Dessine chaque fil en SVG : une courbe qui "pend" un peu entre deux épingles.
function tracerFils() {
  const svg = sceneMur.querySelector(".fils");
  const ns = "http://www.w3.org/2000/svg";
  svg.innerHTML = "";

  FILS.forEach((fil) => {
    const a = positionEpingle(document.getElementById(fil.de));
    const b = positionEpingle(document.getElementById(fil.vers));
    const longueur = Math.hypot(b.x - a.x, b.y - a.y);

    // Point de contrôle : au milieu, un peu plus bas (le poids du fil).
    const c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + longueur * 0.15 };

    const chemin = document.createElementNS(ns, "path");
    chemin.setAttribute("d", `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`);
    chemin.setAttribute("class", "fil fil--" + fil.type);
    svg.appendChild(chemin);

    if (fil.etiquette) {
      // Milieu de la courbe (formule de la courbe de Bézier à t = 0,5),
      // décalé si besoin pour ne pas cacher un polaroïd.
      const decalage = fil.decalage || { x: 0, y: 34 };
      const texte = document.createElementNS(ns, "text");
      texte.setAttribute("x", 0.25 * a.x + 0.5 * c.x + 0.25 * b.x + decalage.x);
      texte.setAttribute("y", 0.25 * a.y + 0.5 * c.y + 0.25 * b.y + decalage.y);
      texte.setAttribute("class", "fil__etiquette fil__etiquette--" + fil.type);
      texte.textContent = fil.etiquette;
      svg.appendChild(texte);
    }
  });
}

// Les images doivent être chargées pour connaître la hauteur des polaroïds.
window.addEventListener("load", tracerFils);
tracerFils();

/* ------------------------------------------------------------
   PARTIE 3 — LES PLANS DE CAMÉRA
   ------------------------------------------------------------
   Le liège mesure 3200 × 1600 et son centre est à (0, -50) dans
   le monde : un point (bx, by) du liège est donc à (bx - 1600, by - 850).
*/
function surLeMur(bx, by) {
  return { x: bx - 1600, y: by - 850, z: 0 };
}

const plansMur = [
  { nom: "Vue d'ensemble", ...surLeMur(1600, 560), distance: -1750, rx: 0, ry: 0 },
  { nom: "Dossier 01 — Timeline : Zero", polaroid: "p-tz-moodboard", ...surLeMur(565, 542), distance: -150, rx: 0, ry: 8 },
  { nom: "Dossier 02 — Game Jam", polaroid: "p-gj-affiche", ...surLeMur(1515, 358), distance: 250, rx: 0, ry: -6 },
  { nom: "Dossier 03 — Abysscore", polaroid: "p-ab-menu", ...surLeMur(1595, 1042), distance: 200, rx: 4, ry: 6 },
  { nom: "Dossier 04 — De l'âme à l'écran", polaroid: "p-dae-festival", ...surLeMur(2650, 360), distance: 60, rx: 0, ry: -8 },
  { nom: "Dossier 05 — Rentrée Magique 101", polaroid: "p-rm-site", ...surLeMur(2580, 1032), distance: 250, rx: 4, ry: 8 },
  { nom: "Dossier 06 — Pièces isolées", polaroid: "p-phoenix-animation", ...surLeMur(662, 1228), distance: 150, rx: 4, ry: -6 },
];

const inviteMur = sceneMur.querySelector(".hud__invite");
const texteInviteMur = sceneMur.querySelector("[data-texte-invite]");
let planActuelMur = plansMur[0];

cameraMur.creerRail(plansMur, (plan) => {
  planActuelMur = plan;
  inviteMur.hidden = !plan.polaroid;
  const titreDossier = plan.nom.split(" — ")[1] || "";
  texteInviteMur.textContent = "Ouvrir le dossier " + titreDossier;
});

/* ------------------------------------------------------------
   PARTIE 4 — EXAMINER UN POLAROÏD
   ------------------------------------------------------------ */
const modaleProjet = document.getElementById("modale-projet");

function remplirModale(idProjet, indexMedia) {
  const projet = PROJETS[idProjet];
  const champ = (nom) => modaleProjet.querySelector(`[data-projet-${nom}]`);

  champ("numero").textContent = projet.numero;
  champ("titre").textContent = projet.titre;
  champ("type").textContent = projet.type;
  champ("outils").textContent = projet.outils;
  champ("description").textContent = projet.description;
  champ("fil").textContent = projet.fil;
  champ("bloc-fil").hidden = !projet.fil;

  // Lien vers le projet en ligne, s'il y en a un (s'ouvre dans un nouvel onglet).
  const lien = champ("lien");
  lien.hidden = !projet.lien;
  if (projet.lien) {
    lien.href = projet.lien.url;
    lien.querySelector("span").textContent = projet.lien.texte;
  }

  // Une vignette par pièce du dossier (seulement s'il y en a plusieurs).
  const vignettes = champ("vignettes");
  vignettes.innerHTML = "";
  if (projet.medias.length > 1) {
    projet.medias.forEach((media, index) => {
      const bouton = document.createElement("button");
      bouton.type = "button";
      bouton.className = "galerie__vignette";
      bouton.setAttribute("aria-label", "Voir : " + media.legende);
      const image = document.createElement("img");
      image.src = DOSSIER_IMG + (media.apercu || media.src);
      image.alt = "";
      bouton.appendChild(image);
      bouton.addEventListener("click", () => afficherMedia(projet, index));
      vignettes.appendChild(bouton);
    });
  }

  afficherMedia(projet, indexMedia);
}

// Affiche une pièce en grand : une image, ou une vidéo avec ses contrôles.
function afficherMedia(projet, index) {
  const media = projet.medias[index];
  const scene = modaleProjet.querySelector("[data-projet-media]");
  scene.innerHTML = "";

  let element;
  if (media.type === "video") {
    element = document.createElement("video");
    element.src = DOSSIER_VIDEO + media.src;
    element.poster = DOSSIER_IMG + media.apercu;
    element.controls = true;
    element.playsInline = true;
  } else {
    element = document.createElement("img");
    element.src = DOSSIER_IMG + media.src;
    element.alt = projet.titre + " — " + media.legende;
  }
  scene.appendChild(element);
  modaleProjet.querySelector("[data-projet-legende]").textContent = media.legende;

  modaleProjet.querySelectorAll(".galerie__vignette").forEach((vignette, i) => {
    vignette.classList.toggle("est-active", i === index);
  });
}

function examinerPolaroid(polaroid) {
  // Mode tactile : pas de gros plan, le rapport s'ouvre tout de suite.
  if (MODE_TACTILE) {
    remplirModale(polaroid.dataset.projet, Number(polaroid.dataset.media));
    ouvrirModale(modaleProjet, () => modaleProjet.querySelectorAll("video").forEach((video) => video.pause()));
    return;
  }

  if (sceneMur.classList.contains("en-examen")) return;

  const style = getComputedStyle(polaroid);
  const bx = parseFloat(style.getPropertyValue("--bx"));
  const by = parseFloat(style.getPropertyValue("--by"));

  sceneMur.classList.add("en-examen");
  polaroid.classList.add("est-examine");
  cameraMur.examiner({ ...surLeMur(bx, by), distance: 480, rx: 0, ry: 0 });

  remplirModale(polaroid.dataset.projet, Number(polaroid.dataset.media));
  gsap.delayedCall(0.5, () => ouvrirModale(modaleProjet, terminerExamenMur));
}

function terminerExamenMur() {
  modaleProjet.querySelectorAll("video").forEach((video) => video.pause());
  sceneMur.classList.remove("en-examen");
  sceneMur.querySelectorAll(".est-examine").forEach((p) => p.classList.remove("est-examine"));
  cameraMur.revenir();
}

sceneMur.querySelectorAll(".polaroid").forEach((polaroid) => {
  polaroid.addEventListener("click", () => examinerPolaroid(polaroid));
});

// Invite "[E] Ouvrir le dossier…" : examine le polaroïd principal du plan.
function ouvrirDossierDuPlan() {
  if (planActuelMur.polaroid) examinerPolaroid(document.getElementById(planActuelMur.polaroid));
}

inviteMur.addEventListener("click", ouvrirDossierDuPlan);

document.addEventListener("keydown", (e) => {
  const dansUnChamp = e.target.closest("input, textarea");
  if (e.key.toLowerCase() !== "e" || dansUnChamp || modaleOuverte) return;
  if (cameraMur.visible) ouvrirDossierDuPlan();
});
