Voici un texte clair et présentable que tu peux utiliser tel quel (README, dossier ou pitch) pour expliquer **la partie simulation du projet** :

---

## Simulation du système logistique

Dans le cadre du projet, nous avons mis en place un système de **simulation automatisée** permettant de reproduire le fonctionnement réel d’une plateforme logistique, sans dépendre de véritables utilisateurs ou partenaires externes.

L’objectif de ces simulations est double :

* **générer des flux réalistes** (commandes, tournées, traitements logistiques),
* **alimenter le moteur d’optimisation** afin de démontrer la pertinence des décisions prises par le système.

---

### Principe général

Les simulations sont conçues comme des **agents indépendants** (ou “bots”) représentant les différents acteurs du système :

* un **marchand (client)** qui passe des commandes,
* un **entrepôt** qui prépare et valide les expéditions,
* un **partenaire transporteur** qui propose de la capacité de transport.

Ces agents ne communiquent **jamais directement entre eux**.
Ils interagissent uniquement avec le backend de l’application via des appels API, exactement comme le feraient de vrais utilisateurs.

---

### Simulation du marchand (client)

Le simulateur de marchand reproduit le comportement d’un client professionnel qui effectue des commandes de marchandises.

Il génère automatiquement des demandes de livraison avec des paramètres variables :

* localisation de livraison,
* volume et poids,
* type de livraison (standard, groupée, urgente),
* date souhaitée.

Ces commandes sont envoyées au backend, qui les enregistre puis déclenche leur traitement logistique.

---

### Simulation de l’entrepôt

Le simulateur d’entrepôt représente le processus de préparation des commandes.

Son rôle est de :

* consulter les commandes en attente,
* simuler un délai de préparation,
* mettre à jour leur statut (ex : “prête à être expédiée”).

Il peut également simuler la gestion des stocks en mettant à jour les quantités disponibles.

Cette étape permet de reproduire le flux réel :
**commande → préparation → expédition**.

---

### Simulation des partenaires transporteurs

Le simulateur de partenaire modélise des transporteurs externes mettant à disposition de la capacité dans leurs camions.

Il effectue plusieurs actions :

* déclaration de tournées (trajet, date, capacité disponible),
* réception des propositions de transport générées par le backend,
* acceptation ou refus de ces propositions selon une logique simple (prix, détour, capacité restante).

Ce mécanisme permet de simuler un écosystème de partenaires dynamique et réaliste.

---

### Rôle central du backend

Le backend joue un rôle central dans le système :

* il reçoit les données issues des simulations,
* il calcule les distances et temps de trajet via l’API de Google Maps Platform,
* il exécute un algorithme d’optimisation pour affecter chaque commande à la meilleure option (flotte interne ou partenaire),
* il génère des propositions de transport,
* il met à jour les états des commandes en temps réel.

Ainsi, toute la logique métier est centralisée, garantissant une architecture cohérente et évolutive.

---

### Intérêt pour la démonstration

Ce système de simulation permet de construire un **scénario de démonstration complet et automatisé**, dans lequel :

1. des commandes sont générées,
2. elles sont préparées,
3. des tournées partenaires sont proposées,
4. des décisions d’affectation sont prises automatiquement.

Il devient alors possible de visualiser :

* l’utilisation des ressources,
* l’intégration des partenaires,
* et les gains économiques générés.

---

### Conclusion

La mise en place de ces simulations permet de transformer le projet en une **plateforme autonome**, capable de démontrer de manière concrète et dynamique la valeur du système d’optimisation logistique, sans dépendre d’interactions humaines réelles.


