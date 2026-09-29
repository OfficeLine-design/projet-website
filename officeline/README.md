# Office Line — Site Web Multilingue (FR / EN / AR)

Site statique multi-pages généré à partir de templates Jinja2, conforme au
cahier des charges : multilingue avec RTL pour l'arabe, catalogue conforme
aux mind maps Gloomaps, SEO optimisé, formulaire de devis, espace
distributeurs (maquette), conformité loi 18-07.

## Structure du projet

```
officeline/
├── build.py                  → génère le site dans dist/
├── data/
│   ├── company.json          → coordonnées des 2 divisions, réseaux sociaux, marques
│   ├── bureautique.json      → catalogue Bureautique (9 familles, source Gloomaps)
│   ├── equipements.json      → catalogue Équipements (5 pôles + modèles, source Gloomaps)
│   ├── strings.fr.json       → TOUS les textes du site en français (source de vérité)
│   ├── strings.en.json       → textes en anglais (à compléter — voir plus bas)
│   └── strings.ar.json       → textes en arabe (à compléter — voir plus bas)
├── templates/                → gabarits Jinja2 (base, header, footer, home, catalog, contact...)
├── static/
│   ├── css/style.css         → design system (couleurs, typographie, composants, animations)
│   ├── css/rtl.css           → surcharges pour l'arabe (RTL)
│   ├── js/main.js            → navigation, animations au scroll, retour en haut
│   ├── js/catalog.js         → filtres & recherche catalogue
│   ├── js/form.js            → validation formulaires (devis + espace distributeurs)
│   └── img/                  → logo, favicon, image de partage (og-cover)
└── dist/                     → SITE GÉNÉRÉ, prêt à héberger (voir "Déploiement")
```

## ✍️ Traductions EN / AR

Les traductions anglaises et arabes sont **déjà rédigées et intégrées** (interface
complète + catalogue Bureautique et Équipements). Le site est pleinement
fonctionnel dans les 3 langues, RTL compris pour l'arabe.

Si vous souhaitez ajuster ou corriger un texte, ouvrez simplement
`data/strings.en.json` / `data/strings.ar.json` (interface) ou
`data/bureautique.json` / `data/equipements.json` (catalogue), modifiez la
valeur voulue, puis relancez :
```bash
python3 build.py
```

## 🎨 Design

- Couleurs : Navy `#333366`, Sky `#6699CC`, Orange CTA `#E8833B`
- Typographies : Space Grotesk (titres), Manrope (texte), IBM Plex Mono
  (repères techniques/modèles), Cairo + IBM Plex Sans Arabic (arabe)
- Animations : révélation au défilement, parallax léger sur le hero,
  effets de survol, défilement des marques partenaires
- 100% responsive (mobile, tablette, desktop), RTL complet pour l'arabe
- Le site reste lisible même si le JavaScript est désactivé (dégradation
  progressive : les animations sont un bonus, jamais un prérequis)

## 🔍 SEO

- Titres, meta descriptions et URLs canoniques par page et par langue
- Balises `hreflang` pour indiquer à Google les versions FR/EN/AR de chaque page
- Données structurées JSON-LD (schema.org/Organization) avec les 2 adresses
- `sitemap.xml` et `robots.txt` générés automatiquement
- HTML sémantique, images avec attributs alt (à compléter avec vos vraies photos)

## ⚠️ Points nécessitant une action de votre part avant mise en production

1. **Photos réelles** : les visuels sont actuellement des motifs SVG
   génériques (le cahier des charges demandait un style "3D/interactif" —
   vos photos de showroom, produits et équipe rendront le site bien plus
   percutant). Remplacez les sections marquées dans le CSS/HTML au besoin.
