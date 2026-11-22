# VELOURS · Salon de beauté (démo portfolio)

Diaporama plein écran, blanc lait et bordeaux, sans vidéo : transitions en arche, rideau,
cercle et diagonale ; titres lettre à lettre ; illustrations au trait qui se dessinent.

- Navigation : molette, glissé (mobile), flèches du clavier, menu, liens directs (`#coiffure`, `#contact`…)
- Textes FR/EN : `src/i18n/fr.js`, `src/i18n/en.js`
- Prestations, prix, horaires, liens : `src/data/salon.js`
  (champ `image` d'une prestation : chemin d'une photo dans `public/images/`, remplace l'illustration)
- `npm run dev` / `npm run build` / `npm run lint`
- Cloudflare Pages : build `npm run build`, dossier `dist`, variable `NODE_VERSION=22`
