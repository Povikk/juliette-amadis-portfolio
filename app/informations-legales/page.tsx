import type { Metadata } from "next";
import "./legal.css";

export const metadata: Metadata = {
  title: "Informations légales | Juliette Amadis",
  description: "Conditions de vente, livraison, retours, mentions légales et confidentialité de la boutique Juliette Amadis.",
};

const updatedAt = "23 septembre 2026";

export default function LegalInformationPage() {
  return <main className="legal-page" id="contenu">
    <a className="site-skip-link" href="#cgv">Aller au contenu</a>
    <header className="legal-header">
      <a className="legal-brand" href="/alternative#alternative-top"><img src="/juliette-amadis-logo.webp" width="640" height="240" alt="Juliette Amadis, artiste illustratrice" /></a>
      <nav aria-label="Navigation principale"><a href="/alternative">Le portfolio</a><a href="/boutique">La boutique</a></nav>
    </header>

    <section className="legal-hero">
      <p>LA BOUTIQUE DE L’ATELIER</p>
      <h1>Informations<br /><em>légales.</em></h1>
      <p>Conditions de vente, expédition, retours et protection de vos données — réunies au même endroit et rédigées pour rester lisibles.</p>
      <small>Dernière mise à jour : {updatedAt}</small>
    </section>

    <nav className="legal-index" aria-label="Sommaire">
      <a href="#cgv">Conditions de vente</a><a href="#livraison">Livraison</a><a href="#retours">Retours</a><a href="#mentions-legales">Mentions légales</a><a href="#confidentialite">Confidentialité</a>
    </nav>

    <aside className="legal-warning" aria-labelledby="legal-warning-title">
      <strong id="legal-warning-title">À compléter avant la publication de la boutique</strong>
      <p>Statut juridique et nom commercial officiel, numéro SIRET/RCS, adresse professionnelle complète, téléphone, numéro de TVA le cas échéant, identité de l’hébergeur et coordonnées du médiateur de la consommation. Ces informations ne sont pas encore présentes dans le projet local et ne doivent pas être inventées.</p>
    </aside>

    <div className="legal-content">
      <section id="cgv">
        <header><span>01</span><div><small>CONDITIONS GÉNÉRALES DE VENTE</small><h2>Commander une création</h2></div></header>
        <h3>Objet et produits</h3>
        <p>Les présentes conditions encadrent les ventes réalisées sur la boutique de Juliette Amadis auprès de clients consommateurs. Les caractéristiques essentielles, visuels, options, disponibilités et prix sont présentés sur chaque fiche produit. Les photographies illustrent les créations ; de légères variations peuvent exister pour les pièces artisanales ou imprimées.</p>
        <h3>Prix et commande</h3>
        <p>Les prix sont indiqués en euros. Les éventuels frais de livraison, remises et taxes applicables sont récapitulés avant la validation définitive. Une commande devient ferme après confirmation du paiement et envoi d’un courriel récapitulatif. Tant que le site porte la mention « mode démonstration », aucun paiement ni aucune commande réelle ne sont enregistrés.</p>
        <h3>Paiement</h3>
        <p>Le paiement sécurisé sera assuré par SumUp lors de sa mise en service. Les informations bancaires ne seront pas conservées par ce site. En cas de refus du prestataire de paiement, la commande ne pourra pas être finalisée.</p>
        <h3>Produits personnalisés</h3>
        <p>Le client doit vérifier soigneusement le texte, le format et les options transmis pour toute dédicace ou création personnalisée. La fabrication commence après validation de la commande. Les produits confectionnés selon les spécifications du client ou nettement personnalisés peuvent être exclus du droit de rétractation.</p>
        <h3>Garanties et réclamations</h3>
        <p>Les garanties légales de conformité et contre les vices cachés restent applicables. Toute difficulté peut être signalée à <a href="mailto:juliette.amadis@gmail.com">juliette.amadis@gmail.com</a> avec le numéro de commande et, si nécessaire, des photographies.</p>
      </section>

      <section id="livraison">
        <header><span>02</span><div><small>EXPÉDITION</small><h2>Livraison</h2></div></header>
        <p>Les zones desservies, modes d’envoi, tarifs et délais estimés sont affichés avant le paiement. La commande est envoyée à l’adresse saisie par le client ; il lui appartient d’en vérifier l’exactitude. Les créations sont emballées avec soin et un suivi est proposé lorsque le transporteur le permet.</p>
        <p>Le délai annoncé comprend la préparation et le transport. Pour une création personnalisée, le délai de fabrication est précisé sur la fiche ou dans le récapitulatif de commande. En cas de retard important, de colis endommagé ou non reçu, contactez l’atelier afin qu’une enquête soit ouverte auprès du transporteur.</p>
        <p>Le vendeur reste responsable de la bonne exécution de la livraison jusqu’à la remise au client, sauf lorsque celui-ci choisit lui-même un transporteur non proposé par la boutique.</p>
      </section>

      <section id="retours">
        <header><span>03</span><div><small>RÉTRACTATION ET RETOURS</small><h2>Changer d’avis</h2></div></header>
        <p>Pour les produits non personnalisés, le client consommateur dispose en principe de quatorze jours à compter de la réception pour notifier sa rétractation, sans avoir à la motiver. Il dispose ensuite de quatorze jours pour renvoyer le produit.</p>
        <p>Le produit doit être retourné complet, correctement protégé et dans un état permettant sa remise en vente. Sauf erreur de la boutique, défaut ou non-conformité, les frais de retour restent à la charge du client. Le remboursement intervient après récupération du bien ou réception d’une preuve d’expédition, selon la première échéance.</p>
        <p>Le droit de rétractation ne s’applique notamment pas aux créations confectionnées sur mesure, personnalisées ou dédicacées selon les indications du client. Pour initier un retour, écrivez à <a href="mailto:juliette.amadis@gmail.com">juliette.amadis@gmail.com</a> avant tout envoi.</p>
      </section>

      <section id="mentions-legales">
        <header><span>04</span><div><small>ÉDITEUR DU SITE</small><h2>Mentions légales</h2></div></header>
        <dl>
          <div><dt>Responsable de publication</dt><dd>Juliette Amadis — artiste illustratrice, Orchies, France.</dd></div>
          <div><dt>Contact</dt><dd><a href="mailto:juliette.amadis@gmail.com">juliette.amadis@gmail.com</a></dd></div>
          <div><dt>Immatriculation, adresse et téléphone</dt><dd>À compléter avant publication.</dd></div>
          <div><dt>Hébergement</dt><dd>À compléter lorsque l’hébergeur de production sera choisi.</dd></div>
          <div><dt>Médiation de la consommation</dt><dd>Les coordonnées du médiateur choisi doivent être ajoutées avant l’ouverture des ventes.</dd></div>
        </dl>
        <h3>Propriété intellectuelle</h3>
        <p>Sauf indication contraire, les illustrations, textes, photographies, éléments graphiques et l’identité visuelle présentés sur ce site sont protégés et appartiennent à Juliette Amadis ou à leurs ayants droit. Toute reproduction, adaptation ou utilisation sans autorisation préalable est interdite.</p>
      </section>

      <section id="confidentialite">
        <header><span>05</span><div><small>DONNÉES PERSONNELLES</small><h2>Confidentialité</h2></div></header>
        <h3>Données et finalités</h3>
        <p>Les données fournies lors d’une prise de contact ou d’une commande servent uniquement à répondre au message, gérer la commande, le paiement, la livraison, le service après-vente et les obligations comptables. Les champs indispensables sont signalés dans les formulaires.</p>
        <h3>Destinataires et conservation</h3>
        <p>Les informations nécessaires pourront être transmises aux prestataires indispensables à la commande — notamment SumUp, l’hébergeur et le transporteur — dans la limite de leur mission. Elles sont conservées pendant la durée nécessaire au service demandé puis selon les durées imposées par les obligations légales.</p>
        <h3>Stockage local et traceurs</h3>
        <p>La version actuelle utilise le stockage local du navigateur pour mémoriser le panier, la langue et, dans l’espace protégé, la session d’administration. Aucun traceur publicitaire n’est installé par le projet local. Si des outils de mesure d’audience ou de publicité sont ajoutés, leur consentement devra être géré avant leur dépôt.</p>
        <h3>Vos droits</h3>
        <p>Vous pouvez demander l’accès, la rectification, l’effacement, la limitation ou la portabilité de vos données, et vous opposer à certains traitements, en écrivant à <a href="mailto:juliette.amadis@gmail.com">juliette.amadis@gmail.com</a>. Vous pouvez également adresser une réclamation à la CNIL.</p>
      </section>
    </div>

    <footer className="legal-footer"><a href="/alternative">Retour au portfolio</a><span>Juliette Amadis · Orchies, France</span><a href="/boutique">Retour à la boutique</a></footer>
  </main>;
}
