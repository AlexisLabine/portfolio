/* ============================================================
   CAMERA.JS — Le moteur de caméra des scènes 3D
   ============================================================
   Une scène (.scene) contient un monde en 3D CSS (.camera).
   Comme dans un jeu vidéo, on ne déplace jamais les objets : on
   déplace la CAMÉRA, c'est-à-dire qu'on applique au monde entier
   la transformation inverse.

   À chaque image, la position de la caméra est la somme de :
     1. le RAIL    : le plan piloté par le scroll (GSAP ScrollTrigger)
     2. l'EXAMEN   : un gros plan quand on clique sur un objet
     3. le REGARD  : la caméra suit légèrement la souris
     4. le SOUFFLE : un léger balancement, comme une caméra à l'épaule

   Une "pose" de caméra = { x, y, z, distance, rx, ry }
     x, y, z   : le point du monde que la caméra regarde (en px)
     distance  : > 0 la caméra s'approche, < 0 elle recule
     rx        : < 0 la caméra regarde vers le bas (plongée)
     ry        : la caméra tourne autour du point regardé

   MODE TACTILE (téléphone, iPad — voir le <head> de index.html) :
   la caméra ne tourne pas. Pas de rail, pas d'épinglage, pas de
   boucle d'images : le CSS met la scène à plat et elle défile
   comme une page normale.
*/

gsap.registerPlugin(ScrollTrigger);

// Si la personne a demandé "moins d'animations" dans son système :
// pas de rail au scroll, pas de balancement, pas de suivi de souris.
const MOUVEMENT_REDUIT = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const CLES_POSE = ["x", "y", "z", "distance", "rx", "ry"];

// Garde seulement les valeurs de caméra d'un plan (0 si absente).
function extrairePose(plan) {
  const pose = {};
  CLES_POSE.forEach((cle) => (pose[cle] = plan[cle] ?? 0));
  return pose;
}

// Le monde est pensé pour un écran de 1280 × 800. On l'agrandit ou on
// le réduit pour garder le même cadrage sur tous les écrans.
function calculerEchelle() {
  const echelle = Math.min(window.innerWidth / 1280, window.innerHeight / 800);
  return Math.min(Math.max(echelle, 0.45), 1.4);
}

// "Lights on" : la classe lumiere-allumee déclenche le clignotement
// en CSS quand 30 % de la scène est visible (Intersection Observer).
// En mode tactile, la scène peut être bien plus haute que l'écran : on
// allume dès que son haut dépasse le premier quart de l'écran.
function allumerAuPassage(scene) {
  const reglages = MODE_TACTILE ? { rootMargin: "0px 0px -25% 0px" } : { threshold: 0.3 };
  const observateur = new IntersectionObserver(([entree]) => {
    if (entree.isIntersecting) {
      scene.classList.add("lumiere-allumee");
      observateur.disconnect(); // une seule fois : la lumière reste allumée
    }
  }, reglages);
  observateur.observe(scene);
}

class Camera {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    allumerAuPassage(scene);
    if (MODE_TACTILE) return; // pas de caméra : la scène reste à plat

    this.monde = scene.querySelector(".camera");

    this.rail = extrairePose({}); //    1. position donnée par le scroll
    this.examen = extrairePose({}); //  2. position du gros plan
    this.melange = { valeur: 0 }; //    0 = rail, 1 = gros plan (animé par GSAP)
    this.regard = { x: 0, y: 0 }; //    3. souris, de -1 à 1
    this.regardLisse = { x: 0, y: 0 };

    this.indexPlan = -1;
    this.enPlongee = false;
    this.enMarche = false;

    this.ajusterEchelle();
    window.addEventListener("resize", () => this.ajusterEchelle());

    window.addEventListener("mousemove", (e) => {
      this.regard.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.regard.y = (e.clientY / window.innerHeight) * 2 - 1;
    });

