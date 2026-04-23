---
description: Scaffolder un nouvel endpoint API (route + contrôleur + service + test)
argument-hint: <méthode> <url> — ex. POST /api/orders
---

Utilise le skill `api-endpoint` pour scaffolder un endpoint avec les arguments suivants : $ARGUMENTS.

Étapes attendues :
1. Confirmer le framework HTTP et le valideur utilisés (lire `package.json`).
2. Consulter context7 si une librairie externe est utilisée.
3. Créer le schéma de validation, le service, le contrôleur, la route, le test unitaire du service.
4. Lancer les tests et rapporter les fichiers créés.

Si le contrat (body, params, réponses) n'est pas évident, demande-le avant de coder.
