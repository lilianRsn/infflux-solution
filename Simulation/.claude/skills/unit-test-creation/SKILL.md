---
name: unit-test-creation
description: Scaffolder un test unitaire cohérent avec le projet Node.js (Jest par défaut). Utilise ce skill chaque fois qu'un nouveau module de logique métier (service, use-case, utilitaire de calcul, fonction du moteur d'optimisation) est créé ou modifié de façon non-triviale.
---

# Création d'un test unitaire

Ce skill scaffold un test unitaire isolé pour un module donné, aligné sur les conventions du projet.

## Étape 1 — Reconnaissance

Avant d'écrire quoi que ce soit, rassemble :

1. **Le module cible** : lis-le en entier (`Read`).
2. **Le runner configuré** : lis `package.json` (cherche `jest`, `vitest`, ou autre dans `devDependencies` et dans la section `scripts`).
3. **Un test voisin existant** : `Glob` sur `**/*.test.{js,ts}` ou `**/*.spec.{js,ts}` pour copier le style (extension, imports, matchers, helpers).
4. **Les dépendances du module** : identifie les I/O à mocker (DB, HTTP, fs, horloge, env).

Si tu as un doute sur une API du runner ou d'une librairie d'assertion → passe par **context7** (`resolve-library-id` puis `query-docs`).

## Étape 2 — Plan des cas de test

Liste avant d'écrire (dans un TodoWrite ou mental) :

- **Chemin heureux** — le cas d'usage principal.
- **Cas limites** — entrées vides, capacité max atteinte, dates égales, listes singletons.
- **Erreurs attendues** — entrées invalides → exception métier précise.
- **Invariants métier** — propriétés toujours vraies (ex. somme livrée ≤ commandée, pas de double affectation d'emplacement).

## Étape 3 — Structure du fichier

```
describe('<NomDuModule>', () => {
  describe('<comportement ou méthode>', () => {
    it('<scénario observable>', () => {
      // arrange
      // act
      // assert
    });
  });
});
```

Une assertion principale par `it`. Pas de logique métier dans le test.

## Étape 4 — Isolation

- Mock I/O avec `jest.mock()` ou injection de dépendance selon le style du projet.
- Horloge : `jest.useFakeTimers()` si le temps est un paramètre du comportement.
- **Ne mock pas** les collaborateurs purs (fonctions sans effet de bord) — teste l'intégration.

## Étape 5 — Exécution et rapport

1. Lance la suite : `npm test -- <chemin>` (ou l'équivalent configuré).
2. Rapporte : nombre de tests passés, cas couverts, points non couverts sciemment laissés (et pourquoi).

## À éviter

- Copier la logique du module dans le test (le test doit être trivialement lisible et indépendant).
- Assertions floues (`toBeTruthy`, `toBeDefined`) quand on peut être précis.
- Tester des détails d'implémentation (ex. vérifier un appel interne) au lieu du contrat observable.
- Sur-scaffolder : si 3 tests suffisent à couvrir le contrat, n'en écris pas 15.