    // On ne calcule les images que lorsque la scène est à l'écran.
    new IntersectionObserver(([entree]) => {
      this.visible = entree.isIntersecting;
      if (this.visible) this.demarrer();
    }).observe(scene);
  }

  ajusterEchelle() {
    this.scene.style.setProperty("--echelle", calculerEchelle());
  }

  /* ----------------------------------------------------------
     1. LE RAIL : une suite de plans, parcourue au scroll
     ---------------------------------------------------------- */
  // La scène reste épinglée à l'écran (pin) pendant que le scroll fait
  // avancer une timeline GSAP qui passe d'un plan à l'autre. Le "snap"
  // fait toujours s'arrêter la caméra pile sur un plan.
  creerRail(plans, quandPlanChange) {
    if (MODE_TACTILE) return;

    const changerPlan = (index) => {
      if (index === this.indexPlan) return;
      this.indexPlan = index;
      this.scene.dataset.plan = index; // utilisé par le CSS (titre...)
      const etiquette = this.scene.querySelector("[data-nom-plan]");
      if (etiquette) etiquette.textContent = plans[index].nom;
      if (quandPlanChange) quandPlanChange(plans[index], index);
    };

    Object.assign(this.rail, extrairePose(plans[0]));

    if (MOUVEMENT_REDUIT) {
      // Pas de rail : on reste sur un plan fixe qui montre toute la scène.
      Object.assign(this.rail, extrairePose(plans[1]));
      changerPlan(1);
      return;
    }

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: this.scene,
        start: "top top",
        end: "+=" + (plans.length - 1) * 100 + "%", // un écran de scroll par plan
        pin: true,
        anticipatePin: 1,
        scrub: 1, // la caméra "rattrape" le scroll en 1 s : effet de poids
        snap: {
          snapTo: "labelsDirectional",
          duration: { min: 0.4, max: 1.2 },
          delay: 0.1,
          ease: "power2.inOut",
        },
        onUpdate: (declencheur) => {
          changerPlan(Math.round(declencheur.progress * (plans.length - 1)));
        },
      },
    });

    plans.forEach((plan, index) => {
      if (index > 0) {
        timeline.to(this.rail, { ...extrairePose(plan), duration: 1, ease: "power2.inOut" });
      }
      timeline.addLabel("plan-" + index);
    });

    changerPlan(0);
  }

  /* ----------------------------------------------------------
     2. L'EXAMEN : gros plan sur un objet, puis retour au rail
     ---------------------------------------------------------- */
  examiner(pose) {
    if (MODE_TACTILE) return;
    Object.assign(this.examen, pose);
    return gsap.to(this.melange, { valeur: 1, duration: 1.1, ease: "power3.inOut" });
  }

  revenir() {
    if (MODE_TACTILE) return;
    return gsap.to(this.melange, { valeur: 0, duration: 0.9, ease: "power3.inOut" });
  }

  /* ----------------------------------------------------------
     LA BOUCLE D'IMAGES (environ 60 fois par seconde)
     ---------------------------------------------------------- */
  demarrer() {
    if (this.enMarche) return;
    this.enMarche = true;

    const image = (temps) => {
      if (!this.visible) {
        this.enMarche = false;
        return;
      }
      this.dessiner(temps / 1000);
      requestAnimationFrame(image);
    };
    requestAnimationFrame(image);
  }

  dessiner(secondes) {
    // Mélange entre la position du rail et celle du gros plan.
    const m = this.melange.valeur;
    const p = {};
    CLES_POSE.forEach((cle) => {
      p[cle] = this.rail[cle] + (this.examen[cle] - this.rail[cle]) * m;
    });

    let roulis = 0;
    if (!MOUVEMENT_REDUIT) {
      // 3. Le regard suit la souris, avec du retard (lissage).
      this.regardLisse.x += (this.regard.x - this.regardLisse.x) * 0.05;
      this.regardLisse.y += (this.regard.y - this.regardLisse.y) * 0.05;
      const liberte = 1 - m * 0.75; // on bouge moins pendant un gros plan
      p.ry += this.regardLisse.x * 4 * liberte;
      p.rx -= this.regardLisse.y * 2.5 * liberte;

      // 4. Le souffle : de lentes ondulations (sinus), comme une caméra tenue à la main.
      p.x += Math.sin(secondes * 0.4) * 6;
      p.y += Math.sin(secondes * 0.53) * 4;
      roulis = Math.sin(secondes * 0.3) * 0.3;
    }

    // Transformation INVERSE appliquée au monde : on amène le point regardé
    // au centre, on tourne autour de lui, puis on rapproche ou recule.
    this.monde.style.transform =
      `translateZ(${p.distance}px) rotateZ(${roulis}deg) rotateX(${p.rx}deg) ` +
      `rotateY(${p.ry}deg) translate3d(${-p.x}px, ${-p.y}px, ${-p.z}px)`;

    // Les "billboards" utilisent cet angle pour rester face à la caméra.
    this.monde.style.setProperty("--cam-ry", p.ry + "deg");

    // En forte plongée, les éléments très hauts (lampe, mur) passeraient
    // derrière l'objectif : le CSS les masque avec la classe "plongee".
    const plongee = p.rx < -35;
    if (plongee !== this.enPlongee) {
      this.enPlongee = plongee;
      this.scene.classList.toggle("plongee", plongee);
    }
  }
}

// La page était bloquée pendant le code de la porte : on recalcule
// les positions des scènes épinglées une fois la porte ouverte.
document.addEventListener("porte:ouverte", () => ScrollTrigger.refresh());