2. **Formulaire de devis — activer l'envoi réel** : le formulaire est câblé
   à [Formspree](https://formspree.io) (aucun serveur à héberger).
   - Créez un compte gratuit sur formspree.io, créez un formulaire, copiez
     son identifiant (`https://formspree.io/f/xxxxabcd`)
   - Ouvrez `static/js/form.js`, remplacez `YOUR_FORM_ID` dans la constante
     `FORMSPREE_ENDPOINT` par cet identifiant
   - Relancez `python3 build.py`
   - Tant que ce n'est pas fait, le formulaire affiche un message clair
     ("non configuré") plutôt que de prétendre avoir envoyé la demande.
3. **Espace distributeurs — authentification réelle** : un serveur Node.js
   fonctionnel est fourni dans `server/` (voir section dédiée ci-dessous).
   Il faut l'héberger (VPS, Render, Railway...) et pointer le front-end
   vers son URL.
4. **Cartes Google Maps** : les coordonnées GPS dans `data/company.json`
   sont approximatives — à ajuster avec les coordonnées exactes de vos 2
   divisions.
5. **Domaine** : remplacez `https://officeline-dz.com` dans
   `data/company.json` si l'URL finale diffère.
6. **Catalogues PDF réels** : déposez vos vrais catalogues PDF dans
   `server/catalogs/bureautique.pdf` et `server/catalogs/equipements.pdf`
   (voir section serveur ci-dessous) — le téléchargement fonctionne dès
   qu'ils sont présents.

## 🔐 Espace distributeurs — serveur d'authentification (`server/`)

Un serveur Node.js **sans aucune dépendance externe** (aucun `npm install`
requis, fonctionne avec le Node installé sur n'importe quelle machine) :
mots de passe hachés (scrypt + sel), sessions signées (HMAC), protection
anti-bruteforce sur la connexion, téléchargement de catalogue PDF réservé
aux distributeurs authentifiés.

```
server/
├── server.js              → serveur HTTP (API)
├── auth.js                → hachage des mots de passe + jetons de session
├── create-distributor.js  → script pour créer/modifier un compte
├── distributors.json      → base des comptes (vide par défaut)
├── catalogs/               → déposez ici bureautique.pdf et equipements.pdf
└── package.json
```

**Démarrage rapide :**
```bash
cd server

# 1. Créer votre premier compte distributeur
node create-distributor.js mon_distributeur "MotDePasse!23" "Nom de la société"

# 2. (Recommandé) définir un secret de session avant la mise en production
export OL_TOKEN_SECRET="une-longue-chaine-aleatoire-difficile-a-deviner"

# 3. Démarrer le serveur (écoute sur le port 4000 par défaut)
node server.js
```

**Brancher le site au serveur :**
Dans `static/js/form.js`, remplacez `API_BASE_URL` (actuellement
`http://localhost:4000`) par l'URL réelle où vous hébergerez ce serveur
(ex. `https://api.officeline-dz.com`), puis relancez `python3 build.py`.

**Déploiement :** ce serveur peut tourner sur n'importe quel hébergeur
Node.js (VPS avec `pm2`, Render, Railway, etc.). Placez-le derrière
Nginx/Caddy avec HTTPS en production, et restreignez
`OL_ALLOWED_ORIGIN` à votre domaine exact (variable d'environnement)
plutôt que `*`.

Testé de bout en bout : connexion valide/invalide, session, téléchargement
protégé par jeton, expiration de session (8h) — tout fonctionne.

## 🚀 Déploiement

Le dossier `dist/` est un site 100% statique : il suffit de l'héberger tel
quel sur n'importe quel serveur web (Apache, Nginx, OVH, Netlify, etc.).

```
dist/
├── index.html         → redirige automatiquement vers /fr/
├── fr/  en/  ar/       → une version complète du site par langue
├── assets/             → CSS, JS, images (partagés entre les 3 langues)
├── sitemap.xml
└── robots.txt
```

Aucune étape de build n'est nécessaire côté serveur — uploadez `dist/` tel
quel. Pour reconstruire après une modification de contenu, relancez
`python3 build.py` (nécessite Python 3 + `pip install jinja2`) et
re-uploadez le nouveau `dist/`.
