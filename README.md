# Juliette Amadis — Portfolio et boutique

Site de Juliette Amadis, illustratrice spécialisée dans les univers fantasy, western et steampunk. Il réunit son portfolio, ses informations professionnelles, une boutique en ligne en préparation et un espace de gestion local.

Site en ligne : [jamadis.povik.workers.dev](https://jamadis.povik.workers.dev/alternative)

## Fonctionnalités

### Site et portfolio

- Navigation adaptée aux ordinateurs et aux téléphones.
- Contenu disponible en français et en anglais.
- Présentation de l’artiste, de son travail, de ses participations aux festivals et de ses prestations.
- Portfolio organisé avec chargement progressif des œuvres.
- Visionneuse plein écran avec navigation, zoom à la molette ou au double-clic et déplacement de l’image.
- Liens directs vers la boutique, le contact, Instagram et Facebook.
- Pages consacrées aux CGV, à la livraison, aux retours, aux mentions légales et à la confidentialité.

### Boutique

- Catalogue de créations classées par catégorie.
- Recherche par nom ou univers.
- Fiches produit avec galerie d’images, descriptions, promotions et articles similaires.
- Gestion des formats, variantes, dédicaces et autres options avec mise à jour du prix.
- Panier persistant avec modification des quantités et calcul du sous-total.
- Produits indisponibles ou masqués pris en charge.
- Parcours de commande de démonstration.

Le paiement n’est pas encore connecté. L’étape finale simule une commande et indique l’emplacement prévu pour la future intégration SumUp ; aucune transaction réelle n’est effectuée.

### Administration locale

- Accès protégé par un mot de passe créé sur l’appareil.
- Modification des textes du site depuis un aperçu intégré.
- Ajout, modification, masquage, restauration et classement des œuvres du portfolio par glisser-déposer.
- Gestion des produits : nom, catégorie, prix, promotion, ruban, stock, visibilité, options et description structurée.
- Aperçu en direct des fiches produit.
- Export et restauration des réglages au format JSON.

Les modifications réalisées dans l’administration sont conservées dans le stockage local du navigateur. Cette interface convient à la préparation du site en local, mais ne remplace pas encore une administration sécurisée reliée à une base de données.

## Technologies utilisées

- TypeScript
- React 19
- Vinext, basé sur le routeur Next.js
- Vite
- CSS
- Cloudflare Workers et plugin Vite Cloudflare
- Web Storage pour le panier et les réglages locaux
- Images WebP optimisées pour le catalogue

## Installation et utilisation

### Prérequis

- Node.js 22.13.0 ou une version plus récente
- npm

```bash
git clone https://github.com/Povikk/juliette-amadis-portfolio.git
cd juliette-amadis-portfolio
npm install
npm run dev
```

Le serveur de développement est ensuite accessible à l’adresse indiquée dans le terminal, généralement `http://localhost:3000`.

Routes principales :

- `/alternative` : site et portfolio
- `/boutique` : catalogue et panier
- `/administration` : tableau de bord local
- `/informations-legales` : informations légales et commerciales

### Commandes utiles

```bash
npm run dev      # lancer le serveur de développement
npm run build    # générer et vérifier la version de production
npm run start    # lancer la version compilée
npm run lint     # analyser le code avec ESLint
```

## Auteur

**Jonathan Ragot**\\
GitHub : [Povikk](https://github.com/Povikk)
