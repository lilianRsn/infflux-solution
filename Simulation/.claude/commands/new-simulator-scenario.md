---
description: Scaffolder un nouveau scénario de simulation (client / entrepôt / transporteur)
argument-hint: <acteur> <nom-scenario> — ex. client commandes-pic-fin-mois
---

Utilise le skill `simulator-scenario` pour scaffolder un scénario de simulation avec les arguments suivants : $ARGUMENTS.

Étapes attendues :
1. Repérer la structure des simulateurs existants.
2. Vérifier le client HTTP utilisé (lire `package.json`) et consulter context7 si besoin.
3. Créer la configuration du scénario (seed, durée, tick rate, paramètres).
4. Implémenter les comportements et la boucle de tick ; les briques pures doivent être testées unitairement.
5. Fournir la commande CLI pour lancer le scénario contre un backend local.

Rappel non-négociable : le simulateur communique UNIQUEMENT via HTTP, jamais d'import direct de modules backend.
