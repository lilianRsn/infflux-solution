---
description: Créer un test unitaire Jest pour un module existant
argument-hint: <chemin/vers/module.js>
---

Utilise le skill `unit-test-creation` pour scaffolder un test unitaire pour le module : $ARGUMENTS.

Étapes attendues :
1. Lire le module cible en entier.
2. Vérifier le runner dans `package.json` (Jest / Vitest / autre).
3. Lister les cas (chemin heureux, cas limites, erreurs, invariants).
4. Écrire le test en isolant les I/O (mocks).
5. Lancer la suite et rapporter le résultat.
