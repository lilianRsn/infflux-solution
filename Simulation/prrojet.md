# Plateforme logistique intelligente avec simulation et gestion avancée du stockage

## Présentation du projet

Ce projet consiste à concevoir une plateforme logistique intelligente permettant d’optimiser la gestion des livraisons en combinant flotte interne et transporteurs partenaires.  
L’objectif est de réduire les coûts, améliorer le taux de remplissage des camions et proposer des solutions de livraison plus flexibles.

La plateforme repose sur une architecture centralisée où un backend pilote l’ensemble des opérations :
- gestion des commandes,
- gestion des stocks,
- planification des tournées,
- intégration des partenaires,
- optimisation des décisions logistiques.

Afin de rendre le système autonome et démontrable, des simulateurs reproduisent le comportement des différents acteurs (clients, entrepôts, partenaires).

---

## Simulation du système

Le système intègre des simulations représentant :
- des clients (marchands),
- des entrepôts,
- des partenaires transporteurs.

Ces simulateurs interagissent uniquement avec le backend via des appels API, reproduisant fidèlement un environnement réel.

Ils permettent de générer :
- des commandes,
- des mises à jour de stock,
- des propositions de transport,

et ainsi alimenter en continu le moteur d’optimisation.

---

## Nouvelle fonctionnalité : gestion avancée du stockage côté marchand

Une évolution importante du projet introduit une logique de **stockage intelligent côté client (marchand)**.

### Objectif

Permettre aux clients :
- de choisir où leurs marchandises sont stockées,
- d’optimiser leur logistique en fonction de leur capacité de stockage,
- de mieux anticiper leurs livraisons.

---

## Fonctionnement

### Choix du stockage

Le client ne se contente plus de passer une commande.  
Il peut désormais :
- sélectionner un entrepôt ou point de stockage,
- décider de stocker une partie des marchandises en avance,
- adapter ses livraisons en fonction de ses besoins réels.

---

### Capacité de stockage client

Chaque client possède une **capacité de stockage propre**, définie dans son profil.

Cette information est essentielle pour :
- proposer des livraisons groupées,
- éviter les surcharges,
- lisser les flux logistiques.

Le système prend en compte :
- la capacité maximale,
- le stock actuellement présent,
- la fréquence des livraisons.

---

### Organisation du stockage en entrepôt

Côté entrepôt, les marchandises sont organisées de manière structurée :

- découpage en zones de stockage,
- attribution de rangées (emplacements physiques),
- association des produits à des emplacements précis.

Chaque produit stocké possède donc :
- un entrepôt d’affectation,
- une zone,
- une rangée ou emplacement.

Cela permet :
- une traçabilité fine,
- une préparation rapide des commandes,
- une optimisation des déplacements internes.

---

### Impact sur la logistique

Cette gestion du stockage influence directement le système global :

- amélioration du groupage des commandes,
- réduction des livraisons urgentes,
- meilleure anticipation des flux,
- optimisation des tournées.

Le moteur d’optimisation utilise ces données pour décider :
- quand livrer,
- où livrer,
- et avec quel transporteur.

---

## Rôle du backend

Le backend centralise toutes les informations :
- commandes clients,
- capacités de stockage,
- états des entrepôts,
- tournées partenaires.

Il exploite ces données pour :
- calculer les meilleures stratégies logistiques,
- proposer des affectations optimales,
- ajuster dynamiquement les décisions.

---

## Conclusion

Grâce à l’ajout de la gestion du stockage côté client, la plateforme ne se limite plus à la livraison.  
Elle devient un véritable outil de **pilotage logistique global**, capable d’anticiper, optimiser et orchestrer l’ensemble de la chaîne d’approvisionnement.

Cette approche permet de démontrer concrètement :
- la réduction des coûts,
- l’amélioration de l’efficacité,
- et la création de valeur grâce à l’intelligence logistique.